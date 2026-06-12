import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_CLASSES, MOCK_SCHOOLS, MOCK_STUDENTS } from '../data/mockData'
import { getReservationById, MOCK_RESERVATIONS } from '../data/reservationMockData'
import { getApplicableChecklistItems, getReservationChecklist, getReturnByReservationId, ITEM_CONDITIONS, RETURN_STATUSES } from '../data/deliveryReturnMockData'

export default function RegistrarDevolucao() {
  const { reservaId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialId = reservaId || searchParams.get('reservaId') || ''
  const [formData, setFormData] = useState({ reservationId: initialId, expectedReturnDate: '', actualReturnDate: '', receivedBy: '', itemCondition: '', wasLate: false, hadDamage: false, lateFee: 0, damageFee: 0, notes: '', status: 'pendente', checklist: getReservationChecklist(initialId) })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const itemReturn = getReturnByReservationId(initialId)
    const reservation = getReservationById(initialId)
    if (itemReturn) setFormData({ ...itemReturn, reservationId: itemReturn.reservationId })
    else if (reservation) setFormData((current) => ({ ...current, reservationId: reservation.id, expectedReturnDate: reservation.expectedReturnDate, checklist: getReservationChecklist(reservation.id) }))
  }, [initialId])

  const reservation = getReservationById(formData.reservationId)
  const student = MOCK_STUDENTS.find((item) => item.id === reservation?.studentId)
  const school = MOCK_SCHOOLS.find((item) => item.id === reservation?.schoolId)
  const studentClass = MOCK_CLASSES.find((item) => item.id === reservation?.classId)
  const checklistItems = getApplicableChecklistItems(formData.reservationId)

  const selectReservation = (id) => { const selected = getReservationById(id); setFormData((current) => ({ ...current, reservationId: selected?.id || '', expectedReturnDate: selected?.expectedReturnDate || '', checklist: getReservationChecklist(selected?.id) })) }
  const setBoolean = (field, checked) => setFormData((current) => ({ ...current, [field]: checked, ...(field === 'wasLate' && !checked ? { lateFee: 0 } : {}), ...(field === 'hadDamage' && !checked ? { damageFee: 0 } : {}) }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!formData.reservationId) nextErrors.reservationId = 'Selecione a reserva.'
    if (!formData.actualReturnDate && formData.status !== 'pendente') nextErrors.actualReturnDate = 'Informe a data real.'
    if (!formData.receivedBy.trim() && formData.status !== 'pendente') nextErrors.receivedBy = 'Informe o recebedor.'
    if (!formData.itemCondition && formData.status !== 'pendente') nextErrors.itemCondition = 'Informe a condição dos itens.'
    if (formData.status !== 'pendente' && checklistItems.filter((item) => item.applicable).some((item) => !formData.checklist[item.key])) nextErrors.checklist = 'Confirme todos os itens aplicáveis.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    const reservationStatus = ['devolvido', 'atrasado', 'com avaria'].includes(formData.status) ? 'devolvido' : reservation?.status
    console.log('Devolução salva em modo mock', { ...formData, reservationStatus })
    navigate(`/reservas/${formData.reservationId}`, { state: { reservationStatus, itemReturn: formData } })
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        <header className="mb-6"><h1 className="text-2xl font-bold text-nirart-text">Registrar Devolução</h1><p className="mt-1 text-sm text-gray-600">Confira os itens, ocorrências e multas da devolução.</p></header>
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6"><h2 className="text-lg font-semibold">Reserva</h2><div className="mt-4"><Field label="Reserva" error={errors.reservationId}><select value={formData.reservationId} onChange={(event) => selectReservation(event.target.value)} className={inputClass(errors.reservationId)}><option value="">Selecione</option>{MOCK_RESERVATIONS.filter((item) => !['cancelado'].includes(item.status)).map((item) => <option key={item.id} value={item.id}>Reserva #{item.id} - {MOCK_STUDENTS.find((studentEntry) => studentEntry.id === item.studentId)?.fullName}</option>)}</select></Field></div>{reservation && <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-3"><Info label="Aluno" value={student?.fullName} /><Info label="Escola" value={school?.fantasyName} /><Info label="Turma" value={studentClass?.name} /></div>}</section>
          <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Devolução prevista"><input type="date" readOnly value={formData.expectedReturnDate} className={`${inputClass()} bg-gray-50`} /></Field><Field label="Data real de devolução" error={errors.actualReturnDate}><input type="date" value={formData.actualReturnDate} onChange={(event) => setFormData({ ...formData, actualReturnDate: event.target.value })} className={inputClass(errors.actualReturnDate)} /></Field><Field label="Recebedor da devolução" error={errors.receivedBy}><input value={formData.receivedBy} onChange={(event) => setFormData({ ...formData, receivedBy: event.target.value })} className={inputClass(errors.receivedBy)} /></Field><Field label="Condição dos itens" error={errors.itemCondition}><select value={formData.itemCondition} onChange={(event) => setFormData({ ...formData, itemCondition: event.target.value })} className={inputClass(errors.itemCondition)}><option value="">Selecione</option>{ITEM_CONDITIONS.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Status"><select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })} className={inputClass()}>{RETURN_STATUSES.map((item) => <option key={item} value={item}>{capitalize(item)}</option>)}</select></Field></div></section>
          <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6"><div className="flex items-center gap-3"><AlertTriangle className="text-nirart-wine" /><h2 className="text-lg font-semibold">Ocorrências e multas</h2></div><div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"><Toggle label="Houve atraso" checked={formData.wasLate} onChange={(checked) => setBoolean('wasLate', checked)} /><Toggle label="Houve avaria" checked={formData.hadDamage} onChange={(checked) => setBoolean('hadDamage', checked)} /><Field label="Multa por atraso"><input type="number" min="0" step="0.01" disabled={!formData.wasLate} value={formData.lateFee} onChange={(event) => setFormData({ ...formData, lateFee: event.target.value })} className={`${inputClass()} disabled:bg-gray-50`} /></Field><Field label="Multa por avaria"><input type="number" min="0" step="0.01" disabled={!formData.hadDamage} value={formData.damageFee} onChange={(event) => setFormData({ ...formData, damageFee: event.target.value })} className={`${inputClass()} disabled:bg-gray-50`} /></Field></div><div className="mt-4 rounded-lg bg-red-50 p-4"><p className="text-sm text-red-800">Total de multas</p><p className="mt-1 text-2xl font-bold text-nirart-wine">{formatCurrency(Number(formData.lateFee || 0) + Number(formData.damageFee || 0))}</p></div></section>
          <Checklist items={checklistItems} values={formData.checklist} onChange={(key, checked) => setFormData({ ...formData, checklist: { ...formData.checklist, [key]: checked } })} error={errors.checklist} />
          <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6"><Field label="Observação da devolução"><textarea value={formData.notes} onChange={(event) => setFormData({ ...formData, notes: event.target.value })} className={`${inputClass()} min-h-28`} /></Field></section>
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row"><Button type="button" variant="outline" onClick={() => navigate('/devolucoes')}>Cancelar</Button><Button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap"><RotateCcw size={18} /> Salvar Devolução</Button></div>
        </form>
      </div>
    </MainLayout>
  )
}

function Checklist({ items, values, onChange, error }) { return <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6"><div className="flex items-center gap-3"><CheckCircle2 className="text-nirart-green" /><h2 className="text-lg font-semibold">Checklist da devolução</h2></div><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">{items.map((item) => <label key={item.key} className={`flex items-center gap-3 rounded-lg border p-4 ${item.applicable ? 'cursor-pointer' : 'bg-gray-50 opacity-50'}`}><input type="checkbox" disabled={!item.applicable} checked={Boolean(values[item.key])} onChange={(event) => onChange(item.key, event.target.checked)} className="h-5 w-5 accent-[#6FBFA9]" /><span className="font-medium">{item.label} devolvida</span></label>)}</div>{error && <p className="mt-2 text-sm text-red-600">{error}</p>}</section> }
function Toggle({ label, checked, onChange }) { return <label className="flex items-center justify-between rounded-lg border p-4"><span className="font-medium text-gray-700">{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-[#6FBFA9]" /></label> }
function Field({ label, error, children }) { return <label className="block"><span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>{children}{error && <span className="mt-1 block text-sm text-red-600">{error}</span>}</label> }
function Info({ label, value }) { return <div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 break-words font-semibold">{value || '—'}</p></div> }
function inputClass(error) { return `w-full rounded-lg border px-3 py-2 outline-none focus:ring-1 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'}` }
function formatCurrency(value) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0) }
function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1) }
