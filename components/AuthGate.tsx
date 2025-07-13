'use client'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth()
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span>Carregando autenticação...</span>
      </div>
    )
  }
  return <>{children}</>
} 