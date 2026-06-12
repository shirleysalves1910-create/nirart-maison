import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, PackagePlus, Save } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import {
  getInventoryItemById,
  INVENTORY_STATUS,
  MOCK_ACCESSORIES,
  MOCK_CLOTHES,
  MOCK_SHOES
} from '../data/inventoryMockData'

const availableItems = [...MOCK_CLOTHES, ...MOCK_SHOES, ...MOCK_ACCESSORIES]

export default function KitsLocacao() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const existingKit = getInventoryItemById(id)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    items: [],
    totalValue: '',
    status: 'Disponível',
    notes: ''
  })

  useEffect(() => {
    if (existingKit?.type === 'Kit') {
      const selectedRefs = existingKit.items.map((item) => item.split(' - ')[0])
      setFormData({
        name: existingKit.name,
        description: existingKit.description,
        items: selectedRefs,
        totalValue: existingKit.totalValue,
        status: existingKit.status,
        notes: existingKit.notes || ''
      })
    }
  }, [existingKit])

  const suggestedValue = useMemo(() => {
    return availableItems
      .filter((item) => formData.items.includes(item.ref))
      .reduce((total, item) => total + Number(item.rentalValue || 0), 0)
  }, [formData.items])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const toggleItem = (ref) => {
    setFormData((current) => ({
      ...current,
      items: current.items.includes(ref)
        ? current.items.filter((itemRef) => itemRef !== ref)
        : [...current.items, ref]
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!formData.name.trim()) nextErrors.name = 'Informe o nome do kit'
    if (!formData.description.trim()) nextErrors.description = 'Informe a descricao'
    if (formData.items.length === 0) nextErrors.items = 'Selecione ao menos um item'
    if (String(formData.totalValue).trim() === '') nextErrors.totalValue = 'Informe o valor total'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    console.log('Kit salvo em modo mock', formData)
    navigate('/estoque')
  }

  if (isEditing && existingKit?.type !== 'Kit') {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Kit nao encontrado</h1>
            <Button className="mt-6" onClick={() => navigate('/estoque')}>Voltar ao Estoque</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <div className="mb-6 flex items-center gap-4">
          <button type="button" onClick={() => navigate('/estoque')} className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft size={24} className="text-nirart-text" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-nirart-text">
              {isEditing ? 'Editar Kit de Locacao' : 'Criar Kit de Locacao'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">Agrupe itens do estoque em uma composicao pronta para locacao.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Nome do kit" name="name" value={formData.name} onChange={handleChange} error={errors.name} />
            <Field
              label="Status"
              name="status"
              type="select"
              value={formData.status}
              onChange={handleChange}
              options={INVENTORY_STATUS.map((status) => ({ value: status, label: status }))}
            />
            <Field label="Descricao" name="description" type="textarea" value={formData.description} onChange={handleChange} error={errors.description} />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-nirart-text">Itens do kit</h2>
                <p className="text-sm text-gray-600">Selecione roupas, sapatos e acessorios.</p>
              </div>
              <PackagePlus className="text-nirart-green" size={24} />
            </div>
            <div className={`grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-2 ${errors.items ? 'border-red-500' : 'border-gray-200'}`}>
              {availableItems.map((item) => (
                <label
                  key={item.ref}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    formData.items.includes(item.ref)
                      ? 'border-nirart-green bg-green-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.items.includes(item.ref)}
                    onChange={() => toggleItem(item.ref)}
                    className="mt-1 h-4 w-4 accent-[#6FBFA9]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-nirart-text">{item.ref} - {item.description}</p>
                    <p className="mt-1 text-xs text-gray-500">{item.type} | {item.color} | Tam. {item.size}</p>
                    <p className="mt-1 text-xs font-semibold text-nirart-green">
                      {formatCurrency(item.rentalValue)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {errors.items && <p className="mt-1 text-xs text-red-600">{errors.items}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Valor total"
              name="totalValue"
              type="number"
              min="0"
              step="0.01"
              value={formData.totalValue}
              onChange={handleChange}
              error={errors.totalValue}
            />
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-800">Soma individual sugerida</p>
              <p className="mt-2 text-2xl font-bold text-nirart-green">{formatCurrency(suggestedValue)}</p>
            </div>
          </div>

          <Field label="Observacao" name="notes" type="textarea" value={formData.notes} onChange={handleChange} />

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/estoque')}>Cancelar</Button>
            <Button type="submit" className="flex items-center justify-center gap-2">
              <Save size={18} /> {isEditing ? 'Salvar Alteracoes' : 'Criar Kit'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

function Field({ label, name, value, onChange, error, type = 'text', options = [], ...props }) {
  const fieldClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none ${
    error ? 'border-red-500' : 'border-gray-300 focus:border-nirart-green focus:ring-1 focus:ring-nirart-green'
  }`

  return (
    <div className={type === 'textarea' ? 'md:col-span-2' : ''}>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {type === 'textarea' ? (
        <textarea name={name} value={value} onChange={onChange} rows={4} className={`${fieldClass} resize-none`} />
      ) : type === 'select' ? (
        <select name={name} value={value} onChange={onChange} className={fieldClass}>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input name={name} value={value} onChange={onChange} type={type} className={fieldClass} {...props} />
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}
