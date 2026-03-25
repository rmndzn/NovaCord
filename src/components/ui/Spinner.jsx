export default function Spinner({ size = 24, color = 'var(--violet-500)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" strokeDasharray="40" strokeDashoffset="30" strokeLinecap="round" />
    </svg>
  )
}
