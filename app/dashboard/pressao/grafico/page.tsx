'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthGate from '@/components/AuthGate'
import { useTheme } from '@/contexts/ThemeContext'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'

import { MoonIcon, SunIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid'

interface MediaDiaria {
  dia: string
  media_glicemia?: number
  media_sistolica?: number
  media_diastolica?: number
}

interface User {
  user_metadata?: {
    avatar_url?: string
  }
  email?: string
}

export default function Dashboard() {
  const { darkMode, toggleTheme } = useTheme()
  const [remediosAtivos, setRemediosAtivos] = useState(0)
  const [mediaDiaria, setMediaDiaria] = useState<MediaDiaria[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      if (!userId) {
        router.push('/login')
        return
      }
      setUser(userData?.user)

      // Buscar remédios ativos
      const { data: remedios } = await supabase
        .from('remedios')
        .select('*')
        .eq('usuario_id', userId)
        .eq('ativo', true)

      // Médias diárias — glicemia
      const { data: mediaGlicemia, error: errGlicemia } = await supabase
        .rpc('media_diaria_glicemia', { p_usuario_id: userId })

      // Médias diárias — pressão (sistólica e diastólica)
      const { data: mediaPressao, error: errPressao } = await supabase
        .rpc('media_diaria_pressao', { p_usuario_id: userId })

      if (errGlicemia) console.error('Erro média glicemia:', errGlicemia)
      if (errPressao) console.error('Erro média pressão:', errPressao)

      // Juntar dados para gráfico — juntar datas
      const diasUnicos = new Set<string>()
      mediaGlicemia?.forEach((m: { dia: string }) => diasUnicos.add(m.dia))
      mediaPressao?.forEach((m: { dia: string }) => diasUnicos.add(m.dia))

      const diasArray = Array.from(diasUnicos).sort().slice(-10) // últimas 10 datas

      const mediasCombinadas: MediaDiaria[] = diasArray.map((dia) => ({
        dia,
        media_glicemia: mediaGlicemia?.find((m: { dia: string; media_glicemia: number }) => m.dia === dia)?.media_glicemia ?? null,
        media_sistolica: mediaPressao?.find((m: { dia: string; media_sistolica: number }) => m.dia === dia)?.media_sistolica ?? null,
        media_diastolica: mediaPressao?.find((m: { dia: string; media_diastolica: number }) => m.dia === dia)?.media_diastolica ?? null,
      }))

      setRemediosAtivos(remedios?.length || 0)
      setMediaDiaria(mediasCombinadas)
      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <AuthGate>
        <div className="p-6 text-gray-700 dark:text-gray-300">Carregando dados do painel...</div>
      </AuthGate>
    )
  }

  return (
    <AuthGate>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400">
              {/* Inicial do nome */}
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                Painel de Saúde
              </h1>
              <p className="text-gray-700 dark:text-gray-300">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              aria-label="Toggle Dark/Light Theme"
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              {darkMode ? (
                <SunIcon className="w-6 h-6 text-yellow-400" />
              ) : (
                <MoonIcon className="w-6 h-6 text-gray-700" />
              )}
            </button>

            <button
              onClick={handleLogout}
              aria-label="Logout"
              className="p-2 rounded-full hover:bg-red-500 hover:text-white transition"
            >
              <ArrowRightOnRectangleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Lista de remédios ativos */}
        <section className="bg-white dark:bg-gray-800 shadow-md rounded p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Remédios Ativos ({remediosAtivos})
          </h2>
          {/* Aqui poderia listar nomes ou apenas um resumo */}
          <p className="text-gray-700 dark:text-gray-300">
            Você tem {remediosAtivos} remédio(s) ativo(s) no momento.
          </p>
        </section>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gráfico Glicemia */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Média diária de Glicemia
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mediaDiaria}>
                <XAxis
                  dataKey="dia"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  stroke={darkMode ? '#ddd' : '#333'}
                  tick={{ fontSize: 10, fill: darkMode ? '#ccc' : '#555' }}
                  tickFormatter={(value) => {
                    if (typeof value !== 'string') return ''
                    const date = new Date(value.replace(' ', 'T'))
                    if (isNaN(date.getTime())) return value
                    const day = String(date.getDate()).padStart(2, '0')
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const hours = String(date.getHours()).padStart(2, '0')
                    const minutes = String(date.getMinutes()).padStart(2, '0')
                    return `${day}/${month} - ${hours}:${minutes}`
                  }}
                />
                <YAxis
                  stroke={darkMode ? '#ddd' : '#333'}
                  tick={{ fontSize: 12, fill: darkMode ? '#ccc' : '#555' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: darkMode ? '#333' : '#fff', borderRadius: '6px' }}
                  itemStyle={{ color: darkMode ? '#ccc' : '#555' }}
                />
                <CartesianGrid stroke={darkMode ? '#444' : '#eee'} strokeDasharray="5 5" />
                <Line
                  type="monotone"
                  dataKey="media_glicemia"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico Pressão */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Média diária de Pressão
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mediaDiaria}>
                <XAxis
                  dataKey="dia"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  stroke={darkMode ? '#ddd' : '#333'}
                  tick={{ fontSize: 10, fill: darkMode ? '#ccc' : '#555' }}
                  tickFormatter={(value) => {
                    if (typeof value !== 'string') return ''
                    const date = new Date(value.replace(' ', 'T'))
                    if (isNaN(date.getTime())) return value
                    const day = String(date.getDate()).padStart(2, '0')
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const hours = String(date.getHours()).padStart(2, '0')
                    const minutes = String(date.getMinutes()).padStart(2, '0')
                    return `${day}/${month} - ${hours}:${minutes}`
                  }}
                />
                <YAxis
                  stroke={darkMode ? '#ddd' : '#333'}
                  tick={{ fontSize: 12, fill: darkMode ? '#ccc' : '#555' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: darkMode ? '#333' : '#fff', borderRadius: '6px' }}
                  itemStyle={{ color: darkMode ? '#ccc' : '#555' }}
                />
                <CartesianGrid stroke={darkMode ? '#444' : '#eee'} strokeDasharray="5 5" />
                <Line
                  type="monotone"
                  dataKey="media_sistolica"
                  stroke="#8884d8"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="media_diastolica"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Links para outras páginas */}
        <div className="flex flex-wrap gap-4 mt-6">
          <Link
            href="/dashboard/remedios"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Meus Remédios
          </Link>
          <Link
            href="/dashboard/glicemia"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            Nova Glicemia
          </Link>
          <Link
            href="/dashboard/pressao"
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Nova Pressão
          </Link>
          <Link
            href="/dashboard/lembretes"
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
          >
            Lembretes
          </Link>
        </div>
      </div>
    </AuthGate>
  )
}
