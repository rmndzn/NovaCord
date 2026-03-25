import { useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Hash,
  Users,
  Lock,
  Unlock,
  Image,
  Send,
  Loader,
  X,
  Menu,
  Settings2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useChat } from '../../context/ChatContext'
import Avatar from '../ui/Avatar'
import CommunityManagePanel from './CommunityManagePanel'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import './ChatArea.css'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const VALID_IMAGES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const VALID_VIDEOS = ['video/mp4', 'video/webm', 'video/quicktime']

export default function ChatArea() {
  const { communityId } = useParams()
  const navigate = useNavigate()
  const { openSidebar } = useOutletContext() || {}
  const { profile, user } = useAuth()
  const {
    communities,
    activeCommunity,
    activateCommunityById,
    messages,
    loading,
    sendMessage,
    uploadMedia,
    typingUsers,
    broadcastTyping,
    members,
  } = useChat()

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadPreview, setUploadPreview] = useState(null)
  const [uploadFile, setUploadFile] = useState(null)
  const [showManagePanel, setShowManagePanel] = useState(false)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!communityId) return
    if (activeCommunity?.id === communityId) return

    activateCommunityById(communityId)
      .then((community) => {
        if (!community) {
          toast.error('You are not a member of that community.')
          navigate('/app/discover')
        }
      })
      .catch(() => {
        toast.error('Unable to open that community right now.')
        navigate('/app/discover')
      })
  }, [communityId, activeCommunity?.id, communities, activateCommunityById])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setText('')
    setUploadFile(null)
    setUploadPreview(null)
    setShowManagePanel(false)
  }, [activeCommunity?.id])

  if (!activeCommunity) return <EmptyState openSidebar={openSidebar} />

  const isChannel = activeCommunity.type === 'channel'
  const isPrivate = activeCommunity.visibility === 'private'
  const isOwner = activeCommunity.owner_id === user?.id || activeCommunity.role === 'owner'

  function handleFileSelect(event) {
    const file = event.target.files?.[0]
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
    reader.onloadend = () => {
      setUploadPreview({ url: reader.result, type: file.type, name: file.name })
    }
    reader.readAsDataURL(file)
  }

  function clearUpload() {
    setUploadFile(null)
    setUploadPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSend() {
    if (!text.trim() && !uploadFile) return

    setSending(true)
    try {
      if (uploadFile) {
        const fileUrl = await uploadMedia(uploadFile)
        const messageType = uploadFile.type.startsWith('video/') ? 'video' : 'image'
        await sendMessage(activeCommunity.id, text.trim() || uploadFile.name, fileUrl, messageType)
        clearUpload()
      } else {
        await sendMessage(activeCommunity.id, text.trim())
      }
      setText('')
    } catch (error) {
      toast.error(error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  function handleTextChange(event) {
    setText(event.target.value)
    if (event.target.value.trim()) broadcastTyping()
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/app/discover')
  }

  const groupedMessages = groupMessagesByDate(messages)

  return (
    <>
      <div className="chat-area">
        <div
          className="chat-hero"
          style={{
            backgroundImage: activeCommunity.banner_url
              ? `linear-gradient(180deg, rgba(4, 1, 12, 0.35), rgba(5, 0, 15, 0.96)), url(${activeCommunity.banner_url})`
              : undefined,
          }}
        >
          {!activeCommunity.banner_url && <div className="chat-hero-fallback" />}
          <div className="chat-header">
            <div className="chat-header-info">
              <button className="chat-back-btn" onClick={handleBack} aria-label="Back">
                <ArrowLeft size={18} />
              </button>

              <button className="mobile-sidebar-btn" onClick={() => openSidebar?.()} aria-label="Open sidebar">
                <Menu size={18} />
              </button>

              {activeCommunity.avatar_url ? (
                <img
                  src={activeCommunity.avatar_url}
                  alt={activeCommunity.name}
                  className="chat-header-avatar"
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
                  <span>{isPrivate ? 'Private' : 'Public'} | {isChannel ? 'Channel' : 'Group'}</span>
                  <span>|</span>
                  <span>{members.length} members</span>
                </div>
              </div>
            </div>

            {isOwner && (
              <button className="chat-manage-btn" onClick={() => setShowManagePanel(true)}>
                <Settings2 size={16} />
                Manage
              </button>
            )}
          </div>

          <div className="chat-community-summary">
            <p className="chat-community-kicker">Community Space</p>
            <h1>{activeCommunity.name}</h1>
            <p>{activeCommunity.description || 'Welcome to your community hub. Start the conversation and shape the vibe.'}</p>
          </div>
        </div>

        <div className="messages-area">
          {loading ? (
            <div className="loading-messages">
              {[...Array(5)].map((_, index) => <MessageSkeleton key={index} />)}
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

                  {msgs.map((message, index) => {
                    const isOwn = message.sender_id === profile?.id
                    const prevMessage = msgs[index - 1]
                    const isGrouped = Boolean(
                      prevMessage &&
                      prevMessage.sender_id === message.sender_id &&
                      new Date(message.created_at) - new Date(prevMessage.created_at) < 300000
                    )

                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={isOwn}
                        isGrouped={isGrouped}
                      />
                    )
                  })}
                </div>
              ))}

              {typingUsers.length > 0 && (
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
                </div>
              )}

              <div ref={bottomRef} />
            </>
          )}
        </div>

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
            placeholder={`Message ${activeCommunity.name}...`}
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
              : <Send size={18} />}
          </button>
        </div>
      </div>

      <CommunityManagePanel
        community={activeCommunity}
        open={showManagePanel}
        onClose={() => setShowManagePanel(false)}
      />
    </>
  )
}

function MessageBubble({ message, isOwn, isGrouped }) {
  const isImage = message.message_type === 'image'
  const isVideo = message.message_type === 'video'
  const sender = message.profiles

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

function EmptyState({ openSidebar }) {
  return (
    <div className="empty-channel-state">
      <div style={{ textAlign: 'center' }}>
        <button className="mobile-sidebar-empty-btn" onClick={() => openSidebar?.()}>
          <Menu size={18} />
          Browse Communities
        </button>
        <div style={{ fontSize: 64, marginBottom: 16 }}>N</div>
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

function groupMessagesByDate(messages) {
  const groups = {}
  messages.forEach((message) => {
    const date = format(new Date(message.created_at), 'MMMM d, yyyy')
    if (!groups[date]) groups[date] = []
    groups[date].push(message)
  })
  return Object.entries(groups).map(([date, msgs]) => ({ date, msgs }))
}
