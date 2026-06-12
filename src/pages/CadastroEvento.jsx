import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CalendarDays, MapPin, UserRound } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_CLASSES, MOCK_SCHOOLS, MOCK_STUDENTS } from '../data/mockData'
import { MOCK_RESERVATIONS } from '../data/reservationMockData'
import {
  EVENT_STATUSES,
  EVENT_TYPES,
  getAgendaEventById,
  RESPONSIBLES
} from '../data/agendaMockData'

const EMPTY_FORM = {
  title: '',
  type: 'atendimento',
  date: '',
  startTime: '',
  endTime: '',
  studentId: '',
  schoolId: '',
  classId: '',
  reservationId: '',
  responsible: '',
  location: '',
  status: 'agendado',
  notes: ''
}

export default function CadastroEvento() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const storedEvent = isEdit ? getAgendaEventById(id) : null
    if (storedEvent) {
      setFormData({
        ...EMPTY_FORM,
        ...storedEvent,
        studentId: storedEvent.studentId || '',
        schoolId: storedEvent.schoolId || '',
        classId: storedEvent.classId || '',
        reservationId: storedEvent.reservationId || ''
      })
      return
    }

    const reservationId = searchParams.get('reservaId')
    const studentId = searchParams.get('alunoId')
    const reservation = MOCK_RESERVATIONS.find((item) => String(item.id) === String(reservationId))
    const student = MOCK_STUDENTS.find((item) => String(item.id) === String(studentId))

    if (reservation) {
      setFormData((current) => ({
        ...current,
        studentId: reservation.studentId,
        schoolId: reservation.schoolId,
        classId: reservation.classId,
        reservationId: reservation.id
      }))
    } else if (student) {
      setFormData((current) => ({
        ...current,
        studentId: student.id,
        schoolId: student.schoolId,
        classId: student.classId
      }))
    }
  }, [id, isEdit, searchParams])

  const availableClasses = useMemo(
    () => MOCK_CLASSES.filter((item) => !formData.schoolId || String(item.schoolId) === String(formData.schoolId)),
    [formData.schoolId]
  )

  const availableReservations = useMemo(
    () => MOCK_RESERVATIONS.filter((item) => !formData.studentId || String(item.studentId) === String(formData.studentId)),
    [formData.studentId]
  )

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const handleStudentChange = (studentId) => {
    const student = MOCK_STUDENTS.find((item) => String(item.id) === String(studentId))
    setFormData((current) => ({
      ...current,
      studentId: student?.id || '',
      schoolId: student?.schoolId || '',
      classId: student?.classId || '',
      reservationId: ''
    }))
    clearRelationshipErrors()
  }

  const handleReservationChange = (reservationId) => {
    const reservation = MOCK_RESERVATIONS.find((item) => String(item.id) === String(reservationId))
    setFormData((current) => ({
      ...current,
      reservationId: reservation?.id || '',
      studentId: reservation?.studentId || current.studentId,
      schoolId: reservation?.schoolId || current.schoolId,
      classId: reservation?.classId || current.classId
    }))
    clearRelationshipErrors()
  }

  const clearRelationshipErrors = () => {
    setErrors((current) => ({
      ...current,
      studentId: '',
      schoolId: '',
      classId: '',
      reservationId: ''
    }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!formData.title.trim()) nextErrors.title = 'Informe o título do evento.'
    if (!formData.type) nextErrors.type = 'Selecione o tipo de evento.'
    if (!formData.date) nextErrors.date = 'Informe a data.'
    if (!formData.startTime) nextErrors.startTime = 'Informe a hora de início.'
    if (!formData.endTime) nextErrors.endTime = 'Informe a hora de término.'
    if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) {
      nextErrors.endTime = 'A hora final deve ser posterior à hora inicial.'
    }
    if (!formData.studentId) nextErrors.studentId = 'Selecione o aluno.'
    if (!formData.schoolId) nextErrors.schoolId = 'Selecione a escola.'
    if (!formData.classId) nextErrors.classId = 'Selecione a turma.'
    if (!formData.responsible) nextErrors.responsible = 'Selecione o responsável.'
    if (!formData.location.trim()) nextErrors.location = 'Informe o local.'
    if (!formData.status) nextErrors.status = 'Selecione o status.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) return
    navigate(isEdit ? `/agenda/${id}` : '/agenda')
  }

  if (isEdit && !getAgendaEventById(id)) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Evento não encontrado</h1>
            <p className="mt-2 text-gray-600">Selecione um evento válido na agenda.</p>
            <Button className="mt-6" onClick={() => navigate('/agenda')}>Voltar para Agenda</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-5xl p-4 md:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-nirart-text md:text-3xl">
            {isEdit ? 'Editar Evento' : 'Novo Evento'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Organize o compromisso e relacione aluno, escola, turma e reserva.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormSection icon={CalendarDays} title="Dados do evento">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Título" error={errors.title} className="md:col-span-2">
                <input
                  value={formData.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  className={inputClass(errors.title)}
                  placeholder="Ex.: Prova final do vestido"
                />
              </Field>
              <Field label="Tipo de evento" error={errors.type}>
                <select value={formData.type} onChange={(event) => updateField('type', event.target.value)} className={inputClass(errors.type)}>
                  {EVENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </Field>
              <Field label="Status" error={errors.status}>
                <select value={formData.status} onChange={(event) => updateField('status', event.target.value)} className={inputClass(errors.status)}>
                  {EVENT_STATUSES.map((status) => <option key={status} value={status}>{capitalize(status)}</option>)}
                </select>
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Data" error={errors.date}>
                <input type="date" value={formData.date} onChange={(event) => updateField('date', event.target.value)} className={inputClass(errors.date)} />
              </Field>
              <Field label="Hora de início" error={errors.startTime}>
                <input type="time" value={formData.startTime} onChange={(event) => updateField('startTime', event.target.value)} className={inputClass(errors.startTime)} />
              </Field>
              <Field label="Hora de término" error={errors.endTime}>
                <input type="time" value={formData.endTime} onChange={(event) => updateField('endTime', event.target.value)} className={inputClass(errors.endTime)} />
              </Field>
            </div>
          </FormSection>

          <FormSection icon={UserRound} title="Vínculos">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Aluno" error={errors.studentId}>
                <select value={formData.studentId} onChange={(event) => handleStudentChange(event.target.value)} className={inputClass(errors.studentId)}>
                  <option value="">Selecione o aluno</option>
                  {MOCK_STUDENTS.map((student) => <option key={student.id} value={student.id}>{student.fullName}</option>)}
                </select>
              </Field>
              <Field label="Reserva vinculada">
                <select value={formData.reservationId} onChange={(event) => handleReservationChange(event.target.value)} className={inputClass()}>
                  <option value="">Sem reserva vinculada</option>
                  {availableReservations.map((reservation) => (
                    <option key={reservation.id} value={reservation.id}>
                      Reserva #{reservation.id} - {formatDate(reservation.eventDate)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Escola" error={errors.schoolId}>
                <select value={formData.schoolId} onChange={(event) => updateField('schoolId', event.target.value)} className={inputClass(errors.schoolId)}>
                  <option value="">Selecione a escola</option>
                  {MOCK_SCHOOLS.map((school) => <option key={school.id} value={school.id}>{school.fantasyName}</option>)}
                </select>
              </Field>
              <Field label="Turma" error={errors.classId}>
                <select value={formData.classId} onChange={(event) => updateField('classId', event.target.value)} className={inputClass(errors.classId)}>
                  <option value="">Selecione a turma</option>
                  {availableClasses.map((studentClass) => <option key={studentClass.id} value={studentClass.id}>{studentClass.name}</option>)}
                </select>
              </Field>
            </div>
          </FormSection>

          <FormSection icon={MapPin} title="Atendimento">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Responsável" error={errors.responsible}>
                <select value={formData.responsible} onChange={(event) => updateField('responsible', event.target.value)} className={inputClass(errors.responsible)}>
                  <option value="">Selecione o responsável</option>
                  {RESPONSIBLES.map((responsible) => <option key={responsible} value={responsible}>{responsible}</option>)}
                </select>
              </Field>
              <Field label="Local" error={errors.location}>
                <input
                  value={formData.location}
                  onChange={(event) => updateField('location', event.target.value)}
                  className={inputClass(errors.location)}
                  placeholder="Informe o local do compromisso"
                />
              </Field>
              <Field label="Observações" className="md:col-span-2">
                <textarea
                  value={formData.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  className={`${inputClass()} min-h-28 resize-y`}
                  placeholder="Orientações, alterações ou informações importantes"
                />
              </Field>
            </div>
          </FormSection>

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => navigate(isEdit ? `/agenda/${id}` : '/agenda')} className="whitespace-nowrap">
              Cancelar
            </Button>
            <Button type="submit" className="whitespace-nowrap">
              {isEdit ? 'Salvar alterações' : 'Criar evento'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

function FormSection({ icon: Icon, title, children }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-green-50 p-2 text-nirart-green"><Icon size={20} /></div>
        <h2 className="text-lg font-semibold text-nirart-text">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Field({ label, error, className = '', children }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  )
}

function inputClass(error) {
  return `w-full min-w-0 rounded-lg border px-3 py-2 outline-none focus:ring-1 ${
    error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'
  }`
}

function formatDate(value) {
  if (!value) return 'Sem data'
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
