import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Users,
  BookOpen,
  Calendar,
  Clock,
  CreditCard,
  Package,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import MetricCard from '../components/MetricCard'
import SectionCard from '../components/SectionCard'
import Button from '../components/Button'

export default function Home() {
  const navigate = useNavigate()

  // Dados mockados para eventos
  const upcomingEvents = [
    { id: 1, name: 'Formatura 6º ano - Escola ABC', date: '12/06/2024', time: '18:00' },
    { id: 2, name: 'Baile de Debutantes - Colégio XYZ', date: '15/06/2024', time: '20:00' },
    { id: 3, name: 'Festa de Conclusão - E.E. 123', date: '18/06/2024', time: '19:00' },
  ]

  const pendingPayments = [
    { id: 1, school: 'Escola Estadual Maria', amount: 'R$ 1.500,00', status: 'Vencido' },
    { id: 2, school: 'Colégio São João', amount: 'R$ 2.200,00', status: 'Vence em 3 dias' },
    { id: 3, school: 'E.E. Das Flores', amount: 'R$ 890,00', status: 'Vence em 7 dias' },
  ]

  return (
    <MainLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-nirart-text">Bem-vindo de volta!</h1>
          <p className="text-gray-600 text-sm mt-1">Aqui está um resumo do seu negócio</p>
        </div>

        {/* Linha 1 - Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={Building2}
            title="Escolas"
            value="12"
            subtitle="Cadastradas"
            color="green"
          />
          <MetricCard
            icon={Users}
            title="Turmas"
            value="48"
            subtitle="Ativas"
            color="wine"
          />
          <MetricCard
            icon={BookOpen}
            title="Alunos"
            value="1,250"
            subtitle="Registrados"
            color="blue"
          />
          <MetricCard
            icon={Calendar}
            title="Reservas"
            value="32"
            subtitle="Este mês"
            color="purple"
          />
        </div>

        {/* Linha 2 - Seções Detalhadas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Próximos Eventos */}
          <SectionCard
            title="Próximos Eventos"
            icon={Clock}
            action={
              <button className="text-nirart-green text-sm font-semibold hover:underline">
                Ver todos
              </button>
            }
          >
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-b-0"
                >
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-500">
                    <Calendar size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-nirart-text text-sm">{event.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                      <span>📅 {event.date}</span>
                      <span>🕐 {event.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Pagamentos Pendentes */}
          <SectionCard
            title="Pagamentos Pendentes"
            icon={CreditCard}
            action={
              <button className="text-nirart-wine text-sm font-semibold hover:underline">
                Ver cobranças
              </button>
            }
          >
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-start justify-between pb-4 border-b border-gray-100 last:border-b-0"
                >
                  <div>
                    <p className="font-semibold text-nirart-text text-sm">{payment.school}</p>
                    <p className="text-sm text-gray-600 mt-1">{payment.amount}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    payment.status === 'Vencido'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Estoque Reservado */}
          <SectionCard
            title="Estoque Reservado"
            icon={Package}
            action={
              <button className="text-nirart-green text-sm font-semibold hover:underline">
                Gerenciar
              </button>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vestidos Reservados</p>
                  <p className="text-2xl font-bold text-nirart-text">145</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-nirart-green">320</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-nirart-green h-2 rounded-full"
                  style={{ width: '45%' }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 text-center">45% do estoque reservado</p>
            </div>
          </SectionCard>

          {/* Total Recebido */}
          <SectionCard
            title="Total Recebido (Junho)"
            icon={TrendingUp}
            action={
              <button className="text-nirart-wine text-sm font-semibold hover:underline">
                Relatório
              </button>
            }
          >
            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-nirart-wine">R$ 12.450</p>
                <span className="text-green-600 text-sm font-semibold">↑ 12%</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Reservas confirmadas</span>
                  <span className="font-semibold text-nirart-text">R$ 8.900</span>
                </div>
                <div className="flex justify-between">
                  <span>Multas e adicionais</span>
                  <span className="font-semibold text-nirart-text">R$ 3.550</span>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-nirart-card rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-nirart-text mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="primary"
              onClick={() => navigate('/cadastro-escola')}
              className="flex items-center justify-center gap-2"
            >
              <Building2 size={18} /> Adicionar Escola
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/reservas')}
              className="flex items-center justify-center gap-2"
            >
              <Calendar size={18} /> Nova Reserva
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/importar-alunos')}
              className="flex items-center justify-center gap-2"
            >
              <BookOpen size={18} /> Importar Alunos
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/pagamentos')}
              className="flex items-center justify-center gap-2"
            >
              <CreditCard size={18} /> Registrar Pagamento
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
