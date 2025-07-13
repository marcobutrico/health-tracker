'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import { Activity, X, Clock, Save, RotateCcw } from 'lucide-react'

interface GlicemiaForm {
  glicemia: string
  datahora: string
  observacoes?: string
}

export default function NovaGlicemia() {
  const [formData, setFormData] = useState<GlicemiaForm>({
    glicemia: '',
    datahora: new Date().toISOString().slice(0, 16), // Formato YYYY-MM-DDTHH:MM
    observacoes: ''
  })
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<{ email: string; avatar_url?: string } | null>(null)
  const [showModal, setShowModal] = useState(true)

  const router = useRouter()

  useEffect(() => {
    // Buscar perfil do usuário
    const fetchUserProfile = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email, avatar_url')
          .eq('id', userData.user.id)
          .single()
        
        setUserProfile(profileData || { email: userData.user.email || '' })
      }
    }

    fetchUserProfile()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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
    
    if (!formData.glicemia.trim()) {
      alert('Por favor, insira o valor da glicemia')
      return
    }

    const glicemiaValue = parseFloat(formData.glicemia)
    if (isNaN(glicemiaValue) || glicemiaValue < 0) {
      alert('Por favor, insira um valor válido para a glicemia')
      return
    }

    setLoading(true)

    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id

      if (!userId) {
        router.push('/login')
        return
      }

      const { error } = await supabase
        .from('registros_glicemia')
        .insert({
          usuario_id: userId,
          glicemia: glicemiaValue,
          datahora: formData.datahora,
          observacoes: formData.observacoes?.trim() || null
        })

      if (error) {
        console.error('Erro ao salvar glicemia:', error)
        alert('Erro ao salvar a medição. Tente novamente.')
      } else {
        alert('Medição de glicemia salva com sucesso!')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao salvar a medição. Tente novamente.')
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
                  <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Nova Medição de Glicemia
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
                {/* Valor da Glicemia */}
                <div>
                  <label htmlFor="glicemia" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor da Glicemia (mg/dL)
                  </label>
                  <input
                    type="number"
                    id="glicemia"
                    name="glicemia"
                    value={formData.glicemia}
                    onChange={handleInputChange}
                    placeholder="Ex: 120"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
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
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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

                {/* Observações */}
                <div>
                  <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observações (opcional)
                  </label>
                  <textarea
                    id="observacoes"
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleInputChange}
                    placeholder="Ex: Após o almoço, antes do exercício..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  />
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
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
