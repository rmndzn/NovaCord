
import { Hash, Users, Lock, Globe, Info } from 'lucide-react'
import { generateAvatarColor, getInitials } from '../../utils/formatters'
import styles from './ChatHeader.module.css'

export function ChatHeader({ community }) {
  if (!community) return null
  const TypeIcon = community.type === 'channel' ? Hash : Users

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.icon} style={{ background: generateAvatarColor(community.name || '') }}>
          {community.avatar_url ? (
            <img src={community.avatar_url} alt={community.name} className={styles.iconImg} />
          ) : (
            <span className={styles.iconText}>{getInitials(community.name)}</span>
          )}
        </div>
        <div className={styles.info}>
          <div className={styles.nameRow}>
            <TypeIcon size={14} className={styles.typeIcon} />
            <h2 className={styles.name}>{community.name}</h2>
            {community.visibility === 'private'
              ? <span className={styles.badge}><Lock size={10} /> Private</span>
              : <span className={`${styles.badge} ${styles.public}`}><Globe size={10} /> Public</span>
            }
          </div>
          {community.description && <p className={styles.desc}>{community.description}</p>}
        </div>
      </div>
      <div className={styles.actions}>
        <button className={styles.actionBtn}><Info size={18} /></button>
      </div>
    </header>
  )
}
