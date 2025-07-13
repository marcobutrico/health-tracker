'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

const tipos = ['agua', 'remedio', 'outro']

export default function EditarLembrete() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname.split('/').pop() || ''
  const [tipo, setTipo] = useState(tipos[0])
  const [horario, setHorario] = useState('08:00')
  const [ativo, setAtivo] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    async function fetchLembrete() {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      if (!userId) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('lembretes')
        .select('*')
        .eq('id', id)
        .eq('usuario_id', userId)
        .single()

      if (error) {
        alert('Lembrete não encontrado')
        router.push('/dashboard/lembretes')
        return
      }

      setTipo(data.tipo)
      setHorario(data.horario)
      setAtivo(data.ativo)
      setFetching(false)
    }
    fetchLembrete()
  }, [id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id
    if (!userId) {
      alert('Usuário não autenticado')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('lembretes')
      .update({ tipo, horario, ativo })
      .eq('id', id)
      .eq('usuario_id', userId)

    if (error) {
      alert('Erro ao atualizar lembrete: ' + error.message)
      setLoading(false)
    } else {
      router.push('/dashboard/lembretes')
    }
  }

  if (fetching) return <p>Carregando lembrete...</p>

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Editar Lembrete</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          Tipo
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          Horário
          <input
            type="time"
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
          />
          Ativo
        </label>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}
