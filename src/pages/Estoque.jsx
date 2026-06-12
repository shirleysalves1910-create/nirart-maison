import { useMemo, useState } from 'react'
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
  X
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import SearchBar from '../components/SearchBar'
import {
  getEditPath,
  MOCK_INVENTORY_HISTORY,
  MOCK_INVENTORY_ITEMS
} from '../data/inventoryMockData'

const TYPE_ICONS = {
  Roupa: Shirt,
  Sapato: PackageOpen,
  Acessorio: Sparkles,
  Kit: Box
}

export default function Estoque() {
  const navigate = useNavigate()
  const [items] = useState(MOCK_INVENTORY_ITEMS)
  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState('')
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [status, setStatus] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [modalType, setModalType] = useState('')
  const [showCreateMenu, setShowCreateMenu] = useState(false)

  const filteredItems = items.filter((item) => {
    const searchable = [
      item.ref,
      item.description,
      item.name,
      item.category,
      item.color,
      item.size,
      item.status
    ].join(' ').toLowerCase()

    return (
      searchable.includes(searchTerm.toLowerCase()) &&
      (!category || item.category === category || item.type === category) &&
      (!color || item.color === color) &&
      (!size || item.size === size) &&
      (!status || item.status === status)
    )
  })

  const metrics = useMemo(() => ({
    clothes: items.filter((item) => item.type === 'Roupa').length,
    shoes: items.filter((item) => item.type === 'Sapato').length,
    accessories: items.filter((item) => item.type === 'Acessorio').length,
    kits: items.filter((item) => item.type === 'Kit').length,
    available: items.reduce((total, item) => total + getAvailableQuantity(item), 0),
    reserved: sum(items, 'reservedQuantity'),
    rented: sum(items, 'rentedQuantity')
  }), [items])

  const openModal = (type, item) => {
    setSelectedItem(item)
    setModalType(type)
  }

  const closeModal = () => {
    setSelectedItem(null)
    setModalType('')
  }

  const categories = unique(items.flatMap((item) => [item.type, item.category]).filter(Boolean))
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Filter value={category} onChange={setCategory} label="Todas as categorias" options={categories} />
            <Filter value={color} onChange={setColor} label="Todas as cores" options={colors} />
            <Filter value={size} onChange={setSize} label="Todos os tamanhos" options={sizes} />
            <Filter value={status} onChange={setStatus} label="Todos os status" options={['Disponível', 'Reservado', 'Locado', 'Inativo']} />
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {filteredItems.length === 0 ? (
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
              />
              <MobileCards
                items={filteredItems}
                onView={(item) => openModal('view', item)}
                onEdit={(item) => navigate(getEditPath(item))}
                onHistory={(item) => openModal('history', item)}
                onAvailability={(item) => openModal('availability', item)}
              />
            </>
          )}
        </section>
      </div>

      {selectedItem && (
        <InventoryModal
          type={modalType}
          item={selectedItem}
          onClose={closeModal}
        />
      )}
    </MainLayout>
  )
}

function DesktopTable({ items, onView, onEdit, onHistory, onAvailability }) {
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

function ActionList({ item, onView, onEdit, onHistory, onAvailability }) {
  const actions = [
    { label: 'Visualizar', icon: Eye, onClick: onView },
    { label: 'Editar', icon: Edit2, onClick: onEdit },
    { label: 'Histórico', icon: History, onClick: onHistory },
    { label: 'Ver disponibilidade', icon: ShieldCheck, onClick: onAvailability }
  ]

  return (
    <div className="grid min-w-0 grid-cols-2 gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          title={action.label}
          onClick={() => action.onClick(item)}
          className="inline-flex min-w-[112px] items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-2 text-[11px] font-medium text-gray-700 hover:border-nirart-green hover:text-nirart-green xl:min-w-[120px]"
        >
          <action.icon className="shrink-0" size={15} />
          <span className="whitespace-nowrap text-center">{action.label}</span>
        </button>
      ))}
    </div>
  )
}

function InventoryModal({ type, item, onClose }) {
  const history = MOCK_INVENTORY_HISTORY.filter((entry) => entry.itemRef === item.ref)
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
          {type === 'history' && <ItemHistory history={history} />}
        </div>
      </div>
    </div>
  )
}

function ItemDetails({ item }) {
  const details = [
    ['Tipo', item.type],
    ['Categoria', item.category || '-'],
    ['Cor', item.color || '-'],
    ['Tamanho', item.size || '-'],
    ['Quantidade total', item.totalQuantity],
    ['Valor de locação', formatCurrency(item.rentalValue ?? item.totalValue)],
    ['Status', item.status],
    ['Fornecedor', item.supplier || '-'],
    ['Marca / Modelo', item.brand || item.model || '-']
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

function ItemHistory({ history }) {
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
              <p className="mt-2 text-xs text-gray-500">Responsável: {entry.user}</p>
            </div>
            <span className="text-xs font-medium text-gray-500">{entry.date}</span>
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
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
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

function sum(items, field) {
  return items.reduce((total, item) => total + Number(item[field] || 0), 0)
}

function getAvailableQuantity(item) {
  return Number(item.totalQuantity || 0)
    - Number(item.reservedQuantity || 0)
    - Number(item.rentedQuantity || 0)
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}
