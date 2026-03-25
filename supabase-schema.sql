-- =============================================
-- NOVACORD DATABASE SCHEMA
-- Paste this into Supabase SQL Editor and run.
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- STEP 1: CREATE TABLES (order matters)
-- =============================================

-- profiles (depends on auth.users only)
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  display_name  text not null default 'User',
  username      text unique not null,
  bio           text,
  avatar_url    text,
  banner_url    text,
  created_at    timestamptz default now()
);

-- communities (depends on profiles)
create table if not exists communities (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  type        text not null default 'group'
                check (type in ('group', 'channel')),
  visibility  text not null default 'public'
                check (visibility in ('public', 'private')),
  avatar_url  text,
  owner_id    uuid references profiles(id) on delete set null,
  created_at  timestamptz default now()
);

-- community_members (depends on both above)
create table if not exists community_members (
  id            uuid primary key default uuid_generate_v4(),
  community_id  uuid not null references communities(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  role          text not null default 'member'
                  check (role in ('owner', 'admin', 'member')),
  joined_at     timestamptz default now(),
  unique(community_id, user_id)
);

-- messages (depends on communities + profiles)
create table if not exists messages (
  id            uuid primary key default uuid_generate_v4(),
  community_id  uuid not null references communities(id) on delete cascade,
  sender_id     uuid references profiles(id) on delete set null,
  content       text,
  message_type  text not null default 'text'
                  check (message_type in ('text', 'image', 'video')),
  file_url      text,
  created_at    timestamptz default now()
);

-- badges (depends on profiles)
create table if not exists badges (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  badge_url   text not null,
  badge_name  text not null,
  created_at  timestamptz default now()
);

-- invitations (depends on communities + profiles)
create table if not exists invitations (
  id                uuid primary key default uuid_generate_v4(),
  community_id      uuid not null references communities(id) on delete cascade,
  invited_user_id   uuid not null references profiles(id) on delete cascade,
  invited_by        uuid not null references profiles(id) on delete cascade,
  status            text not null default 'pending'
                      check (status in ('pending', 'accepted', 'declined')),
  created_at        timestamptz default now(),
  unique(community_id, invited_user_id)
);

-- =============================================
-- STEP 2: INDEXES
-- =============================================

create index if not exists idx_messages_community_id  on messages(community_id);
create index if not exists idx_messages_created_at    on messages(created_at desc);
create index if not exists idx_cm_user_id             on community_members(user_id);
create index if not exists idx_cm_community_id        on community_members(community_id);
create index if not exists idx_communities_visibility on communities(visibility);
create index if not exists idx_profiles_username      on profiles(username);

-- =============================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- =============================================

alter table profiles           enable row level security;
alter table communities        enable row level security;
alter table community_members  enable row level security;
alter table messages           enable row level security;
alter table badges             enable row level security;
alter table invitations        enable row level security;

-- =============================================
-- STEP 4: RLS POLICIES
-- NOTE: policies that join back to community_members use a
-- correlated subquery so they only run AFTER that table exists.
-- =============================================

-- ── profiles ─────────────────────────────────────────────────────────────────
create policy "profiles: authenticated users can read all"
  on profiles for select
  using ( auth.role() = 'authenticated' );

create policy "profiles: users can insert own row"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "profiles: users can update own row"
  on profiles for update
  using ( auth.uid() = id );

-- ── communities ───────────────────────────────────────────────────────────────
-- Split into two SELECT policies so the planner never needs community_members
-- before it exists, and so public vs private logic stays clean.

create policy "communities: public ones are visible to all authenticated"
  on communities for select
  using (
    auth.role() = 'authenticated'
    and visibility = 'public'
  );

create policy "communities: private ones visible to members & owner"
  on communities for select
  using (
    auth.role() = 'authenticated'
    and visibility = 'private'
    and (
      owner_id = auth.uid()
      or exists (
        select 1 from community_members cm
        where cm.community_id = communities.id
          and cm.user_id = auth.uid()
      )
    )
  );

create policy "communities: authenticated users can create"
  on communities for insert
  with check (
    auth.role() = 'authenticated'
    and auth.uid() = owner_id
  );

create policy "communities: owner can update"
  on communities for update
  using ( auth.uid() = owner_id );

create policy "communities: owner can delete"
  on communities for delete
  using ( auth.uid() = owner_id );

-- ── community_members ─────────────────────────────────────────────────────────
create policy "community_members: members can read membership of their communities"
  on community_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from community_members cm2
      where cm2.community_id = community_members.community_id
        and cm2.user_id = auth.uid()
    )
  );

create policy "community_members: users can join public communities"
  on community_members for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from communities c
      where c.id = community_id
        and c.visibility = 'public'
    )
  );

create policy "community_members: owner/admin can add members to private communities"
  on community_members for insert
  with check (
    exists (
      select 1 from community_members cm2
      where cm2.community_id = community_members.community_id
        and cm2.user_id = auth.uid()
        and cm2.role in ('owner', 'admin')
    )
  );

create policy "community_members: users can remove themselves"
  on community_members for delete
  using ( auth.uid() = user_id );

create policy "community_members: owner/admin can remove others"
  on community_members for delete
  using (
    exists (
      select 1 from community_members cm2
      where cm2.community_id = community_members.community_id
        and cm2.user_id = auth.uid()
        and cm2.role in ('owner', 'admin')
    )
  );

-- ── messages ──────────────────────────────────────────────────────────────────
create policy "messages: members can read"
  on messages for select
  using (
    exists (
      select 1 from community_members cm
      where cm.community_id = messages.community_id
        and cm.user_id = auth.uid()
    )
  );

create policy "messages: members can send"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from community_members cm
      where cm.community_id = messages.community_id
        and cm.user_id = auth.uid()
    )
  );

create policy "messages: senders can delete own"
  on messages for delete
  using ( auth.uid() = sender_id );

-- ── badges ────────────────────────────────────────────────────────────────────
create policy "badges: authenticated users can read all"
  on badges for select
  using ( auth.role() = 'authenticated' );

-- Insert managed manually via SQL / service role only
-- (badges are awarded by admins, not self-assigned)

-- ── invitations ───────────────────────────────────────────────────────────────
create policy "invitations: involved users can read"
  on invitations for select
  using (
    auth.uid() = invited_user_id
    or auth.uid() = invited_by
  );

create policy "invitations: members can invite to their communities"
  on invitations for insert
  with check (
    auth.uid() = invited_by
    and exists (
      select 1 from community_members cm
      where cm.community_id = invitations.community_id
        and cm.user_id = auth.uid()
    )
  );

create policy "invitations: invited user can update status"
  on invitations for update
  using ( auth.uid() = invited_user_id );

-- =============================================
-- STEP 5: ENABLE REALTIME
-- (run once; safe to re-run)
-- =============================================

-- Messages: full real-time inserts via postgres_changes
alter publication supabase_realtime add table messages;

-- community_members: optional — enables live member count updates
alter publication supabase_realtime add table community_members;

-- =============================================
-- STEP 6: STORAGE BUCKETS
-- Create these manually in Supabase Dashboard → Storage
-- or uncomment the lines below if using service-role SQL.
-- =============================================

-- insert into storage.buckets (id, name, public, file_size_limit)
--   values ('avatars', 'avatars', true,  5242880)  -- 5 MB
--   on conflict (id) do nothing;

-- insert into storage.buckets (id, name, public, file_size_limit)
--   values ('banners', 'banners', true,  5242880)
--   on conflict (id) do nothing;

-- insert into storage.buckets (id, name, public, file_size_limit)
--   values ('media',   'media',   true,  5242880)
--   on conflict (id) do nothing;
