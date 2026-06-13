import { supabase } from './supabase'

const DELIVERY_SELECT = `
  id,
  reserva_id,
  data_entrega,
  responsavel_entrega_id,
  responsavel_entrega_nome,
  recebedor,
  observacoes,
  roupa_entregue,
  sapato_entregue,
  acessorio_entregue,
  kit_entregue,
  embalagem_entregue,
  status,
  created_at,
  updated_at,
  reserva:reservas (
    id,
    aluno_id,
    escola_id,
    turma_id,
    data_entrega,
    data_prevista_devolucao,
    status,
    aluno:alunos (id, nome_completo),
    escola:escolas (id, nome_fantasia),
    turma:turmas (id, nome)
  )
`

export const DELIVERY_STATUSES = ['pendente', 'entregue', 'cancelada']

export async function listarEntregas() {
  const { data, error } = await supabase
    .from('entregas')
    .select(DELIVERY_SELECT)
    .order('data_entrega', { ascending: false })

  if (error) throw error
  return (data || []).map(normalizarEntrega)
}

export async function buscarEntregaPorReservaId(reservationId) {
  const { data, error } = await supabase
    .from('entregas')
    .select(DELIVERY_SELECT)
    .eq('reserva_id', reservationId)
    .maybeSingle()

  if (error) throw error
  return data ? normalizarEntrega(data) : null
}

export async function salvarEntrega(delivery) {
  const { data: previous, error: previousError } = await supabase
    .from('entregas')
    .select('*')
    .eq('reserva_id', delivery.reservationId)
    .maybeSingle()

  if (previousError) throw previousError

  const { data, error } = await supabase
    .from('entregas')
    .upsert(mapearEntregaParaBanco(delivery), { onConflict: 'reserva_id' })
    .select(DELIVERY_SELECT)
    .single()

  if (error) throw error

  if (delivery.status === 'entregue') {
    const { error: reservationError } = await supabase
      .from('reservas')
      .update({ status: 'entregue' })
      .eq('id', delivery.reservationId)

    if (reservationError) {
      await restaurarEntrega(previous, delivery.reservationId)
      throw reservationError
    }
  }

  return normalizarEntrega(data)
}

function mapearEntregaParaBanco(delivery) {
  return {
    reserva_id: delivery.reservationId,
    data_entrega: delivery.deliveryDate,
    responsavel_entrega_nome: textoOpcional(delivery.deliveredBy),
    recebedor: textoOpcional(delivery.receivedBy),
    observacoes: textoOpcional(delivery.notes),
    roupa_entregue: Boolean(delivery.checklist?.clothes),
    sapato_entregue: Boolean(delivery.checklist?.shoes),
    acessorio_entregue: Boolean(delivery.checklist?.accessories),
    kit_entregue: Boolean(delivery.checklist?.kits),
    embalagem_entregue: Boolean(delivery.checklist?.packaging),
    status: delivery.status
  }
}

function normalizarEntrega(delivery) {
  return {
    id: delivery.id,
    reservationId: delivery.reserva_id,
    deliveryDate: delivery.data_entrega || '',
    deliveredBy: delivery.responsavel_entrega_nome || '',
    receivedBy: delivery.recebedor || '',
    notes: delivery.observacoes || '',
    status: delivery.status,
    checklist: {
      clothes: delivery.roupa_entregue,
      shoes: delivery.sapato_entregue,
      accessories: delivery.acessorio_entregue,
      kits: delivery.kit_entregue,
      packaging: delivery.embalagem_entregue
    },
    reservation: normalizarReserva(delivery.reserva),
    createdAt: delivery.created_at,
    updatedAt: delivery.updated_at
  }
}

function normalizarReserva(reservation) {
  if (!reservation) return null
  return {
    id: reservation.id,
    studentId: reservation.aluno_id,
    schoolId: reservation.escola_id || '',
    classId: reservation.turma_id || '',
    deliveryDate: reservation.data_entrega || '',
    expectedReturnDate: reservation.data_prevista_devolucao || '',
    status: reservation.status,
    student: reservation.aluno
      ? { id: reservation.aluno.id, fullName: reservation.aluno.nome_completo }
      : null,
    school: reservation.escola
      ? { id: reservation.escola.id, fantasyName: reservation.escola.nome_fantasia }
      : null,
    studentClass: reservation.turma
      ? { id: reservation.turma.id, name: reservation.turma.nome }
      : null
  }
}

async function restaurarEntrega(previous, reservationId) {
  if (!previous) {
    await supabase.from('entregas').delete().eq('reserva_id', reservationId)
    return
  }

  const payload = { ...previous }
  delete payload.id
  delete payload.created_at
  delete payload.updated_at
  await supabase.from('entregas').update(payload).eq('reserva_id', reservationId)
}

function textoOpcional(value) {
  return value?.trim() || null
}
