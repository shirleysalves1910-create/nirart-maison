import { listarAlunos } from './alunos'
import { listarEscolas } from './escolas'
import { listarPagamentos } from './pagamentos'
import { listarTurmas } from './turmas'
import { supabase } from './supabase'

export async function carregarDashboard() {
  const [
    schools,
    classes,
    students,
    payments,
    financialView,
    inventoryView,
    reservationView,
    agendaView
  ] = await Promise.all([
    listarEscolas(),
    listarTurmas(),
    listarAlunos(),
    listarPagamentos(),
    consultarView('vw_dashboard_financeiro'),
    consultarView('vw_dashboard_estoque'),
    consultarView('vw_dashboard_reservas'),
    consultarView('vw_dashboard_agenda')
  ])

  const today = getLocalDate()
  const currentMonth = `${today.slice(0, 7)}-01`
  const pendingPayments = payments
    .filter((payment) => payment.status !== 'cancelado')
    .flatMap((payment) => payment.installments
      .filter((installment) => ['pendente', 'vencido'].includes(installment.displayStatus))
      .map((installment) => ({
        id: installment.id,
        paymentId: payment.id,
        student: payment.reservation?.student,
        school: payment.reservation?.school,
        amount: Number(installment.value || 0),
        dueDate: installment.dueDate,
        status: installment.dueDate < today ? 'Vencido' : formatDueStatus(installment.dueDate, today)
      })))
    .sort((first, second) => first.dueDate.localeCompare(second.dueDate))

  const inventoryTotals = inventoryView.reduce((totals, item) => ({
    total: totals.total + Number(item.quantidade_total || 0),
    reserved: totals.reserved + Number(item.quantidade_reservada || 0)
  }), { total: 0, reserved: 0 })

  const financialSummary = financialView[0] || {}

  return {
    schoolsCount: schools.length,
    activeClassesCount: classes.filter((item) => normalizarStatus(item.status) === 'ativa').length,
    studentsCount: students.length,
    monthReservationsCount: reservationView
      .filter((item) => item.mes === currentMonth)
      .reduce((total, item) => total + Number(item.quantidade_reservas || 0), 0),
    upcomingEvents: agendaView
      .filter((event) => (
        event.evento_futuro
        && event.status !== 'cancelado'
        && event.data >= today
      ))
      .sort((first, second) => (
        `${first.data} ${normalizarHora(first.hora_inicio)}`
          .localeCompare(`${second.data} ${normalizarHora(second.hora_inicio)}`)
      ))
      .slice(0, 3)
      .map((event) => ({
        id: event.id,
        name: event.titulo,
        date: event.data,
        time: normalizarHora(event.hora_inicio),
        status: event.status
      })),
    pendingPayments: pendingPayments.slice(0, 3),
    inventory: inventoryTotals,
    receivedInMonth: Number(financialSummary.total_recebido_mes || 0),
    totalReceivable: Number(financialSummary.total_a_receber || 0),
    overduePaymentsCount: Number(financialSummary.pagamentos_vencidos || 0),
    upcomingPaymentsCount: Number(financialSummary.pagamentos_a_vencer || 0)
  }
}

async function consultarView(view) {
  const { data, error } = await supabase.from(view).select('*')
  if (error) throw error
  return data || []
}

function formatDueStatus(dueDate, today) {
  const days = diferencaDias(today, dueDate)
  if (days === 0) return 'Vence hoje'
  if (days === 1) return 'Vence amanhã'
  return `Vence em ${days} dias`
}

function diferencaDias(start, end) {
  const [startYear, startMonth, startDay] = start.split('-').map(Number)
  const [endYear, endMonth, endDay] = end.split('-').map(Number)
  const startUtc = Date.UTC(startYear, startMonth - 1, startDay)
  const endUtc = Date.UTC(endYear, endMonth - 1, endDay)
  return Math.max(0, Math.round((endUtc - startUtc) / 86400000))
}

function normalizarStatus(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function normalizarHora(value) {
  return value ? String(value).slice(0, 5) : ''
}

function getLocalDate() {
  const today = new Date()
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-')
}
