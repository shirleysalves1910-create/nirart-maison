import { useNavigate, useParams } from 'react-router-dom'
import {
  CalendarDays,
  Clock3,
  Edit2,
  GraduationCap,
  History,
  Link2,
  MapPin,
  NotebookText,
  UserRound
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_CLASSES, MOCK_SCHOOLS, MOCK_STUDENTS } from '../data/mockData'
import {
  getReservationById,
  getReservationItemsQuantity,
  getReservationTotal
} from '../data/reservationMockData'
import { getAgendaEventById, getEventType } from '../data/agendaMockData'

export default function DetalhesEvento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const event = getAgendaEventById(id)
  const student = MOCK_STUDENTS.find((item) => String(item.id) === String(event?.studentId))
  const school = MOCK_SCHOOLS.find((item) => String(item.id) === String(event?.schoolId))
  const studentClass = MOCK_CLASSES.find((item) => String(item.id) === String(event?.classId))
  const reservation = getReservationById(event?.reservationId)

  if (!event) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Evento não encontrado</h1>
            <p className="mt-2 text-gray-600">Selecione um evento válido na agenda.</p>
            <Button className="mt-6" onClick={() => navigate('/agenda')}>Voltar para Agenda</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const eventType = getEventType(event.type)

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-7xl space-y-6 p-4 md:p-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="break-words text-2xl font-bold text-nirart-text md:text-3xl">{event.title}</h1>
              <TypeBadge eventType={eventType} />
              <StatusBadge status={event.status} />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {formatDate(event.date)} · {event.startTime} às {event.endTime}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={() => navigate('/agenda')} className="whitespace-nowrap">
              Voltar
            </Button>
            <Button
              onClick={() => navigate(`/cadastro-evento/${event.id}`)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Edit2 size={17} /> Editar evento
            </Button>
          </div>
        </header>

        {event.automatic && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            Este compromisso foi criado automaticamente por outro módulo. As alterações nesta tela permanecem mockadas.
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={CalendarDays} label="Data" value={formatDate(event.date)} />
          <SummaryCard icon={Clock3} label="Horário" value={`${event.startTime} às ${event.endTime}`} />
          <SummaryCard icon={UserRound} label="Responsável" value={event.responsible} />
          <SummaryCard icon={MapPin} label="Local" value={event.location} />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6 xl:col-span-2">
            <SectionTitle icon={CalendarDays} title="Dados do evento" />
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow label="Título" value={event.title} className="sm:col-span-2 lg:col-span-3" />
              <InfoRow label="Tipo de evento" value={<TypeBadge eventType={eventType} />} />
              <InfoRow label="Data" value={formatDate(event.date)} />
              <InfoRow label="Status" value={<StatusBadge status={event.status} />} />
              <InfoRow label="Hora de início" value={event.startTime} />
              <InfoRow label="Hora de término" value={event.endTime} />
              <InfoRow label="Responsável" value={event.responsible} />
              <InfoRow label="Local" value={event.location} className="sm:col-span-2 lg:col-span-3" />
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <SectionTitle icon={GraduationCap} title="Dados do aluno" />
            {student ? (
              <div className="mt-5 space-y-4">
                <InfoRow label="Aluno" value={student.fullName} />
                <InfoRow label="Escola" value={school?.fantasyName} />
                <InfoRow label="Turma" value={studentClass?.name} />
                <InfoRow label="Responsável" value={student.guardianName} />
                <InfoRow label="Telefone" value={student.guardianPhone || student.phone} />
              </div>
            ) : (
              <EmptyText text="Nenhum aluno vinculado a este evento." />
            )}
          </section>
        </div>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SectionTitle icon={Link2} title="Reserva vinculada" />
            {reservation && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/reservas/${reservation.id}`)}
                className="whitespace-nowrap"
              >
                Ver reserva
              </Button>
            )}
          </div>

          {reservation ? (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoRow label="Reserva" value={`#${reservation.id}`} />
              <InfoRow label="Data do evento" value={formatDate(reservation.eventDate)} />
              <InfoRow label="Quantidade de itens" value={getReservationItemsQuantity(reservation)} />
              <InfoRow label="Valor total" value={formatCurrency(getReservationTotal(reservation))} />
              <InfoRow label="Status da reserva" value={capitalize(reservation.status)} />
              <InfoRow label="Data da prova" value={formatDate(reservation.fittingDate)} />
              <InfoRow label="Data da entrega" value={formatDate(reservation.deliveryDate)} />
              <InfoRow label="Devolução prevista" value={formatDate(reservation.expectedReturnDate)} />
            </div>
          ) : (
            <EmptyText text="Nenhuma reserva vinculada a este evento." />
          )}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <SectionTitle icon={History} title="Histórico de alterações" />
            <div className="mt-5 space-y-4">
              {(event.history || []).length > 0 ? event.history.map((entry) => (
                <div key={entry.id} className="flex gap-3 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-nirart-green" />
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-nirart-text">{entry.action}</p>
                    <p className="mt-1 text-sm text-gray-500">{entry.date} · {entry.user}</p>
                  </div>
                </div>
              )) : <EmptyText text="Nenhuma alteração registrada." />}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <SectionTitle icon={NotebookText} title="Observações" />
            <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
              {event.notes || 'Sem observações.'}
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
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

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="inline-flex rounded-lg bg-green-50 p-2 text-nirart-green"><Icon size={20} /></div>
      <p className="mt-3 text-sm text-gray-500">{label}</p>
      <p className="mt-1 break-words text-lg font-bold text-nirart-text">{value || '—'}</p>
    </div>
  )
}

function InfoRow({ label, value, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <div className="mt-1 break-words font-semibold text-nirart-text">{value || '—'}</div>
    </div>
  )
}

function TypeBadge({ eventType }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${eventType.color}`}>
      {eventType.label}
    </span>
  )
}

function StatusBadge({ status }) {
  const styles = {
    agendado: 'bg-yellow-100 text-yellow-800',
    confirmado: 'bg-green-100 text-green-800',
    realizado: 'bg-blue-100 text-blue-800',
    cancelado: 'bg-red-100 text-red-800',
    reagendado: 'bg-purple-100 text-purple-800'
  }
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || styles.agendado}`}>
      {capitalize(status)}
    </span>
  )
}

function EmptyText({ text }) {
  return <p className="mt-5 rounded-lg bg-gray-50 p-5 text-sm text-gray-500">{text}</p>
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
