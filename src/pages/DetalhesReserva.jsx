import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Banknote,
  CalendarDays,
  CalendarClock,
  CreditCard,
  Edit2,
  PackageCheck,
  RotateCcw,
  Ruler,
  Truck,
  UserRound
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import {
  MOCK_CLASSES,
  MOCK_MEASUREMENTS,
  MOCK_SCHOOLS,
  MOCK_STUDENTS
} from '../data/mockData'
import {
  getReservationById,
  getReservationEvent,
  getReservationItem,
  getReservationItemsQuantity,
  getReservationTotal
} from '../data/reservationMockData'
import {
  getNextDueInstallment,
  getPaidTotal,
  getPaymentByReservationId,
  getPaymentStatus,
  getRemainingTotal
} from '../data/paymentMockData'
import {
  getDeliveryByReservationId,
  getReturnByReservationId,
  getReturnFineTotal
} from '../data/deliveryReturnMockData'

export default function DetalhesReserva() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const storedReservation = getReservationById(id)
  const reservation = storedReservation && location.state?.reservationStatus
    ? { ...storedReservation, status: location.state.reservationStatus }
    : storedReservation
  const student = MOCK_STUDENTS.find((item) => item.id === reservation?.studentId)
  const school = MOCK_SCHOOLS.find((item) => item.id === reservation?.schoolId)
  const studentClass = MOCK_CLASSES.find((item) => item.id === reservation?.classId)
  const event = getReservationEvent(reservation?.eventId)
  const payment = getPaymentByReservationId(reservation?.id)
  const delivery = location.state?.delivery || getDeliveryByReservationId(reservation?.id)
  const itemReturn = location.state?.itemReturn || getReturnByReservationId(reservation?.id)
  const measurement = MOCK_MEASUREMENTS.find((item) => (
    item.studentId === reservation?.studentId && item.status === 'Ativa'
  )) || MOCK_MEASUREMENTS.find((item) => item.studentId === reservation?.studentId)

  if (!reservation || !student) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Reserva não encontrada</h1>
            <p className="mt-2 text-gray-600">Selecione uma reserva válida na listagem.</p>
            <Button className="mt-6" onClick={() => navigate('/reservas')}>Voltar para Reservas</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-7xl space-y-6 p-4 md:p-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-nirart-text md:text-3xl">
                Reserva #{reservation.id}
              </h1>
              <StatusBadge status={reservation.status} />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {event?.name || 'Evento escolar'} · {formatDate(reservation.eventDate)}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <Button variant="outline" onClick={() => navigate('/reservas')} className="whitespace-nowrap">
              Voltar
            </Button>
            <Button variant="outline" onClick={() => navigate(`/cadastro-reserva/${reservation.id}`)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
              <Edit2 size={17} /> Editar
            </Button>
            <Button
              onClick={() => navigate(payment ? `/pagamentos/${payment.id}` : `/cadastro-pagamento?reservaId=${reservation.id}`)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <CreditCard size={17} /> Pagamento
            </Button>
            <Button
              variant="outline"
              disabled={['entregue', 'devolvido', 'cancelado'].includes(reservation.status)}
              onClick={() => navigate(`/registrar-entrega/${reservation.id}`)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Truck size={17} /> Registrar Entrega
            </Button>
            <Button
              variant="outline"
              disabled={!['entregue', 'devolvido'].includes(reservation.status)}
              onClick={() => navigate(`/registrar-devolucao/${reservation.id}`)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <RotateCcw size={17} /> Registrar Devolução
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Evento" value={formatDate(reservation.eventDate)} icon={CalendarDays} />
          <SummaryCard label="Quantidade de itens" value={getReservationItemsQuantity(reservation)} icon={PackageCheck} />
          <SummaryCard label="Valor total" value={formatCurrency(getReservationTotal(reservation))} icon={CreditCard} />
          <SummaryCard label="Última medição" value={measurement?.date || 'Não registrada'} icon={Ruler} />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <SectionTitle icon={UserRound} title="Dados do aluno" />
            <div className="mt-5 space-y-4">
              <InfoRow label="Nome" value={student.fullName} />
              <InfoRow label="Escola" value={school?.fantasyName} />
              <InfoRow label="Turma" value={studentClass?.name} />
              <InfoRow label="Responsável" value={student.guardianName} />
              <InfoRow label="Telefone" value={student.guardianPhone || student.phone} />
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6 xl:col-span-2">
            <SectionTitle icon={CalendarDays} title="Dados da reserva" />
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow label="Evento" value={event?.name} />
              <InfoRow label="Data do evento" value={formatDate(reservation.eventDate)} />
              <InfoRow label="Data da prova" value={formatDate(reservation.fittingDate)} />
              <InfoRow label="Data da entrega" value={formatDate(reservation.deliveryDate)} />
              <InfoRow label="Devolução prevista" value={formatDate(reservation.expectedReturnDate)} />
              <InfoRow label="Status" value={<StatusBadge status={reservation.status} />} />
              <InfoRow label="Tipo de atendimento" value={reservation.serviceType} />
              <InfoRow label="Local de atendimento" value={reservation.serviceLocation} className="sm:col-span-2" />
              <InfoRow label="Observações" value={reservation.notes || 'Sem observações.'} className="sm:col-span-2 lg:col-span-3" />
            </div>
          </section>
        </div>

        {measurement && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SectionTitle icon={Ruler} title="Medidas do aluno" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/historico-medidas/${student.id}`)}
                className="whitespace-nowrap"
              >
                Ver histórico de medidas
              </Button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {getMeasurementEntries(measurement).map(([label, value]) => (
                <div key={label} className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="mt-1 font-semibold text-nirart-text">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5 md:p-6">
            <SectionTitle icon={PackageCheck} title="Itens reservados" />
          </div>
          <ReservationItems reservation={reservation} />
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="text-lg font-semibold text-nirart-text">Resumo financeiro</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-5">
              <p className="text-sm text-gray-500">Quantidade total de itens</p>
              <p className="mt-2 text-2xl font-bold text-nirart-text">{getReservationItemsQuantity(reservation)}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-5">
              <p className="text-sm text-green-800">Valor total da reserva</p>
              <p className="mt-2 text-2xl font-bold text-nirart-green">{formatCurrency(getReservationTotal(reservation))}</p>
            </div>
          </div>
        </section>

        <FinancialStatus payment={payment} reservation={reservation} navigate={navigate} />

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <OperationCard
            title="Entrega"
            icon={Truck}
            status={delivery?.status || 'pendente'}
            details={[
              ['Data', formatDate(delivery?.deliveryDate || reservation.deliveryDate)],
              ['Responsável', delivery?.deliveredBy || 'Não informado'],
              ['Recebedor', delivery?.receivedBy || 'Não informado']
            ]}
            actionLabel="Registrar Entrega"
            onAction={() => navigate(`/registrar-entrega/${reservation.id}`)}
          />
          <OperationCard
            title="Devolução"
            icon={RotateCcw}
            status={itemReturn?.status || 'pendente'}
            details={[
              ['Data prevista', formatDate(itemReturn?.expectedReturnDate || reservation.expectedReturnDate)],
              ['Data real', formatDate(itemReturn?.actualReturnDate)],
              ['Multas', formatCurrency(getReturnFineTotal(itemReturn))]
            ]}
            actionLabel="Registrar Devolução"
            onAction={() => navigate(`/registrar-devolucao/${reservation.id}`)}
          />
        </section>
      </div>
    </MainLayout>
  )
}

function ReservationItems({ reservation }) {
  return (
    <>
      <div className="hidden lg:block">
        <table className="w-full table-fixed text-left">
          <thead className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="w-[42%] px-4 py-3">Item</th>
              <th className="w-[28%] px-4 py-3">Características</th>
              <th className="w-[14%] px-4 py-3">Quantidade</th>
              <th className="w-[16%] px-4 py-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {reservation.items.map((entry) => {
              const item = getReservationItem(entry.inventoryId)
              return (
                <tr key={entry.inventoryId} className="border-b last:border-0">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-nirart-text">{item?.ref}</p>
                    <p className="mt-1 break-words text-sm text-gray-600">{item?.description || item?.name}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    <p>{item?.category || item?.type}</p>
                    <p className="mt-1">{item?.color || '-'} · Tam. {item?.size || '-'}</p>
                  </td>
                  <td className="px-4 py-4 font-semibold text-nirart-text">{entry.quantity}</td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-500">{formatCurrency(entry.unitValue)} un.</p>
                    <p className="mt-1 font-semibold text-nirart-text">{formatCurrency(entry.quantity * entry.unitValue)}</p>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 lg:hidden">
        {reservation.items.map((entry) => {
          const item = getReservationItem(entry.inventoryId)
          return (
            <article key={entry.inventoryId} className="min-w-0 rounded-lg border border-gray-200 p-4">
              <p className="font-semibold text-nirart-text">{item?.ref}</p>
              <p className="mt-1 break-words text-sm text-gray-600">{item?.description || item?.name}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <InfoRow label="Categoria" value={item?.category || item?.type} />
                <InfoRow label="Cor" value={item?.color || '-'} />
                <InfoRow label="Tamanho" value={item?.size || '-'} />
                <InfoRow label="Quantidade" value={entry.quantity} />
                <InfoRow label="Valor unitário" value={formatCurrency(entry.unitValue)} />
                <InfoRow label="Valor total" value={formatCurrency(entry.quantity * entry.unitValue)} />
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}

function FinancialStatus({ payment, reservation, navigate }) {
  const nextDue = getNextDueInstallment(payment)
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-nirart-text">Status financeiro</h2>
          <p className="mt-1 text-sm text-gray-500">Pagamento e parcelas vinculados à reserva.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(payment ? `/pagamentos/${payment.id}` : `/cadastro-pagamento?reservaId=${reservation.id}`)}
          className="whitespace-nowrap"
        >
          {payment ? 'Ver pagamento' : 'Criar pagamento'}
        </Button>
      </div>

      {payment ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FinancialCard label="Status" value={<PaymentStatus status={getPaymentStatus(payment)} />} icon={CreditCard} />
          <FinancialCard label="Total pago" value={formatCurrency(getPaidTotal(payment))} icon={Banknote} valueClassName="text-green-700" />
          <FinancialCard label="Saldo restante" value={formatCurrency(getRemainingTotal(payment))} icon={CreditCard} valueClassName="text-yellow-700" />
          <FinancialCard label="Próximo vencimento" value={nextDue ? formatDate(nextDue.dueDate) : 'Sem pendências'} icon={CalendarClock} />
        </div>
      ) : (
        <div className="mt-5 rounded-lg bg-gray-50 p-6 text-center">
          <p className="font-medium text-gray-700">Nenhum pagamento cadastrado.</p>
          <p className="mt-1 text-sm text-gray-500">Crie o pagamento para controlar entrada e parcelas.</p>
        </div>
      )}
    </section>
  )
}

function OperationCard({ title, icon: Icon, status, details, actionLabel, onAction }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle icon={Icon} title={title} />
        <OperationStatus status={status} />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {details.map(([label, value]) => <InfoRow key={label} label={label} value={value} />)}
      </div>
      <Button variant="outline" onClick={onAction} className="mt-5 w-full whitespace-nowrap">
        {actionLabel}
      </Button>
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

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="inline-flex rounded-lg bg-green-50 p-2 text-nirart-green"><Icon size={20} /></div>
      <p className="mt-3 text-sm text-gray-500">{label}</p>
      <p className="mt-1 break-words text-xl font-bold text-nirart-text">{value}</p>
    </div>
  )
}

function FinancialCard({ label, value, icon: Icon, valueClassName = 'text-nirart-text' }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <div className="inline-flex rounded-lg bg-white p-2 text-nirart-green"><Icon size={18} /></div>
      <p className="mt-3 text-xs text-gray-500">{label}</p>
      <div className={`mt-1 break-words font-bold ${valueClassName}`}>{value}</div>
    </div>
  )
}

function InfoRow({ label, value, className = '' }) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-500">{label}</p>
      <div className="mt-1 break-words font-semibold text-nirart-text">{value || '—'}</div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    'pré-reserva': 'bg-purple-100 text-purple-800',
    reservado: 'bg-yellow-100 text-yellow-800',
    confirmado: 'bg-green-100 text-green-800',
    entregue: 'bg-blue-100 text-blue-800',
    devolvido: 'bg-gray-100 text-gray-700',
    cancelado: 'bg-red-100 text-red-800'
  }
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {capitalize(status)}
    </span>
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

function OperationStatus({ status }) {
  const styles = {
    pendente: 'bg-yellow-100 text-yellow-800',
    entregue: 'bg-blue-100 text-blue-800',
    devolvido: 'bg-green-100 text-green-800',
    atrasado: 'bg-orange-100 text-orange-800',
    'com avaria': 'bg-red-100 text-red-800',
    cancelada: 'bg-red-100 text-red-800',
    cancelado: 'bg-gray-100 text-gray-700'
  }
  return (
    <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || styles.pendente}`}>
      {capitalize(status)}
    </span>
  )
}

function getMeasurementEntries(measurement) {
  const labels = {
    altura: 'Altura',
    busto: 'Busto',
    cintura: 'Cintura',
    quadril: 'Quadril',
    comprimento: 'Comprimento',
    shoeSize: 'Calçado',
    suitSize: 'Terno',
    shirtSize: 'Camisa',
    pantsSize: 'Calça',
    waist: 'Cintura',
    pantsLength: 'Comp. calça'
  }
  return Object.entries(labels)
    .filter(([key]) => measurement[key])
    .slice(0, 6)
    .map(([key, label]) => [label, measurement[key]])
}

function formatDate(value) {
  if (!value) return '—'
  if (value.includes('/')) return value
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
