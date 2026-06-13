import { Edit2, Trash2, Eye, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { formatDateBR } from '../utils/date'

export default function ClassesTable({ classes, schools, onEdit, onDelete, onView }) {
  const [expandedRow, setExpandedRow] = useState(null)

  const getSchoolName = (schoolId) => {
    return schools.find(s => s.id === schoolId)?.fantasyName || 'Escola não encontrada'
  }

  const getTurnLabel = (turn) => {
    const turns = {
      'morning': 'Matutino',
      'afternoon': 'Vespertino',
      'night': 'Noturno'
    }
    return turns[turn] || turn
  }

  // Desktop View
  const DesktopView = () => (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Nome da Turma</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Escola</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Turno</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Alunos</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Festa</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Status</th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {classes.map((cls) => (
            <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-nirart-text">{cls.name}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{getSchoolName(cls.schoolId)}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{getTurnLabel(cls.turn)}</td>
              <td className="px-6 py-4 text-sm font-semibold text-nirart-text">{cls.students}</td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {formatDateBR(cls.eventDate)}
              </td>
              <td className="px-6 py-4 text-sm">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  cls.status === 'Ativa'
                    ? 'bg-green-100 text-green-700'
                    : cls.status === 'Inativa'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {cls.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onView(cls)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Visualizar"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => onEdit(cls)}
                    className="p-2 text-nirart-green hover:bg-green-50 rounded transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(cls.id)}
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
      {classes.map((cls) => (
        <div key={cls.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedRow(expandedRow === cls.id ? null : cls.id)}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="text-left">
              <p className="font-semibold text-nirart-text">{cls.name}</p>
              <p className="text-xs text-gray-600">{getSchoolName(cls.schoolId)}</p>
            </div>
            <ChevronDown
              size={20}
              className={`text-gray-400 transition-transform ${
                expandedRow === cls.id ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedRow === cls.id && (
            <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 text-xs">Turno</p>
                  <p className="font-semibold text-nirart-text">{getTurnLabel(cls.turn)}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Alunos</p>
                  <p className="font-semibold text-nirart-text">{cls.students}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600 text-xs">Data da Festa</p>
                  <p className="font-semibold text-nirart-text">
                    {formatDateBR(cls.eventDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  cls.status === 'Ativa'
                    ? 'bg-green-100 text-green-700'
                    : cls.status === 'Inativa'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {cls.status}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onView(cls)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => onEdit(cls)}
                    className="p-2 text-nirart-green hover:bg-green-50 rounded transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(cls.id)}
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
