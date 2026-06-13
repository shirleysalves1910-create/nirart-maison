import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { getReturnFineTotal, ITEM_CONDITIONS, listarDevolucoes, RETURN_STATUSES, salvarDevolucao } from '../services/devolucoes'
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
    expectedReturnDate: '',
    actualReturnDate: '',
    receivedBy: '',
    itemCondition: '',
    wasLate: false,
    hadDamage: false,
    lateFee: '0.00',
    damageFee: '0.00',
    fineReceived: false,
    notes: '',
    status: 'pendente',
    checklist: { ...EMPTY_CHECKLIST }
  }
}

export default function RegistrarDevolucao() {
  const { reservaId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialId = reservaId || searchParams.get('reservaId') || ''
  const [reservations, setReservations] = useState([])
  const [returns, setReturns] = useState([])
  const [formData, setFormData] = useState(() => emptyForm(initialId))
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([listarReservas(), listarDevolucoes()])
      .then(([reservationData, returnData]) => {
        if (!active) return
        setReservations(reservationData)
        setReturns(returnData)

        if (initialId) {
          const existing = returnData.find((item) => item.reservationId === initialId)
          const reservation = reservationData.find((item) => item.id === initialId)
          setFormData(existing || buildFormFromReservation(reservation))
        }
      })
      .catch((error) => {
        console.error(error)
        if (active) setLoadError('Não foi possível carregar os dados da devolução.')
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
      || !returns.some((itemReturn) => itemReturn.reservationId === item.id)
    )
  ))
  const totalFine = getReturnFineTotal(formData)

  const selectReservation = (id) => {
    const existing = returns.find((item) => item.reservationId === id)
    const selected = reservations.find((item) => item.id === id)
    setFormData(existing || buildFormFromReservation(selected))
    setErrors({})
  }

  const setOccurrence = (field, checked) => {
    setFormData((current) => {
      const next = {
        ...current,
        [field]: checked,
        ...(field === 'wasLate' && !checked ? { lateFee: '0.00' } : {}),
        ...(field === 'hadDamage' && !checked ? { damageFee: '0.00' } : {})
      }

      if (checked && field === 'hadDamage') next.status = 'com avaria'
      else if (checked && field === 'wasLate' && !current.hadDamage) next.status = 'atrasado'
      else if (!checked && ['atrasado', 'com avaria'].includes(current.status)) {
        next.status = next.hadDamage ? 'com avaria' : next.wasLate ? 'atrasado' : 'devolvido'
      }

      return next
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return

    const nextErrors = {}
    const completed = ['devolvido', 'atrasado', 'com avaria'].includes(formData.status)
    if (!formData.reservationId) nextErrors.reservationId = 'Selecione a reserva.'
    if (!formData.expectedReturnDate) nextErrors.expectedReturnDate = 'A reserva não possui data prevista de devolução.'

    if (completed) {
      if (!formData.actualReturnDate) nextErrors.actualReturnDate = 'Informe a data real.'
      if (!formData.receivedBy.trim()) nextErrors.receivedBy = 'Informe o recebedor.'
      if (!formData.itemCondition) nextErrors.itemCondition = 'Informe a condição dos itens.'
      if (checklistItems.filter((item) => item.applicable).some((item) => !formData.checklist[item.key])) {
        nextErrors.checklist = 'Confirme todos os itens aplicáveis.'
      }
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSaving(true)
    try {
      await salvarDevolucao(formData)
      navigate(`/reservas/${formData.reservationId}`)
    } catch (error) {
      console.error(error)
      setErrors({ submit: 'Não foi possível salvar a devolução. Verifique os dados e tente novamente.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        <header className="mb-6"><h1 className="text-2xl font-bold text-nirart-text">Registrar Devolução</h1><p className="mt-1 text-sm text-gray-600">Confira os itens, ocorrências e multas da devolução.</p></header>

        {loadError && <p className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</p>}

        {loading ? (
          <p className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">Carregando dados da devolução...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6"><h2 className="text-lg font-semibold">Reserva</h2><div className="mt-4"><Field label="Reserva" error={errors.reservationId}><select value={formData.reservationId} onChange={(event) => selectReservation(event.target.value)} className={inputClass(errors.reservationId)}><option value="">Selecione</option>{availableReservations.map((item) => <option key={item.id} value={item.id}>Reserva #{shortId(item.id)} - {item.student?.fullName || 'Aluno não informado'}</option>)}</select></Field></div>{reservation && <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-3"><Info label="Aluno" value={reservation.student?.fullName} /><Info label="Escola" value={reservation.school?.fantasyName} /><Info label="Turma" value={reservation.studentClass?.name} /></div>}</section>
            <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Devolução prevista" error={errors.expectedReturnDate}><input type="date" readOnly value={formData.expectedReturnDate} className={`${inputClass(errors.expectedReturnDate)} bg-gray-50`} /></Field><Field label="Data real de devolução" error={errors.actualReturnDate}><input type="date" value={formData.actualReturnDate} onChange={(event) => setFormData({ ...formData, actualReturnDate: event.target.value })} className={inputClass(errors.actualReturnDate)} /></Field><Field label="Recebedor da devolução" error={errors.receivedBy}><input value={formData.receivedBy} onChange={(event) => setFormData({ ...formData, receivedBy: event.target.value })} className={inputClass(errors.receivedBy)} /></Field><Field label="Condição dos itens" error={errors.itemCondition}><select value={formData.itemCondition} onChange={(event) => setFormData({ ...formData, itemCondition: event.target.value })} className={inputClass(errors.itemCondition)}><option value="">Selecione</option>{ITEM_CONDITIONS.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field><Field label="Status"><select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })} className={inputClass()}>{RETURN_STATUSES.map((item) => <option key={item} value={item}>{capitalize(item)}</option>)}</select></Field></div></section>
            <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6"><div className="flex items-center gap-3"><AlertTriangle className="text-nirart-wine" /><h2 className="text-lg font-semibold">Ocorrências e multas</h2></div><div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"><Toggle label="Houve atraso" checked={formData.wasLate} onChange={(checked) => setOccurrence('wasLate', checked)} /><Toggle label="Houve avaria" checked={formData.hadDamage} onChange={(checked) => setOccurrence('hadDamage', checked)} /><Field label="Multa por atraso"><input type="number" min="0" step="0.01" disabled={!formData.wasLate} value={formData.lateFee} onChange={(event) => setFormData({ ...formData, lateFee: event.target.value })} className={`${inputClass()} disabled:bg-gray-50`} /></Field><Field label="Multa por avaria"><input type="number" min="0" step="0.01" disabled={!formData.hadDamage} value={formData.damageFee} onChange={(event) => setFormData({ ...formData, damageFee: event.target.value })} className={`${inputClass()} disabled:bg-gray-50`} /></Field><Toggle label="Multa recebida" checked={formData.fineReceived} disabled={Number(totalFine) <= 0} onChange={(checked) => setFormData({ ...formData, fineReceived: checked })} /></div><div className="mt-4 rounded-lg bg-red-50 p-4"><p className="text-sm text-red-800">Total de multas</p><p className="mt-1 text-2xl font-bold text-nirart-wine">{formatCurrency(totalFine)}</p></div></section>
            <Checklist items={checklistItems} values={formData.checklist} onChange={(key, checked) => setFormData({ ...formData, checklist: { ...formData.checklist, [key]: checked } })} error={errors.checklist} />
            <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6"><Field label="Observação da devolução"><textarea value={formData.notes} onChange={(event) => setFormData({ ...formData, notes: event.target.value })} className={`${inputClass()} min-h-28`} /></Field></section>
            {errors.submit && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errors.submit}</p>}
            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row"><Button type="button" variant="outline" onClick={() => navigate('/devolucoes')}>Cancelar</Button><Button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 whitespace-nowrap"><RotateCcw size={18} /> {saving ? 'Salvando...' : 'Salvar Devolução'}</Button></div>
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
    expectedReturnDate: reservation.expectedReturnDate || ''
  }
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

function Checklist({ items, values, onChange, error }) { return <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6"><div className="flex items-center gap-3"><CheckCircle2 className="text-nirart-green" /><h2 className="text-lg font-semibold">Checklist da devolução</h2></div><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">{items.map((item) => <label key={item.key} className={`flex items-center gap-3 rounded-lg border p-4 ${item.applicable ? 'cursor-pointer' : 'bg-gray-50 opacity-50'}`}><input type="checkbox" disabled={!item.applicable} checked={Boolean(values[item.key])} onChange={(event) => onChange(item.key, event.target.checked)} className="h-5 w-5 accent-[#6FBFA9]" /><span className="font-medium">{item.label} devolvida</span></label>)}</div>{error && <p className="mt-2 text-sm text-red-600">{error}</p>}</section> }
function Toggle({ label, checked, disabled = false, onChange }) { return <label className={`flex items-center justify-between rounded-lg border p-4 ${disabled ? 'bg-gray-50 opacity-60' : ''}`}><span className="font-medium text-gray-700">{label}</span><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-[#6FBFA9]" /></label> }
function Field({ label, error, children }) { return <label className="block"><span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>{children}{error && <span className="mt-1 block text-sm text-red-600">{error}</span>}</label> }
function Info({ label, value }) { return <div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 break-words font-semibold">{value || '—'}</p></div> }
function inputClass(error) { return `w-full rounded-lg border px-3 py-2 outline-none focus:ring-1 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'}` }
function formatCurrency(value) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0)) }
function shortId(value) { return String(value || '').slice(0, 8) }
function capitalize(value = '') { return value.charAt(0).toUpperCase() + value.slice(1) }
