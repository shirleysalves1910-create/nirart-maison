import { MOCK_CLASSES, MOCK_SCHOOLS, MOCK_STUDENTS } from './mockData'
import { MOCK_DELIVERIES, MOCK_RETURNS } from './deliveryReturnMockData'
import { MOCK_INVENTORY_ITEMS } from './inventoryMockData'
import { getPaidTotal, getRemainingTotal, MOCK_PAYMENTS } from './paymentMockData'
import { MOCK_RESERVATIONS } from './reservationMockData'

export const REPORT_REFERENCE_DATE = '2026-06-12'

export const DEFAULT_REPORT_FILTERS = {
  dateFrom: '2026-06-01',
  dateTo: '2026-09-30',
  schoolId: '',
  classId: '',
  status: '',
  itemType: ''
}

export function buildReportData(filters = DEFAULT_REPORT_FILTERS) {
  const reservations = MOCK_RESERVATIONS
    .filter((reservation) => matchesReservationFilters(reservation, filters))
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate))
  const reservationIds = new Set(reservations.map((reservation) => String(reservation.id)))
  const payments = MOCK_PAYMENTS.filter((payment) => reservationIds.has(String(payment.reservationId)))
  const inventory = MOCK_INVENTORY_ITEMS.filter((item) => !filters.itemType || item.type === filters.itemType)
  const deliveries = MOCK_DELIVERIES.filter((delivery) => reservationIds.has(String(delivery.reservationId)))
  const returns = MOCK_RETURNS.filter((itemReturn) => reservationIds.has(String(itemReturn.reservationId)))

  const overduePayments = flattenInstallments(payments)
    .filter(({ installment }) => installment.status === 'vencido' || (
      installment.status === 'pendente' && installment.dueDate < REPORT_REFERENCE_DATE
    ))
    .sort((a, b) => a.installment.dueDate.localeCompare(b.installment.dueDate))

  const upcomingPayments = flattenInstallments(payments)
    .filter(({ installment }) => (
      installment.status === 'pendente' && installment.dueDate >= REPORT_REFERENCE_DATE
    ))
    .sort((a, b) => a.installment.dueDate.localeCompare(b.installment.dueDate))

  const receivedInMonth = payments.reduce((total, payment) => {
    const downPayment = isCurrentMonth(payment.downPaymentDate) ? Number(payment.downPayment || 0) : 0
    const installments = payment.installments.reduce((sum, installment) => (
      installment.status === 'pago' && isCurrentMonth(installment.paymentDate)
        ? sum + Number(installment.value || 0)
        : sum
    ), 0)
    return total + downPayment + installments
  }, 0)

  const totalReceivable = payments.reduce((total, payment) => total + getRemainingTotal(payment), 0)
  const totalPaid = payments.reduce((total, payment) => total + getPaidTotal(payment), 0)
  const receivedTransactions = buildReceivedTransactions(payments)
  const pendingDeliveries = deliveries.filter((delivery) => delivery.status === 'pendente')
  const pendingReturns = returns.filter((itemReturn) => itemReturn.status === 'pendente')
  const overdueReturns = returns.filter((itemReturn) => (
    itemReturn.status === 'atrasado' ||
    (itemReturn.status === 'pendente' && itemReturn.expectedReturnDate < REPORT_REFERENCE_DATE)
  ))

  const itemRanking = buildItemRanking(reservations, inventory)
  const inventoryTotals = inventory.reduce((totals, item) => {
    const total = Number(item.totalQuantity || 0)
    const reserved = Number(item.reservedQuantity || 0)
    const rented = Number(item.rentedQuantity || 0)
    return {
      total: totals.total + total,
      available: totals.available + Math.max(0, total - reserved - rented),
      reserved: totals.reserved + reserved,
      rented: totals.rented + rented
    }
  }, { total: 0, available: 0, reserved: 0, rented: 0 })

  return {
    reservations,
    payments,
    inventory,
    receivedInMonth,
    receivedTransactions,
    totalPaid,
    totalReceivable,
    overduePayments,
    upcomingPayments,
    activeReservations: reservations.filter((reservation) => !['devolvido', 'cancelado'].includes(reservation.status)),
    pendingDeliveries,
    pendingReturns,
    overdueReturns,
    inventoryTotals,
    itemRanking,
    mostRentedItems: [...inventory]
      .sort((a, b) => Number(b.rentedQuantity || 0) - Number(a.rentedQuantity || 0))
      .slice(0, 5),
    reservationsByMonth: groupReservationsByMonth(reservations),
    reservationsBySchool: groupReservationsByEntity(reservations, 'schoolId', MOCK_SCHOOLS, 'fantasyName'),
    reservationsByClass: groupReservationsByEntity(reservations, 'classId', MOCK_CLASSES, 'name'),
    financialByMonth: buildFinancialByMonth(payments),
    recentReservations: reservations.slice(0, 5),
    upcomingReturns: returns
      .filter((itemReturn) => itemReturn.status === 'pendente')
      .sort((a, b) => a.expectedReturnDate.localeCompare(b.expectedReturnDate))
      .slice(0, 5)
  }
}

export function getReportContext(reservationId) {
  const reservation = MOCK_RESERVATIONS.find((item) => String(item.id) === String(reservationId))
  return {
    reservation,
    student: MOCK_STUDENTS.find((item) => String(item.id) === String(reservation?.studentId)),
    school: MOCK_SCHOOLS.find((item) => String(item.id) === String(reservation?.schoolId)),
    studentClass: MOCK_CLASSES.find((item) => String(item.id) === String(reservation?.classId))
  }
}

function matchesReservationFilters(reservation, filters) {
  const isInPeriod = (
    (!filters.dateFrom || reservation.eventDate >= filters.dateFrom) &&
    (!filters.dateTo || reservation.eventDate <= filters.dateTo)
  )
  const hasItemType = !filters.itemType || reservation.items.some((entry) => (
    MOCK_INVENTORY_ITEMS.find((item) => String(item.id) === String(entry.inventoryId))?.type === filters.itemType
  ))
  return (
    isInPeriod &&
    (!filters.schoolId || String(reservation.schoolId) === String(filters.schoolId)) &&
    (!filters.classId || String(reservation.classId) === String(filters.classId)) &&
    (!filters.status || reservation.status === filters.status) &&
    hasItemType
  )
}

function flattenInstallments(payments) {
  return payments.flatMap((payment) => payment.installments.map((installment) => ({
    payment,
    installment,
    ...getReportContext(payment.reservationId)
  })))
}

function buildItemRanking(reservations, inventory) {
  const allowedIds = new Set(inventory.map((item) => String(item.id)))
  const quantities = reservations.reduce((result, reservation) => {
    reservation.items.forEach((entry) => {
      const key = String(entry.inventoryId)
      if (allowedIds.has(key)) result[key] = (result[key] || 0) + Number(entry.quantity || 0)
    })
    return result
  }, {})

  return Object.entries(quantities)
    .map(([inventoryId, quantity]) => ({
      item: MOCK_INVENTORY_ITEMS.find((entry) => String(entry.id) === inventoryId),
      quantity
    }))
    .filter((entry) => entry.item)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
}

function groupReservationsByMonth(reservations) {
  const months = [
    ['2026-05', 'Mai'],
    ['2026-06', 'Jun'],
    ['2026-07', 'Jul'],
    ['2026-08', 'Ago'],
    ['2026-09', 'Set']
  ]
  return months.map(([key, label]) => ({
    label,
    value: reservations.filter((reservation) => reservation.eventDate.startsWith(key)).length
  }))
}

function buildReceivedTransactions(payments) {
  return payments.flatMap((payment) => {
    const context = getReportContext(payment.reservationId)
    const downPayment = payment.downPayment && payment.downPaymentDate
      ? [{
          id: `entry-${payment.id}`,
          payment,
          date: payment.downPaymentDate,
          value: Number(payment.downPayment),
          method: payment.downPaymentMethod,
          description: 'Entrada',
          ...context
        }]
      : []
    const installments = payment.installments
      .filter((installment) => installment.status === 'pago')
      .map((installment) => ({
        id: `installment-${installment.id}`,
        payment,
        installment,
        date: installment.paymentDate,
        value: Number(installment.value || 0),
        method: installment.paymentMethod,
        description: `Parcela ${installment.number}`,
        ...context
      }))
    return [...downPayment, ...installments]
  }).sort((a, b) => b.date.localeCompare(a.date))
}

function buildFinancialByMonth(payments) {
  const months = [
    ['2026-05', 'Mai'],
    ['2026-06', 'Jun'],
    ['2026-07', 'Jul'],
    ['2026-08', 'Ago'],
    ['2026-09', 'Set']
  ]
  return months.map(([key, label]) => {
    const received = buildReceivedTransactions(payments)
      .filter((entry) => entry.date?.startsWith(key))
      .reduce((total, entry) => total + entry.value, 0)
    const receivable = flattenInstallments(payments)
      .filter(({ installment }) => (
        ['pendente', 'vencido'].includes(installment.status) && installment.dueDate.startsWith(key)
      ))
      .reduce((total, { installment }) => total + Number(installment.value || 0), 0)
    return { label, received, receivable }
  })
}

function groupReservationsByEntity(reservations, key, entities, labelKey) {
  return entities
    .map((entity) => ({
      label: entity[labelKey],
      value: reservations.filter((reservation) => String(reservation[key]) === String(entity.id)).length
    }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value)
}

function isCurrentMonth(value) {
  return Boolean(value?.startsWith('2026-06'))
}
