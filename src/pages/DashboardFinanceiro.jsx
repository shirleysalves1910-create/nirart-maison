import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CalendarClock,
  CheckCircle2,
  TrendingUp,
  WalletCards
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_SCHOOLS } from '../data/mockData'
import {
  buildReportData,
  DEFAULT_REPORT_FILTERS
} from '../data/reportMockData'

export default function DashboardFinanceiro() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState(DEFAULT_REPORT_FILTERS)
  const report = useMemo(() => buildReportData(filters), [filters])

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-7xl space-y-6 p-4 md:p-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-nirart-text">Dashboard Financeiro</h1>
            <p className="mt-1 text-sm text-gray-600">
              Acompanhamento de recebimentos, saldo aberto e vencimentos.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/relatorios')}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <ArrowLeft size={18} /> Voltar para Relatórios
          </Button>
        </header>

        <FinancialFilters filters={filters} setFilters={setFilters} />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <FinanceMetric icon={TrendingUp} label="Recebido no mês" value={formatCurrency(report.receivedInMonth)} style="bg-green-50 text-green-700" />
          <FinanceMetric icon={CheckCircle2} label="Total recebido" value={formatCurrency(report.totalPaid)} style="bg-blue-50 text-blue-700" />
          <FinanceMetric icon={Banknote} label="Total a receber" value={formatCurrency(report.totalReceivable)} style="bg-red-50 text-nirart-wine" />
          <FinanceMetric icon={AlertTriangle} label="Parcelas vencidas" value={report.overduePayments.length} style="bg-red-50 text-red-700" />
          <FinanceMetric icon={CalendarClock} label="Parcelas a vencer" value={report.upcomingPayments.length} style="bg-yellow-50 text-yellow-700" />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6 xl:col-span-2">
            <h2 className="text-lg font-semibold text-nirart-text">Fluxo financeiro mensal</h2>
            <p className="mt-1 text-sm text-gray-500">Valores recebidos e previstos por mês.</p>
            <div className="mt-6">
              <GroupedBarChart data={report.financialByMonth} />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-lg font-semibold text-nirart-text">Composição financeira</h2>
            <p className="mt-1 text-sm text-gray-500">Participação entre recebido e saldo aberto.</p>
            <DonutSummary paid={report.totalPaid} receivable={report.totalReceivable} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <FinancialList
            title="Pagamentos vencidos"
            icon={AlertTriangle}
            entries={report.overduePayments}
            emptyText="Nenhum pagamento vencido."
            navigate={navigate}
            late
          />
          <FinancialList
            title="Próximos vencimentos"
            icon={CalendarClock}
            entries={report.upcomingPayments.slice(0, 6)}
            emptyText="Nenhum pagamento a vencer."
            navigate={navigate}
          />
        </section>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-200 p-5">
            <div className="rounded-lg bg-green-50 p-2 text-nirart-green"><WalletCards size={19} /></div>
            <div>
              <h2 className="font-semibold text-nirart-text">Recebimentos recentes</h2>
              <p className="mt-1 text-xs text-gray-500">Entradas e parcelas já baixadas.</p>
            </div>
          </div>
          <RecentReceipts entries={report.receivedTransactions.slice(0, 8)} />
        </section>
      </div>
    </MainLayout>
  )
}

function FinancialFilters({ filters, setFilters }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-nirart-text">Filtros financeiros</h2>
        <button
          type="button"
          onClick={() => setFilters(DEFAULT_REPORT_FILTERS)}
          className="whitespace-nowrap text-sm font-semibold text-nirart-green hover:underline"
        >
          Limpar filtros
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FilterField label="Período inicial">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))}
            className={filterClass}
          />
        </FilterField>
        <FilterField label="Período final">
          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))}
            className={filterClass}
          />
        </FilterField>
        <FilterField label="Escola">
          <select
            value={filters.schoolId}
            onChange={(event) => setFilters((current) => ({ ...current, schoolId: event.target.value, classId: '' }))}
            className={filterClass}
          >
            <option value="">Todas as escolas</option>
            {MOCK_SCHOOLS.map((school) => <option key={school.id} value={school.id}>{school.fantasyName}</option>)}
          </select>
        </FilterField>
      </div>
    </section>
  )
}

function FinanceMetric({ icon: Icon, label, value, style }) {
  return (
    <article className="min-w-0 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className={`inline-flex rounded-lg p-2.5 ${style}`}><Icon size={20} /></div>
      <p className="mt-4 text-sm text-gray-500">{label}</p>
      <p className="mt-1 break-words text-xl font-bold text-nirart-text">{value}</p>
    </article>
  )
}

function GroupedBarChart({ data }) {
  const max = Math.max(...data.flatMap((entry) => [entry.received, entry.receivable]), 1)
  return (
    <div>
      <div className="flex h-64 items-end gap-3 border-b border-gray-200 px-1 sm:gap-6">
        {data.map((entry) => (
          <div key={entry.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
            <div className="flex h-[88%] w-full max-w-20 items-end justify-center gap-1 sm:gap-2">
              <div
                title={`Recebido: ${formatCurrency(entry.received)}`}
                className="w-1/2 rounded-t bg-nirart-green"
                style={{ height: `${Math.max(entry.received ? 4 : 1, (entry.received / max) * 100)}%` }}
              />
              <div
                title={`A receber: ${formatCurrency(entry.receivable)}`}
                className="w-1/2 rounded-t bg-nirart-wine"
                style={{ height: `${Math.max(entry.receivable ? 4 : 1, (entry.receivable / max) * 100)}%` }}
              />
            </div>
            <span className="mt-2 text-xs font-medium text-gray-500">{entry.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-5 text-xs text-gray-600">
        <Legend color="bg-nirart-green" label="Recebido" />
        <Legend color="bg-nirart-wine" label="A receber" />
      </div>
    </div>
  )
}

function DonutSummary({ paid, receivable }) {
  const total = paid + receivable
  const paidPercentage = total ? Math.round((paid / total) * 100) : 0
  return (
    <div className="mt-6">
      <div
        className="mx-auto flex h-44 w-44 items-center justify-center rounded-full"
        style={{ background: `conic-gradient(#6FBFA9 ${paidPercentage}%, #B2181B ${paidPercentage}% 100%)` }}
      >
        <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
          <span className="text-3xl font-bold text-nirart-text">{paidPercentage}%</span>
          <span className="text-xs text-gray-500">recebido</span>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <SummaryLine color="bg-nirart-green" label="Recebido" value={formatCurrency(paid)} />
        <SummaryLine color="bg-nirart-wine" label="A receber" value={formatCurrency(receivable)} />
      </div>
    </div>
  )
}

function FinancialList({ title, icon: Icon, entries, emptyText, navigate, late = false }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${late ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
          <Icon size={19} />
        </div>
        <h2 className="font-semibold text-nirart-text">{title}</h2>
      </div>
      <div className="mt-5 space-y-3">
        {entries.length ? entries.map((entry) => (
          <article key={entry.installment.id} className="min-w-0 rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="break-words font-semibold text-nirart-text">{entry.student?.fullName || 'Aluno não informado'}</p>
                <p className="mt-1 break-words text-sm text-gray-500">{entry.school?.fantasyName}</p>
              </div>
              <span className={`self-start whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                late ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {late ? 'Vencido' : 'Pendente'}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Info label="Vencimento" value={formatDate(entry.installment.dueDate)} />
              <Info label="Valor" value={formatCurrency(entry.installment.value)} />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/pagamentos/${entry.payment.id}`)}
              className="mt-4 w-full whitespace-nowrap"
            >
              Ver pagamento
            </Button>
          </article>
        )) : <p className="py-8 text-center text-sm text-gray-500">{emptyText}</p>}
      </div>
    </section>
  )
}

function RecentReceipts({ entries }) {
  if (!entries.length) return <p className="p-8 text-center text-sm text-gray-500">Nenhum recebimento encontrado.</p>
  return (
    <>
      <div className="hidden lg:block">
        <table className="w-full table-fixed text-left">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="w-[25%] px-4 py-3">Aluno</th>
              <th className="w-[25%] px-4 py-3">Escola</th>
              <th className="w-[15%] px-4 py-3">Data</th>
              <th className="w-[15%] px-4 py-3">Lançamento</th>
              <th className="w-[10%] px-4 py-3">Forma</th>
              <th className="w-[10%] px-4 py-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-gray-100 text-sm">
                <td className="break-words px-4 py-4 font-semibold text-nirart-text">{entry.student?.fullName}</td>
                <td className="break-words px-4 py-4 text-gray-600">{entry.school?.fantasyName}</td>
                <td className="px-4 py-4 text-gray-600">{formatDate(entry.date)}</td>
                <td className="px-4 py-4 text-gray-600">{entry.description}</td>
                <td className="break-words px-4 py-4 text-gray-600">{entry.method || '—'}</td>
                <td className="px-4 py-4 font-bold text-green-700">{formatCurrency(entry.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 p-3 lg:hidden">
        {entries.map((entry) => (
          <article key={entry.id} className="min-w-0 rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-semibold text-nirart-text">{entry.student?.fullName}</p>
                <p className="mt-1 break-words text-sm text-gray-500">{entry.school?.fantasyName}</p>
              </div>
              <span className="shrink-0 font-bold text-green-700">{formatCurrency(entry.value)}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Info label="Data" value={formatDate(entry.date)} />
              <Info label="Lançamento" value={entry.description} />
              <Info label="Forma" value={entry.method || '—'} />
              <Info label="Reserva" value={`#${entry.payment.reservationId}`} />
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function FilterField({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  )
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-nirart-text">{value || '—'}</p>
    </div>
  )
}

function Legend({ color, label }) {
  return <span className="inline-flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${color}`} /> {label}</span>
}

function SummaryLine({ color, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3">
      <span className="inline-flex items-center gap-2 text-sm text-gray-600">
        <span className={`h-3 w-3 rounded-full ${color}`} /> {label}
      </span>
      <span className="break-words text-right font-bold text-nirart-text">{value}</span>
    </div>
  )
}

const filterClass = 'w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-nirart-green focus:ring-1 focus:ring-nirart-green'

function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}
