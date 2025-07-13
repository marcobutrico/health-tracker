'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Heart, LogOut, Menu, X, Activity, TrendingUp, Pill, Calendar, ChevronDown, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface HeaderProps {
  userProfile?: { email: string; avatar_url?: string } | null
}

export default function Header({ userProfile }: HeaderProps) {
  // Usar userProfile para evitar warning de variável não utilizada
  const userName = userProfile?.email?.split('@')[0] || 'Usuário'
  const { darkMode, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false)
  const router = useRouter()



  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const quickActions = [
    {
      href: '/dashboard/glicemia',
      icon: Activity,
      label: 'Glicemia',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
      hoverColor: 'hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/30 dark:hover:to-green-700/30'
    },
    {
      href: '/dashboard/pressao',
      icon: TrendingUp,
      label: 'Pressão',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
      hoverColor: 'hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/30 dark:hover:to-purple-700/30'
    },
    {
      href: '/dashboard/remedios',
      icon: Pill,
      label: 'Remédios',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      hoverColor: 'hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30'
    },
    {
      href: '/dashboard/lembretes',
      icon: Calendar,
      label: 'Lembretes',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20',
      hoverColor: 'hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-800/30 dark:hover:to-orange-700/30'
    }
  ]

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo e Título */}
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Health Tracker</h1>
            <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Olá, {userName}</span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            {/* Botão de Tema */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 shadow-sm"
              title={darkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            >
              {darkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-gray-600" />}
            </button>
            
            {/* Ações Rápidas Dropdown */}
            <div className="relative">
              <button
                onClick={() => setActionsDropdownOpen(!actionsDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
              >
                <span className="font-medium">Ações Rápidas</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${actionsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {actionsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  {quickActions.map((action) => {
                    const IconComponent = action.icon
                    return (
                      <Link
                        key={action.href}
                        href={action.href}
                        className={`flex items-center gap-3 px-4 py-3 ${action.bgColor} ${action.hoverColor} transition-all duration-300 rounded-lg`}
                        onClick={() => setActionsDropdownOpen(false)}
                      >
                        <IconComponent className={`h-5 w-5 ${action.color}`} />
                        <span className="font-medium text-gray-900 dark:text-white">{action.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-300 shadow-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 shadow-sm"
              title={darkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            >
              {darkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-gray-600" />}
            </button>
            
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 shadow-sm"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden mt-4 space-y-2 animate-slide-up">
            {/* Ações Rápidas Mobile */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Ações Rápidas</h3>
              <div className="space-y-2">
                {quickActions.map((action) => {
                  const IconComponent = action.icon
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className={`flex items-center gap-3 p-3 rounded-lg ${action.bgColor} ${action.hoverColor} transition-all duration-300`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <IconComponent className={`h-5 w-5 ${action.color}`} />
                      <span className="font-medium text-gray-900 dark:text-white">{action.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 text-red-700 dark:text-red-300 rounded-lg hover:from-red-100 hover:to-red-200 dark:hover:from-red-800/30 dark:hover:to-red-700/30 transition-all duration-300"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Overlay para fechar dropdown quando clicar fora */}
      {actionsDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setActionsDropdownOpen(false)}
        />
      )}
    </div>
  )
} 