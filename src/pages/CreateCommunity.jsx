import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Hash, Users, Globe, Lock, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import toast from 'react-hot-toast'
import './CreateCommunity.css'

export default function CreateCommunity() {
  const { user } = useAuth()
  const { fetchCommunities } = useChat()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', description: '', type: 'group', visibility: 'public' })
  const [loading, setLoading] = useState(false)

  const update = (k) => (v) => setForm(f => ({ ...f, [k]: v }))

  async function handleCreate() {
    if (!form.name.trim()) return toast.error('Community name is required')
    setLoading(true)
    try {
      const { data, error } = await supabase.from('communities').insert({
        name: form.name.trim(),
        description: form.description.trim(),
        type: form.type,
        visibility: form.visibility,
        owner_id: user.id,
      }).select().single()

      if (error) throw error

      await supabase.from('community_members').insert({
        community_id: data.id,
        user_id: user.id,
        role: 'owner',
      })

      await fetchCommunities()
      toast.success('Community created!')
      navigate(`/app/chat/${data.id}`)
    } catch (err) {
      toast.error(err.message || 'Failed to create community')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-page">
      <div className="create-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="create-header">
          <h1 className="create-title">Create Community</h1>
          <p className="create-subtitle">Build your squad or broadcast channel</p>
        </div>

        <div className="create-card">
          {/* Type selection */}
          <div className="field-group">
            <label className="field-label">COMMUNITY TYPE</label>
            <div className="option-grid">
              <button
                className={`option-btn ${form.type === 'group' ? 'active' : ''}`}
                onClick={() => update('type')('group')}
              >
                <Users size={20} />
                <span>Group</span>
                <small>Multi-user chat</small>
              </button>
              <button
                className={`option-btn ${form.type === 'channel' ? 'active' : ''}`}
                onClick={() => update('type')('channel')}
              >
                <Hash size={20} />
                <span>Channel</span>
                <small>Broadcast to members</small>
              </button>
            </div>
          </div>

          {/* Visibility */}
          <div className="field-group">
            <label className="field-label">VISIBILITY</label>
            <div className="option-grid">
              <button
                className={`option-btn ${form.visibility === 'public' ? 'active' : ''}`}
                onClick={() => update('visibility')('public')}
              >
                <Globe size={20} />
                <span>Public</span>
                <small>Anyone can join</small>
              </button>
              <button
                className={`option-btn ${form.visibility === 'private' ? 'active' : ''}`}
                onClick={() => update('visibility')('private')}
              >
                <Lock size={20} />
                <span>Private</span>
                <small>Invite only</small>
              </button>
            </div>
          </div>

          {/* Name */}
          <div className="field-group">
            <label className="field-label">NAME</label>
            <input
              className="input"
              placeholder="e.g. Apex Legends Squad"
              value={form.name}
              onChange={e => update('name')(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div className="field-group">
            <label className="field-label">DESCRIPTION (OPTIONAL)</label>
            <textarea
              className="input"
              placeholder="Tell people what your community is about..."
              value={form.description}
              onChange={e => update('description')(e.target.value)}
              rows={3}
              maxLength={300}
              style={{ resize: 'vertical' }}
            />
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCreate} disabled={loading}>
            {loading ? 'CREATING...' : 'CREATE COMMUNITY'}
          </button>
        </div>
      </div>
    </div>
  )
}
