import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Users,
  BookOpen,
  Calendar,
  Clock,
  CreditCard,
  Package,
  TrendingUp
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import MetricCard from '../components/MetricCard'
import SectionCard from '../components/SectionCard'
import Button from '../components/Button'
import { carregarDashboard } from '../services/dashboard'

const EMPTY_DASHBOARD = {
  schoolsCount: 0,
  activeClassesCount: 0,
  studentsCount: 0,
  monthReservationsCount: 0,
  upcomingEvents: [],
  pendingPayments: [],
  inventory: { total: 0, reserved: 0 },
  receivedInMonth: 0,
  totalReceivable: 0,
  overduePaymentsCount: 0,
  upcomingPaymentsCount: 0
}

export default function Home() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    carregarDashboard()
      .then((data) => {
        if (active) setDashboard(data)
      })
      .catch((loadError) => {
        console.error(loadError)
        if (active) setError('Não foi possível carregar os dados da Dashboard.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const reservedPercentage = dashboard.inventory.total
    ? Math.round((dashboard.inventory.reserved / dashboard.inventory.total) * 100)
    : 0

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-nirart-text">Bem-vindo de volta!</h1>
          <p className="mt-1 text-sm text-gray-600">Aqui está um resumo do seu negócio</p>
        </div>

        {error && <p className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {loading && <p className="mb-6 rounded-lg border bg-white p-5 text-center text-sm text-gray-500">Carregando Dashboard...</p>}

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={Building2} title="Escolas" value={formatNumber(dashboard.schoolsCount)} subtitle="Cadastradas" color="green" />
          <MetricCard icon={Users} title="Turmas" value={formatNumber(dashboard.activeClassesCount)} subtitle="Ativas" color="wine" />
          <MetricCard icon={BookOpen} title="Alunos" value={formatNumber(dashboard.studentsCount)} subtitle="Registrados" color="blue" />
          <MetricCard icon={Calendar} title="Reservas" value={formatNumber(dashboard.monthReservationsCount)} subtitle="Este mês" color="purple" />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard
            title="Próximos Eventos"
            icon={Clock}
            action={<button type="button" onClick={() => navigate('/agenda')} className="whitespace-nowrap text-sm font-semibold text-nirart-green hover:underline">Ver todos</button>}
          >
            {dashboard.upcomingEvents.length ? (
              <div className="space-y-4">
                {dashboard.upcomingEvents.map((event) => (
                  <button
                    type="button"
                    key={event.id}
                    onClick={() => navigate(`/agenda/${event.id}`)}
                    className="flex w-full items-start gap-4 border-b border-gray-100 pb-4 text-left last:border-b-0"
                  >
                    <div className="rounded-lg bg-blue-100 p-2 text-blue-500"><Calendar size={18} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold text-nirart-text">{event.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                        <span>{formatDateBR(event.date)}</span>
                        <span>{event.time}</span>
                        <StatusBadge status={event.status} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : <EmptyText text="Nenhum evento futuro encontrado." />}
          </SectionCard>

          <SectionCard
            title="Pagamentos Pendentes"
            icon={CreditCard}
            action={<button type="button" onClick={() => navigate('/pagamentos')} className="whitespace-nowrap text-sm font-semibold text-nirart-wine hover:underline">Ver cobranças</button>}
          >
            {dashboard.pendingPayments.length ? (
              <div className="space-y-4">
                {dashboard.pendingPayments.map((payment) => (
                  <button
                    type="button"
                    key={payment.id}
                    onClick={() => navigate(`/pagamentos/${payment.paymentId}`)}
                    className="flex w-full items-start justify-between gap-3 border-b border-gray-100 pb-4 text-left last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-nirart-text">{payment.student?.fullName || 'Aluno não informado'}</p>
                      <p className="mt-1 break-words text-xs text-gray-500">{payment.school?.fantasyName || 'Sem escola vinculada'}</p>
                      <p className="mt-1 text-sm text-gray-600">{formatCurrency(payment.amount)}</p>
                    </div>
                    <span className={`shrink-0 whitespace-nowrap rounded px-2 py-1 text-xs font-semibold ${payment.status === 'Vencido' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {payment.status}
                    </span>
                  </button>
                ))}
              </div>
            ) : <EmptyText text="Nenhuma parcela pendente encontrada." />}
          </SectionCard>

          <SectionCard
            title="Estoque Reservado"
            icon={Package}
            action={<button type="button" onClick={() => navigate('/estoque')} className="whitespace-nowrap text-sm font-semibold text-nirart-green hover:underline">Gerenciar</button>}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600">Itens reservados</p>
                  <p className="text-2xl font-bold text-nirart-text">{formatNumber(dashboard.inventory.reserved)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-nirart-green">{formatNumber(dashboard.inventory.total)}</p>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-nirart-green" style={{ width: `${Math.min(100, reservedPercentage)}%` }} />
              </div>
              <p className="text-center text-xs text-gray-600">{reservedPercentage}% do estoque reservado</p>
            </div>
          </SectionCard>

          <SectionCard
            title={`Total Recebido (${formatCurrentMonth()})`}
            icon={TrendingUp}
            action={<button type="button" onClick={() => navigate('/dashboard-financeiro')} className="whitespace-nowrap text-sm font-semibold text-nirart-wine hover:underline">Relatório</button>}
          >
            <div className="space-y-4">
              <p className="break-words text-4xl font-bold text-nirart-wine">{formatCurrency(dashboard.receivedInMonth)}</p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between gap-4">
                  <span>Total a receber</span>
                  <span className="text-right font-semibold text-nirart-text">{formatCurrency(dashboard.totalReceivable)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Parcelas vencidas</span>
                  <span className="font-semibold text-red-700">{formatNumber(dashboard.overduePaymentsCount)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Parcelas a vencer</span>
                  <span className="font-semibold text-nirart-text">{formatNumber(dashboard.upcomingPaymentsCount)}</span>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="rounded-lg border border-gray-200 bg-nirart-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-nirart-text">Ações Rápidas</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="primary" onClick={() => navigate('/cadastro-escola')} className="flex items-center justify-center gap-2"><Building2 size={18} /> Adicionar Escola</Button>
            <Button variant="outline" onClick={() => navigate('/cadastro-reserva')} className="flex items-center justify-center gap-2"><Calendar size={18} /> Nova Reserva</Button>
            <Button variant="primary" onClick={() => navigate('/importar-alunos')} className="flex items-center justify-center gap-2"><BookOpen size={18} /> Importar Alunos</Button>
            <Button variant="outline" onClick={() => navigate('/cadastro-pagamento')} className="flex items-center justify-center gap-2"><CreditCard size={18} /> Registrar Pagamento</Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

function StatusBadge({ status }) {
  const styles = {
    agendado: 'bg-yellow-100 text-yellow-700',
    confirmado: 'bg-blue-100 text-blue-700',
    realizado: 'bg-green-100 text-green-700',
    reagendado: 'bg-purple-100 text-purple-700'
  }
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>{capitalize(status)}</span>
}

function EmptyText({ text }) {
  return <p className="py-8 text-center text-sm text-gray-500">{text}</p>
}

function formatDateBR(value) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(Number(value || 0))
}

function formatCurrentMonth() {
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date())
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function capitalize(value = '') {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
