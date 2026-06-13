import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Edit2, MoreHorizontal, RotateCcw, Search } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { getReturnFineTotal, listarDevolucoes, RETURN_STATUSES } from '../services/devolucoes'

export default function Devolucoes() {
  const navigate = useNavigate()
  const [returns, setReturns] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState('')
  const [openActionId, setOpenActionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    listarDevolucoes()
      .then((data) => {
        if (active) setReturns(data)
      })
      .catch((loadError) => {
        console.error(loadError)
        if (active) setError('Não foi possível carregar as devoluções.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filteredReturns = useMemo(() => returns.filter((itemReturn) => {
    const reservation = itemReturn.reservation
    const searchable = [
      reservation?.student?.fullName,
      reservation?.school?.fantasyName,
      reservation?.studentClass?.name,
      `reserva ${itemReturn.reservationId}`
    ].join(' ').toLowerCase()

    return searchable.includes(searchTerm.toLowerCase()) && (!status || itemReturn.status === status)
  }), [returns, searchTerm, status])

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-7xl space-y-6 p-4 md:p-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-3xl font-bold text-nirart-text">Devoluções</h1><p className="mt-1 text-sm text-gray-600">Registre condições, atrasos, avarias e multas.</p></div>
          <Button onClick={() => navigate('/registrar-devolucao')} className="whitespace-nowrap">Registrar Devolução</Button>
        </header>
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Metric label="Pendentes" value={returns.filter((item) => item.status === 'pendente').length} icon={RotateCcw} style="bg-yellow-50 text-yellow-700" />
          <Metric label="Devolvidas" value={returns.filter((item) => item.status === 'devolvido').length} icon={CheckCircle2} style="bg-green-50 text-nirart-green" />
          <Metric label="Com ocorrência" value={returns.filter((item) => ['atrasado', 'com avaria'].includes(item.status)).length} icon={AlertTriangle} style="bg-red-50 text-nirart-wine" />
        </section>
        <section className="grid grid-cols-1 gap-3 rounded-lg border bg-white p-4 md:grid-cols-2 md:p-6">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por aluno, escola ou reserva..." className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 outline-none focus:border-nirart-green focus:ring-1 focus:ring-nirart-green" /></div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="">Todos os status</option>{RETURN_STATUSES.map((item) => <option key={item} value={item}>{capitalize(item)}</option>)}</select>
        </section>

        {error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

        <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
          {loading ? (
            <p className="p-8 text-center text-sm text-gray-500">Carregando devoluções...</p>
          ) : filteredReturns.length ? (
            <>
              <DesktopTable returns={filteredReturns} navigate={navigate} />
              <MobileCards returns={filteredReturns} navigate={navigate} openActionId={openActionId} setOpenActionId={setOpenActionId} />
            </>
          ) : (
            <p className="p-8 text-center text-sm text-gray-500">Nenhuma devolução encontrada.</p>
          )}
        </section>
      </div>
    </MainLayout>
  )
}

function DesktopTable({ returns, navigate }) {
  return <div className="hidden lg:block"><table className="w-full table-fixed text-left"><thead className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600"><tr><th className="w-[18%] px-4 py-3">Aluno</th><th className="w-[18%] px-4 py-3">Escola</th><th className="w-[12%] px-4 py-3">Reserva</th><th className="w-[14%] px-4 py-3">Prevista</th><th className="w-[14%] px-4 py-3">Real</th><th className="w-[12%] px-4 py-3">Multas</th><th className="w-[8%] px-4 py-3">Status</th><th className="w-[4%] px-2 py-3"></th></tr></thead><tbody>{returns.map((itemReturn) => { const reservation = itemReturn.reservation; return <tr key={itemReturn.id} className="border-b align-top hover:bg-gray-50"><td className="break-words px-4 py-4 text-sm font-semibold">{reservation?.student?.fullName || '—'}</td><td className="break-words px-4 py-4 text-sm text-gray-700">{reservation?.school?.fantasyName || '—'}</td><td className="px-4 py-4 text-sm font-semibold">#{shortId(itemReturn.reservationId)}</td><td className="px-4 py-4 text-sm">{formatDateBR(itemReturn.expectedReturnDate)}</td><td className="px-4 py-4 text-sm">{formatDateBR(itemReturn.actualReturnDate)}</td><td className="px-4 py-4 text-sm font-semibold text-nirart-wine">{formatCurrency(getReturnFineTotal(itemReturn))}</td><td className="px-4 py-4"><ReturnStatus status={itemReturn.status} /></td><td className="px-2 py-4"><button type="button" title="Registrar ou editar devolução" onClick={() => navigate(`/registrar-devolucao/${itemReturn.reservationId}`)} className="rounded-lg border p-2 text-gray-700 hover:border-nirart-green"><Edit2 size={16} /></button></td></tr> })}</tbody></table></div>
}

function MobileCards({ returns, navigate, openActionId, setOpenActionId }) {
  return <div className="space-y-3 p-3 lg:hidden">{returns.map((itemReturn) => { const reservation = itemReturn.reservation; return <article key={itemReturn.id} className="rounded-lg border p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words font-semibold">{reservation?.student?.fullName || '—'}</p><p className="mt-1 break-words text-sm text-gray-600">{reservation?.school?.fantasyName || '—'}</p><p className="text-sm text-gray-500">Reserva #{shortId(itemReturn.reservationId)}</p></div><ReturnStatus status={itemReturn.status} /></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><Info label="Prevista" value={formatDateBR(itemReturn.expectedReturnDate)} /><Info label="Data real" value={formatDateBR(itemReturn.actualReturnDate)} /><Info label="Condição" value={itemReturn.itemCondition} /><Info label="Multas" value={formatCurrency(getReturnFineTotal(itemReturn))} /></div><div className="relative mt-4 border-t pt-4"><button type="button" onClick={() => setOpenActionId(openActionId === itemReturn.id ? null : itemReturn.id)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-semibold text-gray-700"><MoreHorizontal size={18} /> Ações da devolução</button>{openActionId === itemReturn.id && <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-lg border bg-white p-2 shadow-xl"><button type="button" onClick={() => navigate(`/registrar-devolucao/${itemReturn.reservationId}`)} className="flex min-h-11 w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-medium hover:bg-gray-50"><Edit2 size={17} /> Registrar ou editar</button></div>}</div></article> })}</div>
}

function Metric({ label, value, icon: Icon, style }) { return <div className="rounded-lg border bg-white p-4 shadow-sm"><div className={`inline-flex rounded-lg p-2 ${style}`}><Icon size={20} /></div><p className="mt-3 text-xs text-gray-600">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div> }
function Info({ label, value }) { return <div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 break-words font-semibold">{value || '—'}</p></div> }
function ReturnStatus({ status }) { const styles = { pendente: 'bg-yellow-100 text-yellow-800', devolvido: 'bg-green-100 text-green-800', atrasado: 'bg-orange-100 text-orange-800', 'com avaria': 'bg-red-100 text-red-800', cancelado: 'bg-gray-100 text-gray-700' }; return <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>{capitalize(status)}</span> }
function formatDateBR(value) { if (!value) return '—'; const [year, month, day] = value.split('-'); return year && month && day ? `${day}/${month}/${year}` : value }
function formatCurrency(value) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0)) }
function shortId(value) { return String(value || '').slice(0, 8) }
function capitalize(value = '') { return value.charAt(0).toUpperCase() + value.slice(1) }
