'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import { Activity, Pill, TrendingUp } from 'lucide-react'

interface LeituraGlicemia {
  id: string
  glicemia: number
  datahora: string
}

interface LeituraPressao {
  id: string
  sistolica: number
  diastolica: number
  bpm?: number
  datahora: string
}

interface Remedio {
  id: string
  nome: string
  dosagem: string
  ativo: boolean
}

export default function Dashboard() {
  const [remediosAtivos, setRemediosAtivos] = useState<Remedio[]>([])
  const [ultimaGlicemia, setUltimaGlicemia] = useState<LeituraGlicemia | null>(null)
  const [ultimaPressao, setUltimaPressao] = useState<LeituraPressao | null>(null)

  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<{ email: string; avatar_url?: string } | null>(null)

  const router = useRouter()

  // Buscar dados e perfil
  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id

      if (!userData?.user || !userId) {
        router.push('/login')
        return
      }

      // Buscar perfil (exemplo: tabela 'profiles' com email e avatar_url)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email, avatar_url')
        .eq('id', userId)
        .single()

      setUserProfile(profileData || { email: userData.user.email || '' })

      // Buscar remédios ativos
      const { data: remedios } = await supabase
        .from('remedios')
        .select('id, nome, dosagem, ativo')
        .eq('usuario_id', userId)
        .eq('ativo', true)

      // Última glicemia
      const { data: glicemia } = await supabase
        .from('registros_glicemia')
        .select('*')
        .eq('usuario_id', userId)
        .order('datahora', { ascending: false })
        .limit(1)

      // Última pressão
      const { data: pressao } = await supabase
        .from('registros_pressao')
        .select('*')
        .eq('usuario_id', userId)
        .order('datahora', { ascending: false })
        .limit(1)



      setRemediosAtivos(remedios || [])
      setUltimaGlicemia(glicemia?.[0] || null)
      setUltimaPressao(pressao?.[0] || null)
      setLoading(false)
    }

    fetchData()
  }, [router])



  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    const userName = userProfile?.email?.split('@')[0] || 'Usuário'
    
    if (hour >= 5 && hour < 12) {
      return `Bom dia, ${userName}`
    } else if (hour >= 12 && hour < 18) {
      return `Boa tarde, ${userName}`
    } else {
      return `Boa noite, ${userName}`
    }
  }

  if (loading) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Carregando dados do painel...</p>
          </div>
        </div>
      </AuthGate>
    )
  }



  return (
    <AuthGate>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header userProfile={userProfile} />
        
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Saudação */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {getGreeting()}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Aqui está um resumo dos seus dados de saúde
            </p>
            
            {/* Botões de Ação Rápida */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/dashboard/glicemia"
                className="flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Activity className="h-5 w-5" />
                <span className="font-medium">Nova Glicemia</span>
              </Link>
              
              <Link
                href="/dashboard/pressao"
                className="flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <TrendingUp className="h-5 w-5" />
                <span className="font-medium">Nova Pressão</span>
              </Link>
            </div>
          </div>
          
          {/* Cards de indicadores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Remédios Ativos</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{remediosAtivos.length}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Pill className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Última Glicemia</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {typeof ultimaGlicemia?.glicemia === 'number' ? ultimaGlicemia.glicemia : '—'} mg/dL
                  </p>
                  {ultimaGlicemia?.datahora && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDateTime(ultimaGlicemia.datahora)}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Última Pressão</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {typeof ultimaPressao?.sistolica === 'number' && typeof ultimaPressao?.diastolica === 'number'
                      ? `${ultimaPressao.sistolica}/${ultimaPressao.diastolica} mmHg`
                      : '—'}
                  </p>
                  {ultimaPressao?.datahora && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDateTime(ultimaPressao.datahora)}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>




        </div>
      </div>
    </AuthGate>
  )
}
