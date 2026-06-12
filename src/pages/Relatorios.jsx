import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  CalendarCheck,
  CalendarClock,
  CreditCard,
  PackageCheck,
  RotateCcw,
  School,
  Shirt,
  TrendingUp,
  Truck
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_CLASSES, MOCK_SCHOOLS } from '../data/mockData'
import { RESERVATION_STATUSES } from '../data/reservationMockData'
import {
  buildReportData,
  DEFAULT_REPORT_FILTERS,
  getReportContext
} from '../data/reportMockData'

const ITEM_TYPES = ['Roupa', 'Sapato', 'Acessorio', 'Kit']

export default function Relatorios() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState(DEFAULT_REPORT_FILTERS)
  const report = useMemo(() => buildReportData(filters), [filters])

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-7xl space-y-6 p-4 md:p-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-nirart-text">Relatórios</h1>
            <p className="mt-1 text-sm text-gray-600">
              Indicadores gerenciais de locações, estoque, pagamentos e operação.
            </p>
          </div>
          <Button
            onClick={() => navigate('/dashboard-financeiro')}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <CreditCard size={18} /> Dashboard Financeiro
          </Button>
        </header>

        <ReportFilters filters={filters} setFilters={setFilters} />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard icon={TrendingUp} label="Faturamento do mês" value={formatCurrency(report.receivedInMonth)} tone="green" />
          <MetricCard icon={Banknote} label="Total a receber" value={formatCurrency(report.totalReceivable)} tone="wine" />
          <MetricCard icon={CalendarCheck} label="Reservas ativas" value={report.activeReservations.length} tone="blue" />
          <MetricCard icon={AlertTriangle} label="Pagamentos vencidos" value={report.overduePayments.length} tone="red" />
          <MetricCard icon={PackageCheck} label="Itens disponíveis" value={report.inventoryTotals.available} tone="purple" />
          <MetricCard icon={RotateCcw} label="Devoluções pendentes" value={report.pendingReturns.length} tone="yellow" />
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <CompactMetric label="Pagamentos a vencer" value={report.upcomingPayments.length} icon={CalendarClock} />
          <CompactMetric label="Estoque reservado" value={report.inventoryTotals.reserved} icon={Shirt} />
          <CompactMetric label="Entregas pendentes" value={report.pendingDeliveries.length} icon={Truck} />
          <CompactMetric label="Devoluções em atraso" value={report.overdueReturns.length} icon={AlertTriangle} />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartCard title="Reservas por mês" subtitle="Quantidade de reservas por data do evento">
            <VerticalBarChart data={report.reservationsByMonth} />
          </ChartCard>
          <ChartCard title="Recebidos x A receber" subtitle="Visão financeira das reservas filtradas">
            <FinancialChart paid={report.totalPaid} receivable={report.totalReceivable} />
          </ChartCard>
          <ChartCard title="Itens mais locados" subtitle="Quantidade atualmente locada no estoque">
            <HorizontalBarChart
              data={report.mostRentedItems.map((item) => ({
                label: item.ref,
                detail: item.description || item.name,
                value: Number(item.rentedQuantity || 0)
              }))}
              color="bg-nirart-wine"
              emptyText="Nenhum item locado para o filtro selecionado."
            />
          </ChartCard>
          <ChartCard title="Reservas por escola" subtitle="Distribuição das reservas filtradas">
            <HorizontalBarChart
              data={report.reservationsBySchool}
              color="bg-nirart-green"
              emptyText="Nenhuma reserva encontrada por escola."
            />
          </ChartCard>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ReportTableCard title="Pagamentos vencidos" icon={AlertTriangle}>
            <ResponsiveTable
              columns={['Cliente/aluno', 'Escola', 'Vencimento', 'Valor']}
              rows={report.overduePayments.map((entry) => ({
                id: entry.installment.id,
                values: [
                  entry.student?.fullName,
                  entry.school?.fantasyName,
                  formatDate(entry.installment.dueDate),
                  formatCurrency(entry.installment.value)
                ],
                badge: 'Vencido'
              }))}
              emptyText="Nenhum pagamento vencido."
            />
          </ReportTableCard>

          <ReportTableCard title="Próximas devoluções" icon={RotateCcw}>
            <ResponsiveTable
              columns={['Cliente/aluno', 'Escola', 'Data prevista', 'Reserva']}
              rows={report.upcomingReturns.map((itemReturn) => {
                const context = getReportContext(itemReturn.reservationId)
                return {
                  id: itemReturn.id,
                  values: [
                    context.student?.fullName,
                    context.school?.fantasyName,
                    formatDate(itemReturn.expectedReturnDate),
                    `#${itemReturn.reservationId}`
                  ],
                  badge: itemReturn.expectedReturnDate < '2026-06-12' ? 'Atrasada' : 'Pendente'
                }
              })}
              emptyText="Nenhuma devolução pendente."
            />
          </ReportTableCard>

          <ReportTableCard title="Itens mais locados" icon={Shirt}>
            <ResponsiveTable
              columns={['Item', 'Categoria', 'Reservados', 'Locados']}
              rows={report.mostRentedItems.map((item) => ({
                id: item.id,
                values: [
                  `${item.ref} - ${item.description || item.name}`,
                  item.category || item.type,
                  item.reservedQuantity,
                  item.rentedQuantity
                ]
              }))}
              emptyText="Nenhum item encontrado."
            />
          </ReportTableCard>

          <ReportTableCard title="Reservas recentes" icon={CalendarCheck}>
            <ResponsiveTable
              columns={['Aluno', 'Escola', 'Evento', 'Status']}
              rows={report.recentReservations.map((reservation) => {
                const context = getReportContext(reservation.id)
                return {
                  id: reservation.id,
                  values: [
                    context.student?.fullName,
                    context.school?.fantasyName,
                    formatDate(reservation.eventDate),
                    capitalize(reservation.status)
                  ]
                }
              })}
              emptyText="Nenhuma reserva encontrada."
            />
          </ReportTableCard>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RankingCard title="Reservas por turma" icon={School} data={report.reservationsByClass} />
          <RankingCard
            title="Itens mais reservados"
            icon={BarChart3}
            data={report.itemRanking.map((entry) => ({
              label: `${entry.item.ref} - ${entry.item.description || entry.item.name}`,
              value: entry.quantity
            }))}
          />
        </section>
      </div>
    </MainLayout>
  )
}

function ReportFilters({ filters, setFilters }) {
  const filteredClasses = MOCK_CLASSES.filter((item) => (
    !filters.schoolId || String(item.schoolId) === String(filters.schoolId)
  ))
  const update = (field, value) => setFilters((current) => ({ ...current, [field]: value }))

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-nirart-text">Filtros do relatório</h2>
          <p className="mt-1 text-xs text-gray-500">O período considera a data do evento da reserva.</p>
        </div>
        <button
          type="button"
          onClick={() => setFilters(DEFAULT_REPORT_FILTERS)}
          className="self-start whitespace-nowrap text-sm font-semibold text-nirart-green hover:underline sm:self-auto"
        >
          Limpar filtros
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <FilterField label="Período inicial">
          <input type="date" value={filters.dateFrom} onChange={(event) => update('dateFrom', event.target.value)} className={filterClass} />
        </FilterField>
        <FilterField label="Período final">
          <input type="date" value={filters.dateTo} onChange={(event) => update('dateTo', event.target.value)} className={filterClass} />
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
        <FilterField label="Turma">
          <select value={filters.classId} onChange={(event) => update('classId', event.target.value)} className={filterClass}>
            <option value="">Todas as turmas</option>
            {filteredClasses.map((studentClass) => <option key={studentClass.id} value={studentClass.id}>{studentClass.name}</option>)}
          </select>
        </FilterField>
        <FilterField label="Status">
          <select value={filters.status} onChange={(event) => update('status', event.target.value)} className={filterClass}>
            <option value="">Todos os status</option>
            {RESERVATION_STATUSES.map((status) => <option key={status} value={status}>{capitalize(status)}</option>)}
          </select>
        </FilterField>
        <FilterField label="Tipo de item">
          <select value={filters.itemType} onChange={(event) => update('itemType', event.target.value)} className={filterClass}>
            <option value="">Todos os tipos</option>
            {ITEM_TYPES.map((type) => <option key={type} value={type}>{type === 'Acessorio' ? 'Acessório' : type}</option>)}
          </select>
        </FilterField>
      </div>
    </section>
  )
}

function MetricCard({ icon: Icon, label, value, tone }) {
  const tones = {
    green: 'bg-green-50 text-green-700',
    wine: 'bg-red-50 text-nirart-wine',
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700',
    yellow: 'bg-yellow-50 text-yellow-700'
  }
  return (
    <article className="min-w-0 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className={`inline-flex rounded-lg p-2.5 ${tones[tone]}`}><Icon size={21} /></div>
      <p className="mt-4 text-sm text-gray-500">{label}</p>
      <p className="mt-1 break-words text-2xl font-bold text-nirart-text">{value}</p>
    </article>
  )
}

function CompactMetric({ icon: Icon, label, value }) {
  return (
    <article className="min-w-0 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-gray-50 p-2 text-nirart-green"><Icon size={18} /></div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-nirart-text">{value}</p>
        </div>
      </div>
    </article>
  )
}

function ChartCard({ title, subtitle, children }) {
  return (
    <section className="min-w-0 rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <h2 className="text-lg font-semibold text-nirart-text">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function VerticalBarChart({ data }) {
  const max = Math.max(...data.map((entry) => entry.value), 1)
  return (
    <div className="flex h-56 min-w-0 items-end gap-3 border-b border-gray-200 px-1 sm:gap-5">
      {data.map((entry) => (
        <div key={entry.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
          <span className="mb-2 text-sm font-bold text-nirart-text">{entry.value}</span>
          <div
            className="w-full max-w-14 rounded-t-md bg-nirart-green transition-all"
            style={{ height: `${Math.max(entry.value ? 12 : 3, (entry.value / max) * 78)}%` }}
          />
          <span className="mt-2 text-xs font-medium text-gray-500">{entry.label}</span>
        </div>
      ))}
    </div>
  )
}

function FinancialChart({ paid, receivable }) {
  const total = paid + receivable
  const paidPercentage = total ? (paid / total) * 100 : 0
  return (
    <div className="space-y-6">
      <div className="flex h-8 overflow-hidden rounded-full bg-gray-100">
        <div className="bg-nirart-green" style={{ width: `${paidPercentage}%` }} />
        <div className="bg-nirart-wine" style={{ width: `${100 - paidPercentage}%` }} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ChartLegend color="bg-nirart-green" label="Total recebido" value={formatCurrency(paid)} percentage={paidPercentage} />
        <ChartLegend color="bg-nirart-wine" label="Total a receber" value={formatCurrency(receivable)} percentage={100 - paidPercentage} />
      </div>
    </div>
  )
}

function ChartLegend({ color, label, value, percentage }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className={`h-3 w-3 rounded-full ${color}`} /> {label}
      </div>
      <p className="mt-2 break-words text-xl font-bold text-nirart-text">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{Math.round(percentage)}% do total</p>
    </div>
  )
}

function HorizontalBarChart({ data, color, emptyText }) {
  const max = Math.max(...data.map((entry) => entry.value), 1)
  if (!data.length) return <EmptyState text={emptyText} />
  return (
    <div className="space-y-4">
      {data.map((entry) => (
        <div key={`${entry.label}-${entry.detail || ''}`} className="min-w-0">
          <div className="mb-1 flex items-start justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="break-words font-semibold text-nirart-text">{entry.label}</p>
              {entry.detail && <p className="break-words text-xs text-gray-500">{entry.detail}</p>}
            </div>
            <span className="shrink-0 font-bold text-nirart-text">{entry.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${(entry.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function ReportTableCard({ title, icon: Icon, children }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-200 p-5">
        <div className="rounded-lg bg-green-50 p-2 text-nirart-green"><Icon size={19} /></div>
        <h2 className="font-semibold text-nirart-text">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function ResponsiveTable({ columns, rows, emptyText }) {
  if (!rows.length) return <EmptyState text={emptyText} />
  return (
    <>
      <div className="hidden lg:block">
        <table className="w-full table-fixed text-left">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>{columns.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                {row.values.map((value, index) => (
                  <td key={`${row.id}-${columns[index]}`} className="break-words px-4 py-4 text-sm text-gray-700">
                    {index === row.values.length - 1 && row.badge
                      ? <TableBadge label={row.badge} />
                      : value || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 p-3 lg:hidden">
        {rows.map((row) => (
          <article key={row.id} className="min-w-0 rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {row.values.map((value, index) => (
                <div key={`${row.id}-${columns[index]}`} className="min-w-0">
                  <p className="text-xs text-gray-500">{columns[index]}</p>
                  <div className="mt-1 break-words text-sm font-semibold text-nirart-text">
                    {index === row.values.length - 1 && row.badge
                      ? <TableBadge label={row.badge} />
                      : value || '—'}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function RankingCard({ title, icon: Icon, data }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-green-50 p-2 text-nirart-green"><Icon size={19} /></div>
        <h2 className="font-semibold text-nirart-text">{title}</h2>
      </div>
      <div className="mt-5 space-y-3">
        {data.length ? data.map((entry, index) => (
          <div key={entry.label} className="flex min-w-0 items-center gap-3 rounded-lg bg-gray-50 p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-nirart-green">
              {index + 1}
            </span>
            <p className="min-w-0 flex-1 break-words text-sm font-semibold text-nirart-text">{entry.label}</p>
            <span className="shrink-0 font-bold text-nirart-text">{entry.value}</span>
          </div>
        )) : <EmptyState text="Nenhum dado encontrado para o filtro selecionado." />}
      </div>
    </section>
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

function TableBadge({ label }) {
  const isLate = ['Vencido', 'Atrasada'].includes(label)
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
      isLate ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
    }`}>
      {label}
    </span>
  )
}

function EmptyState({ text }) {
  return <p className="p-8 text-center text-sm text-gray-500">{text}</p>
}

const filterClass = 'w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-nirart-green focus:ring-1 focus:ring-nirart-green'

function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
