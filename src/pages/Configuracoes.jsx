import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  FileText,
  Image,
  MessageSquareText,
  Palette,
  RotateCcw,
  Save,
  ShieldCheck,
  Users
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_COMPANY_SETTINGS, MOCK_USERS } from '../data/settingsMockData'

export default function Configuracoes() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState(MOCK_COMPANY_SETTINGS)
  const [logoName, setLogoName] = useState('')
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState({})

  const updateField = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setSaved(false)
  }

  const updateNested = (section, field, value) => {
    setSettings((current) => ({
      ...current,
      [section]: { ...current[section], [field]: value }
    }))
    setSaved(false)
  }

  const validate = () => {
    const nextErrors = {}
    if (!settings.storeName.trim()) nextErrors.storeName = 'Informe o nome da loja.'
    if (!settings.phone.trim()) nextErrors.phone = 'Informe o telefone.'
    if (!settings.address.trim()) nextErrors.address = 'Informe o endereço.'
    if (!settings.cnpj.trim()) nextErrors.cnpj = 'Informe o CNPJ.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) return
    setSaved(true)
  }

  const restoreColors = () => {
    setSettings((current) => ({ ...current, colors: MOCK_COMPANY_SETTINGS.colors }))
    setSaved(false)
  }

  return (
    <MainLayout>
      <div className="mx-auto min-w-0 max-w-6xl space-y-6 p-4 md:p-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-nirart-text">Configurações</h1>
            <p className="mt-1 text-sm text-gray-600">
              Personalize os dados, a identidade e as regras operacionais da Nirart Maison.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/usuarios')}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Users size={18} /> Gerenciar Usuários
          </Button>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard icon={Building2} label="Empresa" value={settings.storeName} />
          <SummaryCard icon={Users} label="Usuários cadastrados" value={MOCK_USERS.length} />
          <SummaryCard icon={ShieldCheck} label="Perfis configurados" value="3 perfis" />
        </section>

        {saved && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
            Configurações salvas localmente para demonstração.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <SettingsSection icon={Building2} title="Dados da empresa" description="Informações exibidas em documentos, recibos e comunicações.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Nome da loja" error={errors.storeName}>
                <input value={settings.storeName} onChange={(event) => updateField('storeName', event.target.value)} className={inputClass(errors.storeName)} />
              </Field>
              <Field label="CNPJ" error={errors.cnpj}>
                <input value={settings.cnpj} onChange={(event) => updateField('cnpj', event.target.value)} className={inputClass(errors.cnpj)} placeholder="00.000.000/0000-00" />
              </Field>
              <Field label="Telefone" error={errors.phone}>
                <input value={settings.phone} onChange={(event) => updateField('phone', event.target.value)} className={inputClass(errors.phone)} placeholder="(00) 00000-0000" />
              </Field>
              <Field label="Endereço" error={errors.address}>
                <input value={settings.address} onChange={(event) => updateField('address', event.target.value)} className={inputClass(errors.address)} />
              </Field>
            </div>
          </SettingsSection>

          <SettingsSection icon={Image} title="Logo" description="Prévia local da identidade da empresa. Nenhum arquivo será enviado.">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[180px_1fr] md:items-center">
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-nirart-green text-xl font-bold text-white">
                    NM
                  </div>
                  <p className="mt-2 max-w-36 truncate text-xs text-gray-500">{logoName || 'Logo padrão'}</p>
                </div>
              </div>
              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700">Selecionar logo</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={(event) => setLogoName(event.target.files?.[0]?.name || '')}
                  className="mt-2 block w-full min-w-0 text-sm text-gray-600 file:mr-3 file:whitespace-nowrap file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:font-semibold file:text-nirart-green"
                />
                <p className="mt-2 text-xs text-gray-500">Formatos sugeridos: PNG, JPG ou SVG.</p>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection icon={Palette} title="Cores do sistema" description="Ajuste a identidade visual utilizada nas telas e documentos.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ColorField label="Cor principal" value={settings.colors.primary} onChange={(value) => updateNested('colors', 'primary', value)} />
              <ColorField label="Cor de destaque" value={settings.colors.accent} onChange={(value) => updateNested('colors', 'accent', value)} />
              <ColorField label="Cor de fundo" value={settings.colors.background} onChange={(value) => updateNested('colors', 'background', value)} />
              <ColorField label="Cor do texto" value={settings.colors.text} onChange={(value) => updateNested('colors', 'text', value)} />
            </div>
            <div className="mt-5 flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {Object.values(settings.colors).map((color) => (
                  <span key={color} className="h-9 w-9 rounded-full border border-gray-200" style={{ backgroundColor: color }} title={color} />
                ))}
              </div>
              <Button type="button" size="sm" variant="outline" onClick={restoreColors} className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                <RotateCcw size={16} /> Restaurar cores
              </Button>
            </div>
          </SettingsSection>

          <SettingsSection icon={MessageSquareText} title="Mensagens padrão" description="Textos utilizados nos lembretes e confirmações mockadas.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextAreaField label="Confirmação de reserva" value={settings.messages.reservationConfirmation} onChange={(value) => updateNested('messages', 'reservationConfirmation', value)} />
              <TextAreaField label="Lembrete de entrega" value={settings.messages.deliveryReminder} onChange={(value) => updateNested('messages', 'deliveryReminder', value)} />
              <TextAreaField label="Lembrete de devolução" value={settings.messages.returnReminder} onChange={(value) => updateNested('messages', 'returnReminder', value)} />
              <TextAreaField label="Lembrete de pagamento" value={settings.messages.paymentReminder} onChange={(value) => updateNested('messages', 'paymentReminder', value)} />
            </div>
          </SettingsSection>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SettingsSection icon={FileText} title="Termos de locação" description="Condições apresentadas ao cliente no fechamento da reserva.">
              <textarea value={settings.rentalTerms} onChange={(event) => updateField('rentalTerms', event.target.value)} className={`${inputClass()} min-h-48 resize-y`} />
            </SettingsSection>
            <SettingsSection icon={ShieldCheck} title="Regras de devolução" description="Orientações sobre prazo, atraso, avarias e multas.">
              <textarea value={settings.returnRules} onChange={(event) => updateField('returnRules', event.target.value)} className={`${inputClass()} min-h-48 resize-y`} />
            </SettingsSection>
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap sm:w-auto">
              <Save size={18} /> Salvar Configurações
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

function SettingsSection({ icon: Icon, title, description, children }) {
  return (
    <section className="min-w-0 rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="shrink-0 rounded-lg bg-green-50 p-2 text-nirart-green"><Icon size={20} /></div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-nirart-text">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <article className="min-w-0 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="inline-flex rounded-lg bg-green-50 p-2 text-nirart-green"><Icon size={20} /></div>
      <p className="mt-3 text-sm text-gray-500">{label}</p>
      <p className="mt-1 break-words text-xl font-bold text-nirart-text">{value}</p>
    </article>
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

function ColorField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <div className="flex min-w-0 items-center gap-2">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-12 shrink-0 cursor-pointer rounded border border-gray-300 bg-white p-1" />
        <input value={value} onChange={(event) => onChange(event.target.value)} className={inputClass()} />
      </div>
    </Field>
  )
}

function TextAreaField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass()} min-h-28 resize-y`} />
    </Field>
  )
}

function inputClass(error) {
  return `w-full min-w-0 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 ${
    error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-nirart-green focus:ring-nirart-green'
  }`
}
