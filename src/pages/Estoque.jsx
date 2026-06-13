import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Box,
  Clock3,
  Edit2,
  Eye,
  History,
  Package,
  PackageCheck,
  PackageOpen,
  Plus,
  ShieldCheck,
  Shirt,
  Sparkles,
  ToggleLeft,
  X
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import SearchBar from '../components/SearchBar'
import {
  inativarRegistroEstoque,
  listarEstoque,
  listarMovimentacoesEstoque
} from '../services/estoque'

const TYPE_ICONS = {
  Roupa: Shirt,
  Sapato: PackageOpen,
  Acessorio: Sparkles,
  Kit: Box
}

const TYPE_FILTER_OPTIONS = [
  { value: 'Roupa', label: 'Roupa' },
  { value: 'Sapato', label: 'Sapato' },
  { value: 'Acessorio', label: 'Acessório' },
  { value: 'Kit', label: 'Kit' }
]

const CATEGORY_FILTER_ORDER = ['Feminino', 'Masculino', 'Unissex']

export default function Estoque() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [itemType, setItemType] = useState('')
  const [category, setCategory] = useState('')
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [status, setStatus] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [modalType, setModalType] = useState('')
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [notification, setNotification] = useState('')

  useEffect(() => {
    let active = true
    const loadItems = async () => {
      setLoading(true)
      setErrorMessage('')
      try {
        const data = await listarEstoque()
        if (active) setItems(data)
      } catch (error) {
        if (active) setErrorMessage(getErrorMessage(error, 'Não foi possível carregar o estoque.'))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadItems()
    return () => {
      active = false
    }
  }, [])

  const filteredItems = useMemo(() => items.filter((item) => {
    const searchable = [
      item.ref,
      item.description,
      item.name,
      item.type,
      item.category,
      item.brand,
      item.supplier,
      item.model,
      item.color,
      item.size,
      item.status
    ].join(' ').toLowerCase()

    return (
      searchable.includes(searchTerm.toLowerCase()) &&
      (!itemType || item.type === itemType) &&
      (!category || item.category === category) &&
      (!color || item.color === color) &&
      (!size || item.size === size) &&
      (!status || item.status === status)
    )
  }), [category, color, itemType, items, searchTerm, size, status])

  const metrics = useMemo(() => ({
    clothes: sum(filteredItems.filter((item) => item.type === 'Roupa'), 'totalQuantity'),
    shoes: sum(filteredItems.filter((item) => item.type === 'Sapato'), 'totalQuantity'),
    accessories: sum(filteredItems.filter((item) => item.type === 'Acessorio'), 'totalQuantity'),
    kits: sum(filteredItems.filter((item) => item.type === 'Kit'), 'totalQuantity'),
    available: filteredItems.reduce((total, item) => total + getAvailableQuantity(item), 0),
    reserved: sum(filteredItems, 'reservedQuantity'),
    rented: sum(filteredItems, 'rentedQuantity')
  }), [filteredItems])

  const openModal = async (type, item) => {
    setSelectedItem(item)
    setModalType(type)
    setHistory([])
    if (type === 'history') {
      setHistoryLoading(true)
      setErrorMessage('')
      try {
        setHistory(await listarMovimentacoesEstoque(item))
      } catch (error) {
        setErrorMessage(getErrorMessage(error, 'Não foi possível carregar o histórico.'))
      } finally {
        setHistoryLoading(false)
      }
    }
  }

  const closeModal = () => {
    setSelectedItem(null)
    setModalType('')
    setHistory([])
  }

  const handleInactivate = async (item) => {
    if (item.status === 'Inativo') return
    setActionLoading(true)
    setErrorMessage('')
    try {
      const updated = await inativarRegistroEstoque(item)
      setItems((current) => current.map((entry) => (
        entry.id === updated.id && entry.type === updated.type ? updated : entry
      )))
      setNotification(`${item.ref} foi inativado.`)
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível inativar o item.'))
    } finally {
      setActionLoading(false)
    }
  }

  const categories = orderedCategories(items.map((item) => item.category).filter(Boolean))
  const colors = unique(items.map((item) => item.color).filter(Boolean))
  const sizes = unique(items.map((item) => item.size).filter(Boolean))

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-7xl space-y-6 p-4 md:p-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-nirart-text">Estoque</h1>
            <p className="mt-1 text-sm text-gray-600">Controle roupas, sapatos, acessórios e kits de locação.</p>
          </div>
          <div className="relative">
            <Button
              type="button"
              onClick={() => setShowCreateMenu((current) => !current)}
              className="flex w-full items-center justify-center gap-2 md:w-auto"
            >
              <Plus size={18} /> Novo Item
            </Button>
            {showCreateMenu && (
              <div className="absolute right-0 z-20 mt-2 w-full min-w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                <CreateLink label="Cadastrar Roupa" onClick={() => navigate('/cadastro-roupa')} />
                <CreateLink label="Cadastrar Sapato" onClick={() => navigate('/cadastro-sapato')} />
                <CreateLink label="Cadastrar Acessório" onClick={() => navigate('/cadastro-acessorio')} />
                <CreateLink label="Criar Kit de Locação" onClick={() => navigate('/kits-locacao')} />
              </div>
            )}
          </div>
        </header>

        {notification && (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <span>{notification}</span>
            <button type="button" onClick={() => setNotification('')} className="font-bold" aria-label="Fechar aviso">×</button>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <MetricCard label="Roupas" value={metrics.clothes} icon={Shirt} color="green" />
          <MetricCard label="Sapatos" value={metrics.shoes} icon={PackageOpen} color="wine" />
          <MetricCard label="Acessórios" value={metrics.accessories} icon={Sparkles} color="blue" />
          <MetricCard label="Kits" value={metrics.kits} icon={Box} color="purple" />
          <MetricCard label="Itens disponíveis" value={metrics.available} icon={PackageCheck} color="green" />
          <MetricCard label="Itens reservados" value={metrics.reserved} icon={Clock3} color="yellow" />
          <MetricCard label="Itens locados" value={metrics.rented} icon={Package} color="wine" />
        </section>

        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 md:p-6">
          <SearchBar
            onSearch={setSearchTerm}
            placeholder="Buscar por REF, descrição, categoria, cor, tamanho ou status..."
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Filter value={itemType} onChange={setItemType} label="Todos os tipos" options={TYPE_FILTER_OPTIONS} />
            <Filter value={category} onChange={setCategory} label="Todas as categorias" options={categories} />
            <Filter value={color} onChange={setColor} label="Todas as cores" options={colors} />
            <Filter value={size} onChange={setSize} label="Todos os tamanhos" options={sizes} />
            <Filter value={status} onChange={setStatus} label="Todos os status" options={['Disponível', 'Reservado', 'Locado', 'Inativo']} />
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-gray-500">
              <Clock3 className="animate-spin" size={20} /> Carregando estoque...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto mb-4 text-gray-400" size={46} />
              <p className="font-medium text-gray-700">Nenhum item encontrado</p>
              <p className="mt-1 text-sm text-gray-500">Ajuste a busca ou os filtros.</p>
            </div>
          ) : (
            <>
              <DesktopTable
                items={filteredItems}
                onView={(item) => openModal('view', item)}
                onEdit={(item) => navigate(getEditPath(item))}
                onHistory={(item) => openModal('history', item)}
                onAvailability={(item) => openModal('availability', item)}
                onInactivate={handleInactivate}
                actionLoading={actionLoading}
              />
              <MobileCards
                items={filteredItems}
                onView={(item) => openModal('view', item)}
                onEdit={(item) => navigate(getEditPath(item))}
                onHistory={(item) => openModal('history', item)}
                onAvailability={(item) => openModal('availability', item)}
                onInactivate={handleInactivate}
                actionLoading={actionLoading}
              />
            </>
          )}
        </section>
      </div>

      {selectedItem && (
        <InventoryModal
          type={modalType}
          item={selectedItem}
          history={history}
          historyLoading={historyLoading}
          onClose={closeModal}
        />
      )}
    </MainLayout>
  )
}

function DesktopTable({ items, onView, onEdit, onHistory, onAvailability, onInactivate, actionLoading }) {
  return (
    <div className="hidden xl:block">
      <table className="w-full table-fixed text-left">
        <colgroup>
          <col className="w-[34%]" />
          <col className="w-[21%]" />
          <col className="w-[17%]" />
          <col className="w-[28%]" />
        </colgroup>
        <thead className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
          <tr>
            <th className="px-4 py-3">Item</th>
            <th className="px-4 py-3">Quantidades</th>
            <th className="px-4 py-3">Valor / Status</th>
            <th className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const Icon = TYPE_ICONS[item.type] || Package
            return (
              <tr key={`${item.type}-${item.id}`} className="border-b align-top hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="shrink-0 rounded-lg bg-green-50 p-2 text-nirart-green"><Icon size={20} /></div>
                    <div className="min-w-0">
                      <p className="font-semibold text-nirart-text">{item.ref}</p>
                      <p className="mt-1 text-xs text-gray-500">Descrição</p>
                      <p className="break-words text-sm text-gray-700">{item.description || item.name}</p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span><strong className="font-semibold text-gray-600">Categoria:</strong> {item.category || item.type}</span>
                        <span><strong className="font-semibold text-gray-600">Cor:</strong> {item.color || '-'}</span>
                        <span><strong className="font-semibold text-gray-600">Tamanho:</strong> {item.size || '-'}</span>
                        {getCommercialInfo(item) && (
                          <span>
                            <strong className="font-semibold text-gray-600">{getCommercialInfo(item).label}:</strong>{' '}
                            {getCommercialInfo(item).value}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    <SmallInfo label="Total" value={item.totalQuantity} />
                    <SmallInfo label="Disponíveis" value={getAvailableQuantity(item)} valueClassName="text-green-700" />
                    <SmallInfo label="Reservados" value={item.reservedQuantity} valueClassName="text-yellow-700" />
                    <SmallInfo label="Locados" value={item.rentedQuantity} valueClassName="text-blue-700" />
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-xs text-gray-500">Locação</p>
                  <p className="mt-1 break-words text-sm font-semibold text-nirart-text">{formatCurrency(item.rentalValue ?? item.totalValue)}</p>
                  <div className="mt-3"><StatusBadge status={item.status} /></div>
                </td>
                <td className="px-4 py-4">
                  <ActionList
                    item={item}
                    onView={onView}
                    onEdit={onEdit}
                    onHistory={onHistory}
                    onAvailability={onAvailability}
                    onInactivate={onInactivate}
                    actionLoading={actionLoading}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MobileCards({ items, ...actions }) {
  return (
    <div className="min-w-0 space-y-3 p-3 xl:hidden">
      {items.map((item) => (
        <article key={`${item.type}-${item.id}`} className="min-w-0 overflow-hidden rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-nirart-text">{item.ref}</p>
              <p className="mt-1 text-xs text-gray-500">Descrição</p>
              <p className="break-words text-sm text-gray-600">{item.description || item.name}</p>
            </div>
            <div className="shrink-0"><StatusBadge status={item.status} /></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <SmallInfo label="Categoria" value={item.category || item.type} />
            <SmallInfo label="Cor" value={item.color || '-'} />
            <SmallInfo label="Tamanho" value={item.size || '-'} />
            {getCommercialInfo(item) && (
              <SmallInfo label={getCommercialInfo(item).label} value={getCommercialInfo(item).value} />
            )}
            <SmallInfo label="Locação" value={formatCurrency(item.rentalValue ?? item.totalValue)} />
            <SmallInfo label="Total" value={item.totalQuantity} />
            <SmallInfo label="Disponíveis" value={getAvailableQuantity(item)} valueClassName="text-green-700" />
            <SmallInfo label="Reservados" value={item.reservedQuantity} valueClassName="text-yellow-700" />
            <SmallInfo label="Locados" value={item.rentedQuantity} valueClassName="text-blue-700" />
          </div>
          <div className="mt-4 border-t border-gray-200 pt-4">
            <ActionList item={item} {...actions} />
          </div>
        </article>
      ))}
    </div>
  )
}

function ActionList({ item, onView, onEdit, onHistory, onAvailability, onInactivate, actionLoading }) {
  const actions = [
    { label: 'Visualizar', icon: Eye, onClick: onView },
    { label: 'Editar', icon: Edit2, onClick: onEdit },
    { label: 'Histórico', icon: History, onClick: onHistory },
    { label: 'Ver disponibilidade', icon: ShieldCheck, onClick: onAvailability },
    { label: 'Inativar', icon: ToggleLeft, onClick: onInactivate, disabled: item.status === 'Inativo' || actionLoading }
  ]

  return (
    <div className="grid min-w-0 grid-cols-2 gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          title={action.label}
          onClick={() => action.onClick(item)}
          disabled={action.disabled}
          className="inline-flex min-w-0 w-full items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-2 text-[11px] font-medium text-gray-700 hover:border-nirart-green hover:text-nirart-green disabled:cursor-not-allowed disabled:opacity-40 xl:min-w-[120px]"
        >
          <action.icon className="shrink-0" size={15} />
          <span className="whitespace-nowrap text-center">{action.label}</span>
        </button>
      ))}
    </div>
  )
}

function InventoryModal({ type, item, history, historyLoading, onClose }) {
  const titles = {
    view: 'Detalhes do Item',
    history: 'Histórico do Item',
    availability: 'Disponibilidade'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between bg-gradient-to-r from-nirart-green to-nirart-wine p-5 text-white">
          <div>
            <h2 className="text-xl font-bold">{titles[type]}</h2>
            <p className="text-sm text-white text-opacity-80">{item.ref} - {item.description || item.name}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white hover:bg-opacity-20">
            <X size={22} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {type === 'view' && <ItemDetails item={item} />}
          {type === 'availability' && <Availability item={item} />}
          {type === 'history' && <ItemHistory history={history} loading={historyLoading} />}
        </div>
      </div>
    </div>
  )
}

function ItemDetails({ item }) {
  const commercialInfo = getCommercialInfo(item)
  const details = [
    ['Tipo', item.type],
    ['Categoria', item.category || '-'],
    ['Cor', item.color || '-'],
    ['Tamanho', item.size || '-'],
    ['Quantidade total', item.totalQuantity],
    ['Valor de locação', formatCurrency(item.rentalValue ?? item.totalValue)],
    ['Status', item.status],
    ...(commercialInfo ? [[commercialInfo.label, commercialInfo.value]] : []),
    ...(item.type === 'Acessorio' && item.model ? [['Modelo', item.model]] : [])
  ]

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {details.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 font-semibold text-nirart-text">{value}</p>
          </div>
        ))}
      </div>
      {item.items && (
        <div>
          <p className="text-sm font-semibold text-gray-700">Itens do kit</p>
          <ul className="mt-2 space-y-2">
            {item.items.map((kitItem) => <li key={kitItem} className="rounded bg-gray-50 p-2 text-sm">{kitItem}</li>)}
          </ul>
        </div>
      )}
      <div className="rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-700">Observação</p>
        <p className="mt-2 text-sm text-gray-600">{item.notes || 'Sem observações.'}</p>
      </div>
    </>
  )
}

function Availability({ item }) {
  const data = [
    { label: 'Disponíveis', value: getAvailableQuantity(item), color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Reservados', value: item.reservedQuantity, color: 'text-yellow-700', bg: 'bg-yellow-50' },
    { label: 'Locados', value: item.rentedQuantity, color: 'text-blue-700', bg: 'bg-blue-50' }
  ]
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {data.map((entry) => (
        <div key={entry.label} className={`rounded-lg p-5 text-center ${entry.bg}`}>
          <p className="text-sm text-gray-600">{entry.label}</p>
          <p className={`mt-2 text-3xl font-bold ${entry.color}`}>{entry.value}</p>
        </div>
      ))}
    </div>
  )
}

function ItemHistory({ history, loading }) {
  if (loading) {
    return <p className="rounded-lg bg-gray-50 p-6 text-center text-gray-600">Carregando movimentações...</p>
  }
  if (history.length === 0) {
    return <p className="rounded-lg bg-gray-50 p-6 text-center text-gray-600">Nenhuma movimentação registrada.</p>
  }
  return (
    <div className="space-y-3">
      {history.map((entry) => (
        <div key={entry.id} className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-nirart-text">{entry.action}</p>
              <p className="mt-1 text-sm text-gray-600">{entry.details}</p>
              <p className="mt-2 text-xs text-gray-500">Quantidade: {entry.quantity}</p>
            </div>
            <span className="text-xs font-medium text-gray-500">{formatDateTime(entry.createdAt)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, color }) {
  const styles = {
    green: 'bg-green-50 text-nirart-green',
    wine: 'bg-red-50 text-nirart-wine',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-700'
  }
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className={`inline-flex rounded-lg p-2 ${styles[color]}`}><Icon size={20} /></div>
      <p className="mt-3 text-xs text-gray-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-nirart-text">{value}</p>
    </div>
  )
}

function Filter({ value, onChange, label, options }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-nirart-green focus:ring-1 focus:ring-nirart-green"
    >
      <option value="">{label}</option>
      {options.map((option) => {
        const value = typeof option === 'string' ? option : option.value
        const optionLabel = typeof option === 'string' ? option : option.label
        return <option key={value} value={value}>{optionLabel}</option>
      })}
    </select>
  )
}

function CreateLink({ label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="block w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50">
      {label}
    </button>
  )
}

function StatusBadge({ status }) {
  const styles = {
    Disponível: 'bg-green-100 text-green-800',
    Reservado: 'bg-yellow-100 text-yellow-800',
    Locado: 'bg-blue-100 text-blue-800',
    Inativo: 'bg-gray-100 text-gray-700'
  }
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || styles.Inativo}`}>{status}</span>
}

function SmallInfo({ label, value, valueClassName = 'text-nirart-text' }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 font-semibold ${valueClassName}`}>{value}</p>
    </div>
  )
}

function unique(values) {
  return [...new Set(values)].sort()
}

function orderedCategories(values) {
  const categories = unique([...CATEGORY_FILTER_ORDER, ...values])
  return categories.sort((first, second) => {
    const firstIndex = CATEGORY_FILTER_ORDER.indexOf(first)
    const secondIndex = CATEGORY_FILTER_ORDER.indexOf(second)
    if (firstIndex !== -1 || secondIndex !== -1) {
      if (firstIndex === -1) return 1
      if (secondIndex === -1) return -1
      return firstIndex - secondIndex
    }
    return first.localeCompare(second, 'pt-BR')
  })
}

function sum(items, field) {
  return items.reduce((total, item) => total + Number(item[field] || 0), 0)
}

function getAvailableQuantity(item) {
  return Number(item.totalQuantity || 0)
    - Number(item.reservedQuantity || 0)
    - Number(item.rentedQuantity || 0)
}

function getCommercialInfo(item) {
  if (item.type === 'Sapato') {
    return { label: 'Marca', value: item.brand || '-' }
  }
  if (item.type === 'Roupa' || item.type === 'Acessorio') {
    return item.supplier ? { label: 'Fornecedor', value: item.supplier } : null
  }
  return null
}

function formatCurrency(value) {
  const numericValue = Number(value ?? 0)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(numericValue) ? numericValue : 0)
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value))
}

function getEditPath(item) {
  if (item.type === 'Roupa') return `/cadastro-roupa/${item.id}`
  if (item.type === 'Sapato') return `/cadastro-sapato/${item.id}`
  if (item.type === 'Acessorio') return `/cadastro-acessorio/${item.id}`
  return `/kits-locacao/${item.id}`
}

function getErrorMessage(error, fallback) {
  return error?.message ? `${fallback} ${error.message}` : fallback
}
