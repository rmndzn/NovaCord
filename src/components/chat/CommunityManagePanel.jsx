import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Trash2, UserPlus, X, Shield, Crown, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Avatar from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import { useChat } from '../../context/ChatContext'
import { uploadCommunityAvatar, uploadCommunityBanner, validateFile } from '../../services/uploadService'
import { ROLES } from '../../lib/constants'
import './CommunityManagePanel.css'

export default function CommunityManagePanel({ community, open, onClose }) {
  const { user } = useAuth()
  const {
    members,
    updateCommunity,
    addCommunityMember,
    removeCommunityMember,
    deleteCommunity,
  } = useChat()

  const [form, setForm] = useState({
    name: community?.name || '',
    description: community?.description || '',
    visibility: community?.visibility || 'public',
  })
  const [inviteValue, setInviteValue] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const avatarInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  useEffect(() => {
    setForm({
      name: community?.name || '',
      description: community?.description || '',
      visibility: community?.visibility || 'public',
    })
    setInviteValue('')
    setAvatarFile(null)
    setBannerFile(null)
    setAvatarPreview(null)
    setBannerPreview(null)
  }, [community?.id, open])

  const ownerId = community?.owner_id
  const isOwner = user?.id && ownerId === user.id

  const sortedMembers = useMemo(() => {
    return [...members].sort((left, right) => {
      const leftRank = roleRank(left.role)
      const rightRank = roleRank(right.role)
      if (leftRank !== rightRank) return leftRank - rightRank
      return new Date(left.joined_at) - new Date(right.joined_at)
    })
  }, [members])

  if (!community || !open || !isOwner) return null

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleFileChange(event, type) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      validateFile(file)
    } catch (error) {
      toast.error(error.message)
      return
    }

    const previewUrl = URL.createObjectURL(file)
    if (type === 'avatar') {
      setAvatarFile(file)
      setAvatarPreview(previewUrl)
    } else {
      setBannerFile(file)
      setBannerPreview(previewUrl)
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Community name is required.')
      return
    }

    setSaving(true)
    try {
      const updates = {
        name: form.name.trim(),
        description: form.description.trim(),
        visibility: form.visibility,
      }

      if (avatarFile) {
        updates.avatar_url = await uploadCommunityAvatar(avatarFile, community.id)
      }

      if (bannerFile) {
        updates.banner_url = await uploadCommunityBanner(bannerFile, community.id)
      }

      await updateCommunity(community.id, updates)
      toast.success('Community updated.')
      onClose()
    } catch (error) {
      toast.error(error.message || 'Failed to update community.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddMember() {
    if (!inviteValue.trim()) {
      toast.error('Enter a username or email.')
      return
    }

    setAdding(true)
    try {
      const target = await addCommunityMember(community.id, inviteValue)
      toast.success(`Added ${target.display_name || target.username}.`)
      setInviteValue('')
    } catch (error) {
      if (error.code === '23505') {
        toast.error('That user is already in this community.')
      } else {
        toast.error(error.message || 'Failed to add member.')
      }
    } finally {
      setAdding(false)
    }
  }

  async function handleRemoveMember(member) {
    if (member.role === ROLES.OWNER) return
    setRemovingId(member.id)
    try {
      await removeCommunityMember(member.id, community.id)
      toast.success(`Removed ${member.profiles?.display_name || member.profiles?.username || 'member'}.`)
    } catch (error) {
      toast.error(error.message || 'Failed to remove member.')
    } finally {
      setRemovingId(null)
    }
  }

  async function handleDeleteCommunity() {
    const confirmed = window.confirm(`Delete ${community.name}? This will remove all messages and members.`)
    if (!confirmed) return

    setDeleting(true)
    try {
      await deleteCommunity(community.id)
      toast.success('Community deleted.')
      onClose()
    } catch (error) {
      toast.error(error.message || 'Failed to delete community.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <button className="community-manage-backdrop" onClick={onClose} aria-label="Close community manager" />
      <aside className="community-manage-panel">
        <div className="community-manage-header">
          <div>
            <p className="community-manage-kicker">Owner Controls</p>
            <h2>Manage {community.name}</h2>
          </div>
          <button className="community-manage-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="community-manage-scroll">
          <section className="community-manage-card">
            <div
              className="community-banner-preview"
              style={{
                backgroundImage: bannerPreview || community.banner_url
                  ? `url(${bannerPreview || community.banner_url})`
                  : undefined,
              }}
            >
              {!bannerPreview && !community.banner_url && <div className="community-banner-fallback" />}
              <button className="community-image-action banner" onClick={() => bannerInputRef.current?.click()}>
                <Camera size={16} />
                Change Banner
              </button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={(event) => handleFileChange(event, 'banner')}
                style={{ display: 'none' }}
              />
            </div>

            <div className="community-avatar-row">
              <div className="community-avatar-wrap">
                <Avatar src={avatarPreview || community.avatar_url} name={form.name} size={72} />
                <button className="community-image-action avatar" onClick={() => avatarInputRef.current?.click()}>
                  <Camera size={15} />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleFileChange(event, 'avatar')}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="community-avatar-meta">
                <p className="community-manage-kicker">Media</p>
                <span>Upload a community photo and banner to make it easier to recognize.</span>
              </div>
            </div>

            <label className="community-manage-field">
              <span>Name</span>
              <input value={form.name} onChange={(event) => updateField('name', event.target.value)} maxLength={50} />
            </label>

            <label className="community-manage-field">
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                rows={4}
                maxLength={300}
              />
            </label>

            <div className="community-manage-field">
              <span>Visibility</span>
              <div className="community-visibility-tabs">
                <button
                  className={form.visibility === 'public' ? 'active' : ''}
                  onClick={() => updateField('visibility', 'public')}
                >
                  Public
                </button>
                <button
                  className={form.visibility === 'private' ? 'active' : ''}
                  onClick={() => updateField('visibility', 'private')}
                >
                  Private
                </button>
              </div>
            </div>

            <button className="community-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : null}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </section>

          <section className="community-manage-card">
            <div className="community-manage-section-head">
              <div>
                <p className="community-manage-kicker">Members</p>
                <h3>Invite and moderate</h3>
              </div>
              <span>{sortedMembers.length} members</span>
            </div>

            <div className="community-add-member">
              <input
                value={inviteValue}
                onChange={(event) => setInviteValue(event.target.value)}
                placeholder="Username or email"
              />
              <button onClick={handleAddMember} disabled={adding}>
                {adding ? <Loader2 size={16} className="spin" /> : <UserPlus size={16} />}
                {adding ? 'Adding...' : 'Add'}
              </button>
            </div>

            <div className="community-member-list">
              {sortedMembers.map((member) => {
                const isSelf = member.user_id === user.id
                const locked = member.role === ROLES.OWNER
                return (
                  <div className="community-member-row" key={member.id}>
                    <div className="community-member-main">
                      <Avatar
                        src={member.profiles?.avatar_url}
                        name={member.profiles?.display_name || member.profiles?.username}
                        size={40}
                      />
                      <div>
                        <div className="community-member-name">
                          {member.profiles?.display_name || member.profiles?.username || 'Unknown user'}
                          {isSelf ? ' (you)' : ''}
                        </div>
                        <div className="community-member-sub">
                          @{member.profiles?.username || 'unknown'}
                          {member.profiles?.email ? ` • ${member.profiles.email}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="community-member-actions">
                      <div className={`community-role-pill role-${member.role}`}>
                        {member.role === ROLES.OWNER ? <Crown size={13} /> : <Shield size={13} />}
                        <span>{member.role}</span>
                      </div>
                      <button
                        className="community-remove-btn"
                        onClick={() => handleRemoveMember(member)}
                        disabled={locked || removingId === member.id}
                      >
                        {removingId === member.id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                        {locked ? 'Locked' : 'Remove'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="community-manage-card danger">
            <div className="community-manage-section-head">
              <div>
                <p className="community-manage-kicker">Danger Zone</p>
                <h3>Delete community</h3>
              </div>
            </div>
            <p className="community-danger-copy">
              Deleting the community removes all member records, invitations, and messages.
            </p>
            <button className="community-delete-btn" onClick={handleDeleteCommunity} disabled={deleting}>
              {deleting ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
              {deleting ? 'Deleting...' : 'Delete Community'}
            </button>
          </section>
        </div>
      </aside>
    </>
  )
}

function roleRank(role) {
  if (role === ROLES.OWNER) return 0
  if (role === ROLES.ADMIN) return 1
  return 2
}
