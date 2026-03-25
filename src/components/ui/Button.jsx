
import styles from './Button.module.css'

export function Button({ children, variant = 'primary', size = 'md', loading, disabled, icon, fullWidth, onClick, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.full : ''} ${loading ? styles.loading : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <span className={styles.spinner} />}
      {icon && !loading && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  )
}
