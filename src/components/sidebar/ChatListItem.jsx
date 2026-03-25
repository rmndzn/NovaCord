
import { Lock, Hash, Users } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { formatRelativeTime, getInitials, generateAvatarColor } from '../../utils/formatters'
import styles from './ChatListItem.module.css'

export function ChatListItem({ community, active, onClick }) {
  const TypeIcon = community.type === 'channel' ? Hash : Users
  const isPrivate = community.visibility === 'private'

  return (
    <button className={`${styles.item} ${active ? styles.active : ''}`} onClick={onClick}>
      <div className={styles.iconWrap}>
        {community.avatar_url ? (
          <img src={community.avatar_url} alt={community.name} className={styles.icon} />
        ) : (
          <div className={styles.iconFallback} style={{ background: generateAvatarColor(community.name || '') }}>
            {getInitials(community.name)}
          </div>
        )}
        {isPrivate && <span className={styles.lockBadge}><Lock size={8} /></span>}
      </div>
      <div className={styles.info}>
        <div className={styles.row1}>
          <span className={styles.name}>{community.name}</span>
          <TypeIcon size={11} className={styles.typeIcon} />
        </div>
        <span className={styles.desc}>{community.description || 'No description'}</span>
      </div>
      {active && <div className={styles.activePill} />}
    </button>
  )
}
