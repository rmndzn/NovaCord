
import { formatMessageTime, getInitials, generateAvatarColor } from '../../utils/formatters'
import { Avatar } from '../ui/Avatar'
import styles from './MessageBubble.module.css'
import { useAuth } from '../../context/AuthContext'

export function MessageBubble({ message, showAvatar = true }) {
  const { user } = useAuth()
  const isMine = message.sender_id === user?.id
  const sender = message.profiles

  return (
    <div className={`${styles.bubble} ${isMine ? styles.mine : styles.theirs}`}>
      {!isMine && showAvatar && (
        <div className={styles.avatar}>
          <Avatar
            src={sender?.avatar_url}
            name={sender?.display_name || sender?.username || '?'}
            size="sm"
          />
        </div>
      )}
      <div className={styles.content}>
        {!isMine && showAvatar && (
          <div className={styles.header}>
            <span className={styles.name}>{sender?.display_name || sender?.username || 'Unknown'}</span>
            <span className={styles.time}>{formatMessageTime(message.created_at)}</span>
          </div>
        )}
        <div className={`${styles.body} ${isMine ? styles.bodyMine : styles.bodyTheirs}`}>
          {message.message_type === 'text' && (
            <p className={styles.text}>{message.content}</p>
          )}
          {message.message_type === 'image' && (
            <div className={styles.media}>
              <img src={message.file_url} alt="image" className={styles.mediaImg} onClick={() => window.open(message.file_url, '_blank')} />
              {message.content && <p className={styles.caption}>{message.content}</p>}
            </div>
          )}
          {message.message_type === 'video' && (
            <div className={styles.media}>
              <video src={message.file_url} controls className={styles.mediaVideo} />
              {message.content && <p className={styles.caption}>{message.content}</p>}
            </div>
          )}
        </div>
        {isMine && <span className={styles.timeRight}>{formatMessageTime(message.created_at)}</span>}
      </div>
      {isMine && <div className={styles.spacer} />}
    </div>
  )
}
