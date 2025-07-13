'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import { Activity, Download, RefreshCw, Calendar } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface GlicemiaData {
  id: number
  glicemia: number
  datahora: string
}

export default function GlicemiaGrafico() {
  const { darkMode } = useTheme()
  const [dados, setDados] = useState<GlicemiaData[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<{ email: string; avatar_url?: string } | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [filtroPeriodo, setFiltroPeriodo] = useState<'7d' | '30d' | '90d' | 'all'>('all')

  const ITEMS_PER_PAGE = 50

  useEffect(() => {
    // Buscar perfil do usuário
    const fetchUserProfile = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError) {
          console.error('Erro ao buscar usuário:', userError)
          return
        }

        if (userData?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email, avatar_url')
            .eq('id', userData.user.id)
            .single()
          
          if (profileData) {
            setUserProfile(profileData)
          } else {
            setUserProfile({ email: userData.user.email || '' })
          }
        }
      } catch (error) {
        console.error('Erro ao buscar perfil:', error)
        setUserProfile({ email: 'Usuário' })
      }
    }

    fetchUserProfile()
  }, [])

  const fetchDados = useCallback(async (reset = false) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      if (!userId) return

      const page = reset ? 0 : currentPage
      
      // Calcular filtro de data dentro do callback
      const getDateFilter = () => {
        const now = new Date()
        switch (filtroPeriodo) {
          case '7d':
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
          case '30d':
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
          case '90d':
            return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
          default:
            return null
        }
      }
      
      const dateFilter = getDateFilter()

      // Construir query base
      let query = supabase
        .from('registros_glicemia')
        .select('id, glicemia, datahora', { count: 'exact' })
        .eq('usuario_id', userId)
        .order('datahora', { ascending: true })

      // Aplicar filtro de data se necessário
      if (dateFilter) {
        query = query.gte('datahora', dateFilter)
      }

      // Aplicar paginação
      const { data, error, count } = await query
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1)

      if (error) {
        console.error('Erro ao buscar dados:', error)
        return
      }

      if (reset) {
        setDados(data || [])
        setCurrentPage(0)
      } else {
        setDados(prev => [...prev, ...(data || [])])
        setCurrentPage(page + 1)
      }

      setTotalRegistros(count || 0)
      setHasMore((data?.length || 0) === ITEMS_PER_PAGE)
      setLoading(false)
    } catch (error) {
      console.error('Erro inesperado:', error)
      setLoading(false)
    }
  }, [currentPage, filtroPeriodo])

  useEffect(() => {
    fetchDados(true)
  }, [filtroPeriodo, fetchDados])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchDados()
    }
  }

  const handlePeriodoChange = (periodo: '7d' | '30d' | '90d' | 'all') => {
    setFiltroPeriodo(periodo)
    setLoading(true)
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchDados(true)
  }

  const downloadData = () => {
    const csvContent = [
      'Data/Hora,Glicemia (mg/dL)',
      ...dados.map(d => `${d.datahora},${d.glicemia}`)
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `glicemia_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const chartData = {
    labels: dados.map(d => new Date(d.datahora)),
    datasets: [
      {
        label: 'Glicemia (mg/dL)',
        data: dados.map(d => d.glicemia),
        fill: false,
        borderColor: darkMode ? 'rgba(34,197,94,0.8)' : 'rgba(34,197,94,1)',
        backgroundColor: darkMode ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.1)',
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: darkMode ? '#e5e7eb' : '#374151'
        }
      },
              title: {
          display: true,
          text: 'Histórico de Glicemia',
          color: darkMode ? '#e5e7eb' : '#374151',
          font: {
            size: 16,
            weight: 'bold' as const
          }
        },
              tooltip: {
          mode: 'index' as const,
          intersect: false,
                      callbacks: {
              title: (context: unknown[]) => {
                return formatDate((context[0] as { raw: string }).raw)
              },
              label: (context: unknown) => {
                return `Glicemia: ${(context as { parsed: { y: number } }).parsed.y} mg/dL`
              }
            }
        }
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
          displayFormats: {
            day: 'dd/MM'
          }
        },
        ticks: {
          color: darkMode ? '#e5e7eb' : '#374151',
          maxRotation: 45
        },
        grid: {
          color: darkMode ? '#374151' : '#e5e7eb'
        }
      },
      y: {
        beginAtZero: false,
        ticks: {
          color: darkMode ? '#e5e7eb' : '#374151'
        },
        grid: {
          color: darkMode ? '#374151' : '#e5e7eb'
        }
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header userProfile={userProfile} />
        
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Gráfico de Glicemia
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {totalRegistros} medições carregadas
                </p>
              </div>
            </div>

            {/* Controles */}
            <div className="flex flex-wrap gap-2">
              {/* Filtros de Período */}
              <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => handlePeriodoChange('7d')}
                  className={`px-3 py-1 text-sm rounded-md transition-all duration-300 ${
                    filtroPeriodo === '7d'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600'
                  }`}
                >
                  7d
                </button>
                <button
                  onClick={() => handlePeriodoChange('30d')}
                  className={`px-3 py-1 text-sm rounded-md transition-all duration-300 ${
                    filtroPeriodo === '30d'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600'
                  }`}
                >
                  30d
                </button>
                <button
                  onClick={() => handlePeriodoChange('90d')}
                  className={`px-3 py-1 text-sm rounded-md transition-all duration-300 ${
                    filtroPeriodo === '90d'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600'
                  }`}
                >
                  90d
                </button>
                <button
                  onClick={() => handlePeriodoChange('all')}
                  className={`px-3 py-1 text-sm rounded-md transition-all duration-300 ${
                    filtroPeriodo === 'all'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600'
                  }`}
                >
                  Todas
                </button>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-300 disabled:opacity-50 shadow-sm"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Atualizar</span>
                </button>
                
                <button
                  onClick={downloadData}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all duration-300 shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Gráfico */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="h-96 w-full">
              {loading && dados.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Carregando dados...</p>
                  </div>
                </div>
              ) : dados.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">Nenhuma medição encontrada</p>
                  </div>
                </div>
              ) : (
                                 <Line data={chartData} options={options} />
              )}
            </div>

            {/* Botão Carregar Mais */}
            {hasMore && !loading && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleLoadMore}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-300 shadow-sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  Carregar Mais Dados
                </button>
              </div>
            )}

            {/* Loading para carregar mais */}
            {loading && dados.length > 0 && (
              <div className="flex justify-center mt-6">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <span>Carregando mais dados...</span>
                </div>
              </div>
            )}
          </div>

          {/* Estatísticas */}
          {dados.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Média
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(dados.reduce((sum, d) => sum + d.glicemia, 0) / dados.length)} mg/dL
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Maior Valor
                </h3>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {Math.max(...dados.map(d => d.glicemia))} mg/dL
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Menor Valor
                </h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Math.min(...dados.map(d => d.glicemia))} mg/dL
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGate>
  )
}
