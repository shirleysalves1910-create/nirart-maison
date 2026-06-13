import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, LoaderCircle, Save } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { buscarAlunoPorId } from '../services/alunos'
import {
  atualizarMedida,
  buscarMedidaPorId,
  criarMedida
} from '../services/medidas'

const EMPTY_FORM = {
  measurementDate: getLocalDateString(),
  altura: '',
  busto: '',
  abaixoBusto: '',
  cintura: '',
  quadril: '',
  comprimento: '',
  shoeSize: '',
  notes: '',
  changes: ''
}

export default function MedidasFemininas() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const measurementId = searchParams.get('medidaId')
  const isEditing = Boolean(measurementId)
  const [student, setStudent] = useState(null)
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
        const [studentData, measurement] = await Promise.all([
          buscarAlunoPorId(id),
          measurementId ? buscarMedidaPorId(measurementId) : Promise.resolve(null)
        ])
        if (!active) return

        if (
          measurement &&
          (measurement.studentId !== id || measurement.type !== 'female')
        ) {
          setNotFound(true)
          return
        }

        setStudent(studentData)
        if (measurement) {
          setFormData({
            measurementDate: measurement.measurementDate,
            altura: measurement.altura,
            busto: measurement.busto,
            abaixoBusto: measurement.abaixoBusto,
            cintura: measurement.cintura,
            quadril: measurement.quadril,
            comprimento: measurement.comprimento,
            shoeSize: measurement.shoeSize,
            notes: measurement.notes,
            changes: measurement.changes
          })
        }
      } catch (error) {
        if (!active) return
        if (error?.code === 'PGRST116') {
          setNotFound(true)
        } else {
          setErrorMessage(getErrorMessage(error, 'Não foi possível carregar a medição.'))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [id, measurementId])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setErrorMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData.measurementDate) {
      setErrorMessage('Informe a data da medição.')
      return
    }

    setSubmitting(true)
    setErrorMessage('')
    try {
      if (isEditing) {
        await atualizarMedida(measurementId, 'feminina', formData)
      } else {
        await criarMedida(id, 'feminina', formData)
      }
      navigate(`/historico-medidas/${id}`)
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível salvar a medição.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingState />
  if (notFound || !student) return <NotFoundState onBack={() => navigate('/medidas')} />

  if (student.sex !== 'F') {
    return (
      <MainLayout>
        <div className="mx-auto max-w-4xl p-4 md:p-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Medição feminina indisponível</h1>
            <p className="mt-2 text-gray-600">Utilize a página de medidas correspondente ao cadastro do aluno.</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button variant="outline" onClick={() => navigate('/medidas')}>Voltar</Button>
              <Button variant="primary" onClick={() => navigate(`/medidas-masculinas/${student.id}`)}>Ir para Medidas Masculinas</Button>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <Header
          title={student.fullName}
          subtitle={isEditing ? 'Editar medição feminina' : 'Nova medição feminina'}
          onBack={() => navigate('/medidas')}
        />

        {errorMessage && <ErrorAlert message={errorMessage} />}

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Data da medição" name="measurementDate" value={formData.measurementDate} onChange={handleChange} type="date" />
            <Field label="Altura" name="altura" value={formData.altura} onChange={handleChange} placeholder="Ex: 1,65" />
            <Field label="Busto" name="busto" value={formData.busto} onChange={handleChange} placeholder="Ex: 88" />
            <Field label="Abaixo do busto" name="abaixoBusto" value={formData.abaixoBusto} onChange={handleChange} placeholder="Ex: 74" />
            <Field label="Cintura" name="cintura" value={formData.cintura} onChange={handleChange} placeholder="Ex: 68" />
            <Field label="Quadril" name="quadril" value={formData.quadril} onChange={handleChange} placeholder="Ex: 96" />
            <Field label="Comprimento" name="comprimento" value={formData.comprimento} onChange={handleChange} placeholder="Ex: 120" />
            <Field label="Número do sapato" name="shoeSize" value={formData.shoeSize} onChange={handleChange} placeholder="Ex: 37" />
            <TextareaField label="Observações" name="notes" value={formData.notes} onChange={handleChange} />
            <TextareaField label="Alterações" name="changes" value={formData.changes} onChange={handleChange} />
          </div>

          <FormActions
            submitting={submitting}
            isEditing={isEditing}
            onCancel={() => navigate('/medidas')}
          />
        </form>
      </div>
    </MainLayout>
  )
}

function Header({ title, subtitle, onBack }) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <button type="button" onClick={onBack} className="rounded-lg p-2 transition-colors hover:bg-gray-100" aria-label="Voltar">
        <ArrowLeft size={24} className="text-nirart-text" />
      </button>
      <div>
        <h1 className="text-3xl font-bold text-nirart-text">{title}</h1>
        <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
      </div>
    </div>
  )
}

function Field({ label, name, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-gray-700">{label}</span>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className={inputClass} />
    </label>
  )
}

function TextareaField({ label, name, value, onChange }) {
  return (
    <label className="block md:col-span-2">
      <span className="mb-2 block text-sm font-semibold text-gray-700">{label}</span>
      <textarea name={name} value={value} onChange={onChange} rows={4} className={`${inputClass} resize-none`} />
    </label>
  )
}

function FormActions({ submitting, isEditing, onCancel }) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancelar</Button>
      <Button type="submit" variant="primary" disabled={submitting} className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
        {submitting ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}
        {submitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar Medição'}
      </Button>
    </div>
  )
}

function LoadingState() {
  return (
    <MainLayout>
      <div className="flex min-h-80 items-center justify-center gap-3 p-8 text-sm text-gray-500">
        <LoaderCircle className="animate-spin" size={20} /> Carregando medição...
      </div>
    </MainLayout>
  )
}

function NotFoundState({ onBack }) {
  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-nirart-text">Medição não encontrada</h1>
          <Button className="mt-6" onClick={onBack}>Voltar para Medidas</Button>
        </div>
      </div>
    </MainLayout>
  )
}

function ErrorAlert({ message }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <AlertCircle className="mt-0.5 shrink-0" size={18} />
      <span>{message}</span>
    </div>
  )
}

function getLocalDateString() {
  const today = new Date()
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-')
}

function getErrorMessage(error, fallback) {
  return error?.message ? `${fallback} ${error.message}` : fallback
}

const inputClass = 'w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-nirart-green focus:ring-1 focus:ring-nirart-green'
