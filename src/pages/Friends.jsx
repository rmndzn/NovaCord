import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, MessageCircle, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Avatar from '../components/ui/Avatar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import './Friends.css'

export default function Friends() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [friendships, setFriendships] = useState([])
  const [profilesById, setProfilesById] = useState({})
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!user) return
    loadFriendships()
  }, [user?.id])

  async function loadFriendships() {
    setLoading(true)
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error(error.message || 'Failed to load friends')
      setLoading(false)
      return
    }

    setFriendships(data || [])

    const profileIds = [...new Set((data || []).flatMap((friendship) => [friendship.requester_id, friendship.addressee_id]))]
      .filter((id) => id !== user.id)

    if (!profileIds.length) {
      setProfilesById({})
      setLoading(false)
      return
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', profileIds)

    if (profileError) {
      toast.error(profileError.message || 'Failed to load user profiles')
      setLoading(false)
      return
    }

    const mapped = {}
    for (const profile of profiles || []) mapped[profile.id] = profile
    setProfilesById(mapped)
    setLoading(false)
  }

  const incomingRequests = useMemo(() => {
    return friendships.filter((friendship) => friendship.status === 'pending' && friendship.addressee_id === user?.id)
  }, [friendships, user?.id])

  const acceptedFriends = useMemo(() => {
    return friendships.filter((friendship) => friendship.status === 'accepted')
  }, [friendships])

  function getOtherProfile(friendship) {
    const otherId = friendship.requester_id === user?.id ? friendship.addressee_id : friendship.requester_id
    return profilesById[otherId] || null
  }

  async function sendFriendRequest() {
    const input = username.trim().toLowerCase()
    if (!input) return toast.error('Enter a username first')
    if (sending) return

    setSending(true)
    try {
      const { data: target, error: targetError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', input)
        .maybeSingle()

      if (targetError) throw targetError
      if (!target) return toast.error('User not found')
      if (target.id === user.id) return toast.error('You cannot add yourself')

      const { error } = await supabase.from('friendships').insert({
        requester_id: user.id,
        addressee_id: target.id,
        status: 'pending',
      })

      if (error) {
        if (error.code === '23505') {
          toast.error('Friend request already exists')
        } else {
          throw error
        }
      } else {
        toast.success(`Friend request sent to @${target.username}`)
        setUsername('')
        await loadFriendships()
      }
    } catch (error) {
      toast.error(error.message || 'Could not send friend request')
    } finally {
      setSending(false)
    }
  }

  async function respond(friendshipId, accept) {
    const nextStatus = accept ? 'accepted' : 'blocked'
    const { error } = await supabase
      .from('friendships')
      .update({ status: nextStatus, responded_at: new Date().toISOString() })
      .eq('id', friendshipId)

    if (error) {
      toast.error(error.message || 'Could not update request')
      return
    }

    toast.success(accept ? 'Friend request accepted' : 'Friend request declined')
    await loadFriendships()
  }

  return (
    <div className="friends-page">
      <div className="friends-head">
        <h1>Friends</h1>
      </div>

      <section className="friends-card add">
        <div className="friends-card-title">
          <UserPlus size={16} />
          <span>Add Friend</span>
        </div>
        <div className="friends-add-row">
          <input
            placeholder="Enter username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <button onClick={sendFriendRequest} disabled={sending}>
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </section>

      <section className="friends-card">
        <div className="friends-card-title">
          <span>Incoming Requests</span>
          <small>{incomingRequests.length}</small>
        </div>

        {loading ? (
          <p className="friends-empty">Loading requests...</p>
        ) : incomingRequests.length === 0 ? (
          <p className="friends-empty">No pending friend requests.</p>
        ) : (
          incomingRequests.map((friendship) => {
            const profile = getOtherProfile(friendship)
            if (!profile) return null
            return (
              <div className="friend-row" key={friendship.id}>
                <div className="friend-main">
                  <Avatar src={profile.avatar_url} name={profile.display_name} size={38} />
                  <div>
                    <div className="friend-name">{profile.display_name}</div>
                    <div className="friend-user">@{profile.username}</div>
                  </div>
                </div>
                <div className="friend-actions">
                  <button className="accept" onClick={() => respond(friendship.id, true)}><Check size={14} /></button>
                  <button className="decline" onClick={() => respond(friendship.id, false)}><X size={14} /></button>
                </div>
              </div>
            )
          })
        )}
      </section>

      <section className="friends-card">
        <div className="friends-card-title">
          <span>Your Friends</span>
          <small>{acceptedFriends.length}</small>
        </div>
        {loading ? (
          <p className="friends-empty">Loading friends...</p>
        ) : acceptedFriends.length === 0 ? (
          <p className="friends-empty">No friends yet.</p>
        ) : (
          acceptedFriends.map((friendship) => {
            const profile = getOtherProfile(friendship)
            if (!profile) return null
            return (
              <div className="friend-row" key={friendship.id}>
                <div className="friend-main">
                  <Avatar src={profile.avatar_url} name={profile.display_name} size={40} ring />
                  <div>
                    <div className="friend-name">{profile.display_name}</div>
                    <div className="friend-user">@{profile.username}</div>
                  </div>
                </div>
                <button className="message-btn" onClick={() => navigate(`/app/dm/${profile.username}`)}>
                  <MessageCircle size={14} />
                  Message
                </button>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
