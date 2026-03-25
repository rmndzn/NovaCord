import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, Hash, Globe, Lock, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import toast from 'react-hot-toast'
import './Discover.css'

export default function Discover() {
  const { user } = useAuth()
  const { fetchCommunities } = useChat()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => { loadPublicCommunities() }, [query, filter])

  async function loadPublicCommunities() {
    setLoading(true)
    let q = supabase.from('communities').select('*').eq('visibility', 'public')
    if (query) q = q.ilike('name', `%${query}%`)
    if (filter !== 'all') q = q.eq('type', filter)
    q = q.order('created_at', { ascending: false }).limit(30)
    const { data } = await q
    setCommunities(data || [])
    setLoading(false)
  }

  async function handleJoin(community) {
    setJoining(community.id)
    try {
      const { error } = await supabase.from('community_members').insert({
        community_id: community.id,
        user_id: user.id,
        role: 'member',
      })
      if (error) throw error
      await fetchCommunities()
      toast.success(`Joined ${community.name}!`)
      navigate(`/app/chat/${community.id}`)
    } catch (err) {
      if (err.code === '23505') toast.error('Already a member')
      else toast.error(err.message || 'Failed to join')
    } finally {
      setJoining(null)
    }
  }

  const filterBtns = [
    { id: 'all', label: 'All', icon: <Globe size={13} /> },
    { id: 'group', label: 'Groups', icon: <Users size={13} /> },
    { id: 'channel', label: 'Channels', icon: <Hash size={13} /> },
  ]

  return (
    <div className="discover-page">
      <div className="discover-header">
        <div className="discover-title-area">
          <Zap size={22} style={{ color: 'var(--violet-400)' }} />
          <div>
            <h1 className="discover-title">Discover</h1>
            <p className="discover-subtitle">Find public communities to join</p>
          </div>
        </div>

        <div className="discover-controls">
          <div className="discover-search">
            <Search size={15} />
            <input placeholder="Search communities..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>

          <div className="filter-tabs">
            {filterBtns.map(f => (
              <button key={f.id} className={`filter-tab ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
                {f.icon} {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="communities-grid">
        {loading ? (
          [...Array(6)].map((_, i) => <CommunitySkeleton key={i} />)
        ) : communities.length === 0 ? (
          <div className="no-results">
            <Globe size={40} style={{ color: 'var(--text-faint)', marginBottom: 12 }} />
            <h3>No communities found</h3>
            <p>Try a different search or create your own</p>
          </div>
        ) : (
          communities.map(c => (
            <CommunityCard key={c.id} community={c} onJoin={() => handleJoin(c)} joining={joining === c.id} />
          ))
        )}
      </div>
    </div>
  )
}

function CommunityCard({ community, onJoin, joining }) {
  const isChannel = community.type === 'channel'
  return (
    <div className="community-card">
      <div className="community-card-banner">
        {community.avatar_url ? (
          <img src={community.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div className="community-banner-default">
            {isChannel ? <Hash size={32} /> : <Users size={32} />}
          </div>
        )}
        <div className="community-type-badge">
          <span className={`badge ${isChannel ? 'badge-violet' : 'badge-public'}`}>
            {isChannel ? 'Channel' : 'Group'}
          </span>
        </div>
      </div>

      <div className="community-card-body">
        <h3 className="community-card-name">{community.name}</h3>
        {community.description && (
          <p className="community-card-desc">{community.description}</p>
        )}

        <button className="btn btn-primary join-btn" onClick={onJoin} disabled={joining}>
          {joining ? 'JOINING...' : 'JOIN'}
        </button>
      </div>
    </div>
  )
}

function CommunitySkeleton() {
  return (
    <div className="community-card">
      <div className="skeleton" style={{ height: 100 }} />
      <div className="community-card-body">
        <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 12, width: '80%', marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 36, borderRadius: 10 }} />
      </div>
    </div>
  )
}
