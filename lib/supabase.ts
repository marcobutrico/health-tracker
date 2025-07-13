import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface Usuario {
  id: string
  nome: string
  data_nascimento?: string
  criado_em?: string
}

export interface Remedio {
  id: string
  usuario_id: string
  nome: string
  dosagem?: string
  unidade_id?: string
  observacoes?: string
  ativo: boolean
}

export interface RegistroGlicemia {
  id: number
  usuario_id: string
  datahora: string
  glicemia: number
  created_at: string
}

export interface RegistroPressao {
  id: number
  usuario_id: string
  datahora: string
  sistolica: number
  diastolica: number
  bpm?: number
  created_at: string
}

export interface Lembrete {
  id: string
  usuario_id: string
  tipo: 'agua' | 'remedio'
  horario: string
  ativo: boolean
}

// Script utilitário para sincronizar usuários do Auth com a tabela 'usuarios'
export async function syncAuthUsersToUsuarios() {
  // 1. Buscar todos os usuários do Auth
  const { data: users, error } = await supabase.auth.admin.listUsers()
  if (error) {
    console.error('Erro ao buscar usuários do Auth:', error)
    return
  }

  for (const user of users.users) {
    // 2. Verificar se já existe perfil na tabela 'usuarios'
    const { data: perfil, error: perfilError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', user.id)
      .single()
    if (perfilError && perfilError.code !== 'PGRST116') {
      // PGRST116 = No rows found
      console.error('Erro ao buscar perfil:', perfilError)
      continue
    }
    if (!perfil) {
      // 3. Criar perfil se não existir
      const { error: insertError } = await supabase
        .from('usuarios')
        .insert([{ id: user.id, nome: user.email || 'Usuário', data_nascimento: null }])
      if (insertError) {
        console.error('Erro ao criar perfil para', user.email, insertError)
      } else {
        console.log('Perfil criado para', user.email)
      }
    }
  }
  console.log('Sincronização concluída.')
}