import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, LoaderCircle, PackagePlus, Save } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import {
  atualizarKit,
  buscarKitPorId,
  criarKit,
  INVENTORY_STATUS,
  listarItensEstoque
} from '../services/estoque'

const EMPTY_FORM = {
  ref: '',
  name: '',
  description: '',
  category: '',
  color: '',
  size: '',
  items: [],
  totalQuantity: '',
  totalValue: '',
  status: 'Disponível',
  notes: ''
}

export default function KitsLocacao() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const [availableItems, setAvailableItems] = useState([])
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true

    const loadData = async () => {
      setLoading(true)
      setErrorMessage('')
      try {
        const [items, kit] = await Promise.all([
          listarItensEstoque(),
          isEditing ? buscarKitPorId(id) : Promise.resolve(null)
        ])
        if (!active) return
        const selectedItemIds = new Set(
          (kit?.kitItems || []).map(({ itemId }) => itemId)
        )
        setAvailableItems(items.filter((item) => (
          item.status !== 'Inativo' || selectedItemIds.has(item.id)
        )))

        if (kit) {
          setFormData({
            ref: kit.ref,
            name: kit.name,
            description: kit.description,
            category: kit.category,
            color: kit.color,
            size: kit.size,
            items: kit.kitItems.map(({ itemId, quantity }) => ({ itemId, quantity })),
            totalQuantity: kit.totalQuantity,
            totalValue: kit.totalValue,
            status: kit.status,
            notes: kit.notes
          })
        }
      } catch (error) {
        if (!active) return
        if (error?.code === 'PGRST116') {
          setNotFound(true)
        } else {
          setErrorMessage(getErrorMessage(error, 'Não foi possível carregar o kit.'))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [id, isEditing])

  const suggestedValue = useMemo(() => (
    formData.items.reduce((total, selected) => {
      const item = availableItems.find(({ id: itemId }) => itemId === selected.itemId)
      return total + Number(item?.rentalValue || 0) * Number(selected.quantity || 1)
    }, 0)
  ), [availableItems, formData.items])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setErrorMessage('')
  }

  const toggleItem = (itemId) => {
    setFormData((current) => ({
      ...current,
      items: current.items.some((item) => item.itemId === itemId)
        ? current.items.filter((item) => item.itemId !== itemId)
        : [...current.items, { itemId, quantity: 1 }]
    }))
    setErrors((current) => ({ ...current, items: '' }))
  }

  const updateItemQuantity = (itemId, quantity) => {
    setFormData((current) => ({
      ...current,
      items: current.items.map((item) => (
        item.itemId === itemId
          ? { ...item, quantity: Math.max(1, Number(quantity) || 1) }
          : item
      ))
    }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!formData.ref.trim()) nextErrors.ref = 'Informe a REF.'
    if (!formData.name.trim()) nextErrors.name = 'Informe o nome do kit.'
    if (!formData.description.trim()) nextErrors.description = 'Informe a descrição.'
    if (!formData.items.length) nextErrors.items = 'Selecione ao menos um item.'
    if (String(formData.totalQuantity).trim() === '') nextErrors.totalQuantity = 'Informe a quantidade total.'
    if (String(formData.totalValue).trim() === '') nextErrors.totalValue = 'Informe o valor de locação.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setErrorMessage('')
    try {
      if (isEditing) {
        await atualizarKit(id, formData)
      } else {
        await criarKit(formData)
      }
      navigate('/estoque')
    } catch (error) {
      const fallback = error?.code === '23505'
        ? 'Já existe um kit com esta REF ou composição duplicada.'
        : 'Não foi possível salvar o kit.'
      setErrorMessage(getErrorMessage(error, fallback))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-80 items-center justify-center gap-3 p-8 text-sm text-gray-500">
          <LoaderCircle className="animate-spin" size={20} /> Carregando kit...
        </div>
      </MainLayout>
    )
  }

  if (notFound) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Kit não encontrado</h1>
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
          <button type="button" onClick={() => navigate('/estoque')} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Voltar">
            <ArrowLeft size={24} className="text-nirart-text" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-nirart-text">
              {isEditing ? 'Editar Kit de Locação' : 'Criar Kit de Locação'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">Agrupe itens do estoque em uma composição pronta para locação.</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="REF" name="ref" value={formData.ref} onChange={handleChange} error={errors.ref} />
            <Field label="Nome do kit" name="name" value={formData.name} onChange={handleChange} error={errors.name} />
            <Field label="Categoria" name="category" value={formData.category} onChange={handleChange} />
            <Field
              label="Status"
              name="status"
              type="select"
              value={formData.status}
              onChange={handleChange}
              options={INVENTORY_STATUS.map((status) => ({ value: status, label: status }))}
            />
            <Field label="Cor" name="color" value={formData.color} onChange={handleChange} />
            <Field label="Tamanho" name="size" value={formData.size} onChange={handleChange} />
            <Field label="Descrição" name="description" type="textarea" value={formData.description} onChange={handleChange} error={errors.description} />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-nirart-text">Itens do kit</h2>
                <p className="text-sm text-gray-600">Selecione roupas, sapatos e acessórios.</p>
              </div>
              <PackagePlus className="text-nirart-green" size={24} />
            </div>
            <div className={`grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-2 ${errors.items ? 'border-red-500' : 'border-gray-200'}`}>
              {availableItems.map((item) => {
                const selected = formData.items.find(({ itemId }) => itemId === item.id)
                return (
                  <div
                    key={item.id}
                    className={`rounded-lg border p-3 ${
                      selected ? 'border-nirart-green bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(selected)}
                        onChange={() => toggleItem(item.id)}
                        disabled={item.status === 'Inativo' && !selected}
                        className="mt-1 h-4 w-4 accent-[#6FBFA9]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-nirart-text">{item.ref} - {item.description}</p>
                        <p className="mt-1 text-xs text-gray-500">{item.type} | {item.color || '—'} | Tam. {item.size || '—'}</p>
                        <p className="mt-1 text-xs font-semibold text-nirart-green">{formatCurrency(item.rentalValue)}</p>
                        {item.status === 'Inativo' && (
                          <p className="mt-1 text-xs font-semibold text-gray-500">Item inativo</p>
                        )}
                      </div>
                    </label>
                    {selected && (
                      <label className="mt-3 block text-xs font-semibold text-gray-600">
                        Quantidade no kit
                        <input
                          type="number"
                          min="1"
                          value={selected.quantity}
                          onChange={(event) => updateItemQuantity(item.id, event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </label>
                    )}
                  </div>
                )
              })}
            </div>
            {errors.items && <p className="mt-1 text-xs text-red-600">{errors.items}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field
              label="Quantidade total"
              name="totalQuantity"
              type="number"
              min="0"
              value={formData.totalQuantity}
              onChange={handleChange}
              error={errors.totalQuantity}
            />
            <Field
              label="Valor de locação"
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

          <Field label="Observação" name="notes" type="textarea" value={formData.notes} onChange={handleChange} />

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/estoque')} disabled={submitting}>Cancelar</Button>
            <Button type="submit" disabled={submitting} className="flex items-center justify-center gap-2">
              {submitting ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}
              {submitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Kit'}
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

function getErrorMessage(error, fallback) {
  return error?.message ? `${fallback} ${error.message}` : fallback
}
