'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Lembrete {
  id: string
  tipo: string
  horario: string
  ativo: boolean
}

export default function Lembretes() {
  const [lembretes, setLembretes] = useState<Lembrete[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchLembretes() {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      if (!userId) {
        router.push('/login')
        return
      }
      const { data, error } = await supabase
        .from('lembretes')
        .select('*')
        .eq('usuario_id', userId)
        .order('horario')

      if (error) {
        console.error('Erro ao carregar lembretes:', error)
      } else {
        setLembretes(data || [])
      }
      setLoading(false)
    }
    fetchLembretes()
  }, [router])

  async function handleExcluir(id: string) {
    if (!confirm('Deseja excluir este lembrete?')) return
    const { error } = await supabase.from('lembretes').delete().eq('id', id)
    if (error) {
      alert('Erro ao excluir lembrete.')
    } else {
      setLembretes((prev) => prev.filter((l) => l.id !== id))
    }
  }

  if (loading) return <p>Carregando lembretes...</p>

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Lembretes</h1>

      <button
        onClick={() => router.push('/dashboard/lembretes/novo')}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        + Novo Lembrete
      </button>

      {lembretes.length === 0 ? (
        <p>Nenhum lembrete cadastrado.</p>
      ) : (
        <ul className="space-y-2">
          {lembretes.map(({ id, tipo, horario, ativo }) => (
            <li
              key={id}
              className={`border p-4 rounded flex justify-between items-center ${
                ativo ? '' : 'opacity-50'
              }`}
            >
              <div>
                <strong>{tipo}</strong> às <span>{horario}</span>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => router.push(`/dashboard/lembretes/editar/${id}`)}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleExcluir(id)}
                  className="text-red-600 hover:underline"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
