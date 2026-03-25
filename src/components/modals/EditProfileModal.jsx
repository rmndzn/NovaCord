
import { useState, useRef } from 'react'
import { Camera, User } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Input, Textarea } from '../ui/Input'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import { uploadAvatar, uploadBanner, validateFile } from '../../services/uploadService'
import toast from 'react-hot-toast'
import styles from './EditProfileModal.module.css'

export function EditProfileModal({ isOpen, onClose }) {
  const { profile, updateProfile } = useAuth()
  const [form, setForm] = useState({
    display_name: profile?.display_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const avatarRef = useRef()
  const bannerRef = useRef()

  function update(k, v) { setForm(p => ({ ...p, [k]: v })) }

  function handleAvatarChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    try { validateFile(f) } catch (err) { return toast.error(err.message) }
    setAvatarFile(f)
    setAvatarPreview(URL.createObjectURL(f))
  }

  function handleBannerChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    try { validateFile(f) } catch (err) { return toast.error(err.message) }
    setBannerFile(f)
    setBannerPreview(URL.createObjectURL(f))
  }

  async function handleSubmit() {
    if (!form.display_name.trim()) return toast.error('Display name required')
    if (!form.username.trim()) return toast.error('Username required')
    setLoading(true)
    try {
      const updates = { ...form }
      if (avatarFile) updates.avatar_url = await uploadAvatar(avatarFile, profile.id)
      if (bannerFile) updates.banner_url = await uploadBanner(bannerFile, profile.id)
      await updateProfile(updates)
      toast.success('Profile updated!')
      onClose()
    } catch (e) {
      toast.error(e.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" size="lg">
      <div className={styles.form}>
        {/* Banner */}
        <div className={styles.bannerSection}>
          <div
            className={styles.banner}
            style={{ backgroundImage: `url(${bannerPreview || profile?.banner_url})` }}
          >
            <button className={styles.bannerEdit} onClick={() => bannerRef.current?.click()}>
              <Camera size={16} /> Change Banner
            </button>
          </div>
          <input type="file" ref={bannerRef} accept="image/*" onChange={handleBannerChange} style={{ display: 'none' }} />
          {/* Avatar */}
          <div className={styles.avatarWrap}>
            <Avatar src={avatarPreview || profile?.avatar_url} name={form.display_name} size="xl" />
            <button className={styles.avatarEdit} onClick={() => avatarRef.current?.click()}>
              <Camera size={14} />
            </button>
            <input type="file" ref={avatarRef} accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          </div>
        </div>

        <Input label="Display Name" value={form.display_name} onChange={e => update('display_name', e.target.value)} placeholder="Your display name" />
        <Input label="Username" value={form.username} onChange={e => update('username', e.target.value.replace(/\s/g, '').toLowerCase())} placeholder="your_username" />
        <Textarea label="Bio" value={form.bio} onChange={e => update('bio', e.target.value)} placeholder="Tell the world about yourself..." rows={3} />

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  )
}
