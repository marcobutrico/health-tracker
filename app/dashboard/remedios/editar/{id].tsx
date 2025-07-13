'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditarRemedio() {
  const [nome, setNome] = useState('')
  const [dosagem, setDosagem] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()

  const remedioId = params.id as string

  useEffect(() => {
    const fetchRemedio = async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user) return router.push('/login')

      const { data, error } = await supabase
        .from('remedios')
        .select('*')
        .eq('id', remedioId)
        .eq('usuario_id', user.user.id)
        .single()

      if (error) {
        console.error('Erro ao buscar remédio:', error)
        return router.push('/dashboard/remedios')
      }

      setNome(data.nome)
      setDosagem(data.dosagem)
      setObservacoes(data.observacoes || '')
      setLoading(false)
    }

    fetchRemedio()
  }, [remedioId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase
      .from('remedios')
      .update({ nome, dosagem, observacoes })
      .eq('id', remedioId)

    if (error) {
      alert('Erro ao atualizar: ' + error.message)
    } else {
      router.push('/dashboard/remedios')
    }
  }

  if (loading) return <p className="p-6">Carregando...</p>

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Editar Remédio</h1>
      <input
        className="w-full border p-2"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome do remédio"
        required
      />
      <input
        className="w-full border p-2"
        value={dosagem}
        onChange={(e) => setDosagem(e.target.value)}
        placeholder="Dosagem"
      />
      <textarea
        className="w-full border p-2"
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        placeholder="Observações"
      />
      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
        Salvar Alterações
      </button>
    </form>
  )
}
