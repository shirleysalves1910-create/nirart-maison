import { supabase } from './supabase'

const SCHOOL_COLUMNS = [
  'id',
  'cliente_id',
  'nome_fantasia',
  'cnpj',
  'email',
  'telefone',
  'endereco',
  'cidade',
  'estado',
  'cep',
  'responsavel',
  'observacoes',
  'status',
  'created_at',
  'updated_at'
].join(', ')

export async function listarEscolas() {
  const { data, error } = await supabase
    .from('escolas')
    .select(SCHOOL_COLUMNS)
    .order('nome_fantasia', { ascending: true })

  if (error) throw error
  return (data || []).map(normalizarEscola)
}

export async function buscarEscolaPorId(id) {
  const { data, error } = await supabase
    .from('escolas')
    .select(SCHOOL_COLUMNS)
    .eq('id', id)
    .single()

  if (error) throw error
  return normalizarEscola(data)
}

export async function criarEscola(escola) {
  const { data, error } = await supabase
    .from('escolas')
    .insert(mapearEscolaParaBanco(escola))
    .select(SCHOOL_COLUMNS)
    .single()

  if (error) throw error
  return normalizarEscola(data)
}

export async function atualizarEscola(id, escola) {
  const { data, error } = await supabase
    .from('escolas')
    .update(mapearEscolaParaBanco(escola))
    .eq('id', id)
    .select(SCHOOL_COLUMNS)
    .single()

  if (error) throw error
  return normalizarEscola(data)
}

export async function inativarEscola(id) {
  const { data, error } = await supabase
    .from('escolas')
    .update({ status: 'Inativa' })
    .eq('id', id)
    .select(SCHOOL_COLUMNS)
    .single()

  if (error) throw error
  return normalizarEscola(data)
}

export async function excluirEscola(id) {
  const { error } = await supabase
    .from('escolas')
    .delete()
    .eq('id', id)

  if (error) throw error
}

function mapearEscolaParaBanco(escola) {
  return {
    nome_fantasia: escola.fantasyName.trim(),
    cnpj: valorOpcional(escola.cnpj),
    email: valorOpcional(escola.email),
    telefone: valorOpcional(escola.phone),
    endereco: valorOpcional(escola.address),
    cidade: valorOpcional(escola.city),
    estado: valorOpcional(escola.state)?.toUpperCase(),
    cep: valorOpcional(escola.zipcode),
    responsavel: valorOpcional(escola.responsible),
    observacoes: valorOpcional(escola.notes),
    status: escola.status
  }
}

function normalizarEscola(escola) {
  return {
    id: escola.id,
    clientId: escola.cliente_id,
    fantasyName: escola.nome_fantasia,
    cnpj: escola.cnpj || '',
    email: escola.email || '',
    phone: escola.telefone || '',
    address: escola.endereco || '',
    city: escola.cidade || '',
    state: escola.estado || '',
    zipcode: escola.cep || '',
    responsible: escola.responsavel || '',
    notes: escola.observacoes || '',
    status: escola.status,
    createdAt: escola.created_at,
    updatedAt: escola.updated_at
  }
}

function valorOpcional(value) {
  const normalizedValue = value?.trim()
  return normalizedValue || null
}
