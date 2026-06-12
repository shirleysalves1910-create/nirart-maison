import { MOCK_ADJUSTMENTS } from './mockData'
import { MOCK_DELIVERIES, MOCK_RETURNS } from './deliveryReturnMockData'
import { MOCK_PAYMENTS } from './paymentMockData'
import {
  getReservationById,
  getReservationEvent,
  MOCK_RESERVATIONS
} from './reservationMockData'

export const EVENT_TYPES = [
  { value: 'prova de roupa', label: 'Prova de roupa', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'medição', label: 'Medição', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'ajuste', label: 'Ajuste', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'entrega', label: 'Entrega', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'devolução', label: 'Devolução', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { value: 'evento escolar', label: 'Evento escolar', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { value: 'atendimento', label: 'Atendimento', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { value: 'pagamento', label: 'Pagamento', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'outro', label: 'Outro', color: 'bg-gray-100 text-gray-700 border-gray-200' }
]

export const EVENT_STATUSES = ['agendado', 'confirmado', 'realizado', 'cancelado', 'reagendado']

export const RESPONSIBLES = ['Marina Alves', 'Julia Santos', 'Pedro Souza', 'Ana Martins']

export const MOCK_MANUAL_EVENTS = [
  {
    id: 'manual-1',
    title: 'Medição de Ana Beatriz',
    type: 'medição',
    date: '2026-06-12',
    startTime: '09:00',
    endTime: '09:40',
    studentId: 1,
    schoolId: 1,
    classId: 1,
    reservationId: 1,
    responsible: 'Julia Santos',
    location: 'Nirart Maison - Sala de Medidas',
    status: 'confirmado',
    notes: 'Conferir comprimento e numeração do sapato.',
    history: [
      { id: 1, date: '10/06/2026 14:20', action: 'Evento confirmado', user: 'Julia Santos' },
      { id: 2, date: '08/06/2026 10:00', action: 'Evento criado', user: 'Marina Alves' }
    ]
  },
  {
    id: 'manual-2',
    title: 'Atendimento com responsável',
    type: 'atendimento',
    date: '2026-06-13',
    startTime: '14:00',
    endTime: '14:30',
    studentId: 2,
    schoolId: 1,
    classId: 2,
    reservationId: 3,
    responsible: 'Pedro Souza',
    location: 'Nirart Maison - Recepção',
    status: 'agendado',
    notes: 'Revisar condições do parcelamento.',
    history: [
      { id: 1, date: '11/06/2026 16:00', action: 'Evento criado', user: 'Pedro Souza' }
    ]
  },
  {
    id: 'manual-3',
    title: 'Ajuste final do vestido',
    type: 'ajuste',
    date: '2026-06-18',
    startTime: '10:00',
    endTime: '11:00',
    studentId: 1,
    schoolId: 1,
    classId: 1,
    reservationId: 1,
    responsible: 'Ana Martins',
    location: 'Ateliê Nirart Maison',
    status: 'reagendado',
    notes: 'Evento transferido do dia 17 para o dia 18.',
    history: [
      { id: 1, date: '12/06/2026 08:30', action: 'Reagendado para 18/06/2026', user: 'Ana Martins' },
      { id: 2, date: '09/06/2026 11:00', action: 'Evento criado para 17/06/2026', user: 'Marina Alves' }
    ]
  }
]

export const MOCK_AGENDA_EVENTS = [
  ...MOCK_MANUAL_EVENTS,
  ...buildFittingEvents(),
  ...buildDeliveryEvents(),
  ...buildReturnEvents(),
  ...buildPaymentEvents(),
  ...buildSchoolEvents(),
  ...buildAdjustmentEvents()
]

export function getAgendaEventById(id) {
  return MOCK_AGENDA_EVENTS.find((event) => String(event.id) === String(id))
}

export function getEventType(type) {
  return EVENT_TYPES.find((item) => item.value === type) || EVENT_TYPES.at(-1)
}

function buildFittingEvents() {
  return MOCK_RESERVATIONS
    .filter((reservation) => reservation.fittingDate && reservation.status !== 'cancelado')
    .map((reservation) => ({
      id: `fitting-${reservation.id}`,
      title: `Prova da reserva #${reservation.id}`,
      type: 'prova de roupa',
      date: reservation.fittingDate,
      startTime: '09:00',
      endTime: '09:45',
      studentId: reservation.studentId,
      schoolId: reservation.schoolId,
      classId: reservation.classId,
      reservationId: reservation.id,
      responsible: 'Marina Alves',
      location: reservation.serviceLocation,
      status: reservation.status === 'confirmado' ? 'confirmado' : 'agendado',
      notes: 'Evento criado automaticamente a partir da data da prova.',
      history: [{ id: 1, date: 'Sistema', action: 'Gerado pela reserva', user: 'Agenda automática' }],
      automatic: true
    }))
}

function buildDeliveryEvents() {
  return MOCK_DELIVERIES
    .filter((delivery) => delivery.status !== 'cancelada')
    .map((delivery) => {
      const reservation = getReservationById(delivery.reservationId)
      return {
        id: `delivery-${delivery.id}`,
        title: `Entrega da reserva #${delivery.reservationId}`,
        type: 'entrega',
        date: delivery.deliveryDate,
        startTime: '14:00',
        endTime: '14:30',
        studentId: reservation?.studentId,
        schoolId: reservation?.schoolId,
        classId: reservation?.classId,
        reservationId: delivery.reservationId,
        responsible: delivery.deliveredBy || 'Marina Alves',
        location: reservation?.serviceLocation,
        status: delivery.status === 'entregue' ? 'realizado' : 'agendado',
        notes: delivery.notes || 'Entrega gerada automaticamente.',
        history: [{ id: 1, date: 'Sistema', action: 'Gerado pelo módulo Entregas', user: 'Agenda automática' }],
        automatic: true
      }
    })
}

function buildReturnEvents() {
  return MOCK_RETURNS
    .filter((itemReturn) => itemReturn.status !== 'cancelado')
    .map((itemReturn) => {
      const reservation = getReservationById(itemReturn.reservationId)
      return {
        id: `return-${itemReturn.id}`,
        title: `Devolução da reserva #${itemReturn.reservationId}`,
        type: 'devolução',
        date: itemReturn.actualReturnDate || itemReturn.expectedReturnDate,
        startTime: '16:00',
        endTime: '16:30',
        studentId: reservation?.studentId,
        schoolId: reservation?.schoolId,
        classId: reservation?.classId,
        reservationId: itemReturn.reservationId,
        responsible: itemReturn.receivedBy || 'Marina Alves',
        location: 'Nirart Maison - Recepção',
        status: itemReturn.status === 'pendente' ? 'agendado' : 'realizado',
        notes: itemReturn.notes || 'Devolução prevista gerada automaticamente.',
        history: [{ id: 1, date: 'Sistema', action: 'Gerado pelo módulo Devoluções', user: 'Agenda automática' }],
        automatic: true
      }
    })
}

function buildPaymentEvents() {
  return MOCK_PAYMENTS.flatMap((payment) => {
    const reservation = getReservationById(payment.reservationId)
    return payment.installments
      .filter((installment) => ['pendente', 'vencido'].includes(installment.status))
      .map((installment) => ({
        id: `payment-${payment.id}-${installment.id}`,
        title: `Vencimento da parcela ${installment.number}`,
        type: 'pagamento',
        date: installment.dueDate,
        startTime: '08:00',
        endTime: '08:15',
        studentId: reservation?.studentId,
        schoolId: reservation?.schoolId,
        classId: reservation?.classId,
        reservationId: payment.reservationId,
        responsible: 'Marina Alves',
        location: 'Financeiro Nirart Maison',
        status: installment.status === 'vencido' ? 'reagendado' : 'agendado',
        notes: `Parcela de ${formatCurrency(installment.value)}.`,
        history: [{ id: 1, date: 'Sistema', action: 'Gerado pelo módulo Pagamentos', user: 'Agenda automática' }],
        automatic: true
      }))
  })
}

function buildSchoolEvents() {
  return MOCK_RESERVATIONS
    .filter((reservation) => reservation.status !== 'cancelado')
    .map((reservation) => {
      const event = getReservationEvent(reservation.eventId)
      return {
        id: `school-${reservation.id}`,
        title: event?.name || `Evento da reserva #${reservation.id}`,
        type: 'evento escolar',
        date: reservation.eventDate,
        startTime: '19:00',
        endTime: '22:00',
        studentId: reservation.studentId,
        schoolId: reservation.schoolId,
        classId: reservation.classId,
        reservationId: reservation.id,
        responsible: 'Equipe Nirart',
        location: event?.name || reservation.serviceLocation,
        status: 'confirmado',
        notes: 'Evento escolar vinculado à reserva.',
        history: [{ id: 1, date: 'Sistema', action: 'Gerado pela reserva', user: 'Agenda automática' }],
        automatic: true
      }
    })
}

function buildAdjustmentEvents() {
  return MOCK_ADJUSTMENTS.slice(0, 2).map((adjustment) => {
    const reservation = MOCK_RESERVATIONS.find((item) => item.studentId === adjustment.studentId)
    return {
      id: `adjustment-${adjustment.id}`,
      title: `${adjustment.adjustmentType} - ${adjustment.piece}`,
      type: 'ajuste',
      date: toIsoDate(adjustment.date),
      startTime: '11:00',
      endTime: '11:45',
      studentId: adjustment.studentId,
      schoolId: reservation?.schoolId,
      classId: reservation?.classId,
      reservationId: reservation?.id,
      responsible: adjustment.responsible,
      location: 'Ateliê Nirart Maison',
      status: 'realizado',
      notes: adjustment.description,
      history: [{ id: 1, date: adjustment.date, action: 'Ajuste registrado', user: adjustment.responsible }],
      automatic: true
    }
  })
}

function toIsoDate(value) {
  const [day, month, year] = value.split('/')
  return `${year}-${month}-${day}`
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}
