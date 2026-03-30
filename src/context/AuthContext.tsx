import { createContext, useContext, useEffect, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    // HARD SAFETY TIMEOUT: loading will ALWAYS become false after 3 seconds
    // This prevents any Supabase hang from freezing the app
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.warn('[AuthContext] Safety timeout triggered — forcing loading=false')
        setLoading(false)
      }
    }, 3000)

    // Use ONLY onAuthStateChange (recommended by Supabase)
    // Do NOT use getSession() - it can hang on expired tokens
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mountedRef.current) return

        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newSession.user.id)
              .single()
            if (mountedRef.current) setProfile(data)
          } catch (err) {
            console.error('[AuthContext] Profile load error:', err)
          }
        } else {
          setProfile(null)
        }

        if (mountedRef.current) setLoading(false)
      }
    )

    return () => {
      mountedRef.current = false
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  async function signUp(email: string, password: string, name: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    return { error: error as Error | null }
  }

  async function signOut() {
    setProfile(null)
    setUser(null)
    setSession(null)
    // Don't set loading=true here — let onAuthStateChange handle it
    await supabase.auth.signOut({ scope: 'local' })
    setLoading(false)
  }

  async function updateProfile(data: Partial<Profile>) {
    if (!user) return
    const { data: updated } = await supabase
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()
    if (updated) setProfile(updated)
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
