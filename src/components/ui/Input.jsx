
import styles from './Input.module.css'

export function Input({ label, error, hint, icon, type = 'text', ...props }) {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={`${styles.inputWrap} ${error ? styles.hasError : ''}`}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input type={type} className={`${styles.input} ${icon ? styles.withIcon : ''}`} {...props} />
      </div>
      {error && <span className={styles.error}>{error}</span>}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}

export function Textarea({ label, error, rows = 3, ...props }) {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <textarea className={`${styles.input} ${styles.textarea} ${error ? styles.hasError : ''}`} rows={rows} {...props} />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
