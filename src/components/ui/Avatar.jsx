export default function Avatar({ src, name = '?', size = 36, ring = false, status = null }) {
  const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  const colors = ['#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95']
  const bg = colors[(name?.charCodeAt(0) || 0) % colors.length]

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      {src ? (
        <img src={src} alt={name} style={{
          width: size, height: size, borderRadius: '50%', objectFit: 'cover',
          border: ring ? '2px solid var(--violet-500)' : '2px solid transparent',
          boxShadow: ring ? '0 0 12px rgba(139,92,246,0.4)' : 'none',
        }} />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: `linear-gradient(135deg, ${bg}, #a78bfa)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.35, fontWeight: 700, color: 'white',
          fontFamily: 'var(--font-display)',
          border: ring ? '2px solid var(--violet-500)' : '2px solid rgba(139,92,246,0.3)',
          boxShadow: ring ? '0 0 12px rgba(139,92,246,0.4)' : 'none',
          letterSpacing: '-0.5px',
        }}>
          {initials}
        </div>
      )}
      {status && <div className={`status-dot status-${status}`} style={{ position: 'absolute', bottom: 0, right: 0, border: '2px solid var(--bg-deep)' }} />}
    </div>
  )
}
