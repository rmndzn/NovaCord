# ⚡ NovaCord

> Next-gen gaming social communication platform — Discord profile system meets Telegram chat layout, wrapped in a premium black + violet glassmorphism theme.

---

## 🚀 Quick Start

```bash
npm install
cp .env.example .env   # fill in your Supabase keys
npm run dev
```

---

## 🔧 Environment Variables

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Only two variables needed. No separate WebSocket server required — everything runs on **Supabase Realtime**.

---

## 📡 Real-Time Architecture

All real-time features run through a **single Supabase Realtime channel per community** (`community:{id}`).

| Feature | Mechanism | Notes |
|---|---|---|
| New messages | `postgres_changes` → INSERT | Persisted in DB, delivered to all subscribers |
| Typing indicators | `broadcast` | Ephemeral, never touches the DB |
| Member joins | `postgres_changes` → INSERT | Optional, for live member count |

### How typing indicators work

1. User starts typing → `broadcastTyping()` sends `{ isTyping: true }` once (leading edge)
2. Each keystroke resets a 3-second silence timer
3. After 3 s of no keystrokes → auto-sends `{ isTyping: false }`
4. Sending a message → immediately sends `{ isTyping: false }` via `clearTyping()`
5. All recipients update `typingUsers[]` state — rendered as the animated dots indicator

---

## 🗃️ Database Setup

1. Open **Supabase → SQL Editor**
2. Paste and run `supabase-schema.sql`
3. Create storage buckets in the Supabase dashboard:
   - `avatars` — Public, 5 MB max
   - `banners` — Public, 5 MB max
   - `media`   — Public, 5 MB max

---

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/        # AppLayout, PrivateRoute
│   ├── sidebar/       # Sidebar
│   ├── chat/          # ChatArea, MessageBubble
│   ├── profile/       # ProfileCard, EditProfileModal
│   └── ui/            # Avatar, Spinner
├── context/
│   ├── AuthContext.jsx     # Supabase Auth
│   └── ChatContext.jsx     # Realtime channel management,
│                           # messages, typing broadcast
├── lib/
│   └── supabase.js         # Supabase client (single instance)
└── pages/
    ├── Login.jsx / Register.jsx
    ├── Discover.jsx
    ├── Profile.jsx
    ├── Settings.jsx
    └── CreateCommunity.jsx
```

---

## 🌐 Deploy to Vercel

```bash
npm i -g vercel
vercel
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Vercel dashboard
```

`vercel.json` is included for correct SPA routing.

---

## 🎨 Theme

Edit CSS variables in `src/styles/globals.css`:

```css
:root {
  --violet-500: #8b5cf6;   /* primary accent */
  --violet-neon: #b14bff;  /* neon glow */
  --bg-void: #04000d;      /* deepest background */
}
```

---

## 🏷️ Adding Badges

```sql
INSERT INTO badges (user_id, badge_url, badge_name)
VALUES ('user-uuid', 'https://…/badge.png', 'Early Adopter');
```

Upload badge PNGs to Supabase Storage and reference the public URLs.
