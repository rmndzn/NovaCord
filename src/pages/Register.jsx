import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import './Auth.css'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', username: '', displayName: '' })
  const [loading, setLoading] = useState(false)

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    const { email, password, username, displayName } = form
    if (!email || !password || !username || !displayName) return toast.error('Please fill all fields')
    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    if (!/^[a-z0-9_]{3,20}$/.test(username)) return toast.error('Username: 3-20 chars, lowercase letters, numbers, underscore')

    setLoading(true)
    try {
      await signUp(email, password, username, displayName)
      toast.success('Account created! Check your email.')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Registration failed')
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

        <h1 className="auth-title">Join the Network</h1>
        <p className="auth-subtitle">Create your gaming identity</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label className="field-label">DISPLAY NAME</label>
            <input className="input" placeholder="Your Name" value={form.displayName} onChange={update('displayName')} required />
          </div>
          <div className="field-group">
            <label className="field-label">USERNAME</label>
            <input className="input" placeholder="unique_handle" value={form.username} onChange={update('username')} required />
          </div>
          <div className="field-group">
            <label className="field-label">EMAIL</label>
            <input className="input" type="email" placeholder="your@email.com" value={form.email} onChange={update('email')} required />
          </div>
          <div className="field-group">
            <label className="field-label">PASSWORD</label>
            <input className="input" type="password" placeholder="Min 6 characters" value={form.password} onChange={update('password')} required />
          </div>

          <button className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
