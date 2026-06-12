import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Truck } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_CLASSES, MOCK_SCHOOLS, MOCK_STUDENTS } from '../data/mockData'
import { getReservationById, MOCK_RESERVATIONS } from '../data/reservationMockData'
import { DELIVERY_STATUSES, getApplicableChecklistItems, getDeliveryByReservationId, getReservationChecklist } from '../data/deliveryReturnMockData'

export default function RegistrarEntrega() {
  const { reservaId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialId = reservaId || searchParams.get('reservaId') || ''
  const [formData, setFormData] = useState({ reservationId: initialId, deliveryDate: '', deliveredBy: '', receivedBy: '', notes: '', status: 'pendente', checklist: getReservationChecklist(initialId) })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const delivery = getDeliveryByReservationId(initialId)
    const reservation = getReservationById(initialId)
    if (delivery) setFormData({ ...delivery, reservationId: delivery.reservationId })
    else if (reservation) setFormData((current) => ({ ...current, reservationId: reservation.id, deliveryDate: reservation.deliveryDate, checklist: getReservationChecklist(reservation.id) }))
  }, [initialId])

  const reservation = getReservationById(formData.reservationId)
  const student = MOCK_STUDENTS.find((item) => item.id === reservation?.studentId)
  const school = MOCK_SCHOOLS.find((item) => item.id === reservation?.schoolId)
  const studentClass = MOCK_CLASSES.find((item) => item.id === reservation?.classId)
  const checklistItems = getApplicableChecklistItems(formData.reservationId)

  const selectReservation = (id) => {
    const selected = getReservationById(id)
    setFormData((current) => ({ ...current, reservationId: selected?.id || '', deliveryDate: selected?.deliveryDate || '', checklist: getReservationChecklist(selected?.id) }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!formData.reservationId) nextErrors.reservationId = 'Selecione a reserva.'
    if (!formData.deliveryDate) nextErrors.deliveryDate = 'Informe a data da entrega.'
    if (!formData.deliveredBy.trim()) nextErrors.deliveredBy = 'Informe o responsável pela entrega.'
    if (!formData.receivedBy.trim()) nextErrors.receivedBy = 'Informe o recebedor.'
    const requiredChecks = checklistItems.filter((item) => item.applicable)
    if (formData.status === 'entregue' && requiredChecks.some((item) => !formData.checklist[item.key])) nextErrors.checklist = 'Confirme todos os itens aplicáveis.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    console.log('Entrega salva em modo mock', { ...formData, reservationStatus: formData.status === 'entregue' ? 'entregue' : reservation?.status })
    navigate(`/reservas/${formData.reservationId}`, { state: { reservationStatus: formData.status === 'entregue' ? 'entregue' : reservation?.status, delivery: formData } })
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        <header className="mb-6"><h1 className="text-2xl font-bold text-nirart-text">Registrar Entrega</h1><p className="mt-1 text-sm text-gray-600">Confirme os dados e o checklist dos itens entregues.</p></header>
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-lg font-semibold text-nirart-text">Reserva</h2>
            <div className="mt-4"><Field label="Reserva" error={errors.reservationId}><select value={formData.reservationId} onChange={(event) => selectReservation(event.target.value)} className={inputClass(errors.reservationId)}><option value="">Selecione</option>{MOCK_RESERVATIONS.filter((item) => item.status !== 'cancelado').map((item) => <option key={item.id} value={item.id}>Reserva #{item.id} - {MOCK_STUDENTS.find((studentEntry) => studentEntry.id === item.studentId)?.fullName}</option>)}</select></Field></div>
            {reservation && <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-3"><Info label="Aluno" value={student?.fullName} /><Info label="Escola" value={school?.fantasyName} /><Info label="Turma" value={studentClass?.name} /></div>}
          </section>
          <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Data da entrega" error={errors.deliveryDate}><input type="date" value={formData.deliveryDate} onChange={(event) => setFormData({ ...formData, deliveryDate: event.target.value })} className={inputClass(errors.deliveryDate)} /></Field>
              <Field label="Status"><select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })} className={inputClass()}>{DELIVERY_STATUSES.map((item) => <option key={item} value={item}>{capitalize(item)}</option>)}</select></Field>
              <Field label="Responsável pela entrega" error={errors.deliveredBy}><input value={formData.deliveredBy} onChange={(event) => setFormData({ ...formData, deliveredBy: event.target.value })} className={inputClass(errors.deliveredBy)} /></Field>
              <Field label="Recebedor" error={errors.receivedBy}><input value={formData.receivedBy} onChange={(event) => setFormData({ ...formData, receivedBy: event.target.value })} className={inputClass(errors.receivedBy)} /></Field>
            </div>
            <div className="mt-4"><Field label="Observação da entrega"><textarea value={formData.notes} onChange={(event) => setFormData({ ...formData, notes: event.target.value })} className={`${inputClass()} min-h-28`} /></Field></div>
          </section>
          <Checklist title="Checklist da entrega" items={checklistItems} values={formData.checklist} onChange={(key, checked) => setFormData({ ...formData, checklist: { ...formData.checklist, [key]: checked } })} error={errors.checklist} suffix="entregue" />
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row"><Button type="button" variant="outline" onClick={() => navigate('/entregas')}>Cancelar</Button><Button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap"><Truck size={18} /> Salvar Entrega</Button></div>
        </form>
      </div>
    </MainLayout>
  )
}

function Checklist({ title, items, values, onChange, error, suffix }) {
  return <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6"><div className="flex items-center gap-3"><CheckCircle2 className="text-nirart-green" /><h2 className="text-lg font-semibold text-nirart-text">{title}</h2></div><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">{items.map((item) => <label key={item.key} className={`flex items-center gap-3 rounded-lg border p-4 ${item.applicable ? 'cursor-pointer' : 'bg-gray-50 opacity-50'}`}><input type="checkbox" disabled={!item.applicable} checked={Boolean(values[item.key])} onChange={(event) => onChange(item.key, event.target.checked)} className="h-5 w-5 accent-[#6FBFA9]" /><span className="font-medium text-gray-700">{item.label} {suffix}</span></label>)}</div>{error && <p className="mt-2 text-sm text-red-600">{error}</p>}</section>
}

function Field({ label, error, children }) { return <label className="block"><span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>{children}{error && <span className="mt-1 block text-sm text-red-600">{error}</span>}</label> }
function Info({ label, value }) { return <div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 break-words font-semibold text-nirart-text">{value || '—'}</p></div> }
function inputClass(error) { return `w-full rounded-lg border px-3 py-2 outline-none focus:ring-1 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'}` }
function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1) }
