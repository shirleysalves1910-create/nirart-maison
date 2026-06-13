import { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, ImagePlus, LoaderCircle, Save } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Button from './Button'
import {
  atualizarItemEstoque,
  buscarItemEstoquePorId,
  criarItemEstoque,
  INVENTORY_STATUS
} from '../services/estoque'

const baseFields = {
  ref: '',
  photo: '',
  description: '',
  color: '',
  size: '',
  totalQuantity: '',
  rentalValue: '',
  status: 'Disponível',
  notes: ''
}

export default function InventoryItemForm({ config }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const [preview, setPreview] = useState('')
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({ ...baseFields, ...config.initialFields })
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!isEditing) return

    let active = true
    const loadItem = async () => {
      setLoading(true)
      setErrorMessage('')
      try {
        const item = await buscarItemEstoquePorId(id)
        if (!active) return
        if (item.type !== config.itemType) {
          setNotFound(true)
          return
        }
        setFormData((current) => ({ ...current, ...item }))
        setPreview(item.photo || '')
      } catch (error) {
        if (!active) return
        if (error?.code === 'PGRST116') {
          setNotFound(true)
        } else {
          setErrorMessage(getErrorMessage(error, 'Não foi possível carregar o item.'))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadItem()
    return () => {
      active = false
    }
  }, [config.itemType, id, isEditing])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setErrorMessage('')
    if (name === 'photo') setPreview(value)
  }

  const validate = () => {
    const nextErrors = {}
    const requiredFields = ['ref', 'color', 'size', 'totalQuantity', 'rentalValue', ...config.requiredFields]
    requiredFields.forEach((field) => {
      if (String(formData[field] ?? '').trim() === '') {
        nextErrors[field] = 'Campo obrigatorio'
      }
    })
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
        await atualizarItemEstoque(id, config.itemType, formData)
      } else {
        await criarItemEstoque(config.itemType, formData)
      }
      navigate('/estoque')
    } catch (error) {
      const fallback = error?.code === '23505'
        ? 'Já existe um item com esta REF.'
        : 'Não foi possível salvar o item.'
      setErrorMessage(getErrorMessage(error, fallback))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-80 items-center justify-center gap-3 p-8 text-sm text-gray-500">
          <LoaderCircle className="animate-spin" size={20} /> Carregando item...
        </div>
      </MainLayout>
    )
  }

  if (notFound) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Item não encontrado</h1>
            <p className="mt-2 text-gray-600">O registro solicitado não pertence a este cadastro.</p>
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
          <button
            type="button"
            onClick={() => navigate('/estoque')}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          >
            <ArrowLeft size={24} className="text-nirart-text" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-nirart-text">
              {isEditing ? `Editar ${config.title}` : `Cadastrar ${config.title}`}
            </h1>
            <p className="mt-1 text-sm text-gray-600">{config.subtitle}</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Foto</label>
              <div className="flex h-52 flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-center">
                {preview ? (
                  <img src={preview} alt="Pré-visualização do item" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <ImagePlus size={32} className="text-gray-400" />
                    <span className="mt-2 text-sm font-medium text-gray-600">Foto opcional</span>
                    <span className="mt-1 text-xs text-gray-400">Informe uma URL abaixo</span>
                  </>
                )}
              </div>
              <input
                type="url"
                name="photo"
                value={formData.photo}
                onChange={handleChange}
                placeholder="https://..."
                className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-nirart-green focus:ring-1 focus:ring-nirart-green"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="REF" name="ref" value={formData.ref} onChange={handleChange} error={errors.ref} />
              {config.fields.map((field) => (
                <Field
                  key={field.name}
                  {...field}
                  value={formData[field.name] ?? ''}
                  onChange={handleChange}
                  error={errors[field.name]}
                />
              ))}
              <Field label="Cor" name="color" value={formData.color} onChange={handleChange} error={errors.color} />
              <Field label="Tamanho" name="size" value={formData.size} onChange={handleChange} error={errors.size} />
              <Field label="Quantidade total" name="totalQuantity" type="number" min="0" value={formData.totalQuantity} onChange={handleChange} error={errors.totalQuantity} />
              <Field label="Valor de locação" name="rentalValue" type="number" min="0" step="0.01" value={formData.rentalValue} onChange={handleChange} error={errors.rentalValue} />
              <Field
                label="Status"
                name="status"
                type="select"
                value={formData.status}
                onChange={handleChange}
                options={INVENTORY_STATUS.map((status) => ({ value: status, label: formatStatus(status) }))}
              />
            </div>
          </div>

          <Field
            label="Observacao"
            name="notes"
            type="textarea"
            value={formData.notes}
            onChange={handleChange}
          />

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/estoque')} disabled={submitting}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={submitting} className="flex items-center justify-center gap-2">
              {submitting ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}
              {submitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : `Cadastrar ${config.title}`}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  options = [],
  className = '',
  ...props
}) {
  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${
    error
      ? 'border-red-500 focus:ring-1 focus:ring-red-500'
      : 'border-gray-300 focus:border-nirart-green focus:ring-1 focus:ring-nirart-green'
  }`

  return (
    <div className={type === 'textarea' ? `md:col-span-2 ${className}` : className}>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {type === 'select' ? (
        <select name={name} value={value} onChange={onChange} className={inputClass}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea name={name} value={value} onChange={onChange} rows={4} className={`${inputClass} resize-none`} {...props} />
      ) : (
        <input name={name} value={value} onChange={onChange} type={type} className={inputClass} {...props} />
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function formatStatus(status) {
  return status
}

function getErrorMessage(error, fallback) {
  return error?.message ? `${fallback} ${error.message}` : fallback
}
