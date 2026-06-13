import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, LoaderCircle, Save } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { buscarAlunoPorId } from '../services/alunos'
import { listarMedidas } from '../services/medidas'
import { criarAjuste } from '../services/ajustes'
import { formatDateBR } from '../utils/date'

const EMPTY_FORM = {
  measurementId: '',
  piece: '',
  adjustmentType: '',
  description: '',
  responsible: '',
  adjustmentDate: getLocalDateString(),
  status: 'Pendente',
  notes: ''
}

export default function RegistrarAjuste() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const requestedMeasurementId = searchParams.get('medidaId') || ''
  const [student, setStudent] = useState(null)
  const [measurements, setMeasurements] = useState([])
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
        const [studentData, measurementsData] = await Promise.all([
          buscarAlunoPorId(id),
          listarMedidas(id)
        ])
        if (!active) return

        const defaultMeasurement = measurementsData.find(({ id: measurementId }) => measurementId === requestedMeasurementId)
          || measurementsData.find(({ status }) => status === 'Ativa')
          || measurementsData[0]

        setStudent(studentData)
        setMeasurements(measurementsData)
        setFormData((current) => ({
          ...current,
          measurementId: defaultMeasurement?.id || ''
        }))
      } catch (error) {
        if (!active) return
        if (error?.code === 'PGRST116') {
          setNotFound(true)
        } else {
          setErrorMessage(getErrorMessage(error, 'Não foi possível carregar o aluno.'))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [id, requestedMeasurementId])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setErrorMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (
      !formData.piece.trim() ||
      !formData.adjustmentType ||
      !formData.description.trim() ||
      !formData.adjustmentDate
    ) {
      setErrorMessage('Informe a peça, o tipo, a descrição e a data do ajuste.')
      return
    }

    setSubmitting(true)
    setErrorMessage('')
    try {
      await criarAjuste(id, formData)
      navigate(`/historico-medidas/${id}?tab=adjustments`)
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível registrar o ajuste.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-80 items-center justify-center gap-3 p-8 text-sm text-gray-500">
          <LoaderCircle className="animate-spin" size={20} /> Carregando ajuste...
        </div>
      </MainLayout>
    )
  }

  if (notFound || !student) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-4xl p-4 md:p-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Aluno não encontrado</h1>
            <Button className="mt-6" onClick={() => navigate('/medidas')}>Voltar para Medidas</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <div className="mb-8 flex items-center gap-4">
          <button type="button" onClick={() => navigate(`/historico-medidas/${student.id}`)} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Voltar">
            <ArrowLeft size={24} className="text-nirart-text" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-nirart-text">{student.fullName}</h1>
            <p className="mt-1 text-sm text-gray-600">Registrar ajuste de peça</p>
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
            <Field label="Medição vinculada">
              <select name="measurementId" value={formData.measurementId} onChange={handleChange} className={inputClass}>
                <option value="">Sem medição vinculada</option>
                {measurements.map((measurement) => (
                  <option key={measurement.id} value={measurement.id}>
                    {formatDateBR(measurement.measurementDate)} · {measurement.type === 'female' ? 'Feminina' : 'Masculina'} · {measurement.status}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Peça">
              <input name="piece" value={formData.piece} onChange={handleChange} placeholder="Ex: Vestido de Formatura" className={inputClass} />
            </Field>
            <Field label="Tipo de Ajuste">
              <select name="adjustmentType" value={formData.adjustmentType} onChange={handleChange} className={inputClass}>
                <option value="">Selecione o tipo de ajuste</option>
                {['Comprimento', 'Cintura', 'Busto', 'Manga', 'Bainha', 'Fechamento', 'Outro'].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </Field>
            <Field label="Responsável">
              <input name="responsible" value={formData.responsible} onChange={handleChange} placeholder="Nome do responsável pelo ajuste" className={inputClass} />
            </Field>
            <Field label="Data do ajuste">
              <input type="date" name="adjustmentDate" value={formData.adjustmentDate} onChange={handleChange} className={inputClass} />
            </Field>
            <Field label="Status">
              <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                {['Pendente', 'Em andamento', 'Concluído', 'Cancelado'].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Descrição do Ajuste">
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className={`${inputClass} resize-none`} />
          </Field>

          <Field label="Observações">
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4} className={`${inputClass} resize-none`} />
          </Field>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => navigate(`/historico-medidas/${student.id}`)} disabled={submitting}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={submitting} className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
              {submitting ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}
              {submitting ? 'Salvando...' : 'Registrar Ajuste'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-semibold text-gray-700">{label}</span>
      {children}
    </label>
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

const inputClass = 'w-full min-w-0 rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-nirart-green focus:ring-1 focus:ring-nirart-green'
