import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  Package,
  Calendar,
  Truck,
  RotateCcw,
  CreditCard,
  BarChart3,
  Settings,
  Menu,
  X,
} from 'lucide-react'

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation()

  const menuItems = [
    { name: 'Dashboard', path: '/home', icon: LayoutDashboard },
    { name: 'Escolas', path: '/escolas', icon: Building2 },
    { name: 'Turmas', path: '/turmas', icon: Users },
    { name: 'Alunos', path: '/alunos', icon: BookOpen },
    { name: 'Estoque', path: '/estoque', icon: Package },
    { name: 'Reservas', path: '/reservas', icon: Calendar },
    { name: 'Entregas', path: '/entregas', icon: Truck },
    { name: 'Devoluções', path: '/devolucoes', icon: RotateCcw },
    { name: 'Pagamentos', path: '/pagamentos', icon: CreditCard },
    { name: 'Agenda', path: '/agenda', icon: Calendar },
    { name: 'Relatórios', path: '/relatorios', icon: BarChart3 },
    { name: 'Configurações', path: '/configuracoes', icon: Settings },
  ]

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-nirart-card border-r border-gray-200 transition-all duration-300 z-40 hidden md:flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header do Sidebar */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between h-16">
        {!collapsed && (
          <h1 className="text-xl font-bold text-nirart-green">Nirart</h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
        >
          {collapsed ? (
            <Menu size={20} className="text-nirart-text" />
          ) : (
            <X size={20} className="text-nirart-text" />
          )}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-nirart-green text-white'
                  : 'text-nirart-text hover:bg-gray-100'
              }`}
              title={collapsed ? item.name : ''}
            >
              <Icon size={20} />
              {!collapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-center w-full">
          {collapsed ? (
            <div className="w-8 h-8 bg-nirart-wine rounded-full"></div>
          ) : (
            <div className="w-full text-center">
              <p className="text-xs text-gray-600">Usuário</p>
              <p className="text-sm font-semibold text-nirart-text">Admin</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
