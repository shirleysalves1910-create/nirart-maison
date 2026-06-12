import { Search, Bell, User } from 'lucide-react'

export default function Header() {
  return (
    <header className="h-16 bg-nirart-card border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search Bar */}
      <div className="flex-1 max-w-md hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
        <Search size={18} className="text-gray-500" />
        <input
          type="text"
          placeholder="Buscar..."
          className="bg-transparent outline-none text-sm w-full text-nirart-text placeholder-gray-500"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Notifications */}
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative md:flex hidden items-center justify-center">
          <Bell size={20} className="text-nirart-text" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-nirart-wine rounded-full"></span>
        </button>

        {/* User Profile */}
        <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <div className="w-8 h-8 bg-nirart-wine rounded-full flex items-center justify-center text-white text-sm font-bold">
            A
          </div>
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-sm font-semibold text-nirart-text">Admin</p>
            <p className="text-xs text-gray-600">Administrador</p>
          </div>
        </button>
      </div>
    </header>
  )
}
