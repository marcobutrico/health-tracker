'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import { TrendingUp, X, Clock, Save, RotateCcw } from 'lucide-react'

interface PressaoForm {
  sistolica: string
  diastolica: string
  bpm: string
  datahora: string
}

export default function NovaPressao() {
  const [formData, setFormData] = useState<PressaoForm>({
    sistolica: '',
    diastolica: '',
    bpm: '',
    datahora: new Date().toISOString().slice(0, 16) // Formato YYYY-MM-DDTHH:MM
  })
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<{ email: string; avatar_url?: string } | null>(null)
  const [showModal, setShowModal] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    // Buscar perfil do usuário
    const fetchUserProfile = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError) {
          console.error('Erro ao buscar usuário:', userError)
          router.push('/login')
          return
        }

        if (userData?.user) {
          // Tentar buscar da tabela profiles primeiro
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email, avatar_url')
            .eq('id', userData.user.id)
            .single()
          
          if (profileData) {
            setUserProfile(profileData)
          } else {
            // Se não encontrar em profiles, usar dados do auth
            setUserProfile({ email: userData.user.email || '' })
          }
        }
      } catch (error) {
        console.error('Erro ao buscar perfil:', error)
        setUserProfile({ email: 'Usuário' })
      }
    }

    fetchUserProfile()
  }, [router])



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpar erro quando usuário começa a digitar
    if (error) setError(null)
  }

  const handleMedirAgora = () => {
    const now = new Date()
    const formattedDateTime = now.toISOString().slice(0, 16)
    setFormData(prev => ({
      ...prev,
      datahora: formattedDateTime
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!formData.sistolica.trim()) {
      setError('Por favor, insira o valor da pressão sistólica')
      return
    }

    if (!formData.diastolica.trim()) {
      setError('Por favor, insira o valor da pressão diastólica')
      return
    }

    const sistolicaValue = parseFloat(formData.sistolica)
    const diastolicaValue = parseFloat(formData.diastolica)
    const bpmValue = formData.bpm.trim() ? parseFloat(formData.bpm) : null

    if (isNaN(sistolicaValue) || sistolicaValue < 0) {
      setError('Por favor, insira um valor válido para a pressão sistólica')
      return
    }

    if (isNaN(diastolicaValue) || diastolicaValue < 0) {
      setError('Por favor, insira um valor válido para a pressão diastólica')
      return
    }

    if (sistolicaValue > 300) {
      setError('O valor da pressão sistólica parece muito alto. Verifique se está correto.')
      return
    }

    if (diastolicaValue > 200) {
      setError('O valor da pressão diastólica parece muito alto. Verifique se está correto.')
      return
    }

    if (sistolicaValue < diastolicaValue) {
      setError('A pressão sistólica deve ser maior que a diastólica')
      return
    }

    if (bpmValue !== null && (isNaN(bpmValue) || bpmValue < 30 || bpmValue > 250)) {
      setError('O valor do BPM deve estar entre 30 e 250')
      return
    }

    setLoading(true)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('Erro ao buscar usuário:', userError)
        setError('Erro de autenticação. Faça login novamente.')
        setLoading(false)
        return
      }

      const userId = userData?.user?.id
      if (!userId) {
        setError('Usuário não autenticado')
        setLoading(false)
        router.push('/login')
        return
      }

      // Verificar se o usuário existe na tabela usuarios
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', userId)
        .single()

      if (usuarioError && usuarioError.code !== 'PGRST116') {
        console.error('Erro ao verificar usuário:', usuarioError)
        setError('Erro ao verificar perfil do usuário')
        setLoading(false)
        return
      }

      // Se usuário não existe na tabela usuarios, criar
      if (!usuario) {
        const { error: insertUsuarioError } = await supabase
          .from('usuarios')
          .insert([{ 
            id: userId, 
            nome: userData.user.email || 'Usuário',
            data_nascimento: null 
          }])

        if (insertUsuarioError) {
          console.error('Erro ao criar perfil do usuário:', insertUsuarioError)
          setError('Erro ao criar perfil do usuário')
          setLoading(false)
          return
        }
      }

      // Inserir registro de pressão
      const { error: insertError } = await supabase
        .from('registros_pressao')
        .insert({
          usuario_id: userId,
          sistolica: sistolicaValue,
          diastolica: diastolicaValue,
          bpm: bpmValue,
          datahora: formData.datahora
        })

      if (insertError) {
        console.error('Erro ao salvar pressão:', insertError)
        
        // Tratamento específico de erros
        if (insertError.code === '23505') {
          setError('Já existe um registro com esta data e hora. Tente novamente.')
        } else if (insertError.code === '23503') {
          setError('Erro de referência. Verifique se o usuário está cadastrado corretamente.')
        } else if (insertError.code === '42P01') {
          setError('Tabela não encontrada. Entre em contato com o suporte.')
        } else {
          setError(`Erro ao salvar: ${insertError.message}`)
        }
      } else {
        alert('Medição de pressão salva com sucesso!')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Erro inesperado:', error)
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    router.push('/dashboard')
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header userProfile={userProfile} />
        
        {/* Modal Overlay */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Header do Modal */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Nova Medição de Pressão
                  </h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Formulário */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Mensagem de Erro */}
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                  </div>
                )}

                {/* Pressão Sistólica */}
                <div>
                  <label htmlFor="sistolica" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pressão Sistólica (mmHg)
                  </label>
                  <input
                    type="number"
                    id="sistolica"
                    name="sistolica"
                    value={formData.sistolica}
                    onChange={handleInputChange}
                    placeholder="Ex: 120"
                    min="0"
                    max="300"
                    step="1"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                {/* Pressão Diastólica */}
                <div>
                  <label htmlFor="diastolica" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pressão Diastólica (mmHg)
                  </label>
                  <input
                    type="number"
                    id="diastolica"
                    name="diastolica"
                    value={formData.diastolica}
                    onChange={handleInputChange}
                    placeholder="Ex: 80"
                    min="0"
                    max="200"
                    step="1"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                {/* Batimentos Cardíacos (BPM) */}
                <div>
                  <label htmlFor="bpm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Batimentos Cardíacos - BPM (opcional)
                  </label>
                  <input
                    type="number"
                    id="bpm"
                    name="bpm"
                    value={formData.bpm}
                    onChange={handleInputChange}
                    placeholder="Ex: 72"
                    min="30"
                    max="250"
                    step="1"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Data e Hora */}
                <div>
                  <label htmlFor="datahora" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data e Hora da Medição
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="datetime-local"
                      id="datahora"
                      name="datahora"
                      value={formData.datahora}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleMedirAgora}
                      className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4" />
                      <span className="hidden sm:inline">Agora!</span>
                    </button>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGate>
  )
} 