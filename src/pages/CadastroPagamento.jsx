import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CalendarDays, Calculator, CreditCard } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_CLASSES, MOCK_SCHOOLS, MOCK_STUDENTS } from '../data/mockData'
import {
  getReservationById,
  getReservationEvent,
  getReservationTotal,
  MOCK_RESERVATIONS
} from '../data/reservationMockData'
import {
  getPaymentById,
  PAYMENT_METHODS,
  PAYMENT_STATUSES
} from '../data/paymentMockData'

const EMPTY_FORM = {
  reservationId: '',
  totalValue: 0,
  downPayment: 0,
  downPaymentDate: '',
  downPaymentMethod: '',
  installmentCount: 1,
  firstDueDate: '',
  status: 'aberto',
  notes: ''
}

export default function CadastroPagamento() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const payment = isEdit ? getPaymentById(id) : null
    if (payment) {
      setFormData({
        reservationId: payment.reservationId,
        totalValue: payment.totalValue,
        downPayment: payment.downPayment,
        downPaymentDate: payment.downPaymentDate,
        downPaymentMethod: payment.downPaymentMethod,
        installmentCount: payment.installmentCount,
        firstDueDate: payment.installments[0]?.dueDate || '',
        status: payment.status,
        notes: payment.notes
      })
      return
    }

    const reservationId = searchParams.get('reservaId')
    if (reservationId) selectReservation(reservationId)
  }, [id, isEdit, searchParams])

  const reservation = getReservationById(formData.reservationId)
  const student = MOCK_STUDENTS.find((item) => item.id === reservation?.studentId)
  const school = MOCK_SCHOOLS.find((item) => item.id === reservation?.schoolId)
  const studentClass = MOCK_CLASSES.find((item) => item.id === reservation?.classId)
  const event = getReservationEvent(reservation?.eventId)
  const remainingValue = Math.max(0, Number(formData.totalValue) - Number(formData.downPayment || 0))
  const installmentPreview = useMemo(() => generateInstallments(
    remainingValue,
    Number(formData.installmentCount),
    formData.firstDueDate
  ), [remainingValue, formData.installmentCount, formData.firstDueDate])

  function selectReservation(reservationId) {
    const selectedReservation = getReservationById(reservationId)
    setFormData((current) => ({
      ...current,
      reservationId: selectedReservation ? selectedReservation.id : '',
      totalValue: selectedReservation ? getReservationTotal(selectedReservation) : 0
    }))
    setErrors((current) => ({ ...current, reservationId: '' }))
  }

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!formData.reservationId) nextErrors.reservationId = 'Selecione a reserva.'
    if (Number(formData.downPayment) < 0) nextErrors.downPayment = 'A entrada não pode ser negativa.'
    if (Number(formData.downPayment) > Number(formData.totalValue)) nextErrors.downPayment = 'A entrada não pode superar o valor total.'
    if (Number(formData.downPayment) > 0 && !formData.downPaymentDate) nextErrors.downPaymentDate = 'Informe a data da entrada.'
    if (Number(formData.downPayment) > 0 && !formData.downPaymentMethod) nextErrors.downPaymentMethod = 'Informe a forma de pagamento da entrada.'
    if (remainingValue > 0 && (!formData.installmentCount || Number(formData.installmentCount) > 5)) {
      nextErrors.installmentCount = 'Informe entre 1 e 5 parcelas.'
    }
    if (remainingValue > 0 && !formData.firstDueDate) nextErrors.firstDueDate = 'Informe o primeiro vencimento.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) return
    console.log('Pagamento salvo em modo mock', { ...formData, installments: installmentPreview })
    navigate(formData.reservationId ? `/pagamentos?reservaId=${formData.reservationId}` : '/pagamentos')
  }

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-5xl p-4 md:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-nirart-text">{isEdit ? 'Editar Pagamento' : 'Novo Pagamento'}</h1>
          <p className="mt-1 text-sm text-gray-600">Defina a entrada e o parcelamento da reserva.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-lg font-semibold text-nirart-text">Reserva e aluno</h2>
            <div className="mt-4">
              <Field label="Reserva" error={errors.reservationId}>
                <select
                  value={formData.reservationId}
                  onChange={(event) => selectReservation(event.target.value)}
                  className={inputClass(errors.reservationId)}
                >
                  <option value="">Selecione a reserva</option>
                  {MOCK_RESERVATIONS.map((item) => {
                    const itemStudent = MOCK_STUDENTS.find((studentEntry) => studentEntry.id === item.studentId)
                    return (
                      <option key={item.id} value={item.id}>
                        Reserva #{item.id} - {itemStudent?.fullName} - {formatCurrency(getReservationTotal(item))}
                      </option>
                    )
                  })}
                </select>
              </Field>
            </div>

            {reservation && (
              <div className="mt-5 grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <Info label="Aluno" value={student?.fullName} />
                <Info label="Escola" value={school?.fantasyName} />
                <Info label="Turma" value={studentClass?.name} />
                <Info label="Evento" value={event?.name || formatDate(reservation.eventDate)} />
              </div>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2 text-nirart-green"><Calculator size={20} /></div>
              <h2 className="text-lg font-semibold text-nirart-text">Valores do pagamento</h2>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Valor total">
                <input readOnly value={formatCurrency(formData.totalValue)} className={`${inputClass()} bg-gray-50`} />
              </Field>
              <Field label="Valor de entrada" error={errors.downPayment}>
                <input
                  type="number"
                  min="0"
                  max={formData.totalValue}
                  step="0.01"
                  value={formData.downPayment}
                  onChange={(event) => updateField('downPayment', event.target.value)}
                  className={inputClass(errors.downPayment)}
                />
              </Field>
              <Field label="Data da entrada" error={errors.downPaymentDate}>
                <input
                  type="date"
                  value={formData.downPaymentDate}
                  onChange={(event) => updateField('downPaymentDate', event.target.value)}
                  className={inputClass(errors.downPaymentDate)}
                />
              </Field>
              <Field label="Forma de pagamento da entrada" error={errors.downPaymentMethod}>
                <select
                  value={formData.downPaymentMethod}
                  onChange={(event) => updateField('downPaymentMethod', event.target.value)}
                  className={inputClass(errors.downPaymentMethod)}
                >
                  <option value="">Selecione</option>
                  {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
                </select>
              </Field>
              <Field label="Quantidade de parcelas" error={errors.installmentCount}>
                <input
                  type="number"
                  min="1"
                  max="5"
                  disabled={remainingValue === 0}
                  value={remainingValue === 0 ? 0 : formData.installmentCount}
                  onChange={(event) => updateField('installmentCount', Math.min(5, Math.max(1, Number(event.target.value) || 1)))}
                  className={`${inputClass(errors.installmentCount)} disabled:bg-gray-50`}
                />
              </Field>
              <Field label="Primeiro vencimento" error={errors.firstDueDate}>
                <input
                  type="date"
                  disabled={remainingValue === 0}
                  value={formData.firstDueDate}
                  onChange={(event) => updateField('firstDueDate', event.target.value)}
                  className={`${inputClass(errors.firstDueDate)} disabled:bg-gray-50`}
                />
              </Field>
              <Field label="Status">
                <select value={formData.status} onChange={(event) => updateField('status', event.target.value)} className={inputClass()}>
                  {PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{capitalize(status)}</option>)}
                </select>
              </Field>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FinancialCard label="Valor restante" value={formatCurrency(remainingValue)} style="bg-yellow-50 text-yellow-800" />
              <FinancialCard
                label="Valor estimado por parcela"
                value={formatCurrency(installmentPreview[0]?.value || 0)}
                style="bg-green-50 text-green-800"
              />
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-5 md:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-2 text-nirart-green"><CalendarDays size={20} /></div>
                <div>
                  <h2 className="text-lg font-semibold text-nirart-text">Prévia das parcelas</h2>
                  <p className="mt-1 text-sm text-gray-500">Os vencimentos seguintes são mensais.</p>
                </div>
              </div>
            </div>
            <InstallmentPreview installments={installmentPreview} />
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <Field label="Observação">
              <textarea
                value={formData.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                className={`${inputClass()} min-h-28`}
                placeholder="Informações importantes sobre o pagamento"
              />
            </Field>
          </section>

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => navigate('/pagamentos')}>Cancelar</Button>
            <Button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
              <CreditCard size={18} /> {isEdit ? 'Salvar Alterações' : 'Criar Pagamento'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

function InstallmentPreview({ installments }) {
  if (installments.length === 0) {
    return <p className="p-8 text-center text-sm text-gray-500">O valor foi quitado pela entrada ou os dados do parcelamento ainda não foram preenchidos.</p>
  }

  return (
    <>
      <div className="hidden md:block">
        <table className="w-full table-fixed text-left">
          <thead className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Parcela</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {installments.map((installment) => (
              <tr key={installment.number} className="border-b last:border-0">
                <td className="px-4 py-4 font-semibold text-nirart-text">{installment.number}/{installments.length}</td>
                <td className="px-4 py-4 font-semibold text-nirart-text">{formatCurrency(installment.value)}</td>
                <td className="px-4 py-4 text-gray-700">{formatDate(installment.dueDate)}</td>
                <td className="px-4 py-4"><InstallmentStatus status="pendente" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 p-3 md:hidden">
        {installments.map((installment) => (
          <article key={installment.number} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-nirart-text">Parcela {installment.number}/{installments.length}</p>
              <InstallmentStatus status="pendente" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Info label="Valor" value={formatCurrency(installment.value)} />
              <Info label="Vencimento" value={formatDate(installment.dueDate)} />
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  )
}

function FinancialCard({ label, value, style }) {
  return (
    <div className={`rounded-lg p-5 ${style}`}>
      <p className="text-sm">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-nirart-text">{value || '—'}</p>
    </div>
  )
}

function InstallmentStatus({ status }) {
  return <span className="inline-flex whitespace-nowrap rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">{capitalize(status)}</span>
}

function inputClass(error) {
  return `w-full rounded-lg border px-3 py-2 outline-none focus:ring-1 ${
    error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'
  }`
}

function generateInstallments(remainingValue, count, firstDueDate) {
  if (!remainingValue || !count || !firstDueDate) return []
  const valueInCents = Math.round(remainingValue * 100)
  const baseCents = Math.floor(valueInCents / count)
  const remainder = valueInCents - baseCents * count

  return Array.from({ length: count }, (_, index) => ({
    number: index + 1,
    value: (baseCents + (index === count - 1 ? remainder : 0)) / 100,
    dueDate: addMonths(firstDueDate, index),
    status: 'pendente'
  }))
}

function addMonths(dateValue, months) {
  const [year, month, day] = dateValue.split('-').map(Number)
  const target = new Date(Date.UTC(year, month - 1 + months, 1))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(day, lastDay))
  return target.toISOString().slice(0, 10)
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
