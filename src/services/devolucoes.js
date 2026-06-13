import { supabase } from './supabase'

const RETURN_SELECT = `
  id,
  reserva_id,
  data_prevista,
  data_real,
  recebedor_id,
  recebedor_nome,
  condicao_itens,
  houve_atraso,
  houve_avaria,
  valor_multa_atraso,
  valor_multa_avaria,
  valor_cobrado,
  foi_recebido,
  roupa_devolvida,
  sapato_devolvido,
  acessorio_devolvido,
  kit_devolvido,
  embalagem_devolvida,
  observacoes,
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

export const RETURN_STATUSES = ['pendente', 'devolvido', 'atrasado', 'com avaria', 'cancelado']

export const ITEM_CONDITIONS = [
  'Perfeito estado',
  'Bom estado',
  'Necessita higienização',
  'Com avaria'
]

export async function listarDevolucoes() {
  const { data, error } = await supabase
    .from('devolucoes')
    .select(RETURN_SELECT)
    .order('data_prevista', { ascending: false })

  if (error) throw error
  return (data || []).map(normalizarDevolucao)
}

export async function buscarDevolucaoPorReservaId(reservationId) {
  const { data, error } = await supabase
    .from('devolucoes')
    .select(RETURN_SELECT)
    .eq('reserva_id', reservationId)
    .maybeSingle()

  if (error) throw error
  return data ? normalizarDevolucao(data) : null
}

export async function salvarDevolucao(itemReturn) {
  const { data: previous, error: previousError } = await supabase
    .from('devolucoes')
    .select('*')
    .eq('reserva_id', itemReturn.reservationId)
    .maybeSingle()

  if (previousError) throw previousError

  const { data, error } = await supabase
    .from('devolucoes')
    .upsert(mapearDevolucaoParaBanco(itemReturn), { onConflict: 'reserva_id' })
    .select(RETURN_SELECT)
    .single()

  if (error) throw error

  if (['devolvido', 'atrasado', 'com avaria'].includes(itemReturn.status)) {
    const { error: reservationError } = await supabase
      .from('reservas')
      .update({ status: 'devolvido' })
      .eq('id', itemReturn.reservationId)

    if (reservationError) {
      await restaurarDevolucao(previous, itemReturn.reservationId)
      throw reservationError
    }
  }

  return normalizarDevolucao(data)
}

export function getReturnFineTotal(itemReturn) {
  return valorDoBanco(
    valorParaCentavos(itemReturn?.lateFee) + valorParaCentavos(itemReturn?.damageFee)
  )
}

function mapearDevolucaoParaBanco(itemReturn) {
  const totalFine = getReturnFineTotal(itemReturn)
  return {
    reserva_id: itemReturn.reservationId,
    data_prevista: itemReturn.expectedReturnDate,
    data_real: itemReturn.actualReturnDate || null,
    recebedor_nome: textoOpcional(itemReturn.receivedBy),
    condicao_itens: itemReturn.itemCondition || null,
    houve_atraso: Boolean(itemReturn.wasLate),
    houve_avaria: Boolean(itemReturn.hadDamage),
    valor_multa_atraso: valorDoBanco(valorParaCentavos(itemReturn.lateFee)),
    valor_multa_avaria: valorDoBanco(valorParaCentavos(itemReturn.damageFee)),
    valor_cobrado: totalFine,
    foi_recebido: Boolean(itemReturn.fineReceived),
    roupa_devolvida: Boolean(itemReturn.checklist?.clothes),
    sapato_devolvido: Boolean(itemReturn.checklist?.shoes),
    acessorio_devolvido: Boolean(itemReturn.checklist?.accessories),
    kit_devolvido: Boolean(itemReturn.checklist?.kits),
    embalagem_devolvida: Boolean(itemReturn.checklist?.packaging),
    observacoes: textoOpcional(itemReturn.notes),
    status: itemReturn.status
  }
}

function normalizarDevolucao(itemReturn) {
  return {
    id: itemReturn.id,
    reservationId: itemReturn.reserva_id,
    expectedReturnDate: itemReturn.data_prevista || '',
    actualReturnDate: itemReturn.data_real || '',
    receivedBy: itemReturn.recebedor_nome || '',
    itemCondition: itemReturn.condicao_itens || '',
    wasLate: itemReturn.houve_atraso,
    hadDamage: itemReturn.houve_avaria,
    lateFee: valorDoBanco(valorParaCentavos(itemReturn.valor_multa_atraso)),
    damageFee: valorDoBanco(valorParaCentavos(itemReturn.valor_multa_avaria)),
    chargedAmount: valorDoBanco(valorParaCentavos(itemReturn.valor_cobrado)),
    fineReceived: itemReturn.foi_recebido,
    notes: itemReturn.observacoes || '',
    status: itemReturn.status,
    checklist: {
      clothes: itemReturn.roupa_devolvida,
      shoes: itemReturn.sapato_devolvido,
      accessories: itemReturn.acessorio_devolvido,
      kits: itemReturn.kit_devolvido,
      packaging: itemReturn.embalagem_devolvida
    },
    reservation: normalizarReserva(itemReturn.reserva),
    createdAt: itemReturn.created_at,
    updatedAt: itemReturn.updated_at
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

async function restaurarDevolucao(previous, reservationId) {
  if (!previous) {
    await supabase.from('devolucoes').delete().eq('reserva_id', reservationId)
    return
  }

  const payload = { ...previous }
  delete payload.id
  delete payload.created_at
  delete payload.updated_at
  await supabase.from('devolucoes').update(payload).eq('reserva_id', reservationId)
}

function valorParaCentavos(value) {
  const number = Number(String(value ?? 0).replace(',', '.'))
  return Number.isFinite(number) ? Math.round((number + Number.EPSILON) * 100) : 0
}

function valorDoBanco(cents) {
  return (Number(cents || 0) / 100).toFixed(2)
}

function textoOpcional(value) {
  return value?.trim() || null
}
