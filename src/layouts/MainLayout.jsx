import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import BottomNav from '../components/BottomNav'
import Header from '../components/Header'

export default function MainLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()

  // Não mostrar navegação nas páginas de login
  const showNav = location.pathname !== '/login'

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - apenas em desktop */}
      {showNav && <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />}

      {/* Conteúdo Principal */}
      <main className={`flex-1 flex flex-col transition-all duration-300 pb-24 md:pb-0`}>
        {showNav && <Header />}
        
        {/* Conteúdo da Página */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - apenas em mobile */}
      {showNav && <BottomNav />}
    </div>
  )
}
