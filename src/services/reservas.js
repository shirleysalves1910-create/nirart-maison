import { supabase } from './supabase'

const RESERVATION_COLUMNS = [
  'id',
  'cliente_id',
  'aluno_id',
  'escola_id',
  'turma_id',
  'evento_id',
  'data_evento',
  'data_prova',
  'data_entrega',
  'data_prevista_devolucao',
  'data_validade_pre_reserva',
  'pre_reserva_expirada',
  'tipo_atendimento',
  'local_atendimento',
  'status',
  'valor_total',
  'observacoes',
  'motivo_cancelamento',
  'criado_por',
  'created_at',
  'updated_at'
].join(', ')

const RESERVATION_SELECT = `
  ${RESERVATION_COLUMNS},
  aluno:alunos (
    id, cliente_id, escola_id, turma_id, nome_completo, telefone,
    nome_responsavel, telefone_responsavel, status
  ),
  escola:escolas (id, nome_fantasia),
  turma:turmas (id, nome),
  reserva_itens (
    id, item_estoque_id, kit_id, quantidade, valor_unitario, valor_total,
    item:itens_estoque (
      id, ref, tipo_item, descricao, categoria, cor, tamanho,
      quantidade_total, quantidade_reservada, quantidade_locada,
      quantidade_disponivel, valor_locacao, status
    ),
    kit:kits (
      id, ref, nome, descricao, categoria, cor, tamanho,
      quantidade_total, quantidade_reservada, quantidade_locada,
      quantidade_disponivel, valor_locacao, status
    )
  )
`

export const RESERVATION_STATUSES = [
  'pré-reserva',
  'reservado',
  'confirmado',
  'entregue',
  'devolvido',
  'cancelado'
]

export const SERVICE_TYPES = ['Na loja', 'Na escola', 'Em domicílio']

export async function listarReservas() {
  const { data, error } = await supabase
    .from('reservas')
    .select(RESERVATION_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(normalizarReserva)
}

export async function buscarReservaPorId(id) {
  const { data, error } = await supabase
    .from('reservas')
    .select(RESERVATION_SELECT)
    .eq('id', id)
    .single()

  if (error) throw error
  return normalizarReserva(data)
}

export async function criarReserva(reserva) {
  const total = calcularTotalReserva(reserva.items)
  const { data, error } = await supabase
    .from('reservas')
    .insert(mapearReservaParaBanco(reserva, total))
    .select('id')
    .single()

  if (error) throw error

  try {
    await inserirItensReserva(data.id, reserva.items)
  } catch (itemsError) {
    await supabase.from('reservas').delete().eq('id', data.id)
    throw itemsError
  }

  return buscarReservaPorId(data.id)
}

export async function atualizarReserva(id, reserva) {
  const { data: previousReservation, error: previousReservationError } = await supabase
    .from('reservas')
    .select(RESERVATION_COLUMNS)
    .eq('id', id)
    .single()

  if (previousReservationError) throw previousReservationError

  const { data: previousItems, error: previousItemsError } = await supabase
    .from('reserva_itens')
    .select('item_estoque_id, kit_id, quantidade, valor_unitario')
    .eq('reserva_id', id)

  if (previousItemsError) throw previousItemsError

  const total = calcularTotalReserva(reserva.items)
  const { error } = await supabase
    .from('reservas')
    .update(mapearReservaParaBanco(
      reserva,
      total,
      previousReservation.data_validade_pre_reserva
    ))
    .eq('id', id)

  if (error) throw error

  try {
    await substituirItensReserva(id, reserva.items)
  } catch (itemsError) {
    await restaurarReserva(id, previousReservation, previousItems || [])
    throw itemsError
  }

  return buscarReservaPorId(id)
}

export async function atualizarStatusReserva(id, status, motivoCancelamento = null) {
  const payload = {
    status,
    motivo_cancelamento: status === 'cancelado'
      ? textoOpcional(motivoCancelamento) || 'Cancelada pelo módulo Reservas.'
      : null
  }

  const { data, error } = await supabase
    .from('reservas')
    .update(payload)
    .eq('id', id)
    .select(RESERVATION_SELECT)
    .single()

  if (error) throw error
  return normalizarReserva(data)
}

export function calcularTotalReserva(items) {
  const cents = (items || []).reduce((total, item) => (
    total + Number(item.quantity || 0) * valorParaCentavos(item.unitValue)
  ), 0)
  return (cents / 100).toFixed(2)
}

export function getReservationItemsQuantity(reservation) {
  return (reservation?.items || []).reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  )
}

async function substituirItensReserva(reservationId, items) {
  const { error: deleteError } = await supabase
    .from('reserva_itens')
    .delete()
    .eq('reserva_id', reservationId)

  if (deleteError) throw deleteError
  await inserirItensReserva(reservationId, items)
}

async function inserirItensReserva(reservationId, items) {
  if (!items.length) return

  const rows = items.map((item) => ({
    reserva_id: reservationId,
    item_estoque_id: item.inventoryType === 'Kit' ? null : item.inventoryId,
    kit_id: item.inventoryType === 'Kit' ? item.inventoryId : null,
    quantidade: Math.max(1, Number.parseInt(item.quantity, 10) || 1),
    valor_unitario: valorParaBanco(item.unitValue)
  }))

  const { error } = await supabase.from('reserva_itens').insert(rows)
  if (error) throw error
}

async function restaurarReserva(id, reservation, items) {
  const reservationPayload = { ...reservation }
  delete reservationPayload.id
  delete reservationPayload.created_at
  delete reservationPayload.updated_at

  await supabase.from('reservas').update(reservationPayload).eq('id', id)
  await supabase.from('reserva_itens').delete().eq('reserva_id', id)

  if (items.length) {
    await supabase.from('reserva_itens').insert(items.map((item) => ({
      reserva_id: id,
      item_estoque_id: item.item_estoque_id,
      kit_id: item.kit_id,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario
    })))
  }
}

function mapearReservaParaBanco(reserva, total, currentPreReservationExpiration = null) {
  const isPreReservation = reserva.status === 'pré-reserva'
  return {
    cliente_id: reserva.clientId,
    aluno_id: reserva.studentId,
    escola_id: reserva.schoolId || null,
    turma_id: reserva.classId || null,
    evento_id: reserva.eventId || null,
    data_evento: reserva.eventDate,
    data_prova: reserva.fittingDate || null,
    data_entrega: reserva.deliveryDate || null,
    data_prevista_devolucao: reserva.expectedReturnDate || null,
    data_validade_pre_reserva: isPreReservation
      ? currentPreReservationExpiration || getPreReservationExpiration()
      : null,
    pre_reserva_expirada: false,
    tipo_atendimento: reserva.serviceType,
    local_atendimento: reserva.serviceLocation.trim(),
    status: reserva.status,
    valor_total: total,
    observacoes: textoOpcional(reserva.notes),
    motivo_cancelamento: reserva.status === 'cancelado'
      ? textoOpcional(reserva.cancellationReason) || 'Cancelada pelo módulo Reservas.'
      : null
  }
}

function normalizarReserva(reservation) {
  const items = (reservation.reserva_itens || []).map(normalizarItemReserva)
  return {
    id: reservation.id,
    clientId: reservation.cliente_id,
    studentId: reservation.aluno_id,
    schoolId: reservation.escola_id || '',
    classId: reservation.turma_id || '',
    eventId: reservation.evento_id || '',
    eventDate: reservation.data_evento || '',
    fittingDate: reservation.data_prova || '',
    deliveryDate: reservation.data_entrega || '',
    expectedReturnDate: reservation.data_prevista_devolucao || '',
    preReservationExpiration: reservation.data_validade_pre_reserva,
    preReservationExpired: reservation.pre_reserva_expirada,
    serviceType: reservation.tipo_atendimento,
    serviceLocation: reservation.local_atendimento,
    status: reservation.status,
    totalValue: valorDoBanco(reservation.valor_total),
    notes: reservation.observacoes || '',
    cancellationReason: reservation.motivo_cancelamento || '',
    createdBy: reservation.criado_por,
    createdAt: reservation.created_at,
    updatedAt: reservation.updated_at,
    student: normalizarAluno(reservation.aluno),
    school: reservation.escola
      ? { id: reservation.escola.id, fantasyName: reservation.escola.nome_fantasia }
      : null,
    studentClass: reservation.turma
      ? { id: reservation.turma.id, name: reservation.turma.nome }
      : null,
    items
  }
}

function normalizarItemReserva(entry) {
  const isKit = Boolean(entry.kit_id)
  const source = isKit ? entry.kit : entry.item
  return {
    id: entry.id,
    inventoryId: isKit ? entry.kit_id : entry.item_estoque_id,
    inventoryType: isKit ? 'Kit' : normalizarTipoItem(source?.tipo_item),
    quantity: Number(entry.quantidade || 0),
    unitValue: valorDoBanco(entry.valor_unitario),
    totalValue: valorDoBanco(entry.valor_total),
    inventory: source
      ? {
          id: source.id,
          type: isKit ? 'Kit' : normalizarTipoItem(source.tipo_item),
          ref: source.ref,
          name: isKit ? source.nome : '',
          description: source.descricao,
          category: source.categoria || '',
          color: source.cor || '',
          size: source.tamanho || '',
          totalQuantity: Number(source.quantidade_total || 0),
          reservedQuantity: Number(source.quantidade_reservada || 0),
          rentedQuantity: Number(source.quantidade_locada || 0),
          availableQuantity: Number(source.quantidade_disponivel || 0),
          rentalValue: valorDoBanco(source.valor_locacao),
          status: source.status
        }
      : null
  }
}

function normalizarAluno(student) {
  if (!student) return null
  return {
    id: student.id,
    clientId: student.cliente_id,
    schoolId: student.escola_id || '',
    classId: student.turma_id || '',
    fullName: student.nome_completo,
    phone: student.telefone || '',
    guardianName: student.nome_responsavel || '',
    guardianPhone: student.telefone_responsavel || '',
    status: student.status
  }
}

function normalizarTipoItem(type) {
  return type === 'Acessório' ? 'Acessorio' : type
}

function valorParaCentavos(value) {
  const number = Number(String(value ?? 0).replace(',', '.'))
  return Number.isFinite(number) ? Math.round((number + Number.EPSILON) * 100) : 0
}

function valorParaBanco(value) {
  return (valorParaCentavos(value) / 100).toFixed(2)
}

function valorDoBanco(value) {
  return valorParaBanco(value)
}

function textoOpcional(value) {
  const normalized = value?.trim()
  return normalized || null
}

function getPreReservationExpiration() {
  return new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
}
