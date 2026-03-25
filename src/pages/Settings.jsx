import { useState } from 'react'
import { Settings as SettingsIcon, User, Bell, Shield, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import EditProfileModal from '../components/profile/EditProfileModal'
import './Settings.css'

export default function Settings() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const [editOpen, setEditOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SettingsIcon size={20} style={{ color: 'var(--violet-400)' }} />
            <h1 className="settings-title">Settings</h1>
          </div>
        </div>

        <div className="settings-sections">
          <SettingsSection title="ACCOUNT" icon={<User size={14} />}>
            <SettingsRow label="Display Name" value={profile?.display_name} />
            <SettingsRow label="Username" value={`@${profile?.username}`} mono />
            <SettingsRow label="Email" value={profile?.email} />
            <button className="btn btn-ghost settings-action" onClick={() => setEditOpen(true)}>
              Edit Profile
            </button>
          </SettingsSection>

          <SettingsSection title="PRIVACY" icon={<Shield size={14} />}>
            <SettingsRow label="Profile Visibility" value="Public" />
            <SettingsRow label="Who can invite you" value="Everyone" />
          </SettingsSection>

          <SettingsSection title="NOTIFICATIONS" icon={<Bell size={14} />}>
            <ToggleRow label="Message notifications" defaultOn />
            <ToggleRow label="Mentions" defaultOn />
            <ToggleRow label="Community updates" defaultOn={false} />
          </SettingsSection>

          <div className="settings-danger">
            <button className="btn btn-danger" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {editOpen && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={() => {}}
        />
      )}
    </div>
  )
}

function SettingsSection({ title, icon, children }) {
  return (
    <div className="settings-section">
      <div className="section-header-row">
        {icon}
        <span className="section-label-text">{title}</span>
      </div>
      <div className="section-content">
        {children}
      </div>
    </div>
  )
}

function SettingsRow({ label, value, mono }) {
  return (
    <div className="settings-row">
      <span className="settings-row-label">{label}</span>
      <span className="settings-row-value" style={{ fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>{value}</span>
    </div>
  )
}

function ToggleRow({ label, defaultOn }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="settings-row" style={{ cursor: 'pointer' }} onClick={() => setOn(o => !o)}>
      <span className="settings-row-label">{label}</span>
      <div className={`toggle ${on ? 'on' : ''}`}>
        <div className="toggle-thumb" />
      </div>
    </div>
  )
}
