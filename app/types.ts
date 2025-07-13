// app/types.ts

export interface Remedio {
    id: string
    usuario_id: string
    nome: string
    dosagem?: string
    observacoes?: string
    ativo: boolean
    criado_em?: string
  }