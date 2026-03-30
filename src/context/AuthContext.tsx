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
  const initializedRef = useRef(false)

  useEffect(() => {
    let mounted = true

    async function initialize() {
      try {
        // Try to get existing session — with a timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))

        const result = await Promise.race([sessionPromise, timeoutPromise])

        if (!mounted) return

        if (result && 'data' in result) {
          const { data: { session: existingSession }, error } = result
          if (error) {
            console.warn('[Auth] getSession error:', error.message)
          }

          setSession(existingSession)
          setUser(existingSession?.user ?? null)

          if (existingSession?.user) {
            try {
              const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', existingSession.user.id)
                .single()
              if (mounted) setProfile(data)
            } catch (err) {
              console.warn('[Auth] Profile load error:', err)
            }
          }
        } else {
          // Timeout hit — no session available
          console.warn('[Auth] Session fetch timed out')
        }
      } catch (err) {
        console.error('[Auth] Initialize error:', err)
      } finally {
        if (mounted) {
          setLoading(false)
          initializedRef.current = true
        }
      }
    }

    initialize()

    // Listen for future auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return

        // Skip the INITIAL_SESSION event — we handle that in initialize()
        if (!initializedRef.current) return

        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newSession.user.id)
              .single()
            if (mounted) setProfile(data)
          } catch (err) {
            console.warn('[Auth] Profile reload error:', err)
          }
        } else {
          setProfile(null)
        }

        if (mounted) setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
    }
    // On success, onAuthStateChange will fire and set loading=false
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
