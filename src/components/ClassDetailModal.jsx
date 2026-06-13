import { X, Users, Ruler, Calendar, MapPin, FileText, Badge } from 'lucide-react'
import Button from './Button'
import { formatDateBR, getDaysFromToday } from '../utils/date'

export default function ClassDetailModal({ classData, school, onClose, onEdit, onNavigate }) {
  if (!classData) return null

  const getTurnLabel = (turn) => {
    const turns = {
      'morning': 'Matutino',
      'afternoon': 'Vespertino',
      'night': 'Noturno'
    }
    return turns[turn] || turn
  }

  const getNextEvent = () => {
    const days = getDaysFromToday(classData.eventDate)
    if (days === null) return 'Data não informada'
    if (days > 1) return `em ${days} dias`
    if (days === 1) return 'amanhã'
    if (days === 0) return 'hoje'
    return 'Evento realizado'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-nirart-green to-nirart-wine text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{classData.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <Badge className={`w-4 h-4 rounded-full ${
              classData.status === 'Ativa'
                ? 'bg-green-500'
                : classData.status === 'Inativa'
                ? 'bg-gray-500'
                : 'bg-yellow-500'
            }`} />
            <span className={`text-sm font-semibold ${
              classData.status === 'Ativa'
                ? 'text-green-700'
                : classData.status === 'Inativa'
                ? 'text-gray-700'
                : 'text-yellow-700'
            }`}>
              {classData.status}
            </span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Escola */}
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Escola</p>
              <p className="text-lg font-semibold text-nirart-text">{school?.fantasyName}</p>
            </div>

            {/* Turno */}
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Turno</p>
              <p className="text-lg font-semibold text-nirart-text">{getTurnLabel(classData.turn)}</p>
            </div>

            {/* Alunos */}
            <div className="flex items-start gap-3">
              <Users className="text-nirart-green mt-1" size={20} />
              <div>
                <p className="text-gray-600 text-sm font-medium">Quantidade de Alunos</p>
                <p className="text-2xl font-bold text-nirart-text">{classData.students}</p>
              </div>
            </div>

            {/* Próximo Evento */}
            <div className="flex items-start gap-3">
              <Calendar className="text-blue-500 mt-1" size={20} />
              <div>
                <p className="text-gray-600 text-sm font-medium">Próximo Evento</p>
                <p className="font-semibold text-nirart-text">{getNextEvent()}</p>
              </div>
            </div>
          </div>

          {/* Data e Local da Festa */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Calendar className="text-blue-500 mt-1" size={20} />
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Data da Festa</p>
                <p className="font-semibold text-nirart-text">
                  {formatDateBR(classData.eventDate)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="text-blue-500 mt-1" size={20} />
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Local</p>
                <p className="font-semibold text-nirart-text">{classData.eventLocation}</p>
              </div>
            </div>
          </div>

          {/* Observações */}
          {classData.notes && (
            <div className="flex items-start gap-3">
              <FileText className="text-nirart-wine mt-1" size={20} />
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Observações</p>
                <p className="text-nirart-text">{classData.notes}</p>
              </div>
            </div>
          )}

          {/* Ações Rápidas */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-semibold text-nirart-text mb-3">Gerenciar Turma</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  onNavigate('alunos', classData.id)
                  onClose()
                }}
                className="flex flex-col items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Users size={24} className="text-blue-600" />
                <span className="text-xs font-semibold text-blue-700">Alunos</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('medidas', classData.id)
                  onClose()
                }}
                className="flex flex-col items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <Ruler size={24} className="text-nirart-green" />
                <span className="text-xs font-semibold text-nirart-green">Medidas</span>
              </button>

              <button
                onClick={() => {
                  onNavigate('reservas', classData.id)
                  onClose()
                }}
                className="flex flex-col items-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <Calendar size={24} className="text-purple-600" />
                <span className="text-xs font-semibold text-purple-700">Reservas</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="primary" onClick={() => {
            onEdit(classData)
            onClose()
          }}>
            Editar Turma
          </Button>
        </div>
      </div>
    </div>
  )
}
