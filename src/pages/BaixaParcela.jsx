import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Banknote, CalendarCheck, CreditCard, LoaderCircle } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import {
  buscarPagamentoPorId,
  darBaixaParcela,
  getPaidTotal,
  getRemainingTotal,
  PAYMENT_METHODS
} from '../services/pagamentos'

export default function BaixaParcela() {
  const { id, parcelaId } = useParams()
  const navigate = useNavigate()
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({ paymentDate: getLocalDateString(), paymentMethod: 'PIX', notes: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let active = true
    buscarPagamentoPorId(id)
      .then((data) => { if (active) setPayment(data) })
      .catch((error) => {
        if (!active) return
        if (error?.code === 'PGRST116') setNotFound(true)
        else setErrorMessage(getErrorMessage(error, 'Não foi possível carregar a parcela.'))
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  if (loading) return <MainLayout><div className="flex min-h-80 items-center justify-center gap-3"><LoaderCircle className="animate-spin" /> Carregando parcela...</div></MainLayout>
  const installment = payment?.installments.find((item) => item.id === parcelaId)
  if (notFound || !payment || !installment || !['pendente', 'vencido'].includes(installment.displayStatus)) return <NotFound navigate={navigate} />

  const validate = () => {
    const next = {}
    if (!formData.paymentDate) next.paymentDate = 'Informe a data do pagamento.'
    if (!formData.paymentMethod) next.paymentMethod = 'Selecione a forma de pagamento.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setErrorMessage('')
    try {
      await darBaixaParcela(payment.id, installment.id, formData)
      navigate(`/pagamentos/${payment.id}`)
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível registrar a baixa.'))
    } finally {
      setSubmitting(false)
    }
  }

  const newPaidTotal = Number(getPaidTotal(payment)) + Number(installment.value)
  const newRemainingTotal = Math.max(0, Number(payment.finalValue) - newPaidTotal)

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-3xl p-4 md:p-8">
        <header className="mb-6"><h1 className="text-2xl font-bold">Dar Baixa na Parcela</h1><p className="mt-1 text-sm text-gray-600">Pagamento #{shortId(payment.id)} · Parcela {installment.number}/{payment.installmentCount}</p></header>
        {errorMessage && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{errorMessage}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center gap-3"><CreditCard className="text-nirart-green" /><h2 className="text-lg font-semibold">Dados da parcela</h2></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Info label="Aluno" value={payment.reservation?.student?.fullName} />
              <Info label="Escola" value={payment.reservation?.school?.fantasyName || 'Aluno avulso'} />
              <Info label="Reserva" value={`#${shortId(payment.reservationId)}`} />
              <Info label="Vencimento" value={formatDateBR(installment.dueDate)} />
              <Info label="Valor da parcela" value={formatCurrency(installment.value)} />
              <Info label="Status atual" value={capitalize(installment.displayStatus)} />
            </div>
          </section>
          <section className="rounded-lg border bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center gap-3"><Banknote className="text-nirart-green" /><h2 className="text-lg font-semibold">Registro da baixa</h2></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Data de pagamento" error={errors.paymentDate}><input type="date" value={formData.paymentDate} onChange={(event) => setFormData((current) => ({ ...current, paymentDate: event.target.value }))} className={inputClass(errors.paymentDate)} /></Field>
              <Field label="Forma de pagamento" error={errors.paymentMethod}><select value={formData.paymentMethod} onChange={(event) => setFormData((current) => ({ ...current, paymentMethod: event.target.value }))} className={inputClass(errors.paymentMethod)}>{PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}</select></Field>
            </div>
            <Field label="Observação"><textarea value={formData.notes} onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))} className={`${inputClass()} mt-4 min-h-28`} /></Field>
          </section>
          <section className="rounded-lg border border-green-200 bg-green-50 p-5 md:p-6">
            <div className="flex items-center gap-3"><CalendarCheck className="text-nirart-green" /><h2 className="font-semibold text-green-900">Resumo após a baixa</h2></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3"><Info label="Valor desta baixa" value={formatCurrency(installment.value)} /><Info label="Novo total pago" value={formatCurrency(newPaidTotal)} /><Info label="Novo saldo restante" value={formatCurrency(newRemainingTotal)} /></div>
          </section>
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row"><Button type="button" variant="outline" disabled={submitting} onClick={() => navigate(`/pagamentos/${payment.id}`)}>Cancelar</Button><Button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2">{submitting ? <LoaderCircle className="animate-spin" size={18} /> : <Banknote size={18} />}{submitting ? 'Salvando...' : 'Confirmar Baixa'}</Button></div>
        </form>
      </div>
    </MainLayout>
  )
}

function Field({ label, error, children }) { return <label className="block"><span className="mb-1 block text-sm font-medium">{label}</span>{children}{error && <span className="mt-1 block text-sm text-red-600">{error}</span>}</label> }
function Info({ label, value }) { return <div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 break-words font-semibold">{value || '—'}</p></div> }
function inputClass(error) { return `w-full rounded-lg border px-3 py-2 outline-none ${error ? 'border-red-500' : 'border-gray-300 focus:border-nirart-green'}` }
function NotFound({ navigate }) { return <MainLayout><div className="p-8 text-center"><h1 className="text-2xl font-bold">Parcela não encontrada</h1><Button className="mt-6" onClick={() => navigate('/pagamentos')}>Voltar</Button></div></MainLayout> }
function getLocalDateString() { const today = new Date(); return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}` }
function formatDateBR(value) { if (!value) return '—'; const [year, month, day] = value.split('-'); return `${day}/${month}/${year}` }
function formatCurrency(value) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0)) }
function capitalize(value = '') { return value.charAt(0).toUpperCase() + value.slice(1) }
function shortId(value) { return String(value).slice(0, 8).toUpperCase() }
function getErrorMessage(error, fallback) { return error?.message ? `${fallback} ${error.message}` : fallback }
