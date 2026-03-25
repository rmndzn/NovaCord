import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Compass, Settings, Plus, Hash, Users, Lock, LogOut, ChevronDown } from 'lucide-react'
import Avatar from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import { useChat } from '../../context/ChatContext'
import { formatDistanceToNow } from 'date-fns'
import './Sidebar.css'

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const { communities, activeCommunity, setActiveCommunity } = useChat()
  const [search, setSearch] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const filtered = communities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelectCommunity(community) {
    setActiveCommunity(community)
    navigate(`/app/chat/${community.id}`)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">N</div>
        <span className="logo-text">NovaCord</span>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <Search size={14} />
        <input
          className="search-input"
          placeholder="Search chats..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Nav shortcuts */}
      <div className="sidebar-nav">
        <button
          className={`nav-item ${isActive('/app/discover') ? 'active' : ''}`}
          onClick={() => navigate('/app/discover')}
        >
          <Compass size={16} />
          <span>Discover</span>
        </button>
      </div>

      <div className="divider" />

      {/* Communities list */}
      <div className="sidebar-section">
        <div className="section-header">
          <span className="section-title">COMMUNITIES</span>
          <button className="icon-btn" onClick={() => navigate('/app/create-community')} title="Create Community">
            <Plus size={14} />
          </button>
        </div>

        <div className="chat-list">
          {filtered.length === 0 && (
            <div className="empty-state">
              <Compass size={20} style={{ color: 'var(--text-faint)' }} />
              <p>No communities yet</p>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => navigate('/app/discover')}>
                Browse Discover
              </button>
            </div>
          )}

          {filtered.map(community => (
            <ChatListItem
              key={community.id}
              community={community}
              active={activeCommunity?.id === community.id}
              onClick={() => handleSelectCommunity(community)}
            />
          ))}
        </div>
      </div>

      {/* Bottom user bar */}
      <div className="sidebar-user" onClick={() => setShowUserMenu(o => !o)}>
        <div className="user-info">
          <Avatar src={profile?.avatar_url} name={profile?.display_name} size={32} ring status="online" />
          <div className="user-details">
            <div className="user-display-name">{profile?.display_name || 'User'}</div>
            <div className="user-username">@{profile?.username || 'unknown'}</div>
          </div>
        </div>
        <div className="user-actions">
          <button className="icon-btn" onClick={(e) => { e.stopPropagation(); navigate('/app/settings') }}>
            <Settings size={14} />
          </button>
        </div>

        {showUserMenu && (
          <div className="user-menu">
            <button className="user-menu-item" onClick={() => navigate(`/app/profile/${profile?.username}`)}>
              View Profile
            </button>
            <button className="user-menu-item" onClick={() => navigate('/app/settings')}>
              Settings
            </button>
            <div className="divider" />
            <button className="user-menu-item danger" onClick={handleSignOut}>
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

function ChatListItem({ community, active, onClick }) {
  const isPrivate = community.visibility === 'private'
  const isChannel = community.type === 'channel'

  return (
    <div className={`chat-item ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="chat-item-icon">
        {community.avatar_url ? (
          <img src={community.avatar_url} alt={community.name} style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
        ) : (
          <div className="community-icon">
            {isChannel ? <Hash size={16} /> : <Users size={16} />}
          </div>
        )}
        {isPrivate && <Lock size={10} className="private-badge" />}
      </div>

      <div className="chat-item-content">
        <div className="chat-item-header">
          <span className="chat-name">{community.name}</span>
          <span className="chat-time" style={{ fontSize: 10, color: 'var(--text-faint)' }}>
            {community.created_at ? formatDistanceToNow(new Date(community.created_at), { addSuffix: false }) : ''}
          </span>
        </div>
        <div className="chat-preview">
          {community.description || (isChannel ? 'Channel' : 'Group')}
        </div>
      </div>
    </div>
  )
}
