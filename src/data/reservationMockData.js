import { MOCK_INVENTORY_ITEMS } from './inventoryMockData'

export const RESERVATION_STATUSES = [
  'pré-reserva',
  'reservado',
  'confirmado',
  'entregue',
  'devolvido',
  'cancelado'
]

export const SERVICE_TYPES = [
  'Na loja',
  'Na escola',
  'Em domicílio'
]

export const MOCK_RESERVATION_EVENTS = [
  { id: 1, name: 'Formatura do 6º Ano', schoolId: 1, classId: 1, date: '2026-06-28' },
  { id: 2, name: 'Apresentação Cultural', schoolId: 1, classId: 1, date: '2026-08-15' },
  { id: 3, name: 'Baile de Formatura', schoolId: 1, classId: 2, date: '2026-07-12' },
  { id: 4, name: 'Cerimônia de Conclusão', schoolId: 2, classId: 3, date: '2026-06-08' },
  { id: 5, name: 'Evento de Encerramento', schoolId: 2, classId: 3, date: '2026-09-20' }
]

export const MOCK_RESERVATIONS = [
  {
    id: 1,
    eventId: 1,
    studentId: 1,
    schoolId: 1,
    classId: 1,
    eventDate: '2026-06-28',
    fittingDate: '2026-06-18',
    deliveryDate: '2026-06-26',
    expectedReturnDate: '2026-06-30',
    serviceType: 'Na loja',
    serviceLocation: 'Nirart Maison - Unidade Centro',
    status: 'confirmado',
    notes: 'Ajustar a barra do vestido após a prova.',
    items: [
      { inventoryId: 1, quantity: 1, unitValue: 280 },
      { inventoryId: 101, quantity: 1, unitValue: 90 },
      { inventoryId: 201, quantity: 1, unitValue: 55 }
    ]
  },
  {
    id: 2,
    eventId: 2,
    studentId: 1,
    schoolId: 1,
    classId: 1,
    eventDate: '2026-08-15',
    fittingDate: '2026-08-05',
    deliveryDate: '2026-08-13',
    expectedReturnDate: '2026-08-17',
    serviceType: 'Na escola',
    serviceLocation: 'Escola Estadual Professora Maria Silva',
    status: 'pré-reserva',
    notes: 'Reserva para apresentação cultural.',
    items: [
      { inventoryId: 3, quantity: 1, unitValue: 190 }
    ]
  },
  {
    id: 3,
    eventId: 3,
    studentId: 2,
    schoolId: 1,
    classId: 2,
    eventDate: '2026-07-12',
    fittingDate: '2026-07-02',
    deliveryDate: '2026-07-10',
    expectedReturnDate: '2026-07-14',
    serviceType: 'Na loja',
    serviceLocation: 'Nirart Maison - Unidade Centro',
    status: 'reservado',
    notes: 'Confirmar numeração do sapato durante a prova.',
    items: [
      { inventoryId: 301, quantity: 1, unitValue: 420 }
    ]
  },
  {
    id: 4,
    eventId: 4,
    studentId: 3,
    schoolId: 2,
    classId: 3,
    eventDate: '2026-06-08',
    fittingDate: '2026-05-28',
    deliveryDate: '2026-06-06',
    expectedReturnDate: '2026-06-10',
    serviceType: 'Em domicílio',
    serviceLocation: 'Rua das Flores, 88',
    status: 'devolvido',
    notes: 'Itens devolvidos sem avarias.',
    items: [
      { inventoryId: 302, quantity: 1, unitValue: 390 }
    ]
  },
  {
    id: 5,
    eventId: 5,
    studentId: 3,
    schoolId: 2,
    classId: 3,
    eventDate: '2026-09-20',
    fittingDate: '2026-09-10',
    deliveryDate: '2026-09-18',
    expectedReturnDate: '2026-09-22',
    serviceType: 'Na escola',
    serviceLocation: 'Colégio Particular São João',
    status: 'cancelado',
    notes: 'Evento cancelado pela escola.',
    items: [
      { inventoryId: 1, quantity: 1, unitValue: 280 }
    ]
  }
]

export function getReservationById(id) {
  return MOCK_RESERVATIONS.find((reservation) => String(reservation.id) === String(id))
}

export function getReservationItem(inventoryId) {
  return MOCK_INVENTORY_ITEMS.find((item) => String(item.id) === String(inventoryId))
}

export function getReservationTotal(reservation) {
  return reservation.items.reduce(
    (total, item) => total + Number(item.quantity || 0) * Number(item.unitValue || 0),
    0
  )
}

export function getReservationItemsQuantity(reservation) {
  return reservation.items.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  )
}

export function getReservationEvent(eventId) {
  return MOCK_RESERVATION_EVENTS.find((event) => String(event.id) === String(eventId))
}

export function getInventoryRentalValue(item) {
  return Number(item?.rentalValue ?? item?.totalValue ?? 0)
}
