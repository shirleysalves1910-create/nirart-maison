import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit2,
  Eye,
  List,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Truck,
  Undo2,
  WalletCards,
  XCircle
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_CLASSES, MOCK_SCHOOLS, MOCK_STUDENTS } from '../data/mockData'
import {
  EVENT_STATUSES,
  EVENT_TYPES,
  getEventType,
  MOCK_AGENDA_EVENTS,
  RESPONSIBLES
} from '../data/agendaMockData'

const VIEWS = [
  { value: 'day', label: 'Dia', icon: CalendarDays },
  { value: 'week', label: 'Semana', icon: CalendarRange },
  { value: 'month', label: 'Mês', icon: CalendarDays },
  { value: 'list', label: 'Lista', icon: List }
]

export default function Agenda() {
  const navigate = useNavigate()
  const [events, setEvents] = useState(MOCK_AGENDA_EVENTS)
  const [view, setView] = useState('month')
  const [referenceDate, setReferenceDate] = useState('2026-06-12')
  const [filters, setFilters] = useState({
    search: '',
    date: '',
    schoolId: '',
    classId: '',
    type: '',
    responsible: '',
    status: ''
  })
  const [mobileActionId, setMobileActionId] = useState(null)
  const [confirmation, setConfirmation] = useState(null)

  const filteredEvents = useMemo(() => events
    .filter((event) => {
      const context = getContext(event)
      const searchable = [
        event.title,
        context.student?.fullName,
        context.school?.fantasyName,
        context.studentClass?.name,
        event.responsible,
        event.location
      ].join(' ').toLowerCase()
      return (
        searchable.includes(filters.search.toLowerCase()) &&
        (!filters.date || event.date === filters.date) &&
        (!filters.schoolId || String(event.schoolId) === filters.schoolId) &&
        (!filters.classId || String(event.classId) === filters.classId) &&
        (!filters.type || event.type === filters.type) &&
        (!filters.responsible || event.responsible === filters.responsible) &&
        (!filters.status || event.status === filters.status)
      )
    })
    .sort(sortEvents), [events, filters])

  const visibleEvents = useMemo(
    () => filterByView(filteredEvents, view, referenceDate),
    [filteredEvents, view, referenceDate]
  )

  const dashboard = useMemo(() => ({
    today: events.filter((event) => event.date === '2026-06-12').length,
    fittings: events.filter((event) => event.type === 'prova de roupa' && event.date >= '2026-06-12' && event.status !== 'cancelado').length,
    deliveries: events.filter((event) => event.type === 'entrega' && !['realizado', 'cancelado'].includes(event.status)).length,
    returns: events.filter((event) => event.type === 'devolução' && !['realizado', 'cancelado'].includes(event.status)).length,
    payments: events.filter((event) => event.type === 'pagamento' && event.date >= '2026-06-12' && event.status !== 'cancelado').length
  }), [events])

  const actions = {
    view: (event) => navigate(`/agenda/${event.id}`),
    edit: (event) => navigate(`/cadastro-evento/${event.id}`),
    reschedule: (event) => setConfirmation({ event, action: 'reagendado', title: 'Reagendar evento' }),
    cancel: (event) => setConfirmation({ event, action: 'cancelado', title: 'Cancelar evento' })
  }

  const confirmAction = () => {
    setEvents((current) => current.map((event) => (
      event.id === confirmation.event.id
        ? {
            ...event,
            status: confirmation.action,
            date: confirmation.action === 'reagendado' ? addDays(event.date, 1) : event.date
          }
        : event
    )))
    setConfirmation(null)
  }

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-7xl space-y-6 p-4 md:p-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-nirart-text">Agenda</h1>
            <p className="mt-1 text-sm text-gray-600">Central de compromissos operacionais da Nirart Maison.</p>
          </div>
          <Button onClick={() => navigate('/cadastro-evento')} className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
            <Plus size={18} /> Novo Evento
          </Button>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Metric label="Eventos Hoje" value={dashboard.today} icon={CalendarDays} style="bg-green-50 text-nirart-green" />
          <Metric label="Próximas Provas" value={dashboard.fittings} icon={Clock3} style="bg-purple-50 text-purple-700" />
          <Metric label="Entregas Pendentes" value={dashboard.deliveries} icon={Truck} style="bg-blue-50 text-blue-700" />
          <Metric label="Devoluções Pendentes" value={dashboard.returns} icon={Undo2} style="bg-teal-50 text-teal-700" />
          <Metric label="Pagamentos a Vencer" value={dashboard.payments} icon={WalletCards} style="bg-yellow-50 text-yellow-700" />
        </section>

        <Filters filters={filters} setFilters={setFilters} />

        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <ViewSelector view={view} setView={setView} />
            <DateNavigator view={view} referenceDate={referenceDate} setReferenceDate={setReferenceDate} />
          </div>
          <div className="mt-6">
            {view === 'month' && <MonthView events={visibleEvents} referenceDate={referenceDate} navigate={navigate} />}
            {view === 'week' && <WeekView events={visibleEvents} referenceDate={referenceDate} navigate={navigate} />}
            {view === 'day' && <DayView events={visibleEvents} referenceDate={referenceDate} navigate={navigate} />}
            {view === 'list' && (
              <ListView
                events={visibleEvents}
                actions={actions}
                openActionId={mobileActionId}
                setOpenActionId={setMobileActionId}
              />
            )}
          </div>
        </section>

        {view !== 'list' && (
          <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-4 md:p-5">
              <h2 className="font-semibold text-nirart-text">Eventos no período</h2>
            </div>
            <ListView
              events={visibleEvents}
              actions={actions}
              openActionId={mobileActionId}
              setOpenActionId={setMobileActionId}
              compact
            />
          </section>
        )}
      </div>

      {confirmation && (
        <ConfirmationModal confirmation={confirmation} onClose={() => setConfirmation(null)} onConfirm={confirmAction} />
      )}
    </MainLayout>
  )
}

function Filters({ filters, setFilters }) {
  const update = (field, value) => setFilters((current) => ({ ...current, [field]: value }))
  const filteredClasses = MOCK_CLASSES.filter((item) => !filters.schoolId || String(item.schoolId) === filters.schoolId)

  return (
    <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 md:p-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          value={filters.search}
          onChange={(event) => update('search', event.target.value)}
          placeholder="Buscar por título, aluno, escola, responsável ou local..."
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 outline-none focus:border-nirart-green focus:ring-1 focus:ring-nirart-green"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <input type="date" value={filters.date} onChange={(event) => update('date', event.target.value)} className={filterClass} />
        <select value={filters.schoolId} onChange={(event) => setFilters((current) => ({ ...current, schoolId: event.target.value, classId: '' }))} className={filterClass}>
          <option value="">Todas as escolas</option>
          {MOCK_SCHOOLS.map((item) => <option key={item.id} value={item.id}>{item.fantasyName}</option>)}
        </select>
        <select value={filters.classId} onChange={(event) => update('classId', event.target.value)} className={filterClass}>
          <option value="">Todas as turmas</option>
          {filteredClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select value={filters.type} onChange={(event) => update('type', event.target.value)} className={filterClass}>
          <option value="">Todos os tipos</option>
          {EVENT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select value={filters.responsible} onChange={(event) => update('responsible', event.target.value)} className={filterClass}>
          <option value="">Todos os responsáveis</option>
          {[...new Set([...RESPONSIBLES, 'Equipe Nirart'])].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={filters.status} onChange={(event) => update('status', event.target.value)} className={filterClass}>
          <option value="">Todos os status</option>
          {EVENT_STATUSES.map((item) => <option key={item} value={item}>{capitalize(item)}</option>)}
        </select>
      </div>
    </section>
  )
}

function ViewSelector({ view, setView }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {VIEWS.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => setView(item.value)}
          className={`inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${
            view === item.value ? 'bg-nirart-green text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <item.icon className="hidden sm:block" size={16} /> {item.label}
        </button>
      ))}
    </div>
  )
}

function DateNavigator({ view, referenceDate, setReferenceDate }) {
  const label = getPeriodLabel(view, referenceDate)
  const step = view === 'day' ? 1 : view === 'week' ? 7 : 30
  return (
    <div className="flex items-center justify-between gap-2 sm:justify-end">
      <button type="button" onClick={() => setReferenceDate(addDays(referenceDate, -step))} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"><ChevronLeft size={18} /></button>
      <button type="button" onClick={() => setReferenceDate('2026-06-12')} className="min-h-10 whitespace-nowrap rounded-lg border border-gray-200 px-4 text-sm font-semibold text-nirart-text hover:bg-gray-50">{label}</button>
      <button type="button" onClick={() => setReferenceDate(addDays(referenceDate, step))} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"><ChevronRight size={18} /></button>
    </div>
  )
}

function MonthView({ events, referenceDate, navigate }) {
  const days = getMonthGrid(referenceDate)
  return (
    <>
      <div className="hidden md:block">
        <div className="grid grid-cols-7 border-l border-t border-gray-200 text-center text-xs font-semibold uppercase text-gray-500">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => <div key={day} className="border-b border-r bg-gray-50 p-2">{day}</div>)}
          {days.map((day) => {
            const dayEvents = events.filter((event) => event.date === day.date)
            return (
              <div key={day.date} className={`min-h-28 border-b border-r p-2 text-left ${day.currentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}`}>
                <p className="text-xs font-semibold">{day.day}</p>
                <div className="mt-2 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => <CalendarEvent key={event.id} event={event} navigate={navigate} />)}
                  {dayEvents.length > 3 && <p className="text-xs text-gray-500">+{dayEvents.length - 3} eventos</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="space-y-3 md:hidden">
        {events.length === 0 ? <EmptyState /> : events.slice(0, 10).map((event) => <EventCard key={event.id} event={event} onClick={() => navigate(`/agenda/${event.id}`)} />)}
      </div>
    </>
  )
}

function WeekView({ events, referenceDate, navigate }) {
  const days = getWeekDates(referenceDate)
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
      {days.map((date) => {
        const dayEvents = events.filter((event) => event.date === date)
        return (
          <div key={date} className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-semibold uppercase text-gray-500">{formatWeekday(date)}</p>
            <p className="mt-1 font-bold text-nirart-text">{formatDate(date)}</p>
            <div className="mt-3 space-y-2">
              {dayEvents.length === 0 ? <p className="text-xs text-gray-400">Sem eventos</p> : dayEvents.map((event) => <CalendarEvent key={event.id} event={event} navigate={navigate} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DayView({ events, referenceDate, navigate }) {
  return (
    <div>
      <div className="mb-4 rounded-lg bg-green-50 p-4">
        <p className="text-sm text-green-800">Agenda do dia</p>
        <p className="mt-1 text-xl font-bold text-nirart-text">{formatLongDate(referenceDate)}</p>
      </div>
      <div className="space-y-3">
        {events.length === 0 ? <EmptyState /> : events.map((event) => <EventCard key={event.id} event={event} onClick={() => navigate(`/agenda/${event.id}`)} />)}
      </div>
    </div>
  )
}

function ListView({ events, actions, openActionId, setOpenActionId, compact = false }) {
  if (events.length === 0) return <EmptyState />
  return (
    <>
      <div className="hidden xl:block">
        <table className="w-full table-fixed text-left">
          <thead className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="w-[12%] px-3 py-3">Data</th>
              <th className="w-[9%] px-3 py-3">Hora</th>
              <th className="w-[15%] px-3 py-3">Tipo</th>
              <th className="w-[17%] px-3 py-3">Aluno</th>
              <th className="w-[18%] px-3 py-3">Escola</th>
              <th className="w-[14%] px-3 py-3">Responsável</th>
              <th className="w-[9%] px-3 py-3">Status</th>
              <th className="w-[6%] px-2 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const context = getContext(event)
              return (
                <tr key={event.id} className="border-b align-top hover:bg-gray-50">
                  <td className="px-3 py-4 text-sm">{formatDate(event.date)}</td>
                  <td className="px-3 py-4 text-sm">{event.startTime}</td>
                  <td className="px-3 py-4"><EventTypeBadge type={event.type} /></td>
                  <td className="break-words px-3 py-4 text-sm font-semibold">{context.student?.fullName || '—'}</td>
                  <td className="break-words px-3 py-4 text-sm text-gray-700">{context.school?.fantasyName || '—'}</td>
                  <td className="break-words px-3 py-4 text-sm text-gray-700">{event.responsible}</td>
                  <td className="px-3 py-4"><EventStatus status={event.status} /></td>
                  <td className="px-2 py-4"><DesktopActions event={event} actions={actions} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className={`space-y-3 ${compact ? 'p-3' : ''} xl:hidden`}>
        {events.map((event) => (
          <article key={event.id} className="min-w-0 rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <EventTypeBadge type={event.type} />
                <p className="mt-2 break-words font-semibold text-nirart-text">{event.title}</p>
                <p className="mt-1 text-sm text-gray-500">{formatDate(event.date)} · {event.startTime} às {event.endTime}</p>
              </div>
              <EventStatus status={event.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="Aluno" value={getContext(event).student?.fullName || '—'} />
              <Info label="Escola" value={getContext(event).school?.fantasyName || '—'} />
              <Info label="Responsável" value={event.responsible} />
              <Info label="Local" value={event.location} />
            </div>
            <div className="relative mt-4 border-t pt-4">
              <button type="button" onClick={() => setOpenActionId(openActionId === event.id ? null : event.id)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 font-semibold text-gray-700">
                <MoreHorizontal size={18} /> Ações do evento
              </button>
              {openActionId === event.id && <MobileActions event={event} actions={actions} />}
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function DesktopActions({ event, actions }) {
  return (
    <div className="grid grid-cols-2 gap-1">
      {getActions(event).map((action) => (
        <button key={action.key} type="button" title={action.label} disabled={action.disabled} onClick={() => actions[action.key](event)} className="inline-flex min-h-8 items-center justify-center rounded-lg border p-2 text-gray-700 hover:border-nirart-green disabled:opacity-40">
          <action.icon size={15} />
        </button>
      ))}
    </div>
  )
}

function MobileActions({ event, actions }) {
  return (
    <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-lg border bg-white shadow-xl">
      {getActions(event).map((action) => (
        <button key={action.key} type="button" disabled={action.disabled} onClick={() => actions[action.key](event)} className="flex min-h-11 w-full items-center gap-3 border-b px-4 text-sm font-medium last:border-0 hover:bg-gray-50 disabled:opacity-40">
          <action.icon size={17} /><span className="whitespace-nowrap">{action.label}</span>
        </button>
      ))}
    </div>
  )
}

function getActions(event) {
  const inactive = event.status === 'cancelado'
  return [
    { key: 'view', label: 'Visualizar', icon: Eye },
    { key: 'edit', label: 'Editar', icon: Edit2, disabled: event.automatic || inactive },
    { key: 'reschedule', label: 'Reagendar', icon: RefreshCw, disabled: inactive },
    { key: 'cancel', label: 'Cancelar', icon: XCircle, disabled: inactive || event.status === 'realizado' }
  ]
}

function CalendarEvent({ event, navigate }) {
  const type = getEventType(event.type)
  return (
    <button type="button" onClick={() => navigate(`/agenda/${event.id}`)} className={`block w-full min-w-0 rounded border px-2 py-1 text-left text-[11px] ${type.color}`}>
      <span className="block truncate font-semibold">{event.startTime} {event.title}</span>
    </button>
  )
}

function EventCard({ event, onClick }) {
  return (
    <button type="button" onClick={onClick} className="w-full min-w-0 rounded-lg border border-gray-200 p-4 text-left hover:border-nirart-green">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><EventTypeBadge type={event.type} /><p className="mt-2 break-words font-semibold">{event.title}</p><p className="mt-1 text-sm text-gray-500">{event.startTime} às {event.endTime}</p></div>
        <EventStatus status={event.status} />
      </div>
    </button>
  )
}

function EventTypeBadge({ type }) {
  const config = getEventType(type)
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${config.color}`}>{config.label}</span>
}

function EventStatus({ status }) {
  const styles = { agendado: 'bg-yellow-100 text-yellow-800', confirmado: 'bg-blue-100 text-blue-800', realizado: 'bg-green-100 text-green-800', cancelado: 'bg-red-100 text-red-800', reagendado: 'bg-purple-100 text-purple-800' }
  return <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>{capitalize(status)}</span>
}

function ConfirmationModal({ confirmation, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-nirart-text">{confirmation.title}</h2>
        <p className="mt-3 text-gray-600">Confirmar esta ação para <strong>{confirmation.event.title}</strong>?</p>
        <div className="mt-6 flex justify-end gap-3"><Button variant="outline" onClick={onClose}>Voltar</Button><Button variant={confirmation.action === 'cancelado' ? 'secondary' : 'primary'} onClick={onConfirm}>Confirmar</Button></div>
      </div>
    </div>
  )
}

function Metric({ label, value, icon: Icon, style }) {
  return <div className="rounded-lg border bg-white p-4 shadow-sm"><div className={`inline-flex rounded-lg p-2 ${style}`}><Icon size={20} /></div><p className="mt-3 text-xs text-gray-600">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>
}

function Info({ label, value }) {
  return <div className="min-w-0"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 break-words font-semibold">{value}</p></div>
}

function EmptyState() {
  return <div className="p-8 text-center"><CheckCircle2 className="mx-auto text-gray-300" size={38} /><p className="mt-3 text-sm text-gray-500">Nenhum evento encontrado neste período.</p></div>
}

function getContext(event) {
  return {
    student: MOCK_STUDENTS.find((item) => item.id === event.studentId),
    school: MOCK_SCHOOLS.find((item) => item.id === event.schoolId),
    studentClass: MOCK_CLASSES.find((item) => item.id === event.classId)
  }
}

function filterByView(events, view, referenceDate) {
  if (view === 'list') return events
  if (view === 'day') return events.filter((event) => event.date === referenceDate)
  if (view === 'week') {
    const dates = new Set(getWeekDates(referenceDate))
    return events.filter((event) => dates.has(event.date))
  }
  const month = referenceDate.slice(0, 7)
  return events.filter((event) => event.date.startsWith(month))
}

function getMonthGrid(referenceDate) {
  const [year, month] = referenceDate.split('-').map(Number)
  const first = new Date(Date.UTC(year, month - 1, 1))
  const start = new Date(first)
  start.setUTCDate(1 - first.getUTCDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + index)
    return {
      date: date.toISOString().slice(0, 10),
      day: date.getUTCDate(),
      currentMonth: date.getUTCMonth() === month - 1
    }
  })
}

function getWeekDates(referenceDate) {
  const date = parseDate(referenceDate)
  const start = new Date(date)
  start.setUTCDate(date.getUTCDate() - date.getUTCDay())
  return Array.from({ length: 7 }, (_, index) => {
    const item = new Date(start)
    item.setUTCDate(start.getUTCDate() + index)
    return item.toISOString().slice(0, 10)
  })
}

function getPeriodLabel(view, referenceDate) {
  if (view === 'day') return formatLongDate(referenceDate)
  if (view === 'week') {
    const days = getWeekDates(referenceDate)
    return `${formatDate(days[0])} - ${formatDate(days[6])}`
  }
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDate(referenceDate))
}

function addDays(value, amount) {
  const date = parseDate(value)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

function parseDate(value) {
  return new Date(`${value}T00:00:00Z`)
}

function sortEvents(a, b) {
  return `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')
}

function formatLongDate(value) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDate(value))
}

function formatWeekday(value) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' }).format(parseDate(value))
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const filterClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-nirart-green focus:ring-1 focus:ring-nirart-green'
