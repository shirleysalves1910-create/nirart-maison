import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  Banknote,
  CalendarClock,
  CreditCard,
  Edit2,
  Eye,
  MoreHorizontal,
  ReceiptText,
  Search,
  WalletCards,
  XCircle
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_CLASSES, MOCK_SCHOOLS, MOCK_STUDENTS } from '../data/mockData'
import { getReservationById, getReservationEvent } from '../data/reservationMockData'
import {
  getNextDueInstallment,
  getPaidTotal,
  getPaymentStatus,
  getRemainingTotal,
  MOCK_PAYMENTS,
  PAYMENT_STATUSES
} from '../data/paymentMockData'

export default function Pagamentos() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialReservationId = searchParams.get('reservaId') || ''
  const [payments, setPayments] = useState(MOCK_PAYMENTS)
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState('')
  const [reservationId, setReservationId] = useState(initialReservationId)
  const [mobileActionId, setMobileActionId] = useState(null)
  const [cancelPayment, setCancelPayment] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  const filteredPayments = payments.filter((payment) => {
    const context = getPaymentContext(payment)
    const searchable = [
      context.student?.fullName,
      context.school?.fantasyName,
      context.studentClass?.name,
      context.event?.name,
      `reserva ${payment.reservationId}`
    ].join(' ').toLowerCase()

    return (
      searchable.includes(searchTerm.toLowerCase()) &&
      (!status || getPaymentStatus(payment) === status) &&
      (!reservationId || String(payment.reservationId) === String(reservationId))
    )
  })

  const metrics = useMemo(() => ({
    received: payments.reduce((total, payment) => total + getPaidTotal(payment), 0),
    receivable: payments.reduce((total, payment) => total + getRemainingTotal(payment), 0),
    overdue: payments.reduce((total, payment) => (
      total + payment.installments.filter((installment) => installment.status === 'vencido').length
    ), 0),
    upcoming: payments.reduce((total, payment) => (
      total + payment.installments.filter((installment) => installment.status === 'pendente').length
    ), 0)
  }), [payments])
  const dueOverview = useMemo(() => getDueOverview(payments), [payments])

  const actions = {
    view: (payment) => navigate(`/pagamentos/${payment.id}`),
    edit: (payment) => navigate(`/cadastro-pagamento/${payment.id}`),
    settle: (payment) => {
      const nextInstallment = getNextDueInstallment(payment)
      if (nextInstallment) navigate(`/pagamentos/${payment.id}/baixa/${nextInstallment.id}`)
    },
    cancel: (payment) => {
      setCancelPayment(payment)
      setCancelReason('')
    },
    receipt: (payment) => navigate(`/pagamentos/${payment.id}?recibo=1`)
  }

  const confirmCancellation = () => {
    if (!cancelReason.trim()) return
    setPayments((current) => current.map((payment) => (
      payment.id === cancelPayment.id
        ? {
            ...payment,
            status: 'cancelado',
            cancellationReason: cancelReason,
            installments: payment.installments.map((installment) => (
              installment.status === 'pago' ? installment : { ...installment, status: 'cancelado' }
            ))
          }
        : payment
    )))
    setCancelPayment(null)
    setCancelReason('')
  }

  const clearReservationFilter = () => {
    setReservationId('')
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('reservaId')
    setSearchParams(nextParams)
  }

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-7xl space-y-6 p-4 md:p-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-nirart-text">Pagamentos</h1>
            <p className="mt-1 text-sm text-gray-600">Controle entradas, parcelas, baixas e recebimentos.</p>
          </div>
          <Button
            onClick={() => navigate(reservationId ? `/cadastro-pagamento?reservaId=${reservationId}` : '/cadastro-pagamento')}
            className="whitespace-nowrap"
          >
            Novo Pagamento
          </Button>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Total pago" value={formatCurrency(metrics.received)} icon={Banknote} style="bg-green-50 text-nirart-green" />
          <Metric label="Total a receber" value={formatCurrency(metrics.receivable)} icon={WalletCards} style="bg-yellow-50 text-yellow-700" />
          <Metric label="Parcelas vencidas" value={metrics.overdue} icon={AlertCircle} style="bg-red-50 text-nirart-wine" />
          <Metric label="Parcelas a vencer" value={metrics.upcoming} icon={CalendarClock} style="bg-blue-50 text-blue-600" />
        </section>

        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 md:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por aluno, escola, turma ou reserva..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 outline-none focus:border-nirart-green focus:ring-1 focus:ring-nirart-green"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <select
              value={reservationId}
              onChange={(event) => setReservationId(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Todas as reservas</option>
              {MOCK_PAYMENTS.map((payment) => {
                const context = getPaymentContext(payment)
                return (
                  <option key={payment.id} value={payment.reservationId}>
                    Reserva #{payment.reservationId} - {context.student?.fullName}
                  </option>
                )
              })}
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Todos os status</option>
              {PAYMENT_STATUSES.map((item) => <option key={item} value={item}>{capitalize(item)}</option>)}
            </select>
          </div>
          {initialReservationId && reservationId && (
            <div className="flex flex-col gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 sm:flex-row sm:items-center sm:justify-between">
              <span>Exibindo o pagamento da reserva <strong>#{reservationId}</strong>.</span>
              <button type="button" onClick={clearReservationFilter} className="self-start whitespace-nowrap font-semibold hover:underline sm:self-auto">
                Limpar filtro
              </button>
            </div>
          )}
        </section>

        <DueOverview overdue={dueOverview.overdue} upcoming={dueOverview.upcoming} navigate={navigate} />

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="mx-auto mb-4 text-gray-400" size={46} />
              <p className="font-medium text-gray-700">Nenhum pagamento encontrado</p>
              <p className="mt-1 text-sm text-gray-500">Ajuste os filtros ou cadastre um novo pagamento.</p>
            </div>
          ) : (
            <>
              <DesktopTable payments={filteredPayments} actions={actions} />
              <MobileCards
                payments={filteredPayments}
                actions={actions}
                openActionId={mobileActionId}
                onToggleActions={(id) => setMobileActionId((current) => current === id ? null : id)}
                onCloseActions={() => setMobileActionId(null)}
              />
            </>
          )}
        </section>
      </div>

      {cancelPayment && (
        <CancellationModal
          payment={cancelPayment}
          reason={cancelReason}
          onReasonChange={setCancelReason}
          onClose={() => setCancelPayment(null)}
          onConfirm={confirmCancellation}
        />
      )}
    </MainLayout>
  )
}

function DueOverview({ overdue, upcoming, navigate }) {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <DueList
        title="Pagamentos vencidos"
        emptyText="Nenhuma parcela vencida."
        entries={overdue}
        color="red"
        navigate={navigate}
      />
      <DueList
        title="Pagamentos a vencer"
        emptyText="Nenhuma parcela pendente."
        entries={upcoming}
        color="blue"
        navigate={navigate}
      />
    </section>
  )
}

function DueList({ title, emptyText, entries, color, navigate }) {
  const styles = color === 'red'
    ? 'border-red-200 bg-red-50 text-red-800'
    : 'border-blue-200 bg-blue-50 text-blue-800'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-nirart-text">{title}</h2>
      {entries.length === 0 ? (
        <p className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">{emptyText}</p>
      ) : (
        <div className="mt-4 space-y-2">
          {entries.slice(0, 4).map((entry) => (
            <button
              key={`${entry.payment.id}-${entry.installment.id}`}
              type="button"
              onClick={() => navigate(`/pagamentos/${entry.payment.id}`)}
              className={`flex w-full min-w-0 items-center justify-between gap-3 rounded-lg border p-3 text-left ${styles}`}
            >
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold">{entry.student?.fullName}</p>
                <p className="mt-1 text-xs">Reserva #{entry.payment.reservationId} · Parcela {entry.installment.number}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold">{formatCurrency(entry.installment.value)}</p>
                <p className="mt-1 whitespace-nowrap text-xs">{formatDate(entry.installment.dueDate)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function DesktopTable({ payments, actions }) {
  return (
    <div className="hidden xl:block">
      <table className="w-full table-fixed text-left">
        <colgroup>
          <col className="w-[16%]" />
          <col className="w-[15%]" />
          <col className="w-[12%]" />
          <col className="w-[11%]" />
          <col className="w-[11%]" />
          <col className="w-[11%]" />
          <col className="w-[10%]" />
          <col className="w-[8%]" />
          <col className="w-[6%]" />
        </colgroup>
        <thead className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
          <tr>
            <th className="px-3 py-3">Cliente / Aluno</th>
            <th className="px-3 py-3">Escola</th>
            <th className="px-3 py-3">Reserva</th>
            <th className="px-3 py-3">Valor total</th>
            <th className="px-3 py-3">Total pago</th>
            <th className="px-3 py-3">Restante</th>
            <th className="px-3 py-3">Próximo vencimento</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-2 py-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => {
            const context = getPaymentContext(payment)
            const nextDue = getNextDueInstallment(payment)
            return (
              <tr key={payment.id} className="border-b align-top hover:bg-gray-50">
                <td className="break-words px-3 py-4 text-sm font-semibold text-nirart-text">{context.student?.fullName}</td>
                <td className="break-words px-3 py-4 text-sm text-gray-700">{context.school?.fantasyName}</td>
                <td className="px-3 py-4 text-sm text-gray-700">
                  <p className="font-semibold">#{payment.reservationId}</p>
                  <p className="mt-1 break-words text-xs text-gray-500">{context.event?.name}</p>
                </td>
                <td className="px-3 py-4 text-sm font-semibold text-nirart-text">{formatCurrency(payment.totalValue)}</td>
                <td className="px-3 py-4 text-sm font-semibold text-green-700">{formatCurrency(getPaidTotal(payment))}</td>
                <td className="px-3 py-4 text-sm font-semibold text-yellow-700">{formatCurrency(getRemainingTotal(payment))}</td>
                <td className="px-3 py-4 text-sm text-gray-700">{nextDue ? formatDate(nextDue.dueDate) : '—'}</td>
                <td className="px-3 py-4"><PaymentStatus status={getPaymentStatus(payment)} /></td>
                <td className="px-2 py-4"><DesktopActions payment={payment} actions={actions} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MobileCards({ payments, actions, openActionId, onToggleActions, onCloseActions }) {
  return (
    <div className="min-w-0 space-y-3 p-3 xl:hidden">
      {payments.map((payment) => {
        const context = getPaymentContext(payment)
        const nextDue = getNextDueInstallment(payment)
        return (
          <article key={payment.id} className="min-w-0 rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-semibold text-nirart-text">{context.student?.fullName}</p>
                <p className="mt-1 break-words text-sm text-gray-600">{context.school?.fantasyName}</p>
                <p className="text-sm text-gray-500">Reserva #{payment.reservationId}</p>
              </div>
              <div className="shrink-0"><PaymentStatus status={getPaymentStatus(payment)} /></div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="Valor total" value={formatCurrency(payment.totalValue)} />
              <Info label="Total pago" value={formatCurrency(getPaidTotal(payment))} valueClassName="text-green-700" />
              <Info label="Valor restante" value={formatCurrency(getRemainingTotal(payment))} valueClassName="text-yellow-700" />
              <Info label="Próximo vencimento" value={nextDue ? formatDate(nextDue.dueDate) : '—'} />
            </div>
            <div className="relative mt-4 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => onToggleActions(payment.id)}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-nirart-green hover:text-nirart-green"
              >
                <MoreHorizontal size={18} /> Ações do pagamento
              </button>
              {openActionId === payment.id && (
                <MobileActionMenu payment={payment} actions={actions} onClose={onCloseActions} />
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

function getActions(payment) {
  const cancelled = getPaymentStatus(payment) === 'cancelado'
  const settled = getPaymentStatus(payment) === 'quitado'
  return [
    { key: 'view', label: 'Visualizar', icon: Eye },
    { key: 'edit', label: 'Editar', icon: Edit2, disabled: cancelled },
    { key: 'settle', label: 'Dar baixa', icon: Banknote, disabled: cancelled || settled || !getNextDueInstallment(payment) },
    { key: 'cancel', label: 'Cancelar', icon: XCircle, disabled: cancelled || settled },
    { key: 'receipt', label: 'Recibo', icon: ReceiptText, disabled: getPaidTotal(payment) === 0 }
  ]
}

function DesktopActions({ payment, actions }) {
  return (
    <div className="grid grid-cols-2 gap-1">
      {getActions(payment).map((action) => (
        <button
          key={action.key}
          type="button"
          title={action.label}
          disabled={action.disabled}
          onClick={() => actions[action.key](payment)}
          className="inline-flex min-h-8 items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:border-nirart-green hover:text-nirart-green disabled:cursor-not-allowed disabled:opacity-40"
        >
          <action.icon size={15} />
        </button>
      ))}
    </div>
  )
}

function MobileActionMenu({ payment, actions, onClose }) {
  return (
    <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
      {getActions(payment).map((action) => (
        <button
          key={action.key}
          type="button"
          disabled={action.disabled}
          onClick={() => {
            actions[action.key](payment)
            onClose()
          }}
          className="flex min-h-11 w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-700 last:border-0 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <action.icon size={17} />
          <span className="whitespace-nowrap">{action.label}</span>
        </button>
      ))}
    </div>
  )
}

function CancellationModal({ payment, reason, onReasonChange, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-nirart-text">Cancelar pagamento</h2>
        <p className="mt-2 text-sm text-gray-600">Informe o motivo do cancelamento do pagamento da reserva #{payment.reservationId}.</p>
        <label className="mt-5 block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Motivo</span>
          <textarea
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            className="min-h-28 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-nirart-green focus:ring-1 focus:ring-nirart-green"
          />
        </label>
        {!reason.trim() && <p className="mt-1 text-xs text-red-600">O motivo é obrigatório.</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Voltar</Button>
          <Button variant="secondary" disabled={!reason.trim()} onClick={onConfirm}>Cancelar pagamento</Button>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, icon: Icon, style }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className={`inline-flex rounded-lg p-2 ${style}`}><Icon size={20} /></div>
      <p className="mt-3 text-xs text-gray-600">{label}</p>
      <p className="mt-1 break-words text-xl font-bold text-nirart-text md:text-2xl">{value}</p>
    </div>
  )
}

function Info({ label, value, valueClassName = 'text-nirart-text' }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 break-words font-semibold ${valueClassName}`}>{value}</p>
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
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {capitalize(status)}
    </span>
  )
}

function getPaymentContext(payment) {
  const reservation = getReservationById(payment.reservationId)
  return {
    reservation,
    student: MOCK_STUDENTS.find((item) => item.id === reservation?.studentId),
    school: MOCK_SCHOOLS.find((item) => item.id === reservation?.schoolId),
    studentClass: MOCK_CLASSES.find((item) => item.id === reservation?.classId),
    event: getReservationEvent(reservation?.eventId)
  }
}

function getDueOverview(payments) {
  const entries = payments.flatMap((payment) => {
    const context = getPaymentContext(payment)
    return payment.installments
      .filter((installment) => ['pendente', 'vencido'].includes(installment.status))
      .map((installment) => ({
        payment,
        installment,
        student: context.student
      }))
  })

  return {
    overdue: entries
      .filter((entry) => entry.installment.status === 'vencido')
      .sort((a, b) => a.installment.dueDate.localeCompare(b.installment.dueDate)),
    upcoming: entries
      .filter((entry) => entry.installment.status === 'pendente')
      .sort((a, b) => a.installment.dueDate.localeCompare(b.installment.dueDate))
  }
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
