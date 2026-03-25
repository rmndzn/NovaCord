
import { useState } from 'react'
import { Hash, Users, Globe, Lock, Upload } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Input, Textarea } from '../ui/Input'
import { Button } from '../ui/Button'
import { useChat } from '../../context/ChatContext'
import toast from 'react-hot-toast'
import styles from './CreateCommunityModal.module.css'

export function CreateCommunityModal({ isOpen, onClose }) {
  const { createCommunity } = useChat()
  const [form, setForm] = useState({ name: '', description: '', type: 'group', visibility: 'public' })
  const [loading, setLoading] = useState(false)

  function update(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit() {
    if (!form.name.trim()) return toast.error('Community name is required')
    setLoading(true)
    try {
      await createCommunity({ name: form.name, description: form.description, type: form.type, visibility: form.visibility })
      toast.success(`${form.type === 'group' ? 'Group' : 'Channel'} created!`)
      onClose()
      setForm({ name: '', description: '', type: 'group', visibility: 'public' })
    } catch (e) {
      toast.error(e.message || 'Failed to create community')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Community">
      <div className={styles.form}>
        <div className={styles.typeRow}>
          <TypeCard icon={<Users size={20} />} label="Group" desc="Multi-user discussion" value="group" selected={form.type === 'group'} onClick={() => update('type', 'group')} />
          <TypeCard icon={<Hash size={20} />} label="Channel" desc="Announcements & posts" value="channel" selected={form.type === 'channel'} onClick={() => update('type', 'channel')} />
        </div>

        <Input label="Community Name" value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Night Wolves" maxLength={50} />
        <Textarea label="Description" value={form.description} onChange={e => update('description', e.target.value)} placeholder="What is this community about?" rows={2} />

        <div className={styles.visRow}>
          <VisCard icon={<Globe size={16} />} label="Public" desc="Anyone can discover & join" value="public" selected={form.visibility === 'public'} onClick={() => update('visibility', 'public')} />
          <VisCard icon={<Lock size={16} />} label="Private" desc="Invite only, hidden" value="private" selected={form.visibility === 'private'} onClick={() => update('visibility', 'private')} />
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>Create Community</Button>
        </div>
      </div>
    </Modal>
  )
}

function TypeCard({ icon, label, desc, selected, onClick }) {
  return (
    <button className={`${styles.typeCard} ${selected ? styles.typeSelected : ''}`} onClick={onClick}>
      <span className={styles.typeIcon}>{icon}</span>
      <strong className={styles.typeLabel}>{label}</strong>
      <span className={styles.typeDesc}>{desc}</span>
    </button>
  )
}

function VisCard({ icon, label, desc, selected, onClick }) {
  return (
    <button className={`${styles.visCard} ${selected ? styles.visSelected : ''}`} onClick={onClick}>
      <span className={styles.visIcon}>{icon}</span>
      <div>
        <strong className={styles.visLabel}>{label}</strong>
        <span className={styles.visDesc}>{desc}</span>
      </div>
    </button>
  )
}
