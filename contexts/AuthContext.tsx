import { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../utils/supabase'
import { router } from 'expo-router'

export interface AuthContextType {
  session: Session | null;
  user: {
    id: string;
    email: string;
    username: string | null;
  } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.replace('/(auth)')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider 
      value={{ 
        session, 
        user: user ? {
          id: user.id,
          email: user.email!,
          username: user.user_metadata?.username || null,
        } : null,
        loading, 
        signOut 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
} 