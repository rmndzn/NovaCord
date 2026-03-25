import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-void)' }}>
      <div style={{ fontFamily: 'var(--font-display)', color: 'var(--violet-400)', fontSize: 14, letterSpacing: 3 }}>NOVACORD...</div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}
