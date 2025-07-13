'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ChartData {
  date: string
  glicemia?: number
  sistolica?: number
  diastolica?: number
}

export default function Charts({ userId }: { userId: string }) {
  const [dados, setDados] = useState<ChartData[]>([])

  useEffect(() => {
    const fetch = async () => {
      const { data: glicemia } = await supabase
        .from('registros_glicemia')
        .select('datahora, glicemia')
        .eq('usuario_id', userId)
        .order('datahora', { ascending: true })

      const { data: pressao } = await supabase
        .from('registros_pressao')
        .select('datahora, sistolica, diastolica')
        .eq('usuario_id', userId)
        .order('datahora', { ascending: true })

      const diasMap = new Map()

      glicemia?.forEach((item: { datahora: string; glicemia: number }) => {
        const dia = item.datahora.split('T')[0]
        if (!diasMap.has(dia)) diasMap.set(dia, {})
        diasMap.get(dia).glicemia = item.glicemia
      })

      pressao?.forEach((item: { datahora: string; sistolica: number; diastolica: number }) => {
        const dia = item.datahora.split('T')[0]
        if (!diasMap.has(dia)) diasMap.set(dia, {})
        diasMap.get(dia).sistolica = item.sistolica
        diasMap.get(dia).diastolica = item.diastolica
      })

      const result = Array.from(diasMap.entries()).map(([date, values]) => ({
        date,
        ...values,
      }))

      setDados(result)
    }

    fetch()
  }, [userId])

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold mb-4">Gráficos de Glicemia e Pressão</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="glicemia" stroke="#82ca9d" name="Glicemia" />
          <Line type="monotone" dataKey="sistolica" stroke="#8884d8" name="Sistólica" />
          <Line type="monotone" dataKey="diastolica" stroke="#ff7300" name="Diastólica" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
