'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, Usuario } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  profile: Usuario | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, nome: string, dataNascimento?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updateProfile: (data: Partial<Usuario>) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Usuario | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Função para buscar o perfil do usuário
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Erro ao buscar perfil:', error)
        setProfile(null)
        return
      }
      setProfile(data)
    } catch (error) {
      console.error('Erro ao buscar perfil (catch):', error)
      setProfile(null)
    }
  }

  // Verificar sessão ao carregar
  useEffect(() => {
    console.log('[AuthContext] useEffect inicializado');
    const getSession = async () => {
      try {
        console.log('[AuthContext] Chamando supabase.auth.getSession()');
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('[AuthContext] Resultado getSession:', { session, error });
        if (error) throw error
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error('[AuthContext] Erro ao verificar sessão:', error)
      } finally {
        setLoading(false)
        console.log('[AuthContext] loading = false (getSession)')
      }
    }
    getSession()
    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Evento de auth:', event, session)
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
        console.log('[AuthContext] loading = false (auth event)')
      }
    )
    return () => {
      console.log('[AuthContext] Limpando subscription do onAuthStateChange');
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Salvar data do último login para controle de sessão
      localStorage.setItem('lastLoginDate', new Date().toISOString())
      
      return { error: null }
    } catch (error: any) {
      return { error: error.message || 'Erro ao fazer login' }
    }
  }

  const signUp = async (email: string, password: string, nome: string, dataNascimento?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) throw error

      // Criar perfil do usuário
      if (data.user) {
        const { error: profileError } = await supabase
          .from('usuarios')
          .insert([
            {
              id: data.user.id,
              nome,
              data_nascimento: dataNascimento || null
            }
          ])

        if (profileError) throw profileError
      }

      return { error: null }
    } catch (error: any) {
      return { error: error.message || 'Erro ao criar conta' }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Limpar dados locais
      localStorage.removeItem('lastLoginDate')
      
      setUser(null)
      setProfile(null)
      setSession(null)
      
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      return { error: null }
    } catch (error: any) {
      return { error: error.message || 'Erro ao enviar email de recuperação' }
    }
  }

  const updateProfile = async (data: Partial<Usuario>) => {
    try {
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('usuarios')
        .update(data)
        .eq('id', user.id)

      if (error) throw error

      // Atualizar estado local
      setProfile(prev => prev ? { ...prev, ...data } : null)

      return { error: null }
    } catch (error: any) {
      return { error: error.message || 'Erro ao atualizar perfil' }
    }
  }

  // Verificar se precisa fazer login novamente (após 2 dias)
  useEffect(() => {
    const checkSessionExpiry = () => {
      const lastLoginDate = localStorage.getItem('lastLoginDate')
      if (lastLoginDate && user) {
        const daysSinceLogin = (new Date().getTime() - new Date(lastLoginDate).getTime()) / (1000 * 60 * 60 * 24)
        
        if (daysSinceLogin > 2) {
          signOut()
        }
      }
    }

    // Verificar a cada hora
    const interval = setInterval(checkSessionExpiry, 60 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [user])

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}