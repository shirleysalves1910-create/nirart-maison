import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Banknote,
  CalendarClock,
  CreditCard,
  Edit2,
  Printer,
  ReceiptText,
  UserRound,
  WalletCards
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_CLASSES, MOCK_SCHOOLS, MOCK_STUDENTS } from '../data/mockData'
import {
  getReservationById,
  getReservationEvent
} from '../data/reservationMockData'
import {
  getNextDueInstallment,
  getPaidTotal,
  getPaymentById,
  getPaymentStatus,
  getRemainingTotal
} from '../data/paymentMockData'

export default function DetalhesPagamento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const showReceipt = searchParams.get('recibo') === '1'
  const storedPayment = getPaymentById(id)
  const payment = applySettledInstallment(storedPayment, location.state)
  const reservation = getReservationById(payment?.reservationId)
  const student = MOCK_STUDENTS.find((item) => item.id === reservation?.studentId)
  const school = MOCK_SCHOOLS.find((item) => item.id === reservation?.schoolId)
  const studentClass = MOCK_CLASSES.find((item) => item.id === reservation?.classId)
  const event = getReservationEvent(reservation?.eventId)
  const nextDue = getNextDueInstallment(payment)

  if (!payment || !reservation || !student) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Pagamento não encontrado</h1>
            <p className="mt-2 text-gray-600">Selecione um pagamento válido na listagem.</p>
            <Button className="mt-6" onClick={() => navigate('/pagamentos')}>Voltar para Pagamentos</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const paidTotal = getPaidTotal(payment)
  const remainingTotal = getRemainingTotal(payment)
  const nextInstallment = getNextDueInstallment(payment)

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-7xl space-y-6 p-4 md:p-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-nirart-text md:text-3xl">Pagamento #{payment.id}</h1>
              <PaymentStatus status={getPaymentStatus(payment)} />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Reserva #{payment.reservationId} · {student.fullName}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <Button variant="outline" onClick={() => navigate('/pagamentos')} className="whitespace-nowrap">Voltar</Button>
            <Button variant="outline" onClick={() => navigate(`/cadastro-pagamento/${payment.id}`)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
              <Edit2 size={17} /> Editar
            </Button>
            <Button
              variant="outline"
              disabled={!nextInstallment || getPaymentStatus(payment) === 'cancelado'}
              onClick={() => navigate(`/pagamentos/${payment.id}/baixa/${nextInstallment?.id}`)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Banknote size={17} /> Dar baixa
            </Button>
            <Button
              disabled={paidTotal === 0}
              onClick={() => navigate(`/pagamentos/${payment.id}?recibo=1`)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <ReceiptText size={17} /> Recibo
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Valor total" value={formatCurrency(payment.totalValue)} icon={CreditCard} />
          <SummaryCard label="Total pago" value={formatCurrency(paidTotal)} icon={Banknote} valueClassName="text-green-700" />
          <SummaryCard label="Total a receber" value={formatCurrency(remainingTotal)} icon={WalletCards} valueClassName="text-yellow-700" />
          <SummaryCard label="Próximo vencimento" value={nextDue ? formatDate(nextDue.dueDate) : 'Sem pendências'} icon={CalendarClock} />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <SectionTitle icon={UserRound} title="Cliente e reserva" />
            <div className="mt-5 space-y-4">
              <Info label="Aluno" value={student.fullName} />
              <Info label="Escola" value={school?.fantasyName} />
              <Info label="Turma" value={studentClass?.name} />
              <Info label="Reserva" value={`#${payment.reservationId}`} />
              <Info label="Evento" value={event?.name} />
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6 xl:col-span-2">
            <SectionTitle icon={CreditCard} title="Dados do pagamento" />
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Valor total" value={formatCurrency(payment.totalValue)} />
              <Info label="Valor de entrada" value={formatCurrency(payment.downPayment)} />
              <Info label="Data da entrada" value={formatDate(payment.downPaymentDate)} />
              <Info label="Forma da entrada" value={payment.downPaymentMethod || '—'} />
              <Info label="Quantidade de parcelas" value={payment.installmentCount} />
              <Info label="Status" value={<PaymentStatus status={getPaymentStatus(payment)} />} />
              <Info label="Observação" value={payment.notes || 'Sem observações.'} className="sm:col-span-2 lg:col-span-3" />
              {payment.cancellationReason && (
                <Info label="Motivo do cancelamento" value={payment.cancellationReason} className="sm:col-span-2 lg:col-span-3" />
              )}
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5 md:p-6">
            <SectionTitle icon={CalendarClock} title="Parcelas" />
          </div>
          <Installments payment={payment} navigate={navigate} />
        </section>

        {showReceipt && (
          <Receipt
            payment={payment}
            student={student}
            school={school}
            event={event}
            paidTotal={paidTotal}
          />
        )}
      </div>
    </MainLayout>
  )
}

function Installments({ payment, navigate }) {
  return (
    <>
      <div className="hidden lg:block">
        <table className="w-full table-fixed text-left">
          <thead className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Parcela</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">Pagamento</th>
              <th className="px-4 py-3">Forma</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ação</th>
            </tr>
          </thead>
          <tbody>
            {payment.installments.map((installment) => (
              <tr key={installment.id} className="border-b last:border-0">
                <td className="px-4 py-4 font-semibold text-nirart-text">{installment.number}/{payment.installmentCount}</td>
                <td className="px-4 py-4 font-semibold text-nirart-text">{formatCurrency(installment.value)}</td>
                <td className="px-4 py-4 text-gray-700">{formatDate(installment.dueDate)}</td>
                <td className="px-4 py-4 text-gray-700">{formatDate(installment.paymentDate)}</td>
                <td className="break-words px-4 py-4 text-gray-700">{installment.paymentMethod || '—'}</td>
                <td className="px-4 py-4"><InstallmentStatus status={installment.status} /></td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    disabled={!['pendente', 'vencido'].includes(installment.status) || payment.status === 'cancelado'}
                    onClick={() => navigate(`/pagamentos/${payment.id}/baixa/${installment.id}`)}
                    className="inline-flex whitespace-nowrap rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-nirart-green hover:text-nirart-green disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Dar baixa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 lg:hidden">
        {payment.installments.map((installment) => (
          <article key={installment.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-nirart-text">Parcela {installment.number}/{payment.installmentCount}</p>
              <InstallmentStatus status={installment.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="Valor" value={formatCurrency(installment.value)} />
              <Info label="Vencimento" value={formatDate(installment.dueDate)} />
              <Info label="Data de pagamento" value={formatDate(installment.paymentDate)} />
              <Info label="Forma" value={installment.paymentMethod || '—'} />
              {installment.notes && <Info label="Observação" value={installment.notes} className="col-span-2" />}
            </div>
            {['pendente', 'vencido'].includes(installment.status) && payment.status !== 'cancelado' && (
              <Button
                className="mt-4 w-full whitespace-nowrap"
                onClick={() => navigate(`/pagamentos/${payment.id}/baixa/${installment.id}`)}
              >
                Dar baixa na parcela
              </Button>
            )}
          </article>
        ))}
      </div>
    </>
  )
}

function Receipt({ payment, student, school, event, paidTotal }) {
  return (
    <section className="rounded-lg border-2 border-nirart-green bg-white p-5 shadow-sm md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-nirart-green">Nirart Maison</p>
          <h2 className="mt-1 text-2xl font-bold text-nirart-text">Recibo de Pagamento</h2>
          <p className="mt-1 text-sm text-gray-500">Pagamento #{payment.id} · Reserva #{payment.reservationId}</p>
        </div>
        <Button variant="outline" onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
          <Printer size={17} /> Imprimir
        </Button>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-5 sm:grid-cols-2">
        <Info label="Recebemos de" value={student.fullName} />
        <Info label="Escola" value={school?.fantasyName} />
        <Info label="Referente a" value={event?.name || `Reserva #${payment.reservationId}`} />
        <Info label="Valor recebido" value={formatCurrency(paidTotal)} />
        <Info label="Data de emissão" value="12/06/2026" />
        <Info label="Situação" value={capitalize(getPaymentStatus(payment))} />
      </div>
      <p className="mt-6 text-sm text-gray-600">
        Comprovante emitido em modo demonstrativo. Os dados permanecem apenas na aplicação local.
      </p>
    </section>
  )
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-green-50 p-2 text-nirart-green"><Icon size={20} /></div>
      <h2 className="text-lg font-semibold text-nirart-text">{title}</h2>
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, valueClassName = 'text-nirart-text' }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="inline-flex rounded-lg bg-green-50 p-2 text-nirart-green"><Icon size={20} /></div>
      <p className="mt-3 text-sm text-gray-500">{label}</p>
      <p className={`mt-1 break-words text-xl font-bold ${valueClassName}`}>{value}</p>
    </div>
  )
}

function Info({ label, value, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <div className="mt-1 break-words font-semibold text-nirart-text">{value || '—'}</div>
    </div>
  )
}

function PaymentStatus({ status }) {
  const styles = {
    aberto: 'bg-yellow-100 text-yellow-800',
    parcial: 'bg-blue-100 text-blue-800',
    quitado: 'bg-green-100 text-green-800',
    cancelado: 'bg-red-100 text-red-800'
  }
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>{capitalize(status)}</span>
}

function InstallmentStatus({ status }) {
  const styles = {
    pendente: 'bg-yellow-100 text-yellow-800',
    pago: 'bg-green-100 text-green-800',
    vencido: 'bg-red-100 text-red-800',
    cancelado: 'bg-gray-100 text-gray-700'
  }
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>{capitalize(status)}</span>
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

function applySettledInstallment(payment, state) {
  if (!payment || !state?.settledInstallmentId) return payment
  return {
    ...payment,
    installments: payment.installments.map((installment) => (
      String(installment.id) === String(state.settledInstallmentId)
        ? {
            ...installment,
            status: 'pago',
            paymentDate: state.paymentDate,
            paymentMethod: state.paymentMethod,
            notes: state.notes
          }
        : installment
    ))
  }
}
