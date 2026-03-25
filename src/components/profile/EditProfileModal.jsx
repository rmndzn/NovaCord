import { useState, useRef } from 'react'
import { X, Upload } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const MAX_SIZE = 5 * 1024 * 1024

export default function EditProfileModal({ profile, onClose, onSaved }) {
  const { updateProfile, user } = useAuth()
  const [form, setForm] = useState({
    display_name: profile.display_name || '',
    username: profile.username || '',
    bio: profile.bio || '',
  })
  const [loading, setLoading] = useState(false)
  const avatarRef = useRef()
  const bannerRef = useRef()

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function uploadImage(file, bucket, path) {
    if (file.size > MAX_SIZE) throw new Error('File exceeds 5MB')
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    return publicUrl
  }

  async function handleSave() {
    if (!form.display_name.trim()) return toast.error('Display name required')
    if (!/^[a-z0-9_]{3,20}$/.test(form.username)) return toast.error('Invalid username format')
    setLoading(true)
    try {
      await updateProfile(form)
      toast.success('Profile updated!')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const url = await uploadImage(file, 'avatars', `${user.id}/avatar.${file.name.split('.').pop()}`)
      await updateProfile({ avatar_url: url })
      toast.success('Avatar updated!')
      onSaved()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleBannerChange(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const url = await uploadImage(file, 'banners', `${user.id}/banner.${file.name.split('.').pop()}`)
      await updateProfile({ banner_url: url })
      toast.success('Banner updated!')
      onSaved()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: 1 }}>EDIT PROFILE</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Uploads */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-faint)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>AVATAR</div>
              <button onClick={() => avatarRef.current?.click()} style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(139,92,246,0.1)', border: '1px dashed rgba(139,92,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Upload size={18} style={{ color: 'var(--violet-400)' }} />}
              </button>
              <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-faint)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>BANNER</div>
              <button onClick={() => bannerRef.current?.click()} style={{ width: '100%', height: 60, borderRadius: 10, background: 'rgba(139,92,246,0.1)', border: '1px dashed rgba(139,92,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                {profile.banner_url ? <img src={profile.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Upload size={18} style={{ color: 'var(--violet-400)' }} />}
              </button>
              <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerChange} style={{ display: 'none' }} />
            </div>
          </div>

          {[
            { label: 'DISPLAY NAME', key: 'display_name', placeholder: 'Your Name' },
            { label: 'USERNAME', key: 'username', placeholder: 'unique_handle' },
            { label: 'BIO', key: 'bio', placeholder: 'Tell the world about yourself...', textarea: true },
          ].map(f => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-faint)', fontFamily: 'var(--font-display)' }}>{f.label}</label>
              {f.textarea ? (
                <textarea className="input" placeholder={f.placeholder} value={form[f.key]} onChange={update(f.key)} rows={3} style={{ resize: 'vertical' }} />
              ) : (
                <input className="input" placeholder={f.placeholder} value={form[f.key]} onChange={update(f.key)} />
              )}
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? 'SAVING...' : 'SAVE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
