import { listarDevolucoes } from './devolucoes'
import { listarEntregas } from './entregas'
import { listarEscolas } from './escolas'
import { listarEstoque } from './estoque'
import {
  getRemainingTotal,
  listarPagamentos
} from './pagamentos'
import { listarReservas } from './reservas'
import { supabase } from './supabase'
import { listarTurmas } from './turmas'

export const DEFAULT_REPORT_FILTERS = {
  dateFrom: getYearStart(),
  dateTo: getYearEnd(),
  schoolId: '',
  classId: '',
  status: '',
  itemType: ''
}

export async function carregarBaseRelatorios() {
  const [
    reservations,
    payments,
    inventory,
    deliveries,
    returns,
    schools,
    classes,
    financialView,
    inventoryView,
    reservationsView,
    agendaView
  ] = await Promise.all([
    listarReservas(),
    listarPagamentos(),
    listarEstoque(),
    listarEntregas(),
    listarDevolucoes(),
    listarEscolas(),
    listarTurmas(),
    consultarView('vw_dashboard_financeiro'),
    consultarView('vw_dashboard_estoque'),
    consultarView('vw_dashboard_reservas'),
    consultarView('vw_dashboard_agenda')
  ])

  return {
    reservations,
    payments,
    inventory,
    deliveries,
    returns,
    schools,
    classes,
    views: {
      financial: financialView,
      inventory: inventoryView,
      reservations: reservationsView,
      agenda: agendaView
    }
  }
}

export function gerarRelatorio(base, filters = DEFAULT_REPORT_FILTERS) {
  if (!base) return criarRelatorioVazio()

  const inventory = base.inventory.filter((item) => (
    !filters.itemType || item.type === filters.itemType
  ))
  const reservations = base.reservations
    .filter((reservation) => correspondeFiltrosReserva(reservation, filters))
    .sort((first, second) => second.eventDate.localeCompare(first.eventDate))
  const reservationIds = new Set(reservations.map((reservation) => reservation.id))
  const payments = base.payments.filter((payment) => reservationIds.has(payment.reservationId))
  const deliveries = base.deliveries.filter((delivery) => reservationIds.has(delivery.reservationId))
  const returns = base.returns.filter((itemReturn) => reservationIds.has(itemReturn.reservationId))
  const installmentEntries = achatarParcelas(payments)
  const today = getLocalDate()

  const overduePayments = installmentEntries
    .filter(({ installment }) => (
      installment.status !== 'cancelado'
      && installment.status !== 'pago'
      && installment.dueDate < today
    ))
    .sort((first, second) => first.installment.dueDate.localeCompare(second.installment.dueDate))

  const upcomingPayments = installmentEntries
    .filter(({ installment }) => (
      installment.status === 'pendente'
      && installment.dueDate >= today
    ))
    .sort((first, second) => first.installment.dueDate.localeCompare(second.installment.dueDate))

  const receivedTransactions = montarRecebimentos(payments)
    .filter((entry) => correspondePeriodo(entry.date, filters))
    .sort((first, second) => second.date.localeCompare(first.date))

  const currentMonth = today.slice(0, 7)
  const receivedInMonth = montarRecebimentos(payments)
    .filter((entry) => entry.date?.startsWith(currentMonth))
    .reduce((total, entry) => total + entry.value, 0)

  const totalPaid = receivedTransactions.reduce((total, entry) => total + entry.value, 0)
  const totalReceivable = payments.reduce(
    (total, payment) => total + Number(getRemainingTotal(payment)),
    0
  )
  const pendingDeliveries = deliveries.filter((delivery) => delivery.status === 'pendente')
  const pendingReturns = returns.filter((itemReturn) => itemReturn.status === 'pendente')
  const overdueReturns = returns.filter((itemReturn) => (
    itemReturn.status === 'atrasado'
    || (
      itemReturn.status === 'pendente'
      && itemReturn.expectedReturnDate
      && itemReturn.expectedReturnDate < today
    )
  ))
  const inventoryTotals = somarEstoque(inventory)
  const itemRanking = montarRankingItens(reservations, inventory)

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
    activeReservations: reservations.filter((reservation) => (
      !['devolvido', 'cancelado'].includes(reservation.status)
    )),
    pendingDeliveries,
    pendingReturns,
    overdueReturns,
    inventoryTotals,
    itemRanking,
    mostRentedItems: [...inventory]
      .filter((item) => Number(item.rentedQuantity || 0) > 0)
      .sort((first, second) => Number(second.rentedQuantity) - Number(first.rentedQuantity))
      .slice(0, 5),
    reservationsByMonth: agruparReservasPorMes(reservations, filters),
    reservationsBySchool: agruparReservasPorEntidade(reservations, base.schools, 'schoolId', 'fantasyName'),
    reservationsByClass: agruparReservasPorEntidade(reservations, base.classes, 'classId', 'name'),
    financialByMonth: montarFinanceiroPorMes(payments, filters),
    recentReservations: reservations.slice(0, 5),
    upcomingReturns: pendingReturns
      .filter((itemReturn) => itemReturn.expectedReturnDate)
      .sort((first, second) => first.expectedReturnDate.localeCompare(second.expectedReturnDate))
      .slice(0, 5),
    schools: base.schools,
    classes: base.classes,
    views: base.views
  }
}

function correspondeFiltrosReserva(reservation, filters) {
  const matchesItemType = !filters.itemType || reservation.items.some((item) => (
    item.inventoryType === filters.itemType
  ))
  return (
    correspondePeriodo(reservation.eventDate, filters)
    && (!filters.schoolId || reservation.schoolId === filters.schoolId)
    && (!filters.classId || reservation.classId === filters.classId)
    && (!filters.status || reservation.status === filters.status)
    && matchesItemType
  )
}

function correspondePeriodo(date, filters) {
  return Boolean(date)
    && (!filters.dateFrom || date >= filters.dateFrom)
    && (!filters.dateTo || date <= filters.dateTo)
}

function achatarParcelas(payments) {
  return payments.flatMap((payment) => payment.installments.map((installment) => ({
    payment,
    installment,
    student: payment.reservation?.student,
    school: payment.reservation?.school,
    studentClass: payment.reservation?.studentClass
  })))
}

function montarRecebimentos(payments) {
  return payments.flatMap((payment) => {
    const context = {
      payment,
      student: payment.reservation?.student,
      school: payment.reservation?.school,
      studentClass: payment.reservation?.studentClass
    }
    const downPayment = Number(payment.downPayment || 0) > 0 && payment.downPaymentDate
      ? [{
          id: `entrada-${payment.id}`,
          date: payment.downPaymentDate,
          value: Number(payment.downPayment),
          method: payment.downPaymentMethod,
          description: 'Entrada',
          ...context
        }]
      : []
    const installments = payment.installments
      .filter((installment) => installment.status === 'pago' && installment.paymentDate)
      .map((installment) => ({
        id: `parcela-${installment.id}`,
        installment,
        date: installment.paymentDate,
        value: Number(installment.value || 0),
        method: installment.paymentMethod,
        description: `Parcela ${installment.number}`,
        ...context
      }))
    return [...downPayment, ...installments]
  })
}

function montarRankingItens(reservations, inventory) {
  const allowedIds = new Set(inventory.map((item) => item.id))
  const inventoryById = new Map(inventory.map((item) => [item.id, item]))
  const quantities = new Map()

  reservations.forEach((reservation) => {
    reservation.items.forEach((item) => {
      if (!allowedIds.has(item.inventoryId)) return
      quantities.set(
        item.inventoryId,
        (quantities.get(item.inventoryId) || 0) + Number(item.quantity || 0)
      )
    })
  })

  return [...quantities.entries()]
    .map(([inventoryId, quantity]) => ({ item: inventoryById.get(inventoryId), quantity }))
    .filter((entry) => entry.item)
    .sort((first, second) => second.quantity - first.quantity)
    .slice(0, 5)
}

function somarEstoque(inventory) {
  return inventory.reduce((totals, item) => ({
    total: totals.total + Number(item.totalQuantity || 0),
    available: totals.available + Number(item.availableQuantity || 0),
    reserved: totals.reserved + Number(item.reservedQuantity || 0),
    rented: totals.rented + Number(item.rentedQuantity || 0)
  }), { total: 0, available: 0, reserved: 0, rented: 0 })
}

function agruparReservasPorMes(reservations, filters) {
  return obterMesesDoPeriodo(filters, reservations).map((month) => ({
    label: formatMonthLabel(month),
    value: reservations.filter((reservation) => reservation.eventDate.startsWith(month)).length
  }))
}

function agruparReservasPorEntidade(reservations, entities, reservationKey, entityLabel) {
  return entities
    .map((entity) => ({
      label: entity[entityLabel],
      value: reservations.filter((reservation) => reservation[reservationKey] === entity.id).length
    }))
    .filter((entry) => entry.value > 0)
    .sort((first, second) => second.value - first.value)
}

function montarFinanceiroPorMes(payments, filters) {
  const transactions = montarRecebimentos(payments)
  const installments = achatarParcelas(payments)
  return obterMesesDoPeriodo(filters, []).map((month) => ({
    label: formatMonthLabel(month),
    received: transactions
      .filter((entry) => entry.date?.startsWith(month))
      .reduce((total, entry) => total + entry.value, 0),
    receivable: installments
      .filter(({ installment }) => (
        ['pendente', 'vencido'].includes(installment.displayStatus)
        && installment.dueDate.startsWith(month)
      ))
      .reduce((total, { installment }) => total + Number(installment.value || 0), 0)
  }))
}

function obterMesesDoPeriodo(filters, reservations) {
  const fallbackDates = reservations.map((reservation) => reservation.eventDate).filter(Boolean)
  const start = filters.dateFrom || fallbackDates.sort()[0] || getYearStart()
  const end = filters.dateTo || fallbackDates.sort().at(-1) || getYearEnd()
  const [startYear, startMonth] = start.split('-').map(Number)
  const [endYear, endMonth] = end.split('-').map(Number)
  const months = []
  let year = startYear
  let month = startMonth

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`)
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
    if (months.length >= 12) break
  }

  return months
}

async function consultarView(view) {
  const { data, error } = await supabase.from(view).select('*')
  if (error) throw error
  return data || []
}

function criarRelatorioVazio() {
  return {
    reservations: [],
    payments: [],
    inventory: [],
    receivedInMonth: 0,
    receivedTransactions: [],
    totalPaid: 0,
    totalReceivable: 0,
    overduePayments: [],
    upcomingPayments: [],
    activeReservations: [],
    pendingDeliveries: [],
    pendingReturns: [],
    overdueReturns: [],
    inventoryTotals: { total: 0, available: 0, reserved: 0, rented: 0 },
    itemRanking: [],
    mostRentedItems: [],
    reservationsByMonth: [],
    reservationsBySchool: [],
    reservationsByClass: [],
    financialByMonth: [],
    recentReservations: [],
    upcomingReturns: [],
    schools: [],
    classes: [],
    views: {}
  }
}

function formatMonthLabel(month) {
  const [year, monthNumber] = month.split('-')
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })
    .format(new Date(Date.UTC(Number(year), Number(monthNumber) - 1, 1)))
    .replace('.', '')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function getLocalDate() {
  const today = new Date()
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-')
}

function getYearStart() {
  return `${new Date().getFullYear()}-01-01`
}

function getYearEnd() {
  return `${new Date().getFullYear()}-12-31`
}
