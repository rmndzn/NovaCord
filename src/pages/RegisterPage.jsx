
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, AtSign, Zap } from 'lucide-react'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import styles from './AuthPage.module.css'

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', username: '', displayName: '' })
  const [loading, setLoading] = useState(false)
  const registrationDisabled = true

  function update(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (registrationDisabled) {
      toast.error('Registration is temporarily disabled')
      return
    }
    if (!form.email || !form.password || !form.username || !form.displayName)
      return toast.error('Please fill all fields')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await signUp(form.email, form.password, form.username, form.displayName)
      toast.success('Account created! Welcome to NovaCord!')
      navigate('/app')
    } catch (err) {
      toast.error(err.message || 'Registration failed')
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
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>Join the next-gen gaming social platform</p>
        {registrationDisabled && (
          <div className={styles.notice}>Registration is temporarily disabled</div>
        )}
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input label="Display Name" value={form.displayName} onChange={e => update('displayName', e.target.value)} placeholder="Your name" icon={<User size={16} />} disabled={registrationDisabled} />
          <Input label="Username" value={form.username} onChange={e => update('username', e.target.value.replace(/\s/g, '').toLowerCase())} placeholder="username" icon={<AtSign size={16} />} disabled={registrationDisabled} />
          <Input label="Email" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" icon={<Mail size={16} />} disabled={registrationDisabled} />
          <Input label="Password" type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="min 6 characters" icon={<Lock size={16} />} disabled={registrationDisabled} />
          <Button type="submit" variant="primary" fullWidth size="lg" loading={loading && !registrationDisabled} disabled={registrationDisabled}>
            {registrationDisabled ? 'Registration Disabled' : 'Create Account'}
          </Button>
        </form>
        <p className={styles.switch}>
          Already have an account? <Link to="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
