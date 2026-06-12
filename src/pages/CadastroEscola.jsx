import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_SCHOOLS } from '../data/mockData'

export default function CadastroEscola() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [formData, setFormData] = useState({
    fantasyName: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'SP',
    zipcode: '',
    responsible: '',
    notes: '',
    status: 'Ativa'
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const school = MOCK_SCHOOLS.find((item) => String(item.id) === String(id))

  useEffect(() => {
    if (school) {
      setFormData({
        fantasyName: school.fantasyName,
        cnpj: school.cnpj,
        email: school.email || '',
        phone: school.phone,
        address: school.address,
        city: school.city,
        state: school.state,
        zipcode: school.zipcode,
        responsible: school.responsible,
        notes: school.notes || '',
        status: school.status || 'Ativa'
      })
    }
  }, [school])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.fantasyName.trim()) {
      newErrors.fantasyName = 'Nome fantasia é obrigatório'
    }

    if (!formData.cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Endereço é obrigatório'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Cidade é obrigatória'
    }

    if (!formData.zipcode.trim()) {
      newErrors.zipcode = 'CEP é obrigatório'
    }

    if (!formData.responsible.trim()) {
      newErrors.responsible = 'Responsável é obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    // Simular envio
    setTimeout(() => {
      console.log('Dados da escola:', formData)
      navigate('/escolas')
      setIsSubmitting(false)
    }, 500)
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => navigate('/escolas')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-nirart-text" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-nirart-text">
              {isEditing ? 'Editar Escola' : 'Cadastro de Escola'}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {isEditing ? 'Atualize os dados da escola' : 'Adicione uma nova escola ao sistema'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Informações Básicas */}
          <div className="p-6 md:p-8 border-b border-gray-200 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-nirart-text mb-4 pb-3 border-b-2 border-nirart-green flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-nirart-green text-white text-sm font-bold rounded">1</span>
                Informações Básicas
              </h2>
              
              <div className="space-y-4 mt-4">
                {/* Nome Fantasia */}
                <div>
                  <label className="block text-nirart-text font-semibold mb-2 text-sm">
                    Nome Fantasia *
                  </label>
                  <input
                    type="text"
                    name="fantasyName"
                    value={formData.fantasyName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-all text-sm ${
                      errors.fantasyName
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'
                    }`}
                    placeholder="Ex: Escola Estadual Professora Maria"
                  />
                  {errors.fantasyName && (
                    <p className="text-red-500 text-xs mt-1">{errors.fantasyName}</p>
                  )}
                </div>

                {/* CNPJ e Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-nirart-text font-semibold mb-2 text-sm">
                      CNPJ *
                    </label>
                    <input
                      type="text"
                      name="cnpj"
                      value={formData.cnpj}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-all text-sm font-mono ${
                        errors.cnpj
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'
                      }`}
                      placeholder="XX.XXX.XXX/XXXX-XX"
                    />
                    {errors.cnpj && (
                      <p className="text-red-500 text-xs mt-1">{errors.cnpj}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-nirart-text font-semibold mb-2 text-sm">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-nirart-green focus:outline-none focus:ring-1 focus:ring-nirart-green transition-all text-sm"
                      placeholder="contato@escola.com"
                    />
                  </div>
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-nirart-text font-semibold mb-2 text-sm">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-all text-sm ${
                      errors.phone
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'
                    }`}
                    placeholder="(11) 9999-0000"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="p-6 md:p-8 border-b border-gray-200 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-nirart-text mb-4 pb-3 border-b-2 border-nirart-wine flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-nirart-wine text-white text-sm font-bold rounded">2</span>
                Endereço
              </h2>

              <div className="space-y-4 mt-4">
                {/* Rua */}
                <div>
                  <label className="block text-nirart-text font-semibold mb-2 text-sm">
                    Rua / Avenida *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-all text-sm ${
                      errors.address
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'
                    }`}
                    placeholder="Rua das Flores, 123"
                  />
                  {errors.address && (
                    <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                  )}
                </div>

                {/* Cidade, Estado, CEP */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-nirart-text font-semibold mb-2 text-sm">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-all text-sm ${
                        errors.city
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'
                      }`}
                      placeholder="São Paulo"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-nirart-text font-semibold mb-2 text-sm">
                      Estado *
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-nirart-green focus:outline-none focus:ring-1 focus:ring-nirart-green transition-all text-sm"
                    >
                      <option value="SP">SP - São Paulo</option>
                      <option value="RJ">RJ - Rio de Janeiro</option>
                      <option value="MG">MG - Minas Gerais</option>
                      <option value="BA">BA - Bahia</option>
                      <option value="SC">SC - Santa Catarina</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-nirart-text font-semibold mb-2 text-sm">
                      CEP *
                    </label>
                    <input
                      type="text"
                      name="zipcode"
                      value={formData.zipcode}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-all text-sm ${
                        errors.zipcode
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'
                      }`}
                      placeholder="01234-567"
                    />
                    {errors.zipcode && (
                      <p className="text-red-500 text-xs mt-1">{errors.zipcode}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="p-6 md:p-8 border-b border-gray-200 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-nirart-text mb-4 pb-3 border-b-2 border-nirart-green flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-nirart-green text-white text-sm font-bold rounded">3</span>
                Pessoa de Contato
              </h2>

              <div className="space-y-4 mt-4">
                {/* Responsável */}
                <div>
                  <label className="block text-nirart-text font-semibold mb-2 text-sm">
                    Nome do Responsável *
                  </label>
                  <input
                    type="text"
                    name="responsible"
                    value={formData.responsible}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-all text-sm ${
                      errors.responsible
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'
                    }`}
                    placeholder="Nome completo"
                  />
                  {errors.responsible && (
                    <p className="text-red-500 text-xs mt-1">{errors.responsible}</p>
                  )}
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-nirart-text font-semibold mb-2 text-sm">
                    Observações
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-nirart-green focus:outline-none focus:ring-1 focus:ring-nirart-green transition-all text-sm resize-none"
                    placeholder="Informações adicionais sobre a escola..."
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-nirart-text font-semibold mb-2 text-sm">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-nirart-green focus:outline-none focus:ring-1 focus:ring-nirart-green transition-all text-sm"
                  >
                    <option value="Ativa">Ativa</option>
                    <option value="Inativa">Inativa</option>
                    <option value="Pendente">Pendente</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/escolas')}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <Save size={18} />
              {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Escola' : 'Cadastrar Escola'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
