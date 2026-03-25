import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function ensureProfileRow(authUser, overrides = {}) {
    if (!authUser?.id) return null

    const fallbackUsernameBase =
      overrides.username ||
      authUser.user_metadata?.username ||
      authUser.email?.split('@')[0] ||
      `user_${authUser.id.slice(0, 8)}`

    const payload = {
      id: authUser.id,
      email: overrides.email || authUser.email || '',
      username: fallbackUsernameBase,
      display_name:
        overrides.display_name ||
        authUser.user_metadata?.display_name ||
        authUser.user_metadata?.full_name ||
        fallbackUsernameBase,
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async function fetchProfile(userOrId, fallbackProfile = null) {
    const userId = typeof userOrId === 'string' ? userOrId : userOrId?.id
    if (!userId) {
      setProfile(null)
      setLoading(false)
      return null
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error

    const nextProfile =
      data ||
      fallbackProfile ||
      (typeof userOrId === 'object' ? await ensureProfileRow(userOrId) : null)

    setProfile(nextProfile)
    setLoading(false)
    return nextProfile
  }

  async function signUp(email, password, username, displayName) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user) {
      await ensureProfileRow(data.user, {
        email,
        username,
        display_name: displayName,
      })
    }
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.user) {
      await fetchProfile(data.user)
    }
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  async function updateProfile(updates) {
    if (!user) return
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateProfile, refetchProfile: () => fetchProfile(user) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
