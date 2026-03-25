import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ProfileCard from '../components/profile/ProfileCard'
import EditProfileModal from '../components/profile/EditProfileModal'
import './Profile.css'

export default function Profile() {
  const { username } = useParams()
  const { profile: myProfile } = useAuth()
  const [profile, setProfile] = useState(null)
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)

  const isOwnProfile = myProfile?.username === username

  useEffect(() => {
    loadProfile()
  }, [username])

  async function loadProfile() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('username', username).single()
    setProfile(data)
    if (data) {
      const { data: badgeData } = await supabase.from('badges').select('*').eq('user_id', data.id)
      setBadges(badgeData || [])
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="profile-page">
      <div className="skeleton" style={{ height: 100, borderRadius: 0 }} />
      <div style={{ padding: 20 }}>
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      </div>
    </div>
  )

  if (!profile) return (
    <div className="profile-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-faint)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>👻</div>
        <h3>User not found</h3>
      </div>
    </div>
  )

  return (
    <div className="profile-page">
      <div className="profile-page-inner">
        <ProfileCard
          profile={profile}
          badges={badges}
          onEdit={isOwnProfile ? () => setEditOpen(true) : null}
        />
      </div>

      {editOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={loadProfile}
        />
      )}
    </div>
  )
}
