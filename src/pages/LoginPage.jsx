
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Zap } from 'lucide-react'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import styles from './AuthPage.module.css'

export function LoginPage() {
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
      toast.success('Welcome back!')
      navigate('/app')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg}>
        {[...Array(6)].map((_, i) => <div key={i} className={styles.orb} style={{ '--i': i }} />)}
      </div>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}><Zap size={24} /></div>
          <span className={styles.logoText}>NovaCord</span>
        </div>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to your account</p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" icon={<Mail size={16} />} />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" icon={<Lock size={16} />} />
          <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>Sign In</Button>
        </form>
        <p className={styles.switch}>
          Don't have an account? <Link to="/register" className={styles.link}>Register</Link>
        </p>
      </div>
    </div>
  )
}
