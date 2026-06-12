import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Banknote, CalendarCheck, CreditCard } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_SCHOOLS, MOCK_STUDENTS } from '../data/mockData'
import { getReservationById } from '../data/reservationMockData'
import {
  getInstallment,
  getPaidTotal,
  getPaymentById,
  PAYMENT_METHODS
} from '../data/paymentMockData'

export default function BaixaParcela() {
  const { id, parcelaId } = useParams()
  const navigate = useNavigate()
  const payment = getPaymentById(id)
  const installment = getInstallment(payment, parcelaId)
  const reservation = getReservationById(payment?.reservationId)
  const student = MOCK_STUDENTS.find((item) => item.id === reservation?.studentId)
  const school = MOCK_SCHOOLS.find((item) => item.id === reservation?.schoolId)
  const [formData, setFormData] = useState({
    paymentDate: '2026-06-12',
    paymentMethod: 'PIX',
    notes: ''
  })
  const [errors, setErrors] = useState({})

  if (!payment || !installment || !reservation) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Parcela não encontrada</h1>
            <p className="mt-2 text-gray-600">Selecione uma parcela pendente na página do pagamento.</p>
            <Button className="mt-6" onClick={() => navigate('/pagamentos')}>Voltar para Pagamentos</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const validate = () => {
    const nextErrors = {}
    if (!formData.paymentDate) nextErrors.paymentDate = 'Informe a data do pagamento.'
    if (!formData.paymentMethod) nextErrors.paymentMethod = 'Selecione a forma de pagamento.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) return
    console.log('Baixa registrada em modo mock', {
      paymentId: payment.id,
      installmentId: installment.id,
      ...formData
    })
    navigate(`/pagamentos/${payment.id}`, {
      state: {
        settledInstallmentId: installment.id,
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes
      }
    })
  }

  const newPaidTotal = getPaidTotal(payment) + Number(installment.value)
  const newRemainingTotal = Math.max(0, Number(payment.totalValue) - newPaidTotal)

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-3xl p-4 md:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-nirart-text">Dar Baixa na Parcela</h1>
          <p className="mt-1 text-sm text-gray-600">
            Pagamento #{payment.id} · Parcela {installment.number}/{payment.installmentCount}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2 text-nirart-green"><CreditCard size={20} /></div>
              <h2 className="text-lg font-semibold text-nirart-text">Dados da parcela</h2>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Info label="Aluno" value={student?.fullName} />
              <Info label="Escola" value={school?.fantasyName} />
              <Info label="Reserva" value={`#${payment.reservationId}`} />
              <Info label="Vencimento" value={formatDate(installment.dueDate)} />
              <Info label="Valor da parcela" value={formatCurrency(installment.value)} />
              <Info label="Status atual" value={capitalize(installment.status)} />
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2 text-nirart-green"><Banknote size={20} /></div>
              <h2 className="text-lg font-semibold text-nirart-text">Registro da baixa</h2>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Data de pagamento" error={errors.paymentDate}>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(event) => {
                    setFormData((current) => ({ ...current, paymentDate: event.target.value }))
                    setErrors((current) => ({ ...current, paymentDate: '' }))
                  }}
                  className={inputClass(errors.paymentDate)}
                />
              </Field>
              <Field label="Forma de pagamento" error={errors.paymentMethod}>
                <select
                  value={formData.paymentMethod}
                  onChange={(event) => {
                    setFormData((current) => ({ ...current, paymentMethod: event.target.value }))
                    setErrors((current) => ({ ...current, paymentMethod: '' }))
                  }}
                  className={inputClass(errors.paymentMethod)}
                >
                  <option value="">Selecione</option>
                  {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
                </select>
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Observação">
                <textarea
                  value={formData.notes}
                  onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
                  className={`${inputClass()} min-h-28`}
                  placeholder="Informações sobre a baixa"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-lg border border-green-200 bg-green-50 p-5 md:p-6">
            <div className="flex items-center gap-3">
              <CalendarCheck className="text-nirart-green" size={22} />
              <h2 className="font-semibold text-green-900">Resumo após a baixa</h2>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Info label="Valor desta baixa" value={formatCurrency(installment.value)} />
              <Info label="Novo total pago" value={formatCurrency(newPaidTotal)} />
              <Info label="Novo saldo restante" value={formatCurrency(newRemainingTotal)} />
            </div>
          </section>

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => navigate(`/pagamentos/${payment.id}`)}>Cancelar</Button>
            <Button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
              <Banknote size={18} /> Confirmar Baixa
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
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

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-nirart-text">{value || '—'}</p>
    </div>
  )
}

function inputClass(error) {
  return `w-full rounded-lg border px-3 py-2 outline-none focus:ring-1 ${
    error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'
  }`
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
