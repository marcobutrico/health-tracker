import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatTime(time: string): string {
  return time.slice(0, 5) // Remove os segundos se houver
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  
  if (hour < 12) {
    return 'Bom dia'
  } else if (hour < 18) {
    return 'Boa tarde'
  } else {
    return 'Boa noite'
  }
}

export function getMotivationalMessage(): string {
  const messages = [
    'Cada dia é uma nova oportunidade para cuidar da sua saúde! 💪',
    'Você está no caminho certo! Continue assim! 🌟',
    'Lembre-se: pequenos passos levam a grandes mudanças! 🚶‍♂️',
    'Sua dedicação à saúde é inspiradora! 💚',
    'Cuidar de si mesmo é um ato de amor próprio! ❤️',
    'Você é mais forte do que imagina! 💪',
    'Cada medição é um passo em direção ao bem-estar! 📊',
    'Parabéns por priorizar sua saúde! 🎉',
    'Você está fazendo a diferença na sua vida! ✨',
    'Mantenha o foco e continue cuidando de você! 🎯'
  ]
  
  return messages[Math.floor(Math.random() * messages.length)]
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('A senha deve ter pelo menos 8 caracteres')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula')
  }
  
  if (!/\d/.test(password)) {
    errors.push('A senha deve conter pelo menos um número')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }) as T
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function isValidBloodPressure(systolic: number, diastolic: number): boolean {
  return systolic > 0 && systolic < 300 && diastolic > 0 && diastolic < 200 && systolic > diastolic
}

export function isValidGlucose(glucose: number): boolean {
  return glucose > 0 && glucose < 600
}

export function classifyBloodPressure(systolic: number, diastolic: number): {
  classification: string
  color: string
  risk: 'low' | 'moderate' | 'high'
} {
  if (systolic < 120 && diastolic < 80) {
    return { classification: 'Normal', color: 'text-green-600', risk: 'low' }
  } else if (systolic < 130 && diastolic < 80) {
    return { classification: 'Elevada', color: 'text-yellow-600', risk: 'moderate' }
  } else if (systolic < 140 || diastolic < 90) {
    return { classification: 'Hipertensão Grau 1', color: 'text-orange-600', risk: 'moderate' }
  } else if (systolic < 160 || diastolic < 100) {
    return { classification: 'Hipertensão Grau 2', color: 'text-red-600', risk: 'high' }
  } else {
    return { classification: 'Hipertensão Grau 3', color: 'text-red-800', risk: 'high' }
  }
}

export function classifyGlucose(glucose: number, isFasting: boolean = false): {
  classification: string
  color: string
  risk: 'low' | 'moderate' | 'high'
} {
  if (isFasting) {
    if (glucose < 100) {
      return { classification: 'Normal', color: 'text-green-600', risk: 'low' }
    } else if (glucose < 126) {
      return { classification: 'Pré-diabetes', color: 'text-yellow-600', risk: 'moderate' }
    } else {
      return { classification: 'Diabetes', color: 'text-red-600', risk: 'high' }
    }
  } else {
    if (glucose < 140) {
      return { classification: 'Normal', color: 'text-green-600', risk: 'low' }
    } else if (glucose < 200) {
      return { classification: 'Pré-diabetes', color: 'text-yellow-600', risk: 'moderate' }
    } else {
      return { classification: 'Diabetes', color: 'text-red-600', risk: 'high' }
    }
  }
}