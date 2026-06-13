import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Truck } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { DELIVERY_STATUSES, listarEntregas, salvarEntrega } from '../services/entregas'
import { listarReservas } from '../services/reservas'

const EMPTY_CHECKLIST = {
  clothes: false,
  shoes: false,
  accessories: false,
  kits: false,
  packaging: false
}

function emptyForm(reservationId = '') {
  return {
    reservationId,
    deliveryDate: '',
    deliveredBy: '',
    receivedBy: '',
    notes: '',
    status: 'pendente',
    checklist: { ...EMPTY_CHECKLIST }
  }
}

export default function RegistrarEntrega() {
  const { reservaId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialId = reservaId || searchParams.get('reservaId') || ''
  const [reservations, setReservations] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [formData, setFormData] = useState(() => emptyForm(initialId))
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([listarReservas(), listarEntregas()])
      .then(([reservationData, deliveryData]) => {
        if (!active) return
        setReservations(reservationData)
        setDeliveries(deliveryData)

        if (initialId) {
          const existing = deliveryData.find((item) => item.reservationId === initialId)
          const reservation = reservationData.find((item) => item.id === initialId)
          setFormData(existing || buildFormFromReservation(reservation))
        }
      })
      .catch((error) => {
        console.error(error)
        if (active) setLoadError('Não foi possível carregar os dados da entrega.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [initialId])

  const reservation = reservations.find((item) => item.id === formData.reservationId)
  const checklistItems = useMemo(() => getApplicableChecklistItems(reservation), [reservation])
  const availableReservations = reservations.filter((item) => (
    item.status !== 'cancelado'
    && (
      item.id === formData.reservationId
      || !deliveries.some((delivery) => delivery.reservationId === item.id)
    )
  ))

  const selectReservation = (id) => {
    const existing = deliveries.find((item) => item.reservationId === id)
    const selected = reservations.find((item) => item.id === id)
    setFormData(existing || buildFormFromReservation(selected))
    setErrors({})
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return

    const nextErrors = {}
    if (!formData.reservationId) nextErrors.reservationId = 'Selecione a reserva.'
    if (!formData.deliveryDate) nextErrors.deliveryDate = 'Informe a data da entrega.'

    if (formData.status === 'entregue') {
      if (!formData.deliveredBy.trim()) nextErrors.deliveredBy = 'Informe o responsável pela entrega.'
      if (!formData.receivedBy.trim()) nextErrors.receivedBy = 'Informe o recebedor.'
      const requiredChecks = checklistItems.filter((item) => item.applicable)
      if (requiredChecks.some((item) => !formData.checklist[item.key])) {
        nextErrors.checklist = 'Confirme todos os itens aplicáveis.'
      }
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSaving(true)
    try {
      await salvarEntrega(formData)
      navigate(`/reservas/${formData.reservationId}`)
    } catch (error) {
      console.error(error)
      setErrors({ submit: 'Não foi possível salvar a entrega. Verifique os dados e tente novamente.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        <header className="mb-6"><h1 className="text-2xl font-bold text-nirart-text">Registrar Entrega</h1><p className="mt-1 text-sm text-gray-600">Confirme os dados e o checklist dos itens entregues.</p></header>

        {loadError && <p className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</p>}

        {loading ? (
          <p className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">Carregando dados da entrega...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-nirart-text">Reserva</h2>
              <div className="mt-4"><Field label="Reserva" error={errors.reservationId}><select value={formData.reservationId} onChange={(event) => selectReservation(event.target.value)} className={inputClass(errors.reservationId)}><option value="">Selecione</option>{availableReservations.map((item) => <option key={item.id} value={item.id}>Reserva #{shortId(item.id)} - {item.student?.fullName || 'Aluno não informado'}</option>)}</select></Field></div>
              {reservation && <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-3"><Info label="Aluno" value={reservation.student?.fullName} /><Info label="Escola" value={reservation.school?.fantasyName} /><Info label="Turma" value={reservation.studentClass?.name} /></div>}
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
            {errors.submit && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errors.submit}</p>}
            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row"><Button type="button" variant="outline" onClick={() => navigate('/entregas')}>Cancelar</Button><Button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 whitespace-nowrap"><Truck size={18} /> {saving ? 'Salvando...' : 'Salvar Entrega'}</Button></div>
          </form>
        )}
      </div>
    </MainLayout>
  )
}

function buildFormFromReservation(reservation) {
  if (!reservation) return emptyForm()
  return {
    ...emptyForm(reservation.id),
    deliveryDate: reservation.deliveryDate || '',
    checklist: getInitialChecklist(reservation)
  }
}

function getInitialChecklist(reservation) {
  const applicable = getApplicableChecklistItems(reservation)
  return applicable.reduce((checklist, item) => ({
    ...checklist,
    [item.key]: false
  }), { ...EMPTY_CHECKLIST })
}

function getApplicableChecklistItems(reservation) {
  const types = new Set((reservation?.items || []).map((item) => item.inventoryType))
  return [
    { key: 'clothes', label: 'Roupa', applicable: types.has('Roupa') },
    { key: 'shoes', label: 'Sapato', applicable: types.has('Sapato') },
    { key: 'accessories', label: 'Acessório', applicable: [...types].some((type) => type?.startsWith('Acess')) },
    { key: 'kits', label: 'Kit', applicable: types.has('Kit') },
    { key: 'packaging', label: 'Embalagem', applicable: true }
  ]
}

function Checklist({ title, items, values, onChange, error, suffix }) {
  return <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6"><div className="flex items-center gap-3"><CheckCircle2 className="text-nirart-green" /><h2 className="text-lg font-semibold text-nirart-text">{title}</h2></div><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">{items.map((item) => <label key={item.key} className={`flex items-center gap-3 rounded-lg border p-4 ${item.applicable ? 'cursor-pointer' : 'bg-gray-50 opacity-50'}`}><input type="checkbox" disabled={!item.applicable} checked={Boolean(values[item.key])} onChange={(event) => onChange(item.key, event.target.checked)} className="h-5 w-5 accent-[#6FBFA9]" /><span className="font-medium text-gray-700">{item.label} {suffix}</span></label>)}</div>{error && <p className="mt-2 text-sm text-red-600">{error}</p>}</section>
}

function Field({ label, error, children }) { return <label className="block"><span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>{children}{error && <span className="mt-1 block text-sm text-red-600">{error}</span>}</label> }
function Info({ label, value }) { return <div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 break-words font-semibold text-nirart-text">{value || '—'}</p></div> }
function inputClass(error) { return `w-full rounded-lg border px-3 py-2 outline-none focus:ring-1 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'}` }
function shortId(value) { return String(value || '').slice(0, 8) }
function capitalize(value = '') { return value.charAt(0).toUpperCase() + value.slice(1) }
