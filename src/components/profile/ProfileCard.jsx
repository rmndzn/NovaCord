import { Shield } from 'lucide-react'
import { format } from 'date-fns'
import './ProfileCard.css'

export default function ProfileCard({ profile, badges = [], onEdit }) {
  const joinDate = profile?.created_at ? format(new Date(profile.created_at), 'MMM yyyy') : 'Unknown'

  return (
    <div className="profile-card">
      {/* Banner */}
      <div className="profile-banner">
        {profile?.banner_url ? (
          <img src={profile.banner_url} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div className="default-banner" />
        )}
        <div className="banner-overlay" />
      </div>

      {/* Avatar */}
      <div className="profile-avatar-area">
        <div className="avatar-wrapper">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.display_name} className="profile-avatar" />
          ) : (
            <div className="avatar-placeholder">
              {profile?.display_name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="avatar-status online" />
        </div>

        {onEdit && (
          <button className="btn btn-ghost edit-profile-btn" onClick={onEdit}>
            Edit Profile
          </button>
        )}
      </div>

      {/* Identity */}
      <div className="profile-identity">
        <div className="profile-names">
          <h2 className="display-name">{profile?.display_name || 'Unknown User'}</h2>
          {badges.length > 0 && (
            <div className="badges-row">
              {badges.map(badge => (
                <img key={badge.id} src={badge.badge_url} alt={badge.badge_name} title={badge.badge_name}
                  style={{ width: 20, height: 20, borderRadius: 4 }} />
              ))}
            </div>
          )}
        </div>
        <div className="username">@{profile?.username}</div>
      </div>

      {/* Bio */}
      {profile?.bio && (
        <div className="profile-section">
          <div className="section-label">ABOUT ME</div>
          <p className="profile-bio">{profile.bio}</p>
        </div>
      )}

      {/* Stats */}
      <div className="profile-section">
        <div className="section-label">MEMBER SINCE</div>
        <div className="profile-stat">
          <Shield size={13} />
          <span>{joinDate}</span>
        </div>
      </div>

      <div className="profile-divider" />
    </div>
  )
}
