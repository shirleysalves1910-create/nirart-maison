import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  CalendarCheck,
  CreditCard,
  Edit2,
  Eye,
  LoaderCircle,
  MoreHorizontal,
  PackageCheck,
  RotateCcw,
  Search,
  Truck,
  XCircle
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { listarAlunos } from '../services/alunos'
import {
  atualizarStatusReserva,
  getReservationItemsQuantity,
  listarReservas,
  RESERVATION_STATUSES
} from '../services/reservas'

export default function Reservas() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialStudentId = searchParams.get('alunoId') || ''
  const [reservations, setReservations] = useState([])
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [studentId, setStudentId] = useState(initialStudentId)
  const [status, setStatus] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [mobileActionId, setMobileActionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true
    const loadData = async () => {
      setLoading(true)
      setErrorMessage('')
      try {
        const [reservationData, studentData] = await Promise.all([
          listarReservas(),
          listarAlunos()
        ])
        if (!active) return
        setReservations(reservationData)
        setStudents(studentData)
      } catch (error) {
        if (active) setErrorMessage(getErrorMessage(error, 'Não foi possível carregar as reservas.'))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [])

  const filteredReservations = useMemo(() => reservations.filter((reservation) => {
    const searchable = [
      reservation.student?.fullName,
      reservation.school?.fantasyName,
      reservation.studentClass?.name,
      ...reservation.items.map((entry) => (
        `${entry.inventory?.ref || ''} ${entry.inventory?.description || entry.inventory?.name || ''}`
      ))
    ].join(' ').toLowerCase()

    return (
      searchable.includes(searchTerm.toLowerCase()) &&
      (!studentId || reservation.studentId === studentId) &&
      (!status || reservation.status === status)
    )
  }), [reservations, searchTerm, status, studentId])

  const metrics = useMemo(() => ({
    total: reservations.length,
    active: reservations.filter((item) => ['pré-reserva', 'reservado', 'confirmado'].includes(item.status)).length,
    delivered: reservations.filter((item) => item.status === 'entregue').length,
    returned: reservations.filter((item) => item.status === 'devolvido').length
  }), [reservations])

  const updateStatus = async (reservationId, nextStatus) => {
    setActionLoading(true)
    setErrorMessage('')
    try {
      const updated = await atualizarStatusReserva(reservationId, nextStatus)
      setReservations((current) => current.map((reservation) => (
        reservation.id === updated.id ? updated : reservation
      )))
      setConfirmation(null)
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível atualizar o status da reserva.'))
    } finally {
      setActionLoading(false)
    }
  }

  const requestStatusChange = (reservation, nextStatus, label) => {
    setConfirmation({ reservation, nextStatus, label })
  }

  const clearStudentFilter = () => {
    setStudentId('')
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('alunoId')
    setSearchParams(nextParams)
  }

  const actions = {
    view: (reservation) => navigate(`/reservas/${reservation.id}`),
    edit: (reservation) => navigate(`/cadastro-reserva/${reservation.id}`),
    cancel: (reservation) => requestStatusChange(reservation, 'cancelado', 'cancelar'),
    payment: (reservation) => navigate(`/pagamentos?reservaId=${reservation.id}`),
    delivery: (reservation) => navigate(`/registrar-entrega/${reservation.id}`),
    return: (reservation) => navigate(`/registrar-devolucao/${reservation.id}`)
  }

  const filteredStudent = students.find((student) => student.id === studentId)

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-7xl space-y-6 p-4 md:p-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-nirart-text">Reservas</h1>
            <p className="mt-1 text-sm text-gray-600">Gerencie reservas, entregas e devoluções.</p>
          </div>
          <Button onClick={() => navigate(studentId ? `/cadastro-reserva?alunoId=${studentId}` : '/cadastro-reserva')}>
            Nova Reserva
          </Button>
        </header>

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Total de reservas" value={metrics.total} icon={CalendarCheck} style="bg-green-50 text-nirart-green" />
          <Metric label="Reservas ativas" value={metrics.active} icon={PackageCheck} style="bg-yellow-50 text-yellow-700" />
          <Metric label="Entregues" value={metrics.delivered} icon={Truck} style="bg-blue-50 text-blue-600" />
          <Metric label="Devolvidas" value={metrics.returned} icon={RotateCcw} style="bg-gray-100 text-gray-600" />
        </section>

        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 md:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por aluno, escola, turma ou item..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 outline-none focus:border-nirart-green focus:ring-1 focus:ring-nirart-green"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <select
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Todos os alunos</option>
              {students.map((student) => <option key={student.id} value={student.id}>{student.fullName}</option>)}
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Todos os status</option>
              {RESERVATION_STATUSES.map((item) => <option key={item} value={item}>{capitalize(item)}</option>)}
            </select>
          </div>
          {initialStudentId && studentId && (
            <div className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
              <span>Exibindo reservas de <strong>{filteredStudent?.fullName || 'aluno selecionado'}</strong>.</span>
              <button type="button" onClick={clearStudentFilter} className="font-semibold hover:underline">Limpar filtro</button>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-gray-500">
              <LoaderCircle className="animate-spin" size={20} /> Carregando reservas...
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto mb-4 text-gray-400" size={46} />
              <p className="font-medium text-gray-700">Nenhuma reserva encontrada</p>
              <p className="mt-1 text-sm text-gray-500">Ajuste os filtros ou cadastre uma nova reserva.</p>
            </div>
          ) : (
            <>
              <DesktopTable reservations={filteredReservations} actions={actions} />
              <MobileCards
                reservations={filteredReservations}
                actions={actions}
                openActionId={mobileActionId}
                onToggleActions={(id) => setMobileActionId((current) => current === id ? null : id)}
                onCloseActions={() => setMobileActionId(null)}
              />
            </>
          )}
        </section>
      </div>

      {confirmation && (
        <ConfirmationModal
          confirmation={confirmation}
          loading={actionLoading}
          onClose={() => setConfirmation(null)}
          onConfirm={() => updateStatus(confirmation.reservation.id, confirmation.nextStatus)}
        />
      )}
    </MainLayout>
  )
}

function DesktopTable({ reservations, actions }) {
  return (
    <div className="hidden xl:block">
      <table className="w-full table-fixed text-left">
        <colgroup>
          <col className="w-[17%]" />
          <col className="w-[18%]" />
          <col className="w-[13%]" />
          <col className="w-[12%]" />
          <col className="w-[9%]" />
          <col className="w-[12%]" />
          <col className="w-[10%]" />
          <col className="w-[9%]" />
        </colgroup>
        <thead className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
          <tr>
            <th className="px-4 py-3">Aluno</th>
            <th className="px-4 py-3">Escola</th>
            <th className="px-4 py-3">Turma</th>
            <th className="px-4 py-3">Data do evento</th>
            <th className="px-3 py-3">Itens</th>
            <th className="px-4 py-3">Valor total</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((reservation) => (
            <tr key={reservation.id} className="border-b align-top hover:bg-gray-50">
              <td className="break-words px-3 py-4 text-sm font-semibold text-nirart-text">{reservation.student?.fullName || '-'}</td>
              <td className="break-words px-3 py-4 text-sm text-gray-700">{reservation.school?.fantasyName || 'Aluno avulso'}</td>
              <td className="break-words px-3 py-4 text-sm text-gray-700">{reservation.studentClass?.name || '-'}</td>
              <td className="px-3 py-4 text-sm text-gray-700">{formatDateBR(reservation.eventDate)}</td>
              <td className="px-3 py-4 text-center text-sm font-semibold text-nirart-text">{getReservationItemsQuantity(reservation)}</td>
              <td className="px-3 py-4 text-sm font-semibold text-nirart-text">{formatCurrency(reservation.totalValue)}</td>
              <td className="px-3 py-4"><StatusBadge status={reservation.status} /></td>
              <td className="px-3 py-4"><ActionList reservation={reservation} actions={actions} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MobileCards({ reservations, actions, openActionId, onToggleActions, onCloseActions }) {
  return (
    <div className="min-w-0 space-y-3 p-3 xl:hidden">
      {reservations.map((reservation) => (
        <article key={reservation.id} className="min-w-0 rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words font-semibold text-nirart-text">{reservation.student?.fullName || '-'}</p>
              <p className="mt-1 break-words text-sm text-gray-600">{reservation.school?.fantasyName || 'Aluno avulso'}</p>
              <p className="break-words text-sm text-gray-500">{reservation.studentClass?.name || '-'}</p>
            </div>
            <div className="shrink-0"><StatusBadge status={reservation.status} /></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Info label="Evento" value={formatDateBR(reservation.eventDate)} />
            <Info label="Valor total" value={formatCurrency(reservation.totalValue)} />
            <Info label="Quantidade de itens" value={getReservationItemsQuantity(reservation)} />
            <Info label="Itens reservados" value={summarizeItems(reservation)} />
          </div>
          <div className="relative mt-4 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => onToggleActions(reservation.id)}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-nirart-green hover:text-nirart-green"
            >
              <MoreHorizontal size={18} /> Ações da reserva
            </button>
            {openActionId === reservation.id && (
              <MobileActionMenu reservation={reservation} actions={actions} onClose={onCloseActions} />
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

function getActions(reservation) {
  const disabled = reservation.status === 'cancelado'
  return [
    { key: 'view', label: 'Visualizar', icon: Eye },
    { key: 'edit', label: 'Editar', icon: Edit2, disabled },
    { key: 'cancel', label: 'Cancelar', icon: XCircle, disabled: disabled || reservation.status === 'devolvido' },
    { key: 'payment', label: 'Pagamento', icon: CreditCard, disabled },
    { key: 'delivery', label: 'Entrega', icon: Truck, disabled: disabled || ['entregue', 'devolvido'].includes(reservation.status) },
    { key: 'return', label: 'Devolução', icon: RotateCcw, disabled: disabled || reservation.status !== 'entregue' }
  ]
}

function ActionList({ reservation, actions }) {
  return (
    <div className="grid grid-cols-2 gap-1">
      {getActions(reservation).map((item) => (
        <button
          key={item.key}
          type="button"
          title={item.label}
          disabled={item.disabled}
          onClick={() => actions[item.key](reservation)}
          className="inline-flex min-h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-700 hover:border-nirart-green hover:text-nirart-green disabled:cursor-not-allowed disabled:opacity-40"
        >
          <item.icon size={15} />
        </button>
      ))}
    </div>
  )
}

function MobileActionMenu({ reservation, actions, onClose }) {
  return (
    <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
      {getActions(reservation).map((item) => (
        <button
          key={item.key}
          type="button"
          disabled={item.disabled}
          onClick={() => {
            actions[item.key](reservation)
            onClose()
          }}
          className="flex min-h-11 w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-700 last:border-0 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <item.icon size={17} />
          <span className="whitespace-nowrap">{item.label}</span>
        </button>
      ))}
    </div>
  )
}

function ConfirmationModal({ confirmation, loading, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-nirart-text">Confirmar ação</h2>
        <p className="mt-3 text-gray-600">
          Deseja {confirmation.label} a reserva de <strong>{confirmation.reservation.student?.fullName}</strong>?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>Voltar</Button>
          <Button variant="secondary" onClick={onConfirm} disabled={loading}>
            {loading ? 'Salvando...' : 'Confirmar'}
          </Button>
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
      <p className="mt-1 text-2xl font-bold text-nirart-text">{value}</p>
    </div>
  )
}

function Info({ label, value }) {
  return <div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 break-words font-semibold text-nirart-text">{value}</p></div>
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
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || styles.cancelado}`}>{capitalize(status)}</span>
}

function summarizeItems(reservation) {
  return reservation.items.map((entry) => (
    `${entry.quantity}x ${entry.inventory?.ref || 'item'}`
  )).join(', ')
}

function formatDateBR(value) {
  if (!value) return '-'
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

function getErrorMessage(error, fallback) {
  return error?.message ? `${fallback} ${error.message}` : fallback
}
