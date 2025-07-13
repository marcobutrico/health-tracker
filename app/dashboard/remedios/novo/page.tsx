'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface UnidadeRemedio {
  id: string
  nome: string
  sigla: string
}

export default function NovoRemedio() {
  const [nome, setNome] = useState('')
  const [dosagem, setDosagem] = useState('')
  const [unidadeId, setUnidadeId] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [unidades, setUnidades] = useState<UnidadeRemedio[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUnidades = async () => {
      const { data: unidadesData, error } = await supabase
        .from('unidades_remedio')
        .select('*')
        .order('nome', { ascending: true })

      if (error) console.error('Erro ao carregar unidades:', error)
      else setUnidades(unidadesData || [])

      setLoading(false)
    }

    fetchUnidades()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { data: user } = await supabase.auth.getUser()
    const userId = user?.user?.id

    if (!userId) {
      alert('Usuário não autenticado.')
      return
    }

    // Validação: dosagem só pode conter números e ponto
    if (!/^\d+(\.\d{1,2})?$/.test(dosagem)) {
      alert('A dosagem deve conter apenas números (ex: 500 ou 0.5)')
      return
    }

    const { error } = await supabase.from('remedios').insert([
      {
        usuario_id: userId,
        nome,
        dosagem,
        unidade_id: unidadeId,
        observacoes
      }
    ])

    if (error) {
      alert('Erro ao salvar remédio: ' + error.message)
    } else {
      router.push('/remedios')
    }
  }

  if (loading) return <p>Carregando...</p>

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Adicionar Novo Remédio</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Nome</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium">Dosagem (somente números)</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            value={dosagem}
            onChange={(e) => setDosagem(e.target.value)}
            required
            placeholder="Ex: 500"
          />
        </div>

        <div>
          <label className="block font-medium">Unidade</label>
          <select
            className="w-full border px-3 py-2 rounded"
            value={unidadeId}
            onChange={(e) => setUnidadeId(e.target.value)}
            required
          >
            <option value="">Selecione</option>
            {unidades.map((u: UnidadeRemedio) => (
              <option key={u.id} value={u.id}>
                {u.nome} ({u.sigla})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium">Observações</label>
          <textarea
            className="w-full border px-3 py-2 rounded"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Salvar Remédio
        </button>
      </form>
    </div>
  )
}
