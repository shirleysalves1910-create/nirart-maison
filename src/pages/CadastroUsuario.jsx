import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Mail,
  Save,
  ShieldCheck,
  UserRound
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import {
  getMockUserById,
  getUserProfile,
  USER_PROFILES,
  USER_STATUSES
} from '../data/settingsMockData'

const EMPTY_FORM = {
  name: '',
  email: '',
  profile: 'Atendente',
  status: 'Ativo'
}

export default function CadastroUsuario() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const storedUser = isEdit ? getMockUserById(id) : null
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (storedUser) {
      setFormData({
        name: storedUser.name,
        email: storedUser.email,
        profile: storedUser.profile,
        status: storedUser.status
      })
    }
  }, [storedUser])

  const selectedProfile = getUserProfile(formData.profile)

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!formData.name.trim()) nextErrors.name = 'Informe o nome.'
    if (!formData.email.trim()) {
      nextErrors.email = 'Informe o e-mail.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Informe um e-mail válido.'
    }
    if (!formData.profile) nextErrors.profile = 'Selecione o perfil.'
    if (!formData.status) nextErrors.status = 'Selecione o status.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) return
    navigate('/usuarios')
  }

  if (isEdit && !storedUser) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Usuário não encontrado</h1>
            <p className="mt-2 text-gray-600">Selecione um usuário válido na listagem.</p>
            <Button className="mt-6" onClick={() => navigate('/usuarios')}>Voltar para Usuários</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-4xl p-4 md:p-8">
        <header className="mb-6 flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate('/usuarios')}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-nirart-text hover:bg-gray-100"
            aria-label="Voltar para usuários"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-nirart-text md:text-3xl">
              {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Defina os dados de acesso, perfil e status do usuário.
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <SectionTitle icon={UserRound} title="Dados do usuário" />
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Nome" error={errors.name}>
                <input
                  value={formData.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  className={inputClass(errors.name)}
                  placeholder="Nome completo"
                />
              </Field>
              <Field label="E-mail" error={errors.email}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    className={`${inputClass(errors.email)} pl-10`}
                    placeholder="usuario@nirartmaison.com.br"
                  />
                </div>
              </Field>
              <Field label="Perfil" error={errors.profile}>
                <select value={formData.profile} onChange={(event) => updateField('profile', event.target.value)} className={inputClass(errors.profile)}>
                  {USER_PROFILES.map((profile) => <option key={profile.value} value={profile.value}>{profile.value}</option>)}
                </select>
              </Field>
              <Field label="Status" error={errors.status}>
                <select value={formData.status} onChange={(event) => updateField('status', event.target.value)} className={inputClass(errors.status)}>
                  {USER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </Field>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <SectionTitle icon={ShieldCheck} title="Permissões do perfil" />
            <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-green-900">{selectedProfile?.value}</p>
                  <p className="mt-1 text-sm text-green-800">{selectedProfile?.description}</p>
                </div>
                <span className="self-start whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-nirart-green sm:self-auto">
                  {selectedProfile?.permissions.length || 0} módulos
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {selectedProfile?.permissions.map((permission) => (
                <div key={permission} className="flex min-w-0 items-center gap-2 rounded-lg border border-gray-200 p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <Check size={14} />
                  </span>
                  <span className="break-words text-sm font-medium text-nirart-text">{permission}</span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-gray-500">
              As permissões são definidas pelo perfil e permanecem mockadas nesta etapa.
            </p>
          </section>

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => navigate('/usuarios')} className="whitespace-nowrap">
              Cancelar
            </Button>
            <Button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
              <Save size={18} /> {isEdit ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-green-50 p-2 text-nirart-green"><Icon size={20} /></div>
      <h2 className="text-lg font-semibold text-nirart-text">{title}</h2>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  )
}

function inputClass(error) {
  return `w-full min-w-0 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 ${
    error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'
  }`
}
