import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  Package,
  Calendar,
  CreditCard,
  MoreHorizontal,
} from 'lucide-react'

export default function BottomNav() {
  const location = useLocation()

  const navItems = [
    { name: 'Home', path: '/home', icon: LayoutDashboard },
    { name: 'Escolas', path: '/escolas', icon: Building2 },
    { name: 'Turmas', path: '/turmas', icon: Users },
    { name: 'Alunos', path: '/alunos', icon: BookOpen },
    { name: 'Estoque', path: '/estoque', icon: Package },
    { name: 'Reservas', path: '/reservas', icon: Calendar },
    { name: 'Pagamentos', path: '/pagamentos', icon: CreditCard },
    { name: 'Mais', path: '/agenda', icon: MoreHorizontal },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-nirart-card border-t border-gray-200 md:hidden z-50">
      <div className="flex justify-around items-center h-20">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-16 h-20 gap-1 transition-colors ${
                isActive
                  ? 'text-nirart-green'
                  : 'text-gray-600 hover:text-nirart-text'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
