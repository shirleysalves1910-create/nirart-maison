import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Edit2,
  KeyRound,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UserRound,
  UserX
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_USERS, USER_PROFILES, USER_STATUSES } from '../data/settingsMockData'

export default function Usuarios() {
  const navigate = useNavigate()
  const [users, setUsers] = useState(MOCK_USERS)
  const [filters, setFilters] = useState({ search: '', profile: '', status: '' })
  const [openActionId, setOpenActionId] = useState(null)
  const [notification, setNotification] = useState('')
  const [confirmation, setConfirmation] = useState(null)

  const filteredUsers = useMemo(() => users.filter((user) => {
    const searchable = `${user.name} ${user.email}`.toLowerCase()
    return (
      searchable.includes(filters.search.toLowerCase()) &&
      (!filters.profile || user.profile === filters.profile) &&
      (!filters.status || user.status === filters.status)
    )
  }), [filters, users])

  const counts = {
    total: users.length,
    active: users.filter((user) => user.status === 'Ativo').length,
    administrators: users.filter((user) => user.profile === 'Administrador').length
  }

  const toggleStatus = (user) => {
    const nextStatus = user.status === 'Ativo' ? 'Inativo' : 'Ativo'
    setUsers((current) => current.map((item) => (
      item.id === user.id ? { ...item, status: nextStatus } : item
    )))
    setNotification(`${user.name} foi ${nextStatus === 'Ativo' ? 'ativado' : 'inativado'} com sucesso.`)
    setConfirmation(null)
  }

  const resetPassword = (user) => {
    setNotification(`Redefinição de senha mockada enviada para ${user.email}.`)
    setConfirmation(null)
  }

  const actions = {
    edit: (user) => navigate(`/cadastro-usuario/${user.id}`),
    status: (user) => setConfirmation({ type: 'status', user }),
    password: (user) => setConfirmation({ type: 'password', user })
  }

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-6xl space-y-6 p-4 md:p-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-nirart-text">Usuários</h1>
            <p className="mt-1 text-sm text-gray-600">Gerencie acessos, perfis e status dos usuários.</p>
          </div>
          <Button onClick={() => navigate('/cadastro-usuario')} className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
            <Plus size={18} /> Novo Usuário
          </Button>
        </header>

        {notification && (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <span>{notification}</span>
            <button type="button" onClick={() => setNotification('')} className="shrink-0 font-bold" aria-label="Fechar aviso">×</button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard icon={UserRound} label="Total de usuários" value={counts.total} />
          <SummaryCard icon={UserCheck} label="Usuários ativos" value={counts.active} />
          <SummaryCard icon={ShieldCheck} label="Administradores" value={counts.administrators} />
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:p-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_180px]">
            <label className="relative block min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Buscar por nome ou e-mail..."
                className={`${filterClass} pl-10`}
              />
            </label>
            <select value={filters.profile} onChange={(event) => setFilters((current) => ({ ...current, profile: event.target.value }))} className={filterClass}>
              <option value="">Todos os perfis</option>
              {USER_PROFILES.map((profile) => <option key={profile.value} value={profile.value}>{profile.value}</option>)}
            </select>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className={filterClass}>
              <option value="">Todos os status</option>
              {USER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {filteredUsers.length ? (
            <>
              <div className="hidden lg:block">
                <table className="w-full table-fixed text-left">
                  <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    <tr>
                      <th className="w-[26%] px-4 py-3">Usuário</th>
                      <th className="w-[24%] px-4 py-3">E-mail</th>
                      <th className="w-[16%] px-4 py-3">Perfil</th>
                      <th className="w-[12%] px-4 py-3">Status</th>
                      <th className="w-[22%] px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-4">
                          <p className="break-words font-semibold text-nirart-text">{user.name}</p>
                          <p className="mt-1 text-xs text-gray-500">Último acesso: {user.lastAccess}</p>
                        </td>
                        <td className="break-words px-4 py-4 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 py-4"><ProfileBadge profile={user.profile} /></td>
                        <td className="px-4 py-4"><StatusBadge status={user.status} /></td>
                        <td className="px-4 py-4">
                          <div className="grid grid-cols-2 gap-2">
                            <ActionButton icon={Edit2} label="Editar" onClick={() => actions.edit(user)} />
                            <ActionButton icon={user.status === 'Ativo' ? UserX : UserCheck} label={user.status === 'Ativo' ? 'Inativar' : 'Ativar'} onClick={() => actions.status(user)} />
                            <ActionButton icon={KeyRound} label="Redefinir senha" onClick={() => actions.password(user)} className="col-span-2" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-3 lg:hidden">
                {filteredUsers.map((user) => (
                  <article key={user.id} className="min-w-0 rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-nirart-text">{user.name}</p>
                        <p className="mt-1 break-all text-sm text-gray-500">{user.email}</p>
                      </div>
                      <StatusBadge status={user.status} />
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Info label="Perfil" value={<ProfileBadge profile={user.profile} />} />
                      <Info label="Último acesso" value={user.lastAccess} />
                    </div>
                    <div className="relative mt-4">
                      <button
                        type="button"
                        onClick={() => setOpenActionId((current) => current === user.id ? null : user.id)}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
                      >
                        <MoreHorizontal size={17} /> Ações
                      </button>
                      {openActionId === user.id && (
                        <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                          <MobileAction icon={Edit2} label="Editar usuário" onClick={() => actions.edit(user)} />
                          <MobileAction icon={user.status === 'Ativo' ? UserX : UserCheck} label={user.status === 'Ativo' ? 'Inativar usuário' : 'Ativar usuário'} onClick={() => { actions.status(user); setOpenActionId(null) }} />
                          <MobileAction icon={KeyRound} label="Redefinir senha" onClick={() => { actions.password(user); setOpenActionId(null) }} />
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p className="p-10 text-center text-sm text-gray-500">Nenhum usuário encontrado.</p>
          )}
        </section>
      </div>

      {confirmation && (
        <ConfirmationModal
          confirmation={confirmation}
          onClose={() => setConfirmation(null)}
          onConfirm={() => confirmation.type === 'status'
            ? toggleStatus(confirmation.user)
            : resetPassword(confirmation.user)}
        />
      )}
    </MainLayout>
  )
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="inline-flex rounded-lg bg-green-50 p-2 text-nirart-green"><Icon size={20} /></div>
      <p className="mt-3 text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-nirart-text">{value}</p>
    </article>
  )
}

function ActionButton({ icon: Icon, label, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 ${className}`}
    >
      <Icon size={15} /> {label}
    </button>
  )
}

function MobileAction({ icon: Icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-11 w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left text-sm text-gray-700 last:border-0 hover:bg-gray-50">
      <Icon size={17} /> {label}
    </button>
  )
}

function ProfileBadge({ profile }) {
  const styles = {
    Administrador: 'bg-purple-100 text-purple-800',
    Atendente: 'bg-blue-100 text-blue-800',
    Financeiro: 'bg-yellow-100 text-yellow-800'
  }
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${styles[profile]}`}>{profile}</span>
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
      status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
    }`}>
      {status}
    </span>
  )
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold text-nirart-text">{value}</div>
    </div>
  )
}

function ConfirmationModal({ confirmation, onClose, onConfirm }) {
  const isPassword = confirmation.type === 'password'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-nirart-text">
          {isPassword ? 'Redefinir senha' : `${confirmation.user.status === 'Ativo' ? 'Inativar' : 'Ativar'} usuário`}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {isPassword
            ? `Simular o envio de redefinição de senha para ${confirmation.user.email}?`
            : `Deseja alterar o status de ${confirmation.user.name}?`}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} className="whitespace-nowrap">Cancelar</Button>
          <Button type="button" onClick={onConfirm} className="whitespace-nowrap">Confirmar</Button>
        </div>
      </div>
    </div>
  )
}

const filterClass = 'w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-nirart-green focus:ring-1 focus:ring-nirart-green'
