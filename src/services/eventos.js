import { supabase } from './supabase'
import { listarDevolucoes } from './devolucoes'
import { listarEntregas } from './entregas'
import { listarPagamentos } from './pagamentos'
import { listarReservas } from './reservas'

const EVENT_SELECT = `
  id,
  titulo,
  tipo,
  cor,
  data,
  hora_inicio,
  hora_fim,
  cliente_id,
  aluno_id,
  escola_id,
  turma_id,
  reserva_id,
  responsavel_id,
  responsavel_nome,
  local,
  status,
  observacoes,
  automatico,
  origem,
  created_at,
  updated_at,
  aluno:alunos (
    id, cliente_id, nome_completo, nome_responsavel,
    telefone, telefone_responsavel
  ),
  escola:escolas (id, nome_fantasia),
  turma:turmas (id, nome),
  reserva:reservas!eventos_reserva_id_fkey (
    id, data_evento, data_prova, data_entrega,
    data_prevista_devolucao, valor_total, status,
    reserva_itens (id, quantidade)
  ),
  responsavel:usuarios (id, nome)
`

export const EVENT_TYPES = [
  { value: 'prova de roupa', label: 'Prova de roupa', hex: '#7E57C2', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'medição', label: 'Medição', hex: '#3B82F6', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'ajuste', label: 'Ajuste', hex: '#F97316', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'entrega', label: 'Entrega', hex: '#22C55E', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'devolução', label: 'Devolução', hex: '#14B8A6', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { value: 'evento escolar', label: 'Evento escolar', hex: '#EC4899', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { value: 'atendimento', label: 'Atendimento', hex: '#06B6D4', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { value: 'pagamento', label: 'Pagamento', hex: '#EAB308', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'outro', label: 'Outro', hex: '#6B7280', color: 'bg-gray-100 text-gray-700 border-gray-200' }
]

export const AGENDA_EVENT_TYPES = [
  { value: 'reserva', label: 'Reserva', hex: '#8B5CF6', color: 'bg-violet-100 text-violet-800 border-violet-200' },
  ...EVENT_TYPES
]

export const EVENT_STATUSES = ['agendado', 'confirmado', 'realizado', 'cancelado', 'reagendado']

export async function listarAgendaIntegrada() {
  const [manualEvents, reservations, payments, deliveries, returns] = await Promise.all([
    listarEventos(),
    listarReservas(),
    listarPagamentos(),
    listarEntregas(),
    listarDevolucoes()
  ])

  const derivedEvents = [
    ...reservations.map(criarEventoReserva).filter(Boolean),
    ...payments.flatMap(criarEventosPagamento),
    ...deliveries.map(criarEventoEntrega).filter(Boolean),
    ...returns.map(criarEventoDevolucao).filter(Boolean)
  ]

  return deduplicarEventos(manualEvents, derivedEvents)
}

export async function listarEventos() {
  const { data, error } = await supabase
    .from('eventos')
    .select(EVENT_SELECT)
    .order('data', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (error) throw error
  return (data || []).map(normalizarEvento)
}

export async function buscarEventoPorId(id) {
  const [eventResult, historyResult] = await Promise.all([
    supabase.from('eventos').select(EVENT_SELECT).eq('id', id).single(),
    supabase
      .from('evento_historico')
      .select('id, evento_id, usuario_id, acao, detalhes, created_at, updated_at, usuario:usuarios(id, nome)')
      .eq('evento_id', id)
      .order('created_at', { ascending: false })
  ])

  if (eventResult.error) throw eventResult.error
  if (historyResult.error) throw historyResult.error

  return {
    ...normalizarEvento(eventResult.data),
    history: (historyResult.data || []).map(normalizarHistorico)
  }
}

export async function criarEvento(event) {
  const { data, error } = await supabase
    .from('eventos')
    .insert(mapearEventoParaBanco(event))
    .select(EVENT_SELECT)
    .single()

  if (error) throw error

  try {
    await registrarHistorico(data.id, 'Evento criado', {
      data: event.date,
      hora_inicio: event.startTime,
      status: event.status
    })
  } catch (historyError) {
    await supabase.from('eventos').delete().eq('id', data.id)
    throw historyError
  }

  return normalizarEvento(data)
}

export async function atualizarEvento(id, event) {
  const { data: previous, error: previousError } = await supabase
    .from('eventos')
    .select('data, hora_inicio, hora_fim, status')
    .eq('id', id)
    .single()

  if (previousError) throw previousError

  const { data, error } = await supabase
    .from('eventos')
    .update(mapearEventoParaBanco(event))
    .eq('id', id)
    .select(EVENT_SELECT)
    .single()

  if (error) throw error

  await registrarHistorico(id, 'Evento atualizado', {
    anterior: previous,
    atual: {
      data: event.date,
      hora_inicio: event.startTime,
      hora_fim: event.endTime,
      status: event.status
    }
  })

  return normalizarEvento(data)
}

export async function cancelarEvento(id) {
  const { data, error } = await supabase
    .from('eventos')
    .update({ status: 'cancelado' })
    .eq('id', id)
    .select(EVENT_SELECT)
    .single()

  if (error) throw error
  await registrarHistorico(id, 'Evento cancelado', { status: 'cancelado' })
  return normalizarEvento(data)
}

export async function reagendarEvento(id, newDate) {
  const { data: previous, error: previousError } = await supabase
    .from('eventos')
    .select('data')
    .eq('id', id)
    .single()

  if (previousError) throw previousError

  const { data, error } = await supabase
    .from('eventos')
    .update({ data: newDate, status: 'reagendado' })
    .eq('id', id)
    .select(EVENT_SELECT)
    .single()

  if (error) throw error
  await registrarHistorico(id, 'Evento reagendado', {
    data_anterior: previous.data,
    nova_data: newDate
  })
  return normalizarEvento(data)
}

export function getEventType(type) {
  return AGENDA_EVENT_TYPES.find((item) => item.value === type) || EVENT_TYPES.at(-1)
}

function criarEventoReserva(reservation) {
  if (!reservation.eventDate || reservation.eventId) return null
  return criarEventoDerivado({
    id: `reserva-${reservation.id}`,
    sourceId: reservation.id,
    title: `Reserva #${shortId(reservation.id)}`,
    type: 'reserva',
    date: reservation.eventDate,
    startTime: '08:00',
    endTime: '08:30',
    origin: 'reserva',
    status: mapearStatusReserva(reservation.status),
    sourceStatus: reservation.status,
    reservation,
    responsible: reservation.student?.guardianName || 'Nirart Maison',
    location: reservation.serviceLocation || reservation.school?.fantasyName || 'Nirart Maison',
    notes: reservation.notes,
    detailPath: `/reservas/${reservation.id}`
  })
}

function criarEventosPagamento(payment) {
  if (payment.status === 'cancelado') return []
  return payment.installments
    .filter((installment) => installment.dueDate)
    .map((installment) => criarEventoDerivado({
      id: `pagamento-${payment.id}-${installment.id}`,
      sourceId: installment.id,
      title: `Parcela ${installment.number} da reserva #${shortId(payment.reservationId)}`,
      type: 'pagamento',
      date: installment.dueDate,
      startTime: '08:00',
      endTime: '08:15',
      origin: 'pagamento',
      status: mapearStatusParcela(installment.displayStatus),
      sourceStatus: installment.displayStatus,
      reservation: payment.reservation,
      responsible: 'Financeiro Nirart Maison',
      location: 'Financeiro Nirart Maison',
      notes: `Vencimento da parcela ${installment.number}.`,
      detailPath: `/pagamentos/${payment.id}`
    }))
}

function criarEventoEntrega(delivery) {
  if (!delivery.deliveryDate) return null
  return criarEventoDerivado({
    id: `entrega-${delivery.id}`,
    sourceId: delivery.id,
    title: `Entrega da reserva #${shortId(delivery.reservationId)}`,
    type: 'entrega',
    date: delivery.deliveryDate,
    startTime: '14:00',
    endTime: '14:30',
    origin: 'entrega',
    status: delivery.status === 'entregue' ? 'realizado' : delivery.status === 'cancelada' ? 'cancelado' : 'agendado',
    sourceStatus: delivery.status,
    reservation: delivery.reservation,
    responsible: delivery.deliveredBy || 'Nirart Maison',
    location: delivery.reservation?.school?.fantasyName || 'Nirart Maison',
    notes: delivery.notes,
    detailPath: `/registrar-entrega/${delivery.reservationId}`
  })
}

function criarEventoDevolucao(itemReturn) {
  const date = itemReturn.actualReturnDate || itemReturn.expectedReturnDate
  if (!date) return null
  return criarEventoDerivado({
    id: `devolucao-${itemReturn.id}`,
    sourceId: itemReturn.id,
    title: `Devolução da reserva #${shortId(itemReturn.reservationId)}`,
    type: 'devolução',
    date,
    startTime: '16:00',
    endTime: '16:30',
    origin: 'devolução',
    status: ['devolvido', 'atrasado', 'com avaria'].includes(itemReturn.status)
      ? 'realizado'
      : itemReturn.status === 'cancelado' ? 'cancelado' : 'agendado',
    sourceStatus: itemReturn.status,
    reservation: itemReturn.reservation,
    responsible: itemReturn.receivedBy || 'Nirart Maison',
    location: 'Nirart Maison',
    notes: itemReturn.notes,
    detailPath: `/registrar-devolucao/${itemReturn.reservationId}`
  })
}

function criarEventoDerivado(config) {
  const reservation = config.reservation
  return {
    id: config.id,
    sourceId: config.sourceId,
    title: config.title,
    type: config.type,
    color: getEventType(config.type).hex,
    date: config.date,
    startTime: config.startTime,
    endTime: config.endTime,
    clientId: reservation?.clientId || '',
    studentId: reservation?.studentId || reservation?.student?.id || '',
    schoolId: reservation?.schoolId || reservation?.school?.id || '',
    classId: reservation?.classId || reservation?.studentClass?.id || '',
    reservationId: reservation?.id || '',
    responsibleId: '',
    responsible: config.responsible,
    location: config.location,
    status: config.status,
    sourceStatus: config.sourceStatus,
    notes: config.notes || '',
    automatic: true,
    origin: config.origin,
    student: reservation?.student || null,
    school: reservation?.school || null,
    studentClass: reservation?.studentClass || null,
    reservation,
    detailPath: config.detailPath
  }
}

function deduplicarEventos(manualEvents, derivedEvents) {
  const persistedKeys = new Set(manualEvents.map(chaveSemantica))
  const persistedOperationalKeys = new Set(
    manualEvents.filter((event) => event.origin !== 'manual').map(chaveOperacional)
  )
  const seen = new Set()
  const uniqueDerived = derivedEvents.filter((event) => {
    const key = chaveSemantica(event)
    const sourceKey = `${event.origin}|${event.sourceId}`
    if (
      persistedKeys.has(key)
      || persistedOperationalKeys.has(chaveOperacional(event))
      || seen.has(key)
      || seen.has(sourceKey)
    ) return false
    seen.add(key)
    seen.add(sourceKey)
    return true
  })

  return [...manualEvents, ...uniqueDerived]
}

function chaveOperacional(event) {
  return [
    event.origin,
    event.reservationId || '',
    event.type,
    event.date
  ].join('|')
}

function chaveSemantica(event) {
  return [
    event.origin || 'manual',
    event.reservationId || '',
    event.type,
    event.date,
    event.title.trim().toLowerCase()
  ].join('|')
}

function mapearStatusReserva(status) {
  if (status === 'cancelado') return 'cancelado'
  if (['entregue', 'devolvido'].includes(status)) return 'realizado'
  if (['reservado', 'confirmado'].includes(status)) return 'confirmado'
  return 'agendado'
}

function mapearStatusParcela(status) {
  if (status === 'pago') return 'realizado'
  if (status === 'cancelado') return 'cancelado'
  return 'agendado'
}

function shortId(value) {
  return String(value || '').slice(0, 8)
}

function mapearEventoParaBanco(event) {
  const eventType = getEventType(event.type)
  return {
    titulo: event.title.trim(),
    tipo: event.type,
    cor: eventType.hex,
    data: event.date,
    hora_inicio: normalizarHora(event.startTime),
    hora_fim: normalizarHora(event.endTime),
    cliente_id: event.clientId || null,
    aluno_id: event.studentId || null,
    escola_id: event.schoolId || null,
    turma_id: event.classId || null,
    reserva_id: event.reservationId || null,
    responsavel_id: event.responsibleId || null,
    responsavel_nome: textoOpcional(event.responsible),
    local: event.location.trim(),
    status: event.status,
    observacoes: textoOpcional(event.notes),
    automatico: Boolean(event.automatic),
    origem: event.origin || 'manual'
  }
}

function normalizarEvento(event) {
  return {
    id: event.id,
    title: event.titulo,
    type: event.tipo,
    color: event.cor,
    date: event.data || '',
    startTime: normalizarHora(event.hora_inicio),
    endTime: normalizarHora(event.hora_fim),
    clientId: event.cliente_id || '',
    studentId: event.aluno_id || '',
    schoolId: event.escola_id || '',
    classId: event.turma_id || '',
    reservationId: event.reserva_id || '',
    responsibleId: event.responsavel_id || '',
    responsible: event.responsavel_nome || event.responsavel?.nome || '',
    location: event.local,
    status: event.status,
    notes: event.observacoes || '',
    automatic: event.automatico,
    origin: event.origem || 'manual',
    student: event.aluno
      ? {
          id: event.aluno.id,
          clientId: event.aluno.cliente_id,
          fullName: event.aluno.nome_completo,
          guardianName: event.aluno.nome_responsavel || '',
          phone: event.aluno.telefone || '',
          guardianPhone: event.aluno.telefone_responsavel || ''
        }
      : null,
    school: event.escola
      ? { id: event.escola.id, fantasyName: event.escola.nome_fantasia }
      : null,
    studentClass: event.turma
      ? { id: event.turma.id, name: event.turma.nome }
      : null,
    reservation: normalizarReserva(event.reserva),
    createdAt: event.created_at,
    updatedAt: event.updated_at
  }
}

function normalizarReserva(reservation) {
  if (!reservation) return null
  return {
    id: reservation.id,
    eventDate: reservation.data_evento || '',
    fittingDate: reservation.data_prova || '',
    deliveryDate: reservation.data_entrega || '',
    expectedReturnDate: reservation.data_prevista_devolucao || '',
    totalValue: Number(reservation.valor_total || 0),
    status: reservation.status,
    itemsQuantity: (reservation.reserva_itens || []).reduce(
      (total, item) => total + Number(item.quantidade || 0),
      0
    )
  }
}

function normalizarHistorico(entry) {
  return {
    id: entry.id,
    action: entry.acao,
    details: entry.detalhes || {},
    user: entry.usuario?.nome || 'Sistema',
    createdAt: entry.created_at
  }
}

async function registrarHistorico(eventId, action, details) {
  const { error } = await supabase.from('evento_historico').insert({
    evento_id: eventId,
    acao: action,
    detalhes: details
  })

  if (error) throw error
}

function normalizarHora(value) {
  return value ? String(value).slice(0, 5) : ''
}

function textoOpcional(value) {
  return value?.trim() || null
}
