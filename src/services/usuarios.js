import { supabase } from './supabase'

const USER_COLUMNS = 'id, nome, email, perfil, status, ultimo_acesso, created_at, updated_at'
const EMAIL_RATE_LIMIT_MESSAGE = 'O Supabase limitou temporariamente o envio de e-mails. Aguarde alguns minutos ou desative a confirmação de e-mail no painel do Supabase para testes.'
let userCreationInProgress = false

export async function listarUsuarios() {
  const { data, error } = await supabase
    .from('usuarios')
    .select(USER_COLUMNS)
    .order('nome', { ascending: true })

  if (error) throw error
  return data.map(normalizarUsuario)
}

export async function buscarUsuarioPorId(id) {
  const { data, error } = await supabase
    .from('usuarios')
    .select(USER_COLUMNS)
    .eq('id', id)
    .single()

  if (error) throw error
  return normalizarUsuario(data)
}

export async function criarUsuario({ name, email, profile, status, password }) {
  if (userCreationInProgress) {
    throw new Error('O cadastro do usuário já está em andamento.')
  }

  userCreationInProgress = true
  let currentSession = null

  try {
    const { data: currentSessionData } = await supabase.auth.getSession()
    currentSession = currentSessionData.session

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome: name,
          perfil: profile
        }
      }
    })

    if (authError) {
      if (isEmailRateLimitError(authError)) {
        throw new Error(EMAIL_RATE_LIMIT_MESSAGE)
      }
      throw authError
    }
    if (!authData.user) throw new Error('O Supabase não retornou o usuário criado.')

    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        id: authData.user.id,
        nome: name,
        email,
        perfil: profile,
        status
      })
      .select(USER_COLUMNS)
      .single()

    if (error) {
      throw new Error(`O acesso foi criado no Auth, mas o perfil não pôde ser salvo: ${error.message}`)
    }

    return normalizarUsuario(data)
  } finally {
    try {
      if (currentSession?.access_token && currentSession?.refresh_token) {
        await supabase.auth.setSession({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token
        })
      } else {
        await supabase.auth.signOut({ scope: 'local' })
      }
    } finally {
      userCreationInProgress = false
    }
  }
}

export async function atualizarUsuario(id, { name, profile, status }) {
  const { data, error } = await supabase
    .from('usuarios')
    .update({
      nome: name,
      perfil: profile,
      status
    })
    .eq('id', id)
    .select(USER_COLUMNS)
    .single()

  if (error) throw error
  return normalizarUsuario(data)
}

export async function atualizarStatusUsuario(id, status) {
  const { data, error } = await supabase
    .from('usuarios')
    .update({ status })
    .eq('id', id)
    .select(USER_COLUMNS)
    .single()

  if (error) throw error
  return normalizarUsuario(data)
}

export async function excluirUsuario(id) {
  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function redefinirSenhaUsuario(email) {
  const redirectTo = `${window.location.origin}/login`
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

  if (error) throw error
}

function normalizarUsuario(user) {
  return {
    id: user.id,
    name: user.nome,
    email: user.email,
    profile: user.perfil,
    status: user.status,
    lastAccess: formatDateTime(user.ultimo_acesso),
    createdAt: user.created_at,
    updatedAt: user.updated_at
  }
}

function formatDateTime(value) {
  if (!value) return 'Nunca'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value))
}

function isEmailRateLimitError(error) {
  const message = error?.message?.toLowerCase() || ''
  const code = error?.code?.toLowerCase() || ''
  return (
    message.includes('email rate limit exceeded') ||
    code.includes('email_send_rate_limit')
  )
}
