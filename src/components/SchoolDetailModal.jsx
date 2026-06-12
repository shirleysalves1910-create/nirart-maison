import { X, MapPin, Phone, User, FileText, Badge } from 'lucide-react'
import Button from './Button'

export default function SchoolDetailModal({ school, onClose, onEdit }) {
  if (!school) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-nirart-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-nirart-green to-nirart-wine text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{school.fantasyName}</h2>
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
              school.status === 'Ativa'
                ? 'bg-green-500'
                : school.status === 'Inativa'
                ? 'bg-gray-500'
                : 'bg-yellow-500'
            }`} />
            <span className={`text-sm font-semibold ${
              school.status === 'Ativa'
                ? 'text-green-700'
                : school.status === 'Inativa'
                ? 'text-gray-700'
                : 'text-yellow-700'
            }`}>
              {school.status}
            </span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CNPJ */}
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">CNPJ</p>
              <p className="text-lg font-semibold text-nirart-text font-mono">{school.cnpj}</p>
            </div>

            {/* Email */}
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Email</p>
              <p className="text-lg font-semibold text-nirart-text">{school.email || 'Não informado'}</p>
            </div>

            {/* Responsável */}
            <div className="flex items-start gap-3">
              <User className="text-nirart-green mt-1" size={20} />
              <div>
                <p className="text-gray-600 text-sm font-medium">Responsável</p>
                <p className="font-semibold text-nirart-text">{school.responsible}</p>
              </div>
            </div>

            {/* Telefone */}
            <div className="flex items-start gap-3">
              <Phone className="text-nirart-green mt-1" size={20} />
              <div>
                <p className="text-gray-600 text-sm font-medium">Telefone</p>
                <p className="font-semibold text-nirart-text">{school.phone}</p>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="flex items-start gap-3">
            <MapPin className="text-nirart-green mt-1" size={20} />
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Endereço</p>
              <p className="font-semibold text-nirart-text">{school.address}</p>
              <p className="text-sm text-gray-600 mt-1">
                {school.city}, {school.state} - {school.zipcode}
              </p>
            </div>
          </div>

          {/* Observações */}
          {school.notes && (
            <div className="flex items-start gap-3">
              <FileText className="text-nirart-wine mt-1" size={20} />
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Observações</p>
                <p className="text-nirart-text">{school.notes}</p>
              </div>
            </div>
          )}

          {/* Data de Cadastro */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              Cadastrado em: {new Date(school.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="primary" onClick={() => {
            onEdit(school)
            onClose()
          }}>
            Editar Escola
          </Button>
        </div>
      </div>
    </div>
  )
}
