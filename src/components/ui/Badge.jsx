
import styles from './Badge.module.css'

export function Badge({ src, name, size = 'md' }) {
  return (
    <div className={`${styles.badge} ${styles[size]}`} title={name}>
      <img src={src} alt={name} className={styles.img} />
      <div className={styles.glow} />
    </div>
  )
}

export function BadgeList({ badges }) {
  if (!badges?.length) return null
  return (
    <div className={styles.list}>
      {badges.map((b, i) => <Badge key={i} src={b.badge_url} name={b.badge_name} />)}
    </div>
  )
}
