import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { MessageCircle, Compass, Settings, User } from 'lucide-react'
import Sidebar from '../sidebar/Sidebar'
import { useAuth } from '../../context/AuthContext'
import './AppLayout.css'

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= 768
  })
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth > 768
  })

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [location.pathname, isMobile])

  const mobileNav = useMemo(() => {
    const usernamePath = profile?.username ? `/app/profile/${profile.username}` : '/app/settings'
    return [
      { key: 'chats', label: 'Chats', icon: MessageCircle, path: '/app/chats', active: location.pathname.startsWith('/app/chat') || location.pathname === '/app/chats' },
      { key: 'discover', label: 'Discover', icon: Compass, path: '/app/discover', active: location.pathname === '/app/discover' },
      { key: 'settings', label: 'Settings', icon: Settings, path: '/app/settings', active: location.pathname === '/app/settings' },
      { key: 'profile', label: 'Profile', icon: User, path: usernamePath, active: location.pathname.startsWith('/app/profile/') },
    ]
  }, [location.pathname, profile?.username])

  return (
    <div className="app-layout">
      <div className="app-bg" />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <button
          className="app-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <main className={`app-main ${isMobile ? 'mobile' : ''}`}>
        <Outlet context={{ openSidebar: () => setSidebarOpen(true), isMobile }} />
      </main>

      {isMobile && (
        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          {mobileNav.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                className={`mobile-nav-item ${item.active ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}
