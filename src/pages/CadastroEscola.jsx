import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, LoaderCircle, Save } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import {
  atualizarEscola,
  buscarEscolaPorId,
  criarEscola
} from '../services/escolas'

const EMPTY_FORM = {
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
}

const BRAZILIAN_STATES = [
  { value: 'AC', label: 'AC - Acre' },
  { value: 'AL', label: 'AL - Alagoas' },
  { value: 'AP', label: 'AP - Amapá' },
  { value: 'AM', label: 'AM - Amazonas' },
  { value: 'BA', label: 'BA - Bahia' },
  { value: 'CE', label: 'CE - Ceará' },
  { value: 'DF', label: 'DF - Distrito Federal' },
  { value: 'ES', label: 'ES - Espírito Santo' },
  { value: 'GO', label: 'GO - Goiás' },
  { value: 'MA', label: 'MA - Maranhão' },
  { value: 'MT', label: 'MT - Mato Grosso' },
  { value: 'MS', label: 'MS - Mato Grosso do Sul' },
  { value: 'MG', label: 'MG - Minas Gerais' },
  { value: 'PA', label: 'PA - Pará' },
  { value: 'PB', label: 'PB - Paraíba' },
  { value: 'PR', label: 'PR - Paraná' },
  { value: 'PE', label: 'PE - Pernambuco' },
  { value: 'PI', label: 'PI - Piauí' },
  { value: 'RJ', label: 'RJ - Rio de Janeiro' },
  { value: 'RN', label: 'RN - Rio Grande do Norte' },
  { value: 'RS', label: 'RS - Rio Grande do Sul' },
  { value: 'RO', label: 'RO - Rondônia' },
  { value: 'RR', label: 'RR - Roraima' },
  { value: 'SC', label: 'SC - Santa Catarina' },
  { value: 'SP', label: 'SP - São Paulo' },
  { value: 'SE', label: 'SE - Sergipe' },
  { value: 'TO', label: 'TO - Tocantins' }
]

export default function CadastroEscola() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [formData, setFormData] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!isEditing) return

    let active = true
    const loadSchool = async () => {
      setIsLoading(true)
      setLoadError('')
      try {
        const school = await buscarEscolaPorId(id)
        if (!active) return
        setFormData({
          fantasyName: school.fantasyName,
          cnpj: school.cnpj,
          email: school.email,
          phone: school.phone,
          address: school.address,
          city: school.city,
          state: school.state || 'SP',
          zipcode: school.zipcode,
          responsible: school.responsible,
          notes: school.notes,
          status: school.status || 'Ativa'
        })
      } catch (error) {
        if (!active) return
        if (error?.code === 'PGRST116') {
          setNotFound(true)
        } else {
          setLoadError(getErrorMessage(error, 'Não foi possível carregar a escola.'))
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadSchool()
    return () => {
      active = false
    }
  }, [id, isEditing])

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
    setSubmitError('')
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
    if (loadError) return

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      if (isEditing) {
        await atualizarEscola(id, formData)
      } else {
        await criarEscola(formData)
      }
      navigate('/escolas')
    } catch (error) {
      const fallback = error?.code === '23505'
        ? 'Já existe uma escola cadastrada com este CNPJ.'
        : isEditing
          ? 'Não foi possível atualizar a escola.'
          : 'Não foi possível cadastrar a escola.'
      setSubmitError(getErrorMessage(error, fallback))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-80 items-center justify-center gap-3 p-8 text-sm text-gray-500">
          <LoaderCircle className="animate-spin" size={20} /> Carregando escola...
        </div>
      </MainLayout>
    )
  }

  if (notFound) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Escola não encontrada</h1>
            <p className="mt-2 text-gray-600">Selecione uma escola válida na listagem.</p>
            <Button className="mt-6" onClick={() => navigate('/escolas')}>Voltar para Escolas</Button>
          </div>
        </div>
      </MainLayout>
    )
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

        {(loadError || submitError) && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{loadError || submitError}</span>
          </div>
        )}

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
                      {BRAZILIAN_STATES.map((state) => (
                        <option key={state.value} value={state.value}>
                          {state.label}
                        </option>
                      ))}
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
              disabled={isSubmitting || Boolean(loadError)}
              className="flex items-center gap-2"
            >
              {isSubmitting ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}
              {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Escola' : 'Cadastrar Escola'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

function getErrorMessage(error, fallback) {
  return error?.message ? `${fallback} ${error.message}` : fallback
}
