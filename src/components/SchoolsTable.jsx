import { Edit2, Trash2, Eye, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export default function SchoolsTable({ schools, onEdit, onDelete, onView }) {
  const [expandedRow, setExpandedRow] = useState(null)

  // Desktop View
  const DesktopView = () => (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Nome Fantasia</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">CNPJ</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Responsável</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Telefone</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Status</th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {schools.map((school) => (
            <tr key={school.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-nirart-text">
                <div>
                  <p className="font-semibold">{school.fantasyName}</p>
                  <p className="text-xs text-gray-500">{school.address}</p>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-700 font-mono">{school.cnpj}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{school.responsible}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{school.phone}</td>
              <td className="px-6 py-4 text-sm">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  school.status === 'Ativa'
                    ? 'bg-green-100 text-green-700'
                    : school.status === 'Inativa'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {school.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onView(school)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Visualizar"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => onEdit(school)}
                    className="p-2 text-nirart-green hover:bg-green-50 rounded transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(school.id)}
                    className="p-2 text-nirart-wine hover:bg-red-50 rounded transition-colors"
                    title="Deletar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  // Mobile View
  const MobileView = () => (
    <div className="md:hidden space-y-3">
      {schools.map((school) => (
        <div key={school.id} className="bg-nirart-card border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedRow(expandedRow === school.id ? null : school.id)}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="text-left">
              <p className="font-semibold text-nirart-text">{school.fantasyName}</p>
              <p className="text-xs text-gray-600">{school.cnpj}</p>
            </div>
            <ChevronDown
              size={20}
              className={`text-gray-400 transition-transform ${
                expandedRow === school.id ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedRow === school.id && (
            <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 text-xs">Responsável</p>
                  <p className="font-semibold text-nirart-text">{school.responsible}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Telefone</p>
                  <p className="font-semibold text-nirart-text">{school.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600 text-xs">Endereço</p>
                  <p className="font-semibold text-nirart-text">{school.address}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  school.status === 'Ativa'
                    ? 'bg-green-100 text-green-700'
                    : school.status === 'Inativa'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {school.status}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onView(school)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => onEdit(school)}
                    className="p-2 text-nirart-green hover:bg-green-50 rounded transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(school.id)}
                    className="p-2 text-nirart-wine hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <>
      <DesktopView />
      <MobileView />
    </>
  )
}
