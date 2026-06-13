import { supabase } from './supabase'

const CLASS_COLUMNS = [
  'id',
  'escola_id',
  'nome',
  'turno',
  'data_evento',
  'local_evento',
  'observacoes',
  'status',
  'created_at',
  'updated_at'
].join(', ')

const LINKED_TABLES = ['alunos', 'reservas', 'eventos', 'lista_espera']

export async function listarTurmas() {
  const { data, error } = await supabase
    .from('turmas')
    .select(`${CLASS_COLUMNS}, alunos(count)`)
    .order('nome', { ascending: true })

  if (error) throw error
  return (data || []).map(normalizarTurma)
}

export async function buscarTurmaPorId(id) {
  const { data, error } = await supabase
    .from('turmas')
    .select(`${CLASS_COLUMNS}, alunos(count)`)
    .eq('id', id)
    .single()

  if (error) throw error
  return normalizarTurma(data)
}

export async function criarTurma(turma) {
  const { data, error } = await supabase
    .from('turmas')
    .insert(mapearTurmaParaBanco(turma))
    .select(CLASS_COLUMNS)
    .single()

  if (error) throw error
  return normalizarTurma({ ...data, alunos: [{ count: 0 }] })
}

export async function atualizarTurma(id, turma) {
  const { data, error } = await supabase
    .from('turmas')
    .update(mapearTurmaParaBanco(turma))
    .eq('id', id)
    .select(`${CLASS_COLUMNS}, alunos(count)`)
    .single()

  if (error) throw error
  return normalizarTurma(data)
}

export async function removerTurma(id) {
  const linkedRecords = await contarVinculos(id)

  if (linkedRecords > 0) {
    const { data, error } = await supabase
      .from('turmas')
      .update({ status: 'Inativa' })
      .eq('id', id)
      .select(`${CLASS_COLUMNS}, alunos(count)`)
      .single()

    if (error) throw error
    return {
      action: 'inactivated',
      linkedRecords,
      classData: normalizarTurma(data)
    }
  }

  const { error } = await supabase
    .from('turmas')
    .delete()
    .eq('id', id)

  if (error) throw error
  return { action: 'deleted', linkedRecords: 0, classData: null }
}

async function contarVinculos(id) {
  const results = await Promise.all(LINKED_TABLES.map((table) => (
    supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('turma_id', id)
  )))

  const failedResult = results.find(({ error }) => error)
  if (failedResult?.error) throw failedResult.error

  return results.reduce((total, result) => total + (result.count || 0), 0)
}

function mapearTurmaParaBanco(turma) {
  return {
    escola_id: turma.schoolId,
    nome: turma.name.trim(),
    turno: turma.turn,
    // Inputs type="date" já fornecem YYYY-MM-DD; preserve a string sem timezone.
    data_evento: turma.eventDate || null,
    local_evento: valorOpcional(turma.eventLocation),
    observacoes: valorOpcional(turma.notes),
    status: turma.status
  }
}

function normalizarTurma(turma) {
  return {
    id: turma.id,
    schoolId: turma.escola_id,
    name: turma.nome,
    turn: turma.turno || '',
    eventDate: turma.data_evento || '',
    eventLocation: turma.local_evento || '',
    students: Number(turma.alunos?.[0]?.count || 0),
    notes: turma.observacoes || '',
    status: turma.status,
    createdAt: turma.created_at,
    updatedAt: turma.updated_at
  }
}

function valorOpcional(value) {
  const normalizedValue = value?.trim()
  return normalizedValue || null
}
