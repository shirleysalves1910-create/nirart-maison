import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, CheckCircle2, Edit2, MoreHorizontal, Search, Truck } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { DELIVERY_STATUSES, listarEntregas } from '../services/entregas'

export default function Entregas() {
  const navigate = useNavigate()
  const [deliveries, setDeliveries] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState('')
  const [openActionId, setOpenActionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    listarEntregas()
      .then((data) => {
        if (active) setDeliveries(data)
      })
      .catch((loadError) => {
        console.error(loadError)
        if (active) setError('Não foi possível carregar as entregas.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filteredDeliveries = useMemo(() => deliveries.filter((delivery) => {
    const reservation = delivery.reservation
    const searchable = [
      reservation?.student?.fullName,
      reservation?.school?.fantasyName,
      reservation?.studentClass?.name,
      `reserva ${delivery.reservationId}`
    ].join(' ').toLowerCase()

    return searchable.includes(searchTerm.toLowerCase()) && (!status || delivery.status === status)
  }), [deliveries, searchTerm, status])

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-7xl space-y-6 p-4 md:p-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-nirart-text">Entregas</h1>
            <p className="mt-1 text-sm text-gray-600">Registre e acompanhe a entrega dos itens reservados.</p>
          </div>
          <Button onClick={() => navigate('/registrar-entrega')} className="whitespace-nowrap">Registrar Entrega</Button>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Metric label="Total" value={deliveries.length} icon={Truck} style="bg-green-50 text-nirart-green" />
          <Metric label="Pendentes" value={deliveries.filter((item) => item.status === 'pendente').length} icon={CalendarClock} style="bg-yellow-50 text-yellow-700" />
          <Metric label="Entregues" value={deliveries.filter((item) => item.status === 'entregue').length} icon={CheckCircle2} style="bg-blue-50 text-blue-700" />
        </section>

        <section className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-2 md:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por aluno, escola ou reserva..." className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 outline-none focus:border-nirart-green focus:ring-1 focus:ring-nirart-green" />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Todos os status</option>
            {DELIVERY_STATUSES.map((item) => <option key={item} value={item}>{capitalize(item)}</option>)}
          </select>
        </section>

        {error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <p className="p-8 text-center text-sm text-gray-500">Carregando entregas...</p>
          ) : filteredDeliveries.length ? (
            <>
              <DesktopTable deliveries={filteredDeliveries} navigate={navigate} />
              <MobileCards deliveries={filteredDeliveries} navigate={navigate} openActionId={openActionId} setOpenActionId={setOpenActionId} />
            </>
          ) : (
            <p className="p-8 text-center text-sm text-gray-500">Nenhuma entrega encontrada.</p>
          )}
        </section>
      </div>
    </MainLayout>
  )
}

function DesktopTable({ deliveries, navigate }) {
  return (
    <div className="hidden lg:block">
      <table className="w-full table-fixed text-left">
        <thead className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
          <tr>
            <th className="w-[18%] px-4 py-3">Aluno</th>
            <th className="w-[20%] px-4 py-3">Escola</th>
            <th className="w-[14%] px-4 py-3">Turma</th>
            <th className="w-[15%] px-4 py-3">Reserva</th>
            <th className="w-[14%] px-4 py-3">Data</th>
            <th className="w-[13%] px-4 py-3">Status</th>
            <th className="w-[6%] px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((delivery) => {
            const reservation = delivery.reservation
            return (
              <tr key={delivery.id} className="border-b align-top hover:bg-gray-50">
                <td className="break-words px-4 py-4 text-sm font-semibold text-nirart-text">{reservation?.student?.fullName || '—'}</td>
                <td className="break-words px-4 py-4 text-sm text-gray-700">{reservation?.school?.fantasyName || '—'}</td>
                <td className="break-words px-4 py-4 text-sm text-gray-700">{reservation?.studentClass?.name || '—'}</td>
                <td className="px-4 py-4 text-sm font-semibold">#{shortId(delivery.reservationId)}</td>
                <td className="px-4 py-4 text-sm text-gray-700">{formatDateBR(delivery.deliveryDate)}</td>
                <td className="px-4 py-4"><DeliveryStatus status={delivery.status} /></td>
                <td className="px-4 py-4">
                  <button type="button" title="Registrar ou editar entrega" onClick={() => navigate(`/registrar-entrega/${delivery.reservationId}`)} className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:border-nirart-green hover:text-nirart-green">
                    <Edit2 size={16} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MobileCards({ deliveries, navigate, openActionId, setOpenActionId }) {
  return (
    <div className="space-y-3 p-3 lg:hidden">
      {deliveries.map((delivery) => {
        const reservation = delivery.reservation
        return (
          <article key={delivery.id} className="min-w-0 rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-semibold text-nirart-text">{reservation?.student?.fullName || '—'}</p>
                <p className="mt-1 break-words text-sm text-gray-600">{reservation?.school?.fantasyName || '—'}</p>
                <p className="text-sm text-gray-500">Reserva #{shortId(delivery.reservationId)}</p>
              </div>
              <DeliveryStatus status={delivery.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="Turma" value={reservation?.studentClass?.name} />
              <Info label="Data da entrega" value={formatDateBR(delivery.deliveryDate)} />
              <Info label="Responsável" value={delivery.deliveredBy} />
              <Info label="Recebedor" value={delivery.receivedBy} />
            </div>
            <div className="relative mt-4 border-t pt-4">
              <button type="button" onClick={() => setOpenActionId(openActionId === delivery.id ? null : delivery.id)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 font-semibold text-gray-700">
                <MoreHorizontal size={18} /> Ações da entrega
              </button>
              {openActionId === delivery.id && (
                <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-lg border bg-white p-2 shadow-xl">
                  <button type="button" onClick={() => navigate(`/registrar-entrega/${delivery.reservationId}`)} className="flex min-h-11 w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-medium hover:bg-gray-50">
                    <Edit2 size={17} /> Registrar ou editar
                  </button>
                </div>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

function Metric({ label, value, icon: Icon, style }) {
  return <div className="rounded-lg border bg-white p-4 shadow-sm"><div className={`inline-flex rounded-lg p-2 ${style}`}><Icon size={20} /></div><p className="mt-3 text-xs text-gray-600">{label}</p><p className="mt-1 text-2xl font-bold text-nirart-text">{value}</p></div>
}

function Info({ label, value }) {
  return <div className="min-w-0"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 break-words font-semibold text-nirart-text">{value || '—'}</p></div>
}

function DeliveryStatus({ status }) {
  const styles = { pendente: 'bg-yellow-100 text-yellow-800', entregue: 'bg-green-100 text-green-800', cancelada: 'bg-red-100 text-red-800' }
  return <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>{capitalize(status)}</span>
}

function formatDateBR(value) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

function shortId(value) {
  return String(value || '').slice(0, 8)
}

function capitalize(value = '') {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
