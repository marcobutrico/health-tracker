'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Lembrete {
  id: string
  tipo: string
  horario: string
  ativo: boolean
}

export default function Lembretes({ userId }: { userId: string }) {
  const [lembretes, setLembretes] = useState<Lembrete[]>([])

  useEffect(() => {
    supabase
      .from('lembretes')
      .select('*')
      .eq('usuario_id', userId)
      .eq('ativo', true)
      .then(({ data }) => setLembretes(data || []))
  }, [userId])

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold mb-2">Lembretes Ativos</h2>
      <ul className="space-y-2">
        {lembretes.length === 0 && <p>Nenhum lembrete ativo.</p>}
        {lembretes.map((l: Lembrete) => (
          <li
            key={l.id}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded shadow flex justify-between"
          >
            <span>{l.tipo === 'agua' ? '💧 Água' : '💊 Remédio'} às {l.horario}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
