import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import Avatar from '../components/ui/Avatar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import './DirectMessages.css'

export default function DirectMessages() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [targetProfile, setTargetProfile] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!user?.id || !username) return
    loadThread()
  }, [user?.id, username])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadThread() {
    setLoading(true)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('username', username)
      .maybeSingle()

    if (profileError || !profile) {
      toast.error('User not found')
      setLoading(false)
      return
    }
    setTargetProfile(profile)

    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })

    if (error) {
      toast.error(error.message || 'Could not load messages')
      setLoading(false)
      return
    }

    setMessages(data || [])
    setLoading(false)
  }

  async function sendMessage() {
    if (!text.trim() || !targetProfile || sending) return
    setSending(true)
    const content = text.trim()
    setText('')
    const { error } = await supabase.from('direct_messages').insert({
      sender_id: user.id,
      receiver_id: targetProfile.id,
      content,
    })

    if (error) {
      toast.error(error.message || 'Could not send message')
      setText(content)
      setSending(false)
      return
    }

    await loadThread()
    setSending(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="dm-page">
      <div className="dm-header">
        <button className="dm-back" onClick={() => navigate('/app/friends')}>
          <ArrowLeft size={16} />
        </button>
        <div className="dm-target">
          <Avatar src={targetProfile?.avatar_url} name={targetProfile?.display_name} size={36} />
          <div>
            <div className="dm-name">{targetProfile?.display_name || username}</div>
            <div className="dm-user">@{targetProfile?.username || username}</div>
          </div>
        </div>
      </div>

      <div className="dm-messages">
        {loading ? (
          <p className="dm-empty">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="dm-empty">Start your conversation with @{username}</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`dm-bubble ${message.sender_id === user?.id ? 'mine' : ''}`}>
              <p>{message.content}</p>
              <span>{format(new Date(message.created_at), 'HH:mm')}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="dm-input-row">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          rows={1}
        />
        <button onClick={sendMessage} disabled={sending || !text.trim()}>
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
