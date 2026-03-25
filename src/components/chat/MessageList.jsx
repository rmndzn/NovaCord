
import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { Skeleton } from '../ui/Skeleton'
import styles from './MessageList.module.css'

export function MessageList({ messages, loading }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return (
      <div className={styles.list}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className={styles.skeletonRow} style={{ justifyContent: i % 3 === 0 ? 'flex-end' : 'flex-start' }}>
            {i % 3 !== 0 && <Skeleton circle width={32} height={32} />}
            <Skeleton width={`${120 + i * 30}px`} height={40} />
          </div>
        ))}
      </div>
    )
  }

  if (!messages.length) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyOrb} />
        <h3 className={styles.emptyTitle}>No messages yet</h3>
        <p className={styles.emptyDesc}>Be the first to send a message!</p>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {messages.map((msg, idx) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          showAvatar={idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
