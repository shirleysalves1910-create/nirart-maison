export const PAYMENT_STATUSES = ['aberto', 'parcial', 'quitado', 'cancelado']

export const INSTALLMENT_STATUSES = ['pendente', 'pago', 'vencido', 'cancelado']

export const PAYMENT_METHODS = [
  'Dinheiro',
  'PIX',
  'Cartão de débito',
  'Cartão de crédito',
  'Transferência bancária'
]

export const MOCK_PAYMENTS = [
  {
    id: 1,
    reservationId: 1,
    totalValue: 425,
    downPayment: 125,
    downPaymentDate: '2026-05-28',
    downPaymentMethod: 'PIX',
    installmentCount: 3,
    status: 'parcial',
    notes: 'Entrada recebida no atendimento da prova.',
    cancellationReason: '',
    installments: [
      { id: 101, number: 1, value: 100, dueDate: '2026-06-05', paymentDate: '2026-06-05', status: 'pago', paymentMethod: 'PIX', notes: 'Pagamento confirmado.' },
      { id: 102, number: 2, value: 100, dueDate: '2026-06-12', paymentDate: '', status: 'pendente', paymentMethod: '', notes: '' },
      { id: 103, number: 3, value: 100, dueDate: '2026-06-19', paymentDate: '', status: 'pendente', paymentMethod: '', notes: '' }
    ]
  },
  {
    id: 2,
    reservationId: 2,
    totalValue: 190,
    downPayment: 40,
    downPaymentDate: '2026-05-20',
    downPaymentMethod: 'Dinheiro',
    installmentCount: 3,
    status: 'parcial',
    notes: 'Responsável solicitou vencimentos quinzenais.',
    cancellationReason: '',
    installments: [
      { id: 201, number: 1, value: 50, dueDate: '2026-05-30', paymentDate: '2026-05-30', status: 'pago', paymentMethod: 'Dinheiro', notes: '' },
      { id: 202, number: 2, value: 50, dueDate: '2026-06-08', paymentDate: '', status: 'vencido', paymentMethod: '', notes: 'Aguardando contato com responsável.' },
      { id: 203, number: 3, value: 50, dueDate: '2026-06-22', paymentDate: '', status: 'pendente', paymentMethod: '', notes: '' }
    ]
  },
  {
    id: 3,
    reservationId: 3,
    totalValue: 420,
    downPayment: 0,
    downPaymentDate: '',
    downPaymentMethod: '',
    installmentCount: 3,
    status: 'aberto',
    notes: 'Parcelamento mensal.',
    cancellationReason: '',
    installments: [
      { id: 301, number: 1, value: 140, dueDate: '2026-06-15', paymentDate: '', status: 'pendente', paymentMethod: '', notes: '' },
      { id: 302, number: 2, value: 140, dueDate: '2026-07-15', paymentDate: '', status: 'pendente', paymentMethod: '', notes: '' },
      { id: 303, number: 3, value: 140, dueDate: '2026-08-15', paymentDate: '', status: 'pendente', paymentMethod: '', notes: '' }
    ]
  },
  {
    id: 4,
    reservationId: 4,
    totalValue: 390,
    downPayment: 90,
    downPaymentDate: '2026-05-10',
    downPaymentMethod: 'PIX',
    installmentCount: 3,
    status: 'quitado',
    notes: 'Pagamento concluído antes da entrega.',
    cancellationReason: '',
    installments: [
      { id: 401, number: 1, value: 100, dueDate: '2026-05-18', paymentDate: '2026-05-18', status: 'pago', paymentMethod: 'PIX', notes: '' },
      { id: 402, number: 2, value: 100, dueDate: '2026-05-28', paymentDate: '2026-05-27', status: 'pago', paymentMethod: 'PIX', notes: '' },
      { id: 403, number: 3, value: 100, dueDate: '2026-06-05', paymentDate: '2026-06-04', status: 'pago', paymentMethod: 'PIX', notes: '' }
    ]
  },
  {
    id: 5,
    reservationId: 5,
    totalValue: 280,
    downPayment: 0,
    downPaymentDate: '',
    downPaymentMethod: '',
    installmentCount: 2,
    status: 'cancelado',
    notes: 'Pagamento cancelado junto com a reserva.',
    cancellationReason: 'Evento cancelado pela escola.',
    installments: [
      { id: 501, number: 1, value: 140, dueDate: '2026-08-20', paymentDate: '', status: 'cancelado', paymentMethod: '', notes: '' },
      { id: 502, number: 2, value: 140, dueDate: '2026-09-10', paymentDate: '', status: 'cancelado', paymentMethod: '', notes: '' }
    ]
  }
]

export function getPaymentById(id) {
  return MOCK_PAYMENTS.find((payment) => String(payment.id) === String(id))
}

export function getPaymentByReservationId(reservationId) {
  return MOCK_PAYMENTS.find((payment) => String(payment.reservationId) === String(reservationId))
}

export function getInstallment(payment, installmentId) {
  return payment?.installments.find((installment) => String(installment.id) === String(installmentId))
}

export function getPaidTotal(payment) {
  if (!payment || payment.status === 'cancelado') return 0
  return Number(payment.downPayment || 0) + payment.installments.reduce(
    (total, installment) => (
      installment.status === 'pago' ? total + Number(installment.value || 0) : total
    ),
    0
  )
}

export function getRemainingTotal(payment) {
  if (!payment || payment.status === 'cancelado') return 0
  return Math.max(0, Number(payment.totalValue || 0) - getPaidTotal(payment))
}

export function getNextDueInstallment(payment) {
  return payment?.installments
    .filter((installment) => ['pendente', 'vencido'].includes(installment.status))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
}

export function getPaymentStatus(payment) {
  if (payment.status === 'cancelado') return 'cancelado'
  const paid = getPaidTotal(payment)
  if (paid >= Number(payment.totalValue || 0)) return 'quitado'
  if (paid > 0) return 'parcial'
  return 'aberto'
}

export function getInstallmentDisplayStatus(installment, referenceDate = '2026-06-12') {
  if (['pago', 'cancelado'].includes(installment.status)) return installment.status
  return installment.dueDate < referenceDate ? 'vencido' : 'pendente'
}
