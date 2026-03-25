import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import './Auth.css'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill all fields')
    setLoading(true)
    try {
      await signIn(email, password)
      toast.success('Welcome back, soldier.')
      navigate('/app')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="app-bg" />
      <div className="auth-grid" />

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">N</div>
          <span className="auth-logo-text">NovaCord</span>
        </div>

        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your gaming hub</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label className="field-label">EMAIL</label>
            <input className="input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="field-group">
            <label className="field-label">PASSWORD</label>
            <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>

        <p className="auth-switch">
          New to NovaCord? <Link to="/register" className="auth-link">Create account</Link>
        </p>
      </div>
    </div>
  )
}
