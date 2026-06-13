import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertCircle, CalendarDays, Calculator, CreditCard, LoaderCircle } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import {
  atualizarPagamento,
  buscarPagamentoPorId,
  calcularValoresFormulario,
  criarPagamento,
  gerarParcelasPreview,
  listarPagamentos,
  PAYMENT_METHODS
} from '../services/pagamentos'
import { listarReservas } from '../services/reservas'

const EMPTY_FORM = {
  reservationId: '',
  totalValue: '0.00',
  discount: '0',
  surcharge: '0',
  downPayment: '0',
  downPaymentDate: '',
  downPaymentMethod: '',
  installmentCount: 1,
  firstDueDate: '',
  paidInstallmentsValue: '0.00',
  paidInstallmentCount: 0,
  notes: ''
}

export default function CadastroPagamento() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [reservations, setReservations] = useState([])
  const [existingReservationIds, setExistingReservationIds] = useState(new Set())
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [paidInstallmentCount, setPaidInstallmentCount] = useState(0)

  useEffect(() => {
    let active = true
    const loadData = async () => {
      setLoading(true)
      try {
        const [reservationData, payments, payment] = await Promise.all([
          listarReservas(),
          listarPagamentos(),
          isEdit ? buscarPagamentoPorId(id) : Promise.resolve(null)
        ])
        if (!active) return
        setReservations(reservationData.filter((item) => item.status !== 'cancelado'))
        setExistingReservationIds(new Set(payments.filter((item) => item.id !== id).map((item) => item.reservationId)))

        if (payment) {
          const firstOpen = payment.installments.find((item) => item.status !== 'pago')
          const paidInstallments = payment.installments.filter((item) => item.status === 'pago')
          setPaidInstallmentCount(paidInstallments.length)
          setFormData({
            reservationId: payment.reservationId,
            totalValue: payment.totalValue,
            discount: payment.discount,
            surcharge: payment.surcharge,
            downPayment: payment.downPayment,
            downPaymentDate: payment.downPaymentDate,
            downPaymentMethod: payment.downPaymentMethod,
            installmentCount: payment.installmentCount,
            firstDueDate: firstOpen?.dueDate || '',
            paidInstallmentsValue: paidInstallments.reduce(
              (total, item) => total + Number(item.value),
              0
            ).toFixed(2),
            paidInstallmentCount: paidInstallments.length,
            notes: payment.notes
          })
        } else {
          const reservationId = searchParams.get('reservaId')
          if (reservationId) {
            const selected = reservationData.find((item) => item.id === reservationId)
            if (selected) setFormData((current) => ({ ...current, reservationId: selected.id, totalValue: selected.totalValue }))
          }
        }
      } catch (error) {
        if (!active) return
        if (error?.code === 'PGRST116') setNotFound(true)
        else setErrorMessage(getErrorMessage(error, 'Não foi possível carregar o pagamento.'))
      } finally {
        if (active) setLoading(false)
      }
    }
    loadData()
    return () => { active = false }
  }, [id, isEdit, searchParams])

  const reservation = reservations.find((item) => item.id === formData.reservationId)
  const values = useMemo(() => calcularValoresFormulario(formData), [formData])
  const installmentPreview = useMemo(() => gerarParcelasPreview(
    values.remainingValue,
    Math.max(0, Number(formData.installmentCount) - paidInstallmentCount),
    formData.firstDueDate
  ), [formData.firstDueDate, formData.installmentCount, paidInstallmentCount, values.remainingValue])

  const selectReservation = (reservationId) => {
    const selected = reservations.find((item) => item.id === reservationId)
    setFormData((current) => ({ ...current, reservationId: selected?.id || '', totalValue: selected?.totalValue || '0.00' }))
    setErrors((current) => ({ ...current, reservationId: '' }))
  }

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setErrorMessage('')
  }

  const validate = () => {
    const nextErrors = {}
    const finalValue = Number(values.finalValue)
    const downPayment = Number(formData.downPayment || 0)
    if (!formData.reservationId) nextErrors.reservationId = 'Selecione a reserva.'
    if (Number(formData.discount) < 0) nextErrors.discount = 'O desconto não pode ser negativo.'
    if (Number(formData.surcharge) < 0) nextErrors.surcharge = 'O acréscimo não pode ser negativo.'
    if (Number(formData.discount) > Number(formData.totalValue) + Number(formData.surcharge || 0)) nextErrors.discount = 'O desconto supera o valor permitido.'
    if (downPayment < 0 || downPayment > finalValue) nextErrors.downPayment = 'A entrada deve estar entre zero e o valor final.'
    if (downPayment > 0 && !formData.downPaymentDate) nextErrors.downPaymentDate = 'Informe a data da entrada.'
    if (downPayment > 0 && !formData.downPaymentMethod) nextErrors.downPaymentMethod = 'Informe a forma da entrada.'
    if (Number(values.remainingValue) > 0 && (Number(formData.installmentCount) < 1 || Number(formData.installmentCount) > 5)) nextErrors.installmentCount = 'Informe entre 1 e 5 parcelas.'
    if (Number(formData.installmentCount) < paidInstallmentCount) nextErrors.installmentCount = `Existem ${paidInstallmentCount} parcela(s) paga(s).`
    if (Number(values.remainingValue) > 0 && !formData.firstDueDate) nextErrors.firstDueDate = 'Informe o primeiro vencimento.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setErrorMessage('')
    try {
      const saved = isEdit ? await atualizarPagamento(id, formData) : await criarPagamento(formData)
      navigate(`/pagamentos/${saved.id}`)
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível salvar o pagamento.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />
  if (notFound) return <NotFound navigate={navigate} />

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-5xl p-4 md:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Pagamento' : 'Novo Pagamento'}</h1>
          <p className="mt-1 text-sm text-gray-600">Defina entrada, desconto, acréscimo e parcelamento.</p>
        </header>
        {errorMessage && <ErrorMessage message={errorMessage} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-lg font-semibold">Reserva e aluno</h2>
            <div className="mt-4">
              <Field label="Reserva" error={errors.reservationId}>
                <select value={formData.reservationId} disabled={isEdit} onChange={(event) => selectReservation(event.target.value)} className={inputClass(errors.reservationId)}>
                  <option value="">Selecione a reserva</option>
                  {reservations.map((item) => (
                    <option key={item.id} value={item.id} disabled={existingReservationIds.has(item.id)}>
                      Reserva #{shortId(item.id)} - {item.student?.fullName} - {formatCurrency(item.totalValue)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {reservation && (
              <div className="mt-5 grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <Info label="Aluno" value={reservation.student?.fullName} />
                <Info label="Escola" value={reservation.school?.fantasyName || 'Aluno avulso'} />
                <Info label="Turma" value={reservation.studentClass?.name || 'Sem turma'} />
                <Info label="Evento" value={formatDateBR(reservation.eventDate)} />
              </div>
            )}
          </section>

          <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center gap-3"><div className="rounded-lg bg-green-50 p-2 text-nirart-green"><Calculator size={20} /></div><h2 className="text-lg font-semibold">Valores do pagamento</h2></div>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Valor da reserva"><input readOnly value={formatCurrency(formData.totalValue)} className={`${inputClass()} bg-gray-50`} /></Field>
              <MoneyField label="Desconto" field="discount" value={formData.discount} error={errors.discount} updateField={updateField} />
              <MoneyField label="Acréscimo" field="surcharge" value={formData.surcharge} error={errors.surcharge} updateField={updateField} />
              <MoneyField label="Valor de entrada" field="downPayment" value={formData.downPayment} error={errors.downPayment} updateField={updateField} />
              <Field label="Data da entrada" error={errors.downPaymentDate}><input type="date" value={formData.downPaymentDate} onChange={(event) => updateField('downPaymentDate', event.target.value)} className={inputClass(errors.downPaymentDate)} /></Field>
              <Field label="Forma de pagamento da entrada" error={errors.downPaymentMethod}>
                <select value={formData.downPaymentMethod} onChange={(event) => updateField('downPaymentMethod', event.target.value)} className={inputClass(errors.downPaymentMethod)}>
                  <option value="">Selecione</option>{PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}
                </select>
              </Field>
              <Field label="Quantidade de parcelas" error={errors.installmentCount}><input type="number" min="0" max="5" value={formData.installmentCount} onChange={(event) => updateField('installmentCount', Math.min(5, Math.max(0, Number(event.target.value) || 0)))} className={inputClass(errors.installmentCount)} /></Field>
              <Field label="Primeiro vencimento" error={errors.firstDueDate}><input type="date" disabled={Number(values.remainingValue) === 0} value={formData.firstDueDate} onChange={(event) => updateField('firstDueDate', event.target.value)} className={`${inputClass(errors.firstDueDate)} disabled:bg-gray-50`} /></Field>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FinancialCard label="Valor final" value={formatCurrency(values.finalValue)} style="bg-blue-50 text-blue-800" />
              <FinancialCard label="Valor restante" value={formatCurrency(values.remainingValue)} style="bg-yellow-50 text-yellow-800" />
              <FinancialCard label="Valor estimado por parcela" value={formatCurrency(installmentPreview[0]?.value || 0)} style="bg-green-50 text-green-800" />
            </div>
          </section>

          <section className="rounded-lg border bg-white shadow-sm">
            <div className="border-b p-5 md:p-6"><div className="flex items-center gap-3"><CalendarDays className="text-nirart-green" /><div><h2 className="text-lg font-semibold">Prévia das parcelas</h2><p className="text-sm text-gray-500">Os vencimentos seguintes são mensais.</p></div></div></div>
            <InstallmentPreview installments={installmentPreview} />
          </section>

          <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6">
            <Field label="Observação"><textarea value={formData.notes} onChange={(event) => updateField('notes', event.target.value)} className={`${inputClass()} min-h-28`} /></Field>
          </section>

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Button type="button" variant="outline" disabled={submitting} onClick={() => navigate('/pagamentos')}>Cancelar</Button>
            <Button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
              {submitting ? <LoaderCircle className="animate-spin" size={18} /> : <CreditCard size={18} />}
              {submitting ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Pagamento'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

function InstallmentPreview({ installments }) {
  if (!installments.length) return <p className="p-8 text-center text-sm text-gray-500">Sem parcelas abertas.</p>
  return <div className="divide-y">{installments.map((item) => <div key={item.number} className="grid grid-cols-3 gap-3 p-4 text-sm"><Info label="Parcela" value={item.number} /><Info label="Valor" value={formatCurrency(item.value)} /><Info label="Vencimento" value={formatDateBR(item.dueDate)} /></div>)}</div>
}

function MoneyField({ label, field, value, error, updateField }) { return <Field label={label} error={error}><input type="number" min="0" step="0.01" value={value} onChange={(event) => updateField(field, event.target.value)} className={inputClass(error)} /></Field> }
function Field({ label, error, children }) { return <label className="block"><span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>{children}{error && <span className="mt-1 block text-sm text-red-600">{error}</span>}</label> }
function FinancialCard({ label, value, style }) { return <div className={`rounded-lg p-5 ${style}`}><p className="text-sm">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div> }
function Info({ label, value }) { return <div className="min-w-0"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 break-words font-semibold">{value || '—'}</p></div> }
function inputClass(error) { return `w-full rounded-lg border px-3 py-2 outline-none focus:ring-1 ${error ? 'border-red-500' : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'}` }
function Loading() { return <MainLayout><div className="flex min-h-80 items-center justify-center gap-3"><LoaderCircle className="animate-spin" /> Carregando pagamento...</div></MainLayout> }
function NotFound({ navigate }) { return <MainLayout><div className="p-8 text-center"><h1 className="text-2xl font-bold">Pagamento não encontrado</h1><Button className="mt-6" onClick={() => navigate('/pagamentos')}>Voltar</Button></div></MainLayout> }
function ErrorMessage({ message }) { return <div className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle size={18} /><span>{message}</span></div> }
function formatDateBR(value) { if (!value) return '—'; const [year, month, day] = value.split('-'); return `${day}/${month}/${year}` }
function formatCurrency(value) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0)) }
function shortId(value) { return String(value).slice(0, 8).toUpperCase() }
function getErrorMessage(error, fallback) { return error?.message ? `${fallback} ${error.message}` : fallback }
