
import styles from './Skeleton.module.css'
export function Skeleton({ width, height, circle, className = '' }) {
  return (
    <div
      className={`${styles.skeleton} ${circle ? styles.circle : ''} ${className}`}
      style={{ width, height }}
    />
  )
}
