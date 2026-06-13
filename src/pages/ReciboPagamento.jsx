import { useEffect, useState } from 'react'
import { ArrowLeft, LoaderCircle, Printer } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  buscarPagamentoPorId,
  getPaidTotal,
  getPaymentStatus,
  getRemainingTotal
} from '../services/pagamentos'

export default function ReciboPagamento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true
    buscarPagamentoPorId(id)
      .then((data) => {
        if (active) setPayment(data)
      })
      .catch((error) => {
        if (active) setErrorMessage(error?.message || 'Não foi possível carregar o recibo.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="receipt-page flex min-h-screen items-center justify-center bg-gray-100">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <LoaderCircle className="animate-spin" size={20} /> Carregando recibo...
        </div>
      </div>
    )
  }

  if (!payment?.reservation || errorMessage) {
    return (
      <div className="receipt-page flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <h1 className="text-xl font-bold text-gray-900">Recibo não encontrado</h1>
          <p className="mt-2 text-gray-600">{errorMessage || 'O pagamento informado não existe.'}</p>
          <button type="button" onClick={() => navigate('/pagamentos')} className="mt-6 rounded-lg bg-nirart-green px-4 py-2 font-semibold text-white">
            Voltar para Pagamentos
          </button>
        </div>
      </div>
    )
  }

  const reservation = payment.reservation
  const student = reservation.student
  const transaction = getLatestPaidTransaction(payment)
  const paidTotal = getPaidTotal(payment)
  const remainingTotal = getRemainingTotal(payment)

  return (
    <div className="receipt-page min-h-screen bg-gray-100 px-4 py-8 text-gray-900 print:bg-white print:p-0">
      <div className="receipt-toolbar mx-auto mb-4 flex w-full max-w-[210mm] items-center justify-between gap-3">
        <button type="button" onClick={() => navigate(`/pagamentos/${payment.id}`)} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700">
          <ArrowLeft size={17} /> Voltar
        </button>
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-nirart-green px-4 py-2 text-sm font-semibold text-white">
          <Printer size={17} /> Imprimir / Gerar PDF
        </button>
      </div>

      <main className="receipt-document mx-auto min-h-[277mm] w-full max-w-[210mm] bg-white p-8 shadow-lg md:p-12 print:min-h-0 print:max-w-none print:p-0 print:shadow-none">
        <header className="border-b-2 border-gray-900 pb-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xl font-bold uppercase tracking-[0.18em] text-nirart-green">Nirart Maison</p>
              <h1 className="mt-2 text-3xl font-bold text-gray-950">Recibo de Pagamento</h1>
            </div>
            <div className="text-right text-sm">
              <p><span className="font-semibold">Recibo:</span> {receiptNumber(payment.id)}</p>
              <p className="mt-1"><span className="font-semibold">Emissão:</span> {formatDateBR(getLocalDateString())}</p>
            </div>
          </div>
        </header>

        <ReceiptSection title="Dados do cliente">
          <ReceiptGrid>
            <ReceiptField label="Aluno" value={student?.fullName} />
            <ReceiptField label="Responsável / cliente" value={student?.guardianName || student?.fullName} />
            <ReceiptField label="Escola" value={reservation.school?.fantasyName || 'Aluno avulso'} />
            <ReceiptField label="Turma" value={reservation.studentClass?.name || 'Sem turma'} />
            <ReceiptField label="Reserva" value={`#${shortId(payment.reservationId)}`} />
          </ReceiptGrid>
        </ReceiptSection>

        <ReceiptSection title="Dados do pagamento">
          <ReceiptGrid>
            <ReceiptField label="Valor total da reserva" value={formatCurrency(payment.totalValue)} />
            <ReceiptField label="Valor final" value={formatCurrency(payment.finalValue)} />
            <ReceiptField label="Valor pago" value={formatCurrency(paidTotal)} highlight />
            <ReceiptField label="Valor restante" value={formatCurrency(remainingTotal)} />
            <ReceiptField label="Forma de pagamento" value={transaction.method || 'Não informada'} />
            <ReceiptField label="Data do pagamento" value={formatDateBR(transaction.date)} />
            <ReceiptField label="Parcela paga" value={transaction.installmentLabel} />
            <ReceiptField label="Status" value={capitalize(getPaymentStatus(payment))} />
          </ReceiptGrid>
        </ReceiptSection>

        <ReceiptSection title="Descrição">
          <p className="leading-7 text-gray-800">
            Referente à locação de traje e/ou itens para evento em {formatDateBR(reservation.eventDate)},
            vinculada à reserva #{shortId(payment.reservationId)}.
          </p>
        </ReceiptSection>

        <ReceiptSection title="Observações">
          <p className="min-h-16 whitespace-pre-wrap leading-7 text-gray-700">
            {transaction.notes || payment.notes || 'Sem observações.'}
          </p>
        </ReceiptSection>

        <footer className="mt-20 grid grid-cols-1 gap-16 pt-8 sm:grid-cols-2">
          <Signature label="Nirart Maison" />
          <Signature label="Responsável" />
        </footer>
      </main>
    </div>
  )
}

function ReceiptSection({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="border-b border-gray-300 pb-2 text-sm font-bold uppercase tracking-wider text-gray-700">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function ReceiptGrid({ children }) {
  return <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">{children}</div>
}

function ReceiptField({ label, value, highlight = false }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 break-words text-base ${highlight ? 'text-lg font-bold text-nirart-green' : 'font-semibold text-gray-900'}`}>
        {value || '—'}
      </p>
    </div>
  )
}

function Signature({ label }) {
  return (
    <div className="pt-12 text-center">
      <div className="border-t border-gray-900 pt-2 text-sm font-semibold">{label}</div>
    </div>
  )
}

function getLatestPaidTransaction(payment) {
  const paidInstallments = payment.installments
    .filter((item) => item.status === 'pago')
    .sort((first, second) => (
      `${second.paymentDate}-${second.number}`.localeCompare(`${first.paymentDate}-${first.number}`)
    ))

  if (paidInstallments.length) {
    const installment = paidInstallments[0]
    return {
      method: installment.paymentMethod,
      date: installment.paymentDate,
      installmentLabel: `${installment.number}/${payment.installmentCount}`,
      notes: installment.notes
    }
  }

  return {
    method: payment.downPaymentMethod,
    date: payment.downPaymentDate,
    installmentLabel: Number(payment.downPayment) > 0 ? 'Entrada' : 'Não se aplica',
    notes: payment.notes
  }
}

function receiptNumber(id) {
  return `REC-${shortId(id)}`
}

function getLocalDateString() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

function formatDateBR(value) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0))
}

function capitalize(value = '') {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function shortId(value) {
  return String(value).slice(0, 8).toUpperCase()
}
