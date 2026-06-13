import { supabase } from './supabase'

const MEASUREMENT_COLUMNS = [
  'id',
  'aluno_id',
  'registrado_por',
  'tipo',
  'data_medicao',
  'status',
  'foto_medida_url',
  'arquivo_medida_url',
  'altura',
  'busto',
  'abaixo_busto',
  'cintura',
  'quadril',
  'comprimento',
  'tamanho_terno',
  'comprimento_manga',
  'tamanho_camisa',
  'tamanho_calca',
  'cintura_calca',
  'comprimento_calca',
  'numero_sapato',
  'observacoes',
  'alteracoes',
  'created_at',
  'updated_at'
].join(', ')

export async function listarMedidas(alunoId = null) {
  let query = supabase
    .from('medidas')
    .select(MEASUREMENT_COLUMNS)
    .order('data_medicao', { ascending: false })
    .order('created_at', { ascending: false })

  if (alunoId) query = query.eq('aluno_id', alunoId)

  const { data, error } = await query
  if (error) throw error
  return (data || []).map(normalizarMedida)
}

export async function buscarMedidaPorId(id) {
  const { data, error } = await supabase
    .from('medidas')
    .select(MEASUREMENT_COLUMNS)
    .eq('id', id)
    .single()

  if (error) throw error
  return normalizarMedida(data)
}

export async function criarMedida(alunoId, tipo, medida) {
  const { data: activeMeasurements, error: activeError } = await supabase
    .from('medidas')
    .select('id')
    .eq('aluno_id', alunoId)
    .eq('status', 'Ativa')

  if (activeError) throw activeError

  const activeIds = (activeMeasurements || []).map(({ id }) => id)
  if (activeIds.length) {
    const { error: previousError } = await supabase
      .from('medidas')
      .update({ status: 'Anterior' })
      .in('id', activeIds)

    if (previousError) throw previousError
  }

  const { data, error } = await supabase
    .from('medidas')
    .insert({
      aluno_id: alunoId,
      tipo,
      status: 'Ativa',
      data_medicao: medida.measurementDate || getLocalDateString(),
      ...mapearCamposMedida(medida, tipo)
    })
    .select(MEASUREMENT_COLUMNS)
    .single()

  if (error) {
    if (activeIds.length) {
      await supabase.from('medidas').update({ status: 'Ativa' }).in('id', activeIds)
    }
    throw error
  }

  return normalizarMedida(data)
}

export async function atualizarMedida(id, tipo, medida) {
  const { data, error } = await supabase
    .from('medidas')
    .update({
      tipo,
      data_medicao: medida.measurementDate,
      ...mapearCamposMedida(medida, tipo)
    })
    .eq('id', id)
    .select(MEASUREMENT_COLUMNS)
    .single()

  if (error) throw error
  return normalizarMedida(data)
}

function mapearCamposMedida(medida, tipo) {
  const common = {
    altura: numeroOpcional(medida.altura),
    numero_sapato: textoOpcional(medida.shoeSize),
    observacoes: textoOpcional(medida.notes),
    alteracoes: textoOpcional(medida.changes)
  }

  if (tipo === 'feminina') {
    return {
      ...common,
      busto: numeroOpcional(medida.busto),
      abaixo_busto: numeroOpcional(medida.abaixoBusto),
      cintura: numeroOpcional(medida.cintura),
      quadril: numeroOpcional(medida.quadril),
      comprimento: numeroOpcional(medida.comprimento),
      tamanho_terno: null,
      comprimento_manga: null,
      tamanho_camisa: null,
      tamanho_calca: null,
      cintura_calca: null,
      comprimento_calca: null
    }
  }

  return {
    ...common,
    busto: null,
    abaixo_busto: null,
    cintura: null,
    quadril: null,
    comprimento: null,
    tamanho_terno: textoOpcional(medida.suitSize),
    comprimento_manga: numeroOpcional(medida.sleeve),
    tamanho_camisa: textoOpcional(medida.shirtSize),
    tamanho_calca: textoOpcional(medida.pantsSize),
    cintura_calca: numeroOpcional(medida.waist),
    comprimento_calca: numeroOpcional(medida.pantsLength)
  }
}

function normalizarMedida(medida) {
  return {
    id: medida.id,
    studentId: medida.aluno_id,
    registeredBy: medida.registrado_por,
    type: medida.tipo === 'feminina' ? 'female' : 'male',
    measurementDate: medida.data_medicao,
    date: medida.data_medicao,
    status: medida.status,
    photoUrl: medida.foto_medida_url || '',
    fileUrl: medida.arquivo_medida_url || '',
    altura: numeroParaTexto(medida.altura),
    busto: numeroParaTexto(medida.busto),
    abaixoBusto: numeroParaTexto(medida.abaixo_busto),
    cintura: numeroParaTexto(medida.cintura),
    quadril: numeroParaTexto(medida.quadril),
    comprimento: numeroParaTexto(medida.comprimento),
    suitSize: medida.tamanho_terno || '',
    sleeve: numeroParaTexto(medida.comprimento_manga),
    shirtSize: medida.tamanho_camisa || '',
    pantsSize: medida.tamanho_calca || '',
    waist: numeroParaTexto(medida.cintura_calca),
    pantsLength: numeroParaTexto(medida.comprimento_calca),
    shoeSize: medida.numero_sapato || '',
    notes: medida.observacoes || '',
    changes: medida.alteracoes || '',
    createdAt: medida.created_at,
    updatedAt: medida.updated_at
  }
}

function numeroOpcional(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null

  const normalized = String(value)
    .trim()
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '')

  if (!normalized || Number.isNaN(Number(normalized))) return null
  return Number(normalized)
}

function numeroParaTexto(value) {
  if (value === null || value === undefined) return ''
  return String(value).replace('.', ',')
}

function textoOpcional(value) {
  const normalized = value?.trim()
  return normalized || null
}

function getLocalDateString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
