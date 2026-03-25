import { useEffect, useRef, useState } from 'react'
import { Hash, Users, Lock, Unlock, Image, Send, Loader, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useChat } from '../../context/ChatContext'
import Avatar from '../ui/Avatar'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import './ChatArea.css'

const MAX_FILE_SIZE = 5 * 1024 * 1024

const VALID_IMAGES = ['image/jpeg','image/jpg','image/png','image/webp','image/gif']
const VALID_VIDEOS = ['video/mp4','video/webm','video/quicktime']

export default function ChatArea() {
  const { profile } = useAuth()
  const {
    activeCommunity, messages, loading,
    sendMessage, uploadMedia,
    typingUsers, broadcastTyping, clearTyping,
  } = useChat()

  const [text, setText]                 = useState('')
  const [sending, setSending]           = useState(false)
  const [uploadPreview, setUploadPreview] = useState(null)
  const [uploadFile, setUploadFile]     = useState(null)
  const bottomRef   = useRef(null)
  const fileInputRef = useRef(null)

  // Auto-scroll to bottom when messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Clear stale input when switching community
  useEffect(() => {
    setText('')
    setUploadFile(null)
    setUploadPreview(null)
  }, [activeCommunity?.id])

  if (!activeCommunity) return <EmptyState />

  const isChannel = activeCommunity.type === 'channel'
  const isPrivate  = activeCommunity.visibility === 'private'

  // ── File selection ────────────────────────────────────────────────────────
  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File exceeds 5 MB limit')
      return
    }
    if (![...VALID_IMAGES, ...VALID_VIDEOS].includes(file.type)) {
      toast.error('Unsupported file type')
      return
    }

    setUploadFile(file)
    const reader = new FileReader()
    reader.onloadend = () =>
      setUploadPreview({ url: reader.result, type: file.type, name: file.name })
    reader.readAsDataURL(file)
  }

  function clearUpload() {
    setUploadFile(null)
    setUploadPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Send message ──────────────────────────────────────────────────────────
  async function handleSend() {
    if (!text.trim() && !uploadFile) return
    setSending(true)
    try {
      if (uploadFile) {
        const fileUrl  = await uploadMedia(uploadFile)
        const msgType  = uploadFile.type.startsWith('video/') ? 'video' : 'image'
        await sendMessage(activeCommunity.id, text.trim() || uploadFile.name, fileUrl, msgType)
        clearUpload()
      } else {
        await sendMessage(activeCommunity.id, text.trim())
      }
      setText('')
      // clearTyping is called inside sendMessage in ChatContext
    } catch (err) {
      toast.error(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // ── Input change: broadcast typing via Supabase Realtime ──────────────────
  function handleTextChange(e) {
    setText(e.target.value)
    if (e.target.value.trim()) broadcastTyping()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const groupedMessages = groupMessagesByDate(messages)

  return (
    <div className="chat-area">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="chat-header">
        <div className="chat-header-info">
          {activeCommunity.avatar_url ? (
            <img
              src={activeCommunity.avatar_url}
              alt=""
              style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}
            />
          ) : (
            <div className="channel-icon">
              {isChannel ? <Hash size={18} /> : <Users size={18} />}
            </div>
          )}
          <div>
            <div className="chat-header-name">{activeCommunity.name}</div>
            <div className="chat-header-meta">
              {isPrivate ? <Lock size={11} /> : <Unlock size={11} />}
              <span>{isPrivate ? 'Private' : 'Public'} · {isChannel ? 'Channel' : 'Group'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div className="messages-area">
        {loading ? (
          <div className="loading-messages">
            {[...Array(5)].map((_, i) => <MessageSkeleton key={i} />)}
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="empty-chat">
                <div className="empty-chat-icon">
                  {isChannel ? <Hash size={40} /> : <Users size={40} />}
                </div>
                <h3>Welcome to {activeCommunity.name}</h3>
                <p>{activeCommunity.description || 'This is the beginning of something great.'}</p>
              </div>
            )}

            {groupedMessages.map(({ date, msgs }) => (
              <div key={date}>
                <div className="date-separator">
                  <div className="date-line" />
                  <span className="date-label">{date}</span>
                  <div className="date-line" />
                </div>

                {msgs.map((msg, i) => {
                  const isOwn    = msg.sender_id === profile?.id
                  const prevMsg  = msgs[i - 1]
                  const isGrouped =
                    prevMsg &&
                    prevMsg.sender_id === msg.sender_id &&
                    new Date(msg.created_at) - new Date(prevMsg.created_at) < 300_000
                  return (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={isOwn}
                      isGrouped={isGrouped}
                    />
                  )
                })}
              </div>
            ))}

            {/* ── Typing indicator (powered by Supabase Realtime broadcast) ── */}
            {typingUsers.length > 0 && (
              <div className="typing-indicator">
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
                <span>
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
                </span>
              </div>
            )}

            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* ── Upload preview ─────────────────────────────────────────────────── */}
      {uploadPreview && (
        <div className="upload-preview">
          <div className="preview-item">
            {uploadPreview.type.startsWith('video/') ? (
              <video src={uploadPreview.url} style={{ maxHeight: 120, borderRadius: 8 }} />
            ) : (
              <img src={uploadPreview.url} alt="preview" style={{ maxHeight: 120, borderRadius: 8 }} />
            )}
            <span className="preview-name">{uploadPreview.name}</span>
          </div>
          <button className="remove-preview" onClick={clearUpload}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Input bar ──────────────────────────────────────────────────────── */}
      <div className="chat-input-area">
        <button className="attach-btn" onClick={() => fileInputRef.current?.click()}>
          <Image size={18} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,video/mp4,video/webm"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <textarea
          className="message-input"
          placeholder={`Message ${activeCommunity.name}…`}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        <button
          className={`send-btn ${(text.trim() || uploadFile) && !sending ? 'active' : ''}`}
          onClick={handleSend}
          disabled={sending || (!text.trim() && !uploadFile)}
        >
          {sending
            ? <Loader size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
            : <Send size={18} />
          }
        </button>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MessageBubble({ message, isOwn, isGrouped }) {
  const isImage = message.message_type === 'image'
  const isVideo = message.message_type === 'video'
  const sender  = message.profiles

  return (
    <div className={`message ${isOwn ? 'own' : ''} ${isGrouped ? 'grouped' : ''}`}>
      {!isGrouped && !isOwn && (
        <Avatar src={sender?.avatar_url} name={sender?.display_name} size={32} />
      )}
      {isGrouped && !isOwn && <div style={{ width: 32, flexShrink: 0 }} />}

      <div className="message-content">
        {!isGrouped && (
          <div className="message-header">
            <span className="message-sender">
              {isOwn ? 'You' : sender?.display_name || 'Unknown'}
            </span>
            <span className="message-time">
              {format(new Date(message.created_at), 'HH:mm')}
            </span>
          </div>
        )}

        <div className={`message-bubble ${isOwn ? 'own-bubble' : ''}`}>
          {message.file_url && isImage && (
            <img
              src={message.file_url}
              alt="media"
              className="message-media"
              onClick={() => window.open(message.file_url, '_blank')}
            />
          )}
          {message.file_url && isVideo && (
            <video src={message.file_url} controls className="message-media" />
          )}
          {message.content && message.content !== message.file_url && (
            <p className="message-text">{message.content}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function MessageSkeleton() {
  return (
    <div className="message" style={{ padding: '8px 16px' }}>
      <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="skeleton" style={{ width: 120, height: 12 }} />
        <div className="skeleton" style={{ width: '60%', height: 16 }} />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="empty-channel-state">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⚡</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--violet-300)', marginBottom: 8 }}>
          Select a Community
        </h2>
        <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>
          Choose a community from the sidebar to start chatting
        </p>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupMessagesByDate(messages) {
  const groups = {}
  messages.forEach(msg => {
    const date = format(new Date(msg.created_at), 'MMMM d, yyyy')
    if (!groups[date]) groups[date] = []
    groups[date].push(msg)
  })
  return Object.entries(groups).map(([date, msgs]) => ({ date, msgs }))
}
