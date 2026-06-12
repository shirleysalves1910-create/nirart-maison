import { getReservationById, getReservationItem } from './reservationMockData'

export const DELIVERY_STATUSES = ['pendente', 'entregue', 'cancelada']

export const RETURN_STATUSES = ['pendente', 'devolvido', 'atrasado', 'com avaria', 'cancelado']

export const ITEM_CONDITIONS = [
  'Perfeito estado',
  'Bom estado',
  'Necessita higienização',
  'Com avaria'
]

export const MOCK_DELIVERIES = [
  {
    id: 1,
    reservationId: 1,
    deliveryDate: '2026-06-26',
    deliveredBy: 'Marina Alves',
    receivedBy: 'Mariana Souza',
    notes: 'Itens conferidos com a responsável.',
    status: 'entregue',
    checklist: {
      clothes: true,
      shoes: true,
      accessories: true,
      kits: false,
      packaging: true
    }
  },
  {
    id: 2,
    reservationId: 2,
    deliveryDate: '2026-08-13',
    deliveredBy: 'Julia Santos',
    receivedBy: '',
    notes: 'Entrega agendada na escola.',
    status: 'pendente',
    checklist: {
      clothes: false,
      shoes: false,
      accessories: false,
      kits: false,
      packaging: false
    }
  },
  {
    id: 3,
    reservationId: 3,
    deliveryDate: '2026-07-10',
    deliveredBy: 'Pedro Souza',
    receivedBy: '',
    notes: '',
    status: 'pendente',
    checklist: {
      clothes: false,
      shoes: false,
      accessories: false,
      kits: false,
      packaging: false
    }
  },
  {
    id: 4,
    reservationId: 4,
    deliveryDate: '2026-06-06',
    deliveredBy: 'Marina Alves',
    receivedBy: 'João Nunes',
    notes: 'Kit entregue completo.',
    status: 'entregue',
    checklist: {
      clothes: false,
      shoes: false,
      accessories: false,
      kits: true,
      packaging: true
    }
  },
  {
    id: 5,
    reservationId: 5,
    deliveryDate: '2026-09-18',
    deliveredBy: '',
    receivedBy: '',
    notes: 'Entrega cancelada junto com a reserva.',
    status: 'cancelada',
    checklist: {
      clothes: false,
      shoes: false,
      accessories: false,
      kits: false,
      packaging: false
    }
  }
]

export const MOCK_RETURNS = [
  {
    id: 1,
    reservationId: 1,
    expectedReturnDate: '2026-06-30',
    actualReturnDate: '',
    receivedBy: '',
    itemCondition: '',
    wasLate: false,
    hadDamage: false,
    lateFee: 0,
    damageFee: 0,
    notes: '',
    status: 'pendente',
    checklist: {
      clothes: false,
      shoes: false,
      accessories: false,
      kits: false,
      packaging: false
    }
  },
  {
    id: 2,
    reservationId: 2,
    expectedReturnDate: '2026-08-17',
    actualReturnDate: '',
    receivedBy: '',
    itemCondition: '',
    wasLate: false,
    hadDamage: false,
    lateFee: 0,
    damageFee: 0,
    notes: '',
    status: 'pendente',
    checklist: {
      clothes: false,
      shoes: false,
      accessories: false,
      kits: false,
      packaging: false
    }
  },
  {
    id: 3,
    reservationId: 3,
    expectedReturnDate: '2026-07-14',
    actualReturnDate: '',
    receivedBy: '',
    itemCondition: '',
    wasLate: false,
    hadDamage: false,
    lateFee: 0,
    damageFee: 0,
    notes: '',
    status: 'pendente',
    checklist: {
      clothes: false,
      shoes: false,
      accessories: false,
      kits: false,
      packaging: false
    }
  },
  {
    id: 4,
    reservationId: 4,
    expectedReturnDate: '2026-06-10',
    actualReturnDate: '2026-06-12',
    receivedBy: 'Marina Alves',
    itemCondition: 'Com avaria',
    wasLate: true,
    hadDamage: true,
    lateFee: 40,
    damageFee: 80,
    notes: 'A embalagem apresentou rasgo e o vestido precisa de reparo.',
    status: 'com avaria',
    checklist: {
      clothes: false,
      shoes: false,
      accessories: false,
      kits: true,
      packaging: true
    }
  },
  {
    id: 5,
    reservationId: 5,
    expectedReturnDate: '2026-09-22',
    actualReturnDate: '',
    receivedBy: '',
    itemCondition: '',
    wasLate: false,
    hadDamage: false,
    lateFee: 0,
    damageFee: 0,
    notes: 'Devolução cancelada junto com a reserva.',
    status: 'cancelado',
    checklist: {
      clothes: false,
      shoes: false,
      accessories: false,
      kits: false,
      packaging: false
    }
  }
]

export function getDeliveryByReservationId(reservationId) {
  return MOCK_DELIVERIES.find((delivery) => String(delivery.reservationId) === String(reservationId))
}

export function getReturnByReservationId(reservationId) {
  return MOCK_RETURNS.find((itemReturn) => String(itemReturn.reservationId) === String(reservationId))
}

export function getReservationChecklist(reservationId, completed = false) {
  const reservation = getReservationById(reservationId)
  const itemTypes = new Set(
    reservation?.items.map((entry) => getReservationItem(entry.inventoryId)?.type) || []
  )

  return {
    clothes: itemTypes.has('Roupa') ? completed : false,
    shoes: itemTypes.has('Sapato') ? completed : false,
    accessories: itemTypes.has('Acessorio') ? completed : false,
    kits: itemTypes.has('Kit') ? completed : false,
    packaging: completed
  }
}

export function getApplicableChecklistItems(reservationId) {
  const reservation = getReservationById(reservationId)
  const itemTypes = new Set(
    reservation?.items.map((entry) => getReservationItem(entry.inventoryId)?.type) || []
  )

  return [
    { key: 'clothes', label: 'Roupa', applicable: itemTypes.has('Roupa') },
    { key: 'shoes', label: 'Sapato', applicable: itemTypes.has('Sapato') },
    { key: 'accessories', label: 'Acessório', applicable: itemTypes.has('Acessorio') },
    { key: 'kits', label: 'Kit', applicable: itemTypes.has('Kit') },
    { key: 'packaging', label: 'Embalagem', applicable: true }
  ]
}

export function getReturnFineTotal(itemReturn) {
  return Number(itemReturn?.lateFee || 0) + Number(itemReturn?.damageFee || 0)
}
