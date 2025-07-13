'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface PressaoData {
  sistolica: number
  diastolica: number
  datahora: string
}

interface GlicemiaData {
  glicemia: number
  datahora: string
}

export default function Indicators({ userId }: { userId: string }) {
  const [pressao, setPressao] = useState<PressaoData | null>(null)
  const [glicemia, setGlicemia] = useState<GlicemiaData | null>(null)
  const [remedios, setRemedios] = useState<number>(0)

  useEffect(() => {
    const fetchData = async () => {
      const { data: p } = await supabase
        .from('registros_pressao')
        .select('*')
        .eq('usuario_id', userId)
        .order('datahora', { ascending: false })
        .limit(1)

      const { data: g } = await supabase
        .from('registros_glicemia')
        .select('*')
        .eq('usuario_id', userId)
        .order('datahora', { ascending: false })
        .limit(1)

      const { count } = await supabase
        .from('remedios')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', userId)

      setPressao(p?.[0] || null)
      setGlicemia(g?.[0] || null)
      setRemedios(count || 0)
    }

    fetchData()
  }, [userId])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded shadow">
        <h2 className="text-lg font-semibold">Última Pressão</h2>
        <p>{pressao ? `${pressao.sistolica}/${pressao.diastolica} mmHg` : 'Sem dados'}</p>
      </div>
      <div className="bg-green-100 dark:bg-green-900 p-4 rounded shadow">
        <h2 className="text-lg font-semibold">Última Glicemia</h2>
        <p>{glicemia ? `${glicemia.glicemia} mg/dL` : 'Sem dados'}</p>
      </div>
      <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded shadow">
        <h2 className="text-lg font-semibold">Remédios Ativos</h2>
        <p>{remedios} cadastrados</p>
      </div>
    </div>
  )
}
