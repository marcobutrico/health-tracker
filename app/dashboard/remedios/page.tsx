'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Remedio } from '@/lib/supabase'

export default function ListaRemedios() {
  const [remedios, setRemedios] = useState<Remedio[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchRemedios = async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user) return router.push('/login')

      const { data, error } = await supabase
        .from('remedios')
        .select('*')
        .eq('usuario_id', user.user.id)

      if (error) console.error('Erro ao buscar:', error)
      else setRemedios(data || [])

      setLoading(false)
    }

    fetchRemedios()
  }, [router])

  if (loading) return <p>Carregando...</p>

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Meus Remédios</h1>
      <Link href="/dashboard/remedios/novo" className="text-blue-500 hover:underline">+ Novo Remédio</Link>
      <ul className="space-y-2">
        {remedios.map((r) => (
          <li key={r.id} className="border p-4 rounded shadow-sm">
            <h2 className="font-semibold">{r.nome} - {r.dosagem}</h2>
            <p>{r.observacoes}</p>
            <div className="flex gap-4 mt-2">
              <Link href={`/dashboard/remedios/editar/${r.id}`} className="text-green-500 hover:underline">Editar</Link>
              <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:underline">Excluir</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )

  async function handleDelete(id: string) {
    const ok = confirm('Tem certeza que deseja excluir?')
    if (!ok) return
    const { error } = await supabase.from('remedios').delete().eq('id', id)
    if (error) return alert('Erro ao excluir')
    setRemedios(remedios.filter((r) => r.id !== id))
  }
}
