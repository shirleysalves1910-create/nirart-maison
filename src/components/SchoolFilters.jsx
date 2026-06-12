import { Filter, X } from 'lucide-react'
import { useState } from 'react'

export default function SchoolFilters({ onFilterChange }) {
  const [showFilters, setShowFilters] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('Todos')

  const handleStatusChange = (status) => {
    setSelectedStatus(status)
    onFilterChange({ status: status === 'Todos' ? null : status })
  }

  const statuses = ['Todos', 'Ativa', 'Inativa', 'Pendente']

  return (
    <div className="space-y-4">
      {/* Toggle Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
      >
        <Filter size={18} />
        Filtros
        {showFilters ? <X size={18} /> : null}
      </button>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          {/* Status Filter */}
          <div>
            <p className="text-sm font-semibold text-nirart-text mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedStatus === status
                      ? 'bg-nirart-green text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-nirart-green'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* More Filter Options */}
          <div>
            <p className="text-sm font-semibold text-nirart-text mb-2">Ordenar por</p>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-nirart-green focus:outline-none">
              <option value="name">Nome (A-Z)</option>
              <option value="name-desc">Nome (Z-A)</option>
              <option value="recent">Mais Recentes</option>
              <option value="oldest">Mais Antigos</option>
            </select>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSelectedStatus('Todos')
              onFilterChange({ status: null })
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      )}
    </div>
  )
}
