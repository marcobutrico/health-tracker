'use client'

import { useEffect } from 'react'

interface Lembrete {
  id: string
  tipo: string
  horario: string // "HH:mm"
  ativo: boolean
}

interface Props {
  lembretes: Lembrete[]
}

export default function NotificationScheduler({ lembretes }: Props) {
  useEffect(() => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações.')
      return
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    if (Notification.permission !== 'granted') {
      console.log('Permissão para notificações não concedida')
      return
    }

    // Função para calcular milissegundos até o horário do lembrete hoje
    function tempoAteHorario(horario: string) {
      const [hora, minuto] = horario.split(':').map(Number)
      const agora = new Date()
      const dataLembrete = new Date(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate(),
        hora,
        minuto,
        0,
        0
      )
      let diff = dataLembrete.getTime() - agora.getTime()
      if (diff < 0) {
        // Se horário já passou, agenda para o próximo dia
        diff += 24 * 60 * 60 * 1000
      }
      return diff
    }

    const timers: NodeJS.Timeout[] = []

    lembretes.forEach(({ id, tipo, horario, ativo }) => {
      if (!ativo) return

      const delay = tempoAteHorario(horario)
      console.log(`Lembrete ${tipo} programado para daqui ${delay}ms`)

      const timer = setTimeout(() => {
        new Notification('Lembrete', {
          body: `Hora de: ${tipo}`,
          tag: id,
          icon: '/favicon.ico',
          silent: false,
        })
      }, delay)

      timers.push(timer)
    })

    // Limpa timers quando componente desmonta
    return () => timers.forEach((t) => clearTimeout(t))
  }, [lembretes])

  return null // componente só agenda notificações, não precisa renderizar nada
}
