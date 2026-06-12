import { useEffect, useState } from 'react'
import { ArrowLeft, ImagePlus, Save } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Button from './Button'
import { getInventoryItemById, INVENTORY_STATUS } from '../data/inventoryMockData'

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
  const existingItem = getInventoryItemById(id)
  const [preview, setPreview] = useState('')
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({ ...baseFields, ...config.initialFields })

  useEffect(() => {
    if (existingItem && existingItem.type === config.itemType) {
      setFormData((current) => ({
        ...current,
        ...existingItem
      }))
      setPreview(existingItem.photo || '')
    }
  }, [config.itemType, existingItem])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handlePhoto = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setFormData((current) => ({ ...current, photo: file.name }))
    setPreview(URL.createObjectURL(file))
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

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) return
    console.log(`${config.itemType} salvo em modo mock`, formData)
    navigate('/estoque')
  }

  if (isEditing && (!existingItem || existingItem.type !== config.itemType)) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Item nao encontrado</h1>
            <p className="mt-2 text-gray-600">O registro solicitado nao pertence a este cadastro.</p>
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

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Foto</label>
              <label className="flex h-52 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-center transition-colors hover:border-nirart-green">
                {preview ? (
                  <img src={preview} alt="Pre-visualizacao do item" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <ImagePlus size={32} className="text-gray-400" />
                    <span className="mt-2 text-sm font-medium text-gray-600">Selecionar foto</span>
                    <span className="mt-1 text-xs text-gray-400">PNG ou JPG</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              </label>
              {formData.photo && <p className="mt-2 truncate text-xs text-gray-500">{formData.photo}</p>}
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
              <Field label="Valor de locacao" name="rentalValue" type="number" min="0" step="0.01" value={formData.rentalValue} onChange={handleChange} error={errors.rentalValue} />
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
            <Button type="button" variant="outline" onClick={() => navigate('/estoque')}>Cancelar</Button>
            <Button type="submit" variant="primary" className="flex items-center justify-center gap-2">
              <Save size={18} /> {isEditing ? 'Salvar Alteracoes' : `Cadastrar ${config.title}`}
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
