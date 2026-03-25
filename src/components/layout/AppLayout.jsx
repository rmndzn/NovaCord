import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Compass, Home, Settings } from 'lucide-react'
import Sidebar from '../sidebar/Sidebar'
import Avatar from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import { useChat } from '../../context/ChatContext'
import './AppLayout.css'

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { communities, activeCommunity, setActiveCommunity } = useChat()
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth > 768
  })

  useEffect(() => {
    function handleResize() {
      setSidebarOpen(window.innerWidth > 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  function goToCommunity(community) {
    setActiveCommunity(community)
    navigate(`/app/chat/${community.id}`)
  }

  return (
    <div className="app-layout">
      <div className="app-bg" />

      <aside className="mobile-community-rail">
        <button
          className={`mobile-rail-btn ${location.pathname === '/app/discover' ? 'active' : ''}`}
          onClick={() => navigate('/app/discover')}
          aria-label="Discover"
        >
          <Compass size={18} />
        </button>

        <div className="mobile-rail-divider" />

        <div className="mobile-rail-list">
          {communities.map((community) => {
            const isActive = activeCommunity?.id === community.id || location.pathname === `/app/chat/${community.id}`
            return (
              <button
                key={community.id}
                className={`mobile-rail-btn community ${isActive ? 'active' : ''}`}
                onClick={() => goToCommunity(community)}
                aria-label={community.name}
                title={community.name}
              >
                {community.avatar_url ? (
                  <img src={community.avatar_url} alt={community.name} />
                ) : (
                  <span>{community.name?.slice(0, 2).toUpperCase() || 'C'}</span>
                )}
              </button>
            )
          })}
        </div>
      </aside>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {sidebarOpen && (
        <button
          className="app-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <main className="app-main">
        <Outlet context={{ openSidebar: () => setSidebarOpen(true) }} />
      </main>

      <div
        className="mobile-profile-dock"
        onClick={() => navigate(profile?.username ? `/app/profile/${profile.username}` : '/app/settings')}
      >
        <div className="mobile-profile-main">
          <Avatar src={profile?.avatar_url} name={profile?.display_name} size={34} ring />
          <div className="mobile-profile-copy">
            <div className="mobile-profile-name">{profile?.display_name || 'User'}</div>
            <div className="mobile-profile-username">@{profile?.username || 'unknown'}</div>
          </div>
        </div>

        <div className="mobile-profile-actions">
          <button
            className="mobile-profile-action"
            onClick={(event) => {
              event.stopPropagation()
              navigate('/app/discover')
            }}
            aria-label="Discover"
          >
            <Home size={16} />
          </button>
          <button
            className="mobile-profile-action"
            onClick={(event) => {
              event.stopPropagation()
              navigate('/app/settings')
            }}
            aria-label="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
