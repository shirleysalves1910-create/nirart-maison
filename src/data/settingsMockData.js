export const MOCK_COMPANY_SETTINGS = {
  storeName: 'Nirart Maison',
  phone: '(85) 99999-2026',
  address: 'Rua das Acácias, 320, Centro, Fortaleza - CE',
  cnpj: '12.345.678/0001-90',
  logo: '',
  colors: {
    primary: '#6FBFA9',
    accent: '#B2181B',
    background: '#F8F6F2',
    text: '#2B2B2B'
  },
  messages: {
    reservationConfirmation: 'Olá! Sua reserva na Nirart Maison foi confirmada.',
    deliveryReminder: 'Lembramos que a entrega dos itens está agendada para {data}.',
    returnReminder: 'A devolução dos itens está prevista para {data}.',
    paymentReminder: 'Identificamos uma parcela com vencimento em {data}.'
  },
  rentalTerms: 'O cliente declara ter conferido os itens no momento da retirada e se compromete a devolvê-los nas mesmas condições de conservação, respeitando as datas acordadas na reserva.',
  returnRules: 'A devolução deve ocorrer até a data prevista. Atrasos e avarias poderão gerar multas conforme avaliação da equipe Nirart Maison.'
}

export const USER_PROFILES = [
  {
    value: 'Administrador',
    description: 'Acesso total ao sistema.',
    permissions: [
      'Dashboard',
      'Escolas',
      'Turmas',
      'Alunos',
      'Medidas',
      'Estoque',
      'Reservas',
      'Entregas',
      'Devoluções',
      'Pagamentos',
      'Agenda',
      'Relatórios',
      'Dashboard Financeiro',
      'Configurações',
      'Usuários'
    ]
  },
  {
    value: 'Atendente',
    description: 'Acesso à operação de atendimento e locação.',
    permissions: [
      'Escolas',
      'Turmas',
      'Alunos',
      'Medidas',
      'Reservas',
      'Entregas',
      'Devoluções'
    ]
  },
  {
    value: 'Financeiro',
    description: 'Acesso aos módulos e indicadores financeiros.',
    permissions: [
      'Pagamentos',
      'Relatórios',
      'Dashboard Financeiro'
    ]
  }
]

export const USER_STATUSES = ['Ativo', 'Inativo']

export const MOCK_USERS = [
  {
    id: 1,
    name: 'Marina Alves',
    email: 'marina@nirartmaison.com.br',
    profile: 'Administrador',
    status: 'Ativo',
    lastAccess: '12/06/2026 08:15'
  },
  {
    id: 2,
    name: 'Julia Santos',
    email: 'julia@nirartmaison.com.br',
    profile: 'Atendente',
    status: 'Ativo',
    lastAccess: '12/06/2026 09:40'
  },
  {
    id: 3,
    name: 'Pedro Souza',
    email: 'pedro@nirartmaison.com.br',
    profile: 'Financeiro',
    status: 'Ativo',
    lastAccess: '11/06/2026 17:22'
  },
  {
    id: 4,
    name: 'Ana Martins',
    email: 'ana@nirartmaison.com.br',
    profile: 'Atendente',
    status: 'Inativo',
    lastAccess: '28/05/2026 14:10'
  }
]

export function getMockUserById(id) {
  return MOCK_USERS.find((user) => String(user.id) === String(id))
}

export function getUserProfile(profile) {
  return USER_PROFILES.find((item) => item.value === profile)
}
