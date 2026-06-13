import { supabase } from './supabase'

const ADJUSTMENT_COLUMNS = [
  'id',
  'aluno_id',
  'medida_id',
  'responsavel_id',
  'peca',
  'tipo_ajuste',
  'descricao',
  'responsavel_nome',
  'data_ajuste',
  'observacoes',
  'status',
  'created_at',
  'updated_at'
].join(', ')

export async function listarAjustes(alunoId) {
  const { data, error } = await supabase
    .from('ajustes')
    .select(ADJUSTMENT_COLUMNS)
    .eq('aluno_id', alunoId)
    .order('data_ajuste', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(normalizarAjuste)
}

export async function criarAjuste(alunoId, ajuste) {
  const { data, error } = await supabase
    .from('ajustes')
    .insert({
      aluno_id: alunoId,
      medida_id: ajuste.measurementId || null,
      peca: ajuste.piece.trim(),
      tipo_ajuste: ajuste.adjustmentType,
      descricao: ajuste.description.trim(),
      responsavel_nome: textoOpcional(ajuste.responsible),
      data_ajuste: ajuste.adjustmentDate,
      observacoes: textoOpcional(ajuste.notes),
      status: ajuste.status
    })
    .select(ADJUSTMENT_COLUMNS)
    .single()

  if (error) throw error
  return normalizarAjuste(data)
}

function normalizarAjuste(ajuste) {
  return {
    id: ajuste.id,
    studentId: ajuste.aluno_id,
    measurementId: ajuste.medida_id || '',
    responsibleId: ajuste.responsavel_id || '',
    piece: ajuste.peca,
    adjustmentType: ajuste.tipo_ajuste,
    description: ajuste.descricao,
    responsible: ajuste.responsavel_nome || '',
    date: ajuste.data_ajuste,
    adjustmentDate: ajuste.data_ajuste,
    notes: ajuste.observacoes || '',
    status: ajuste.status,
    createdAt: ajuste.created_at,
    updatedAt: ajuste.updated_at
  }
}

function textoOpcional(value) {
  const normalized = value?.trim()
  return normalized || null
}
