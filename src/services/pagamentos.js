import { supabase } from './supabase'

const PAYMENT_COLUMNS = [
  'id', 'reserva_id', 'valor_total', 'desconto', 'acrescimo', 'valor_final',
  'valor_entrada', 'data_entrada', 'forma_pagamento_entrada',
  'quantidade_parcelas', 'status', 'observacoes', 'motivo_cancelamento',
  'criado_por', 'created_at', 'updated_at'
].join(', ')

const PAYMENT_SELECT = `
  ${PAYMENT_COLUMNS},
  reserva:reservas (
    id, valor_total, data_evento, status,
    aluno:alunos (
      id, nome_completo, telefone, nome_responsavel, telefone_responsavel
    ),
    escola:escolas (id, nome_fantasia),
    turma:turmas (id, nome)
  ),
  parcelas (
    id, pagamento_id, numero, valor, data_vencimento, data_pagamento,
    status, forma_pagamento, observacoes, baixado_por, created_at, updated_at
  )
`

export const PAYMENT_STATUSES = ['aberto', 'parcial', 'quitado', 'cancelado']

export const PAYMENT_METHODS = [
  'Dinheiro',
  'PIX',
  'Cartão de débito',
  'Cartão de crédito',
  'Transferência bancária'
]

export async function listarPagamentos() {
  const { data, error } = await supabase
    .from('pagamentos')
    .select(PAYMENT_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(normalizarPagamento)
}

export async function buscarPagamentoPorId(id) {
  const { data, error } = await supabase
    .from('pagamentos')
    .select(PAYMENT_SELECT)
    .eq('id', id)
    .single()

  if (error) throw error
  return normalizarPagamento(data)
}

export async function criarPagamento(form) {
  const reservationTotal = await buscarValorReserva(form.reservationId)
  const calculation = calcularPagamento({ ...form, totalValue: reservationTotal })
  const status = calcularStatusPorValores(calculation.finalCents, calculation.downPaymentCents, 0)

  const { data, error } = await supabase
    .from('pagamentos')
    .insert(mapearPagamentoParaBanco(form, calculation, status))
    .select('id')
    .single()

  if (error) throw error

  try {
    await inserirParcelas(data.id, gerarParcelas(
      calculation.remainingCents,
      calculation.installmentCount,
      form.firstDueDate
    ))
  } catch (installmentError) {
    await supabase.from('pagamentos').delete().eq('id', data.id)
    throw installmentError
  }

  return buscarPagamentoPorId(data.id)
}

export async function atualizarPagamento(id, form) {
  const current = await buscarPagamentoPorId(id)
  if (current.status === 'cancelado') {
    throw new Error('Pagamentos cancelados não podem ser editados.')
  }

  const reservationTotal = await buscarValorReserva(form.reservationId)
  const paidInstallments = current.installments.filter((item) => item.status === 'pago')
  const paidInstallmentsCents = paidInstallments.reduce(
    (total, item) => total + toCents(item.value),
    0
  )
  const calculation = calcularPagamento({
    ...form,
    totalValue: reservationTotal,
    paidInstallmentsCents,
    paidInstallmentCount: paidInstallments.length
  })

  const highestPaidNumber = paidInstallments.reduce(
    (highest, item) => Math.max(highest, item.number),
    0
  )
  if (calculation.installmentCount < highestPaidNumber) {
    throw new Error('A quantidade de parcelas não pode ser menor que o número de parcelas já pagas.')
  }

  const openNumbers = Array.from(
    { length: calculation.installmentCount },
    (_, index) => index + 1
  ).filter((number) => !paidInstallments.some((item) => item.number === number))

  if (calculation.remainingCents > 0 && openNumbers.length === 0) {
    throw new Error('Informe parcelas suficientes para o saldo restante.')
  }

  const nextInstallments = gerarParcelas(
    calculation.remainingCents,
    openNumbers.length,
    form.firstDueDate,
    openNumbers
  )
  const status = calcularStatusPorValores(
    calculation.finalCents,
    calculation.downPaymentCents,
    paidInstallmentsCents
  )

  const previousPayment = await buscarPagamentoBruto(id)
  const { error } = await supabase
    .from('pagamentos')
    .update(mapearPagamentoParaBanco(form, calculation, status))
    .eq('id', id)

  if (error) throw error

  try {
    const { error: deleteError } = await supabase
      .from('parcelas')
      .delete()
      .eq('pagamento_id', id)
      .neq('status', 'pago')

    if (deleteError) throw deleteError
    await inserirParcelas(id, nextInstallments)
  } catch (installmentError) {
    await restaurarPagamento(previousPayment)
    throw installmentError
  }

  return buscarPagamentoPorId(id)
}

export async function cancelarPagamento(id, reason) {
  const { error: installmentError } = await supabase
    .from('parcelas')
    .update({ status: 'cancelado' })
    .eq('pagamento_id', id)
    .neq('status', 'pago')

  if (installmentError) throw installmentError

  const { data, error } = await supabase
    .from('pagamentos')
    .update({
      status: 'cancelado',
      motivo_cancelamento: textoOpcional(reason)
    })
    .eq('id', id)
    .select(PAYMENT_SELECT)
    .single()

  if (error) throw error
  return normalizarPagamento(data)
}

export async function darBaixaParcela(paymentId, installmentId, form) {
  const { data: installment, error: installmentError } = await supabase
    .from('parcelas')
    .update({
      data_pagamento: form.paymentDate,
      forma_pagamento: form.paymentMethod,
      observacoes: textoOpcional(form.notes),
      status: 'pago'
    })
    .eq('id', installmentId)
    .eq('pagamento_id', paymentId)
    .in('status', ['pendente', 'vencido'])
    .select('id')
    .single()

  if (installmentError) throw installmentError
  if (!installment) throw new Error('A parcela não está disponível para baixa.')

  const payment = await buscarPagamentoPorId(paymentId)
  const nextStatus = calcularStatusPagamento(payment)
  const { error } = await supabase
    .from('pagamentos')
    .update({ status: nextStatus })
    .eq('id', paymentId)

  if (error) throw error
  return buscarPagamentoPorId(paymentId)
}

export function calcularValoresFormulario(form) {
  const calculation = calcularPagamento(form)
  return {
    finalValue: fromCents(calculation.finalCents),
    remainingValue: fromCents(calculation.remainingCents)
  }
}

export function gerarParcelasPreview(remainingValue, count, firstDueDate) {
  return gerarParcelas(toCents(remainingValue), Number(count), firstDueDate)
}

export function getPaidTotal(payment) {
  if (!payment) return 0
  const installmentCents = payment.installments.reduce((total, item) => (
    item.status === 'pago' ? total + toCents(item.value) : total
  ), 0)
  return fromCents(toCents(payment.downPayment) + installmentCents)
}

export function getRemainingTotal(payment) {
  if (!payment || payment.status === 'cancelado') return 0
  return fromCents(Math.max(0, toCents(payment.finalValue) - toCents(getPaidTotal(payment))))
}

export function getNextDueInstallment(payment) {
  return payment?.installments
    .filter((item) => ['pendente', 'vencido'].includes(item.displayStatus))
    .sort((first, second) => first.dueDate.localeCompare(second.dueDate))[0] || null
}

export function getPaymentStatus(payment) {
  if (!payment) return 'aberto'
  if (payment.status === 'cancelado') return 'cancelado'
  return calcularStatusPagamento(payment)
}

async function buscarValorReserva(id) {
  const { data, error } = await supabase
    .from('reservas')
    .select('valor_total')
    .eq('id', id)
    .single()

  if (error) throw error
  return valorDoBanco(data.valor_total)
}

async function buscarPagamentoBruto(id) {
  const [paymentResult, installmentResult] = await Promise.all([
    supabase.from('pagamentos').select(PAYMENT_COLUMNS).eq('id', id).single(),
    supabase.from('parcelas').select('*').eq('pagamento_id', id)
  ])
  if (paymentResult.error) throw paymentResult.error
  if (installmentResult.error) throw installmentResult.error
  return { payment: paymentResult.data, installments: installmentResult.data || [] }
}

async function restaurarPagamento(previous) {
  const payment = { ...previous.payment }
  const id = payment.id
  delete payment.id
  delete payment.valor_final
  delete payment.created_at
  delete payment.updated_at

  await supabase.from('pagamentos').update(payment).eq('id', id)
  await supabase.from('parcelas').delete().eq('pagamento_id', id)
  if (previous.installments.length) {
    await supabase.from('parcelas').insert(previous.installments.map((item) => {
      const row = { ...item }
      delete row.id
      delete row.created_at
      delete row.updated_at
      return row
    }))
  }
}

async function inserirParcelas(paymentId, installments) {
  if (!installments.length) return
  const { error } = await supabase.from('parcelas').insert(installments.map((item) => ({
    pagamento_id: paymentId,
    numero: item.number,
    valor: valorParaBanco(item.value),
    data_vencimento: item.dueDate,
    status: 'pendente'
  })))
  if (error) throw error
}

function mapearPagamentoParaBanco(form, calculation, status) {
  return {
    reserva_id: form.reservationId,
    valor_total: valorParaBanco(calculation.totalCents),
    desconto: valorParaBanco(calculation.discountCents),
    acrescimo: valorParaBanco(calculation.surchargeCents),
    valor_entrada: valorParaBanco(calculation.downPaymentCents),
    data_entrada: calculation.downPaymentCents > 0 ? form.downPaymentDate : null,
    forma_pagamento_entrada: calculation.downPaymentCents > 0 ? form.downPaymentMethod : null,
    quantidade_parcelas: calculation.installmentCount,
    status,
    observacoes: textoOpcional(form.notes),
    motivo_cancelamento: null
  }
}

function calcularPagamento(form) {
  const totalCents = toCents(form.totalValue)
  const discountCents = toCents(form.discount)
  const surchargeCents = toCents(form.surcharge)
  const finalCents = Math.max(0, totalCents - discountCents + surchargeCents)
  const downPaymentCents = toCents(form.downPayment)
  const paidInstallmentsCents = form.paidInstallmentsCents === undefined
    ? toCents(form.paidInstallmentsValue)
    : Number(form.paidInstallmentsCents || 0)
  const remainingCents = Math.max(0, finalCents - downPaymentCents - paidInstallmentsCents)
  const installmentCount = remainingCents === 0
    ? Math.max(0, Number(form.paidInstallmentCount) || 0)
    : Math.min(5, Math.max(1, Number(form.installmentCount) || 1))

  return {
    totalCents,
    discountCents,
    surchargeCents,
    finalCents,
    downPaymentCents,
    paidInstallmentsCents,
    remainingCents,
    installmentCount
  }
}

function gerarParcelas(remainingCents, count, firstDueDate, numbers = null) {
  if (!remainingCents || !count || !firstDueDate) return []
  const installmentNumbers = numbers || Array.from({ length: count }, (_, index) => index + 1)
  const baseCents = Math.floor(remainingCents / count)
  const remainder = remainingCents - baseCents * count

  return installmentNumbers.map((number, index) => ({
    number,
    value: fromCents(baseCents + (index === count - 1 ? remainder : 0)),
    dueDate: addMonths(firstDueDate, index),
    status: 'pendente'
  }))
}

function normalizarPagamento(payment) {
  const installments = (payment.parcelas || [])
    .map(normalizarParcela)
    .sort((first, second) => first.number - second.number)
  const reservation = payment.reserva
  return {
    id: payment.id,
    reservationId: payment.reserva_id,
    totalValue: valorDoBanco(payment.valor_total),
    discount: valorDoBanco(payment.desconto),
    surcharge: valorDoBanco(payment.acrescimo),
    finalValue: valorDoBanco(payment.valor_final),
    downPayment: valorDoBanco(payment.valor_entrada),
    downPaymentDate: payment.data_entrada || '',
    downPaymentMethod: payment.forma_pagamento_entrada || '',
    installmentCount: Number(payment.quantidade_parcelas || 0),
    status: payment.status,
    notes: payment.observacoes || '',
    cancellationReason: payment.motivo_cancelamento || '',
    createdAt: payment.created_at,
    updatedAt: payment.updated_at,
    reservation: reservation ? {
      id: reservation.id,
      totalValue: valorDoBanco(reservation.valor_total),
      eventDate: reservation.data_evento || '',
      status: reservation.status,
      student: reservation.aluno ? {
        id: reservation.aluno.id,
        fullName: reservation.aluno.nome_completo,
        phone: reservation.aluno.telefone || '',
        guardianName: reservation.aluno.nome_responsavel || '',
        guardianPhone: reservation.aluno.telefone_responsavel || ''
      } : null,
      school: reservation.escola ? {
        id: reservation.escola.id,
        fantasyName: reservation.escola.nome_fantasia
      } : null,
      studentClass: reservation.turma ? {
        id: reservation.turma.id,
        name: reservation.turma.nome
      } : null
    } : null,
    installments
  }
}

function normalizarParcela(item) {
  const status = item.status
  return {
    id: item.id,
    paymentId: item.pagamento_id,
    number: Number(item.numero),
    value: valorDoBanco(item.valor),
    dueDate: item.data_vencimento,
    paymentDate: item.data_pagamento || '',
    status,
    displayStatus: status === 'pendente' && item.data_vencimento < getLocalDateString()
      ? 'vencido'
      : status,
    paymentMethod: item.forma_pagamento || '',
    notes: item.observacoes || '',
    settledBy: item.baixado_por,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }
}

function calcularStatusPagamento(payment) {
  const finalCents = toCents(payment.finalValue)
  const paidCents = toCents(getPaidTotal(payment))
  return calcularStatusPorValores(finalCents, paidCents, 0)
}

function calcularStatusPorValores(finalCents, downPaymentCents, paidInstallmentsCents) {
  const paidCents = downPaymentCents + paidInstallmentsCents
  if (paidCents >= finalCents) return 'quitado'
  if (paidCents > 0) return 'parcial'
  return 'aberto'
}

function addMonths(dateValue, months) {
  const [year, month, day] = dateValue.split('-').map(Number)
  const absoluteMonth = month - 1 + months
  const targetYear = year + Math.floor(absoluteMonth / 12)
  const targetMonth = ((absoluteMonth % 12) + 12) % 12 + 1
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth))
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`
}

function daysInMonth(year, month) {
  if (month === 2) {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
    return leap ? 29 : 28
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

function getLocalDateString() {
  const today = new Date()
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-')
}

function toCents(value) {
  const number = Number(String(value ?? 0).replace(',', '.'))
  return Number.isFinite(number) ? Math.round((number + Number.EPSILON) * 100) : 0
}

function fromCents(value) {
  return (Number(value || 0) / 100).toFixed(2)
}

function valorParaBanco(value) {
  return Number.isInteger(value) ? fromCents(value) : fromCents(toCents(value))
}

function valorDoBanco(value) {
  return fromCents(toCents(value))
}

function textoOpcional(value) {
  const normalized = value?.trim()
  return normalized || null
}
