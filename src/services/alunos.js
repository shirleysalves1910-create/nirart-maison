import { supabase } from './supabase'

const STUDENT_COLUMNS = [
  'id',
  'cliente_id',
  'escola_id',
  'turma_id',
  'nome_completo',
  'foto_url',
  'sexo',
  'data_nascimento',
  'telefone',
  'endereco',
  'nome_responsavel',
  'telefone_responsavel',
  'observacoes',
  'status',
  'created_at',
  'updated_at'
].join(', ')

const STUDENT_WITH_COUNTS = `${STUDENT_COLUMNS}, medidas(count), reservas(count)`

const DIRECT_LINKS = ['medidas', 'ajustes', 'reservas', 'lista_espera', 'eventos', 'notificacoes']

export async function listarAlunos() {
  const { data, error } = await supabase
    .from('alunos')
    .select(STUDENT_WITH_COUNTS)
    .order('nome_completo', { ascending: true })

  if (error) throw error
  return (data || []).map(normalizarAluno)
}

export async function buscarAlunoPorId(id) {
  const { data, error } = await supabase
    .from('alunos')
    .select(STUDENT_WITH_COUNTS)
    .eq('id', id)
    .single()

  if (error) throw error
  return normalizarAluno(data)
}

export async function criarAluno(aluno) {
  const { data: client, error: clientError } = await supabase
    .from('clientes')
    .insert(mapearClienteParaBanco(aluno))
    .select('id')
    .single()

  if (clientError) throw clientError

  const { data, error } = await supabase
    .from('alunos')
    .insert({
      ...mapearAlunoParaBanco(aluno),
      cliente_id: client.id
    })
    .select(STUDENT_COLUMNS)
    .single()

  if (error) {
    await supabase.from('clientes').delete().eq('id', client.id)
    throw error
  }

  return normalizarAluno({
    ...data,
    medidas: [{ count: 0 }],
    reservas: [{ count: 0 }]
  })
}

export async function importarAlunos({ names, schoolId, classId }) {
  const result = {
    identified: names.length,
    imported: 0,
    errors: []
  }

  for (const name of names) {
    try {
      await criarAluno({
        schoolId,
        classId,
        fullName: name,
        sex: 'O',
        birthDate: '',
        phone: '',
        address: '',
        guardianName: '',
        guardianPhone: '',
        notes: 'Cadastro criado por importação de alunos.',
        status: 'Ativo'
      })
      result.imported += 1
    } catch (error) {
      result.errors.push({
        name,
        message: error?.message || 'Erro desconhecido durante a importação.'
      })
    }
  }

  return result
}

export async function atualizarAluno(id, aluno) {
  const { data: currentStudent, error: currentError } = await supabase
    .from('alunos')
    .select('cliente_id')
    .eq('id', id)
    .single()

  if (currentError) throw currentError

  const { data, error } = await supabase
    .from('alunos')
    .update(mapearAlunoParaBanco(aluno))
    .eq('id', id)
    .select(STUDENT_WITH_COUNTS)
    .single()

  if (error) throw error

  if (currentStudent.cliente_id) {
    const { error: clientError } = await supabase
      .from('clientes')
      .update(mapearClienteParaBanco(aluno))
      .eq('id', currentStudent.cliente_id)

    if (clientError) throw clientError
  }

  return normalizarAluno(data)
}

export async function removerAluno(id) {
  const { data: student, error: studentError } = await supabase
    .from('alunos')
    .select('cliente_id, nome_completo')
    .eq('id', id)
    .single()

  if (studentError) throw studentError

  const linkedRecords = await contarVinculos(id)

  if (linkedRecords > 0) {
    const { data, error } = await supabase
      .from('alunos')
      .update({ status: 'Inativo' })
      .eq('id', id)
      .select(STUDENT_WITH_COUNTS)
      .single()

    if (error) throw error

    if (student.cliente_id) {
      await supabase
        .from('clientes')
        .update({ status: 'Inativo' })
        .eq('id', student.cliente_id)
    }

    return {
      action: 'inactivated',
      linkedRecords,
      student: normalizarAluno(data)
    }
  }

  const { error } = await supabase
    .from('alunos')
    .delete()
    .eq('id', id)

  if (error) throw error

  if (student.cliente_id) {
    await supabase.from('clientes').delete().eq('id', student.cliente_id)
  }

  return { action: 'deleted', linkedRecords: 0, student: null }
}

async function contarVinculos(id) {
  const directResults = await Promise.all(DIRECT_LINKS.map((table) => (
    supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('aluno_id', id)
  )))

  const familyResults = await Promise.all([
    supabase
      .from('aluno_parentesco')
      .select('id', { count: 'exact', head: true })
      .eq('aluno_id', id),
    supabase
      .from('aluno_parentesco')
      .select('id', { count: 'exact', head: true })
      .eq('aluno_relacionado_id', id)
  ])

  const results = [...directResults, ...familyResults]
  const failedResult = results.find(({ error }) => error)
  if (failedResult?.error) throw failedResult.error

  return results.reduce((total, result) => total + (result.count || 0), 0)
}

function mapearAlunoParaBanco(aluno) {
  return {
    escola_id: aluno.schoolId || null,
    turma_id: aluno.classId || null,
    nome_completo: aluno.fullName.trim(),
    sexo: aluno.sex,
    // Inputs type="date" fornecem YYYY-MM-DD; preserve a string sem timezone.
    data_nascimento: aluno.birthDate || null,
    telefone: valorOpcional(aluno.phone),
    endereco: valorOpcional(aluno.address),
    nome_responsavel: valorOpcional(aluno.guardianName),
    telefone_responsavel: valorOpcional(aluno.guardianPhone),
    observacoes: valorOpcional(aluno.notes),
    status: aluno.status
  }
}

function mapearClienteParaBanco(aluno) {
  return {
    tipo_cliente: 'Responsável',
    nome_razao_social: (aluno.guardianName || aluno.fullName).trim(),
    nome_fantasia: valorOpcional(aluno.fullName),
    telefone: valorOpcional(aluno.guardianPhone || aluno.phone),
    endereco: valorOpcional(aluno.address),
    observacoes: valorOpcional(aluno.notes),
    status: aluno.status
  }
}

function normalizarAluno(aluno) {
  return {
    id: aluno.id,
    clientId: aluno.cliente_id,
    schoolId: aluno.escola_id || '',
    classId: aluno.turma_id || '',
    fullName: aluno.nome_completo,
    photoUrl: aluno.foto_url || '',
    sex: aluno.sexo,
    birthDate: aluno.data_nascimento || '',
    phone: aluno.telefone || '',
    address: aluno.endereco || '',
    guardianName: aluno.nome_responsavel || '',
    guardianPhone: aluno.telefone_responsavel || '',
    notes: aluno.observacoes || '',
    status: aluno.status,
    measuresCount: Number(aluno.medidas?.[0]?.count || 0),
    reservationsCount: Number(aluno.reservas?.[0]?.count || 0),
    createdAt: aluno.created_at,
    updatedAt: aluno.updated_at
  }
}

function valorOpcional(value) {
  const normalizedValue = value?.trim()
  return normalizedValue || null
}
