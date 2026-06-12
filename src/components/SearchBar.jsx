import { Search, X } from 'lucide-react'
import { useState } from 'react'

export default function SearchBar({ onSearch, placeholder = 'Buscar...' }) {
  const [value, setValue] = useState('')

  const handleChange = (e) => {
    const newValue = e.target.value
    setValue(newValue)
    onSearch(newValue)
  }

  const handleClear = () => {
    setValue('')
    onSearch('')
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:border-nirart-green focus:outline-none focus:ring-1 focus:ring-nirart-green transition-all text-sm"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      )}
    </div>
  )
}
