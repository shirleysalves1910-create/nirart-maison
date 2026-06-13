import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, LoaderCircle } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { listarEscolas } from '../services/escolas'
import {
  atualizarTurma,
  buscarTurmaPorId,
  criarTurma
} from '../services/turmas'

const EMPTY_FORM = {
  schoolId: '',
  name: '',
  turn: 'morning',
  eventDate: '',
  eventLocation: '',
  notes: '',
  status: 'Ativa'
}

export default function CadastroTurma() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [schools, setSchools] = useState([])
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true

    const loadData = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const [schoolsData, classData] = await Promise.all([
          listarEscolas(),
          isEdit ? buscarTurmaPorId(id) : Promise.resolve(null)
        ])

        if (!active) return
        setSchools(schoolsData)

        if (classData) {
          setFormData({
            schoolId: classData.schoolId,
            name: classData.name,
            turn: classData.turn || 'morning',
            eventDate: classData.eventDate,
            eventLocation: classData.eventLocation,
            notes: classData.notes,
            status: classData.status || 'Ativa'
          })
        }
      } catch (error) {
        if (!active) return
        if (error?.code === 'PGRST116') {
          setNotFound(true)
        } else {
          setLoadError(getErrorMessage(error, 'Não foi possível carregar os dados da turma.'))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [id, isEdit])

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setSubmitError('')
  }

  const validate = () => {
    const nextErrors = {}
    if (!formData.schoolId) nextErrors.schoolId = 'Selecione a escola.'
    if (formData.name.trim().length < 3) nextErrors.name = 'Informe um nome com pelo menos 3 caracteres.'
    if (!formData.eventDate) nextErrors.eventDate = 'A data do evento é obrigatória.'
    if (formData.eventLocation.trim().length < 3) nextErrors.eventLocation = 'Informe um local válido.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loadError || !validate()) return

    setSubmitting(true)
    setSubmitError('')
    try {
      if (isEdit) {
        await atualizarTurma(id, formData)
      } else {
        await criarTurma(formData)
      }
      navigate('/turmas')
    } catch (error) {
      const fallback = error?.code === '23505'
        ? 'Já existe uma turma com este nome na escola selecionada.'
        : isEdit
          ? 'Não foi possível atualizar a turma.'
          : 'Não foi possível criar a turma.'
      setSubmitError(getErrorMessage(error, fallback))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-80 items-center justify-center gap-3 p-8 text-sm text-gray-500">
          <LoaderCircle className="animate-spin" size={20} /> Carregando turma...
        </div>
      </MainLayout>
    )
  }

  if (notFound) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Turma não encontrada</h1>
            <p className="mt-2 text-gray-600">Selecione uma turma válida na listagem.</p>
            <Button className="mt-6" onClick={() => navigate('/turmas')}>Voltar para Turmas</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-nirart-text">{isEdit ? 'Editar Turma' : 'Cadastrar Turma'}</h1>
          <p className="mt-1 text-sm text-gray-600">Preencha os dados da turma</p>
        </div>

        {(loadError || submitError) && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{loadError || submitError}</span>
          </div>
        )}

        {!schools.length && !loadError && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>Cadastre uma escola antes de criar uma turma.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
          <Field label="Escola" error={errors.schoolId}>
            <select
              value={formData.schoolId}
              onChange={(event) => updateField('schoolId', event.target.value)}
              className={inputClass(errors.schoolId)}
            >
              <option value="">Selecione a escola</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.fantasyName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nome da Turma" error={errors.name}>
            <input
              value={formData.name}
              onChange={(event) => updateField('name', event.target.value)}
              className={inputClass(errors.name)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Turno">
              <select
                value={formData.turn}
                onChange={(event) => updateField('turn', event.target.value)}
                className={inputClass()}
              >
                <option value="morning">Matutino</option>
                <option value="afternoon">Vespertino</option>
                <option value="night">Noturno</option>
              </select>
            </Field>

            <Field label="Data do Evento" error={errors.eventDate}>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(event) => updateField('eventDate', event.target.value)}
                className={inputClass(errors.eventDate)}
              />
            </Field>

            <Field label="Status">
              <select
                value={formData.status}
                onChange={(event) => updateField('status', event.target.value)}
                className={inputClass()}
              >
                <option value="Ativa">Ativa</option>
                <option value="Inativa">Inativa</option>
                <option value="Pendente">Pendente</option>
              </select>
            </Field>
          </div>

          <Field label="Local do Evento" error={errors.eventLocation}>
            <input
              value={formData.eventLocation}
              onChange={(event) => updateField('eventLocation', event.target.value)}
              className={inputClass(errors.eventLocation)}
            />
          </Field>

          <Field label="Observações">
            <textarea
              value={formData.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              className={`${inputClass()} h-24 resize-none`}
            />
          </Field>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/turmas')} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || Boolean(loadError) || !schools.length}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {submitting && <LoaderCircle className="animate-spin" size={18} />}
              {submitting ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Turma'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  )
}

function inputClass(error) {
  return `w-full min-w-0 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 ${
    error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'
  }`
}

function getErrorMessage(error, fallback) {
  return error?.message ? `${fallback} ${error.message}` : fallback
}
