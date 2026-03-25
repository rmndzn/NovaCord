import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Hash, Users, Lock, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useChat } from '../context/ChatContext'
import './Chats.css'

export default function Chats() {
  const navigate = useNavigate()
  const { communities, activeCommunity, setActiveCommunity } = useChat()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return communities
    return communities.filter((community) => {
      return (
        community.name?.toLowerCase().includes(needle) ||
        community.description?.toLowerCase().includes(needle)
      )
    })
  }, [communities, query])

  function openChat(community) {
    setActiveCommunity(community)
    navigate(`/app/chat/${community.id}`)
  }

  return (
    <div className="chats-page">
      <header className="chats-header">
        <h1>Chats</h1>
        <button className="chats-create-btn" onClick={() => navigate('/app/create-community')}>
          <Plus size={16} />
          New
        </button>
      </header>

      <div className="chats-search">
        <Search size={16} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search joined communities"
        />
      </div>

      <div className="chats-list">
        {filtered.length === 0 ? (
          <div className="chats-empty">
            <h3>No joined communities yet</h3>
            <p>Join one from Discover or create your own.</p>
            <button className="btn btn-primary" onClick={() => navigate('/app/discover')}>
              Go to Discover
            </button>
          </div>
        ) : (
          filtered.map((community) => (
            <button
              key={community.id}
              className={`chat-row ${activeCommunity?.id === community.id ? 'active' : ''}`}
              onClick={() => openChat(community)}
            >
              <div className="chat-row-avatar">
                {community.avatar_url ? (
                  <img src={community.avatar_url} alt={community.name} />
                ) : (
                  <span>{community.type === 'channel' ? <Hash size={16} /> : <Users size={16} />}</span>
                )}
                {community.visibility === 'private' && <Lock size={10} className="chat-row-lock" />}
              </div>

              <div className="chat-row-main">
                <div className="chat-row-top">
                  <span className="chat-row-name">{community.name}</span>
                  <span className="chat-row-time">
                    {community.created_at ? formatDistanceToNow(new Date(community.created_at), { addSuffix: false }) : ''}
                  </span>
                </div>
                <div className="chat-row-desc">
                  {community.description || (community.type === 'channel' ? 'Channel' : 'Group')}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
