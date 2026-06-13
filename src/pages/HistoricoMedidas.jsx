import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  Clock,
  Edit2,
  LoaderCircle,
  Plus,
  Wrench
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { buscarAlunoPorId } from '../services/alunos'
import { listarMedidas } from '../services/medidas'
import { listarAjustes } from '../services/ajustes'
import { formatDateBR } from '../utils/date'

export default function HistoricoMedidas() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const [student, setStudent] = useState(null)
  const [measurements, setMeasurements] = useState([])
  const [adjustments, setAdjustments] = useState([])
  const [activeTab, setActiveTab] = useState(
    ['current', 'measurements', 'adjustments'].includes(requestedTab)
      ? requestedTab
      : 'measurements'
  )
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true

    const loadData = async () => {
      setLoading(true)
      setErrorMessage('')
      try {
        const [studentData, measurementsData, adjustmentsData] = await Promise.all([
          buscarAlunoPorId(id),
          listarMedidas(id),
          listarAjustes(id)
        ])
        if (!active) return
        setStudent(studentData)
        setMeasurements(measurementsData)
        setAdjustments(adjustmentsData)
      } catch (error) {
        if (!active) return
        if (error?.code === 'PGRST116') {
          setNotFound(true)
        } else {
          setErrorMessage(getErrorMessage(error, 'Não foi possível carregar o histórico.'))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-80 items-center justify-center gap-3 p-8 text-sm text-gray-500">
          <LoaderCircle className="animate-spin" size={20} /> Carregando histórico...
        </div>
      </MainLayout>
    )
  }

  if (notFound || !student) {
    return <MessageState title="Aluno não encontrado" onBack={() => navigate('/medidas')} />
  }

  if (errorMessage) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-4xl p-4 md:p-8">
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{errorMessage}</span>
          </div>
        </div>
      </MainLayout>
    )
  }

  const latestMeasurement = measurements.find((measurement) => measurement.status === 'Ativa') || measurements[0]
  const measurementPath = student.sex === 'F'
    ? `/medidas-femininas/${student.id}`
    : `/medidas-masculinas/${student.id}`

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-nirart-text">Histórico de Medidas</h1>
            <p className="mt-1 text-sm text-gray-600">Acompanhe todas as medições e ajustes de {student.fullName}.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={() => navigate('/medidas')}>Voltar</Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/registrar-ajuste/${student.id}${latestMeasurement ? `?medidaId=${latestMeasurement.id}` : ''}`)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Wrench size={17} /> Registrar Ajuste
            </Button>
            <Button variant="primary" onClick={() => navigate(measurementPath)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
              <Plus size={18} /> Nova Medição
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="grid grid-cols-1 border-b border-gray-200 sm:grid-cols-3">
            <TabButton active={activeTab === 'current'} onClick={() => setActiveTab('current')}>
              Dados da Medição
            </TabButton>
            <TabButton active={activeTab === 'measurements'} onClick={() => setActiveTab('measurements')}>
              <Clock size={16} /> Medições ({measurements.length})
            </TabButton>
            <TabButton active={activeTab === 'adjustments'} onClick={() => setActiveTab('adjustments')}>
              <Wrench size={16} /> Ajustes ({adjustments.length})
            </TabButton>
          </div>

          <div className="p-4 md:p-6">
            {activeTab === 'current' && (
              latestMeasurement
                ? <CurrentMeasurement measurement={latestMeasurement} />
                : <EmptyText text="Nenhuma medição registrada ainda." />
            )}

            {activeTab === 'measurements' && (
              <MeasurementsHistory
                measurements={measurements}
                measurementPath={measurementPath}
                navigate={navigate}
              />
            )}

            {activeTab === 'adjustments' && (
              <AdjustmentsHistory adjustments={adjustments} />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

function CurrentMeasurement({ measurement }) {
  const isFemale = measurement.type === 'female'
  const fields = isFemale
    ? [
        ['Altura', measurement.altura],
        ['Busto', measurement.busto],
        ['Abaixo do Busto', measurement.abaixoBusto],
        ['Cintura', measurement.cintura],
        ['Quadril', measurement.quadril],
        ['Comprimento', measurement.comprimento],
        ['Número do Sapato', measurement.shoeSize]
      ]
    : [
        ['Altura', measurement.altura],
        ['Tamanho do Terno', measurement.suitSize],
        ['Manga', measurement.sleeve],
        ['Tamanho da Camisa', measurement.shirtSize],
        ['Tamanho da Calça', measurement.pantsSize],
        ['Cintura da Calça', measurement.waist],
        ['Comprimento da Calça', measurement.pantsLength],
        ['Número do Sapato', measurement.shoeSize]
      ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card label="Data da Medição" value={formatDateBR(measurement.measurementDate)} />
        <Card label="Status" value={measurement.status} />
        <Card label="Tipo" value={isFemale ? 'Feminina' : 'Masculina'} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {fields.map(([label, value]) => <Card key={label} label={label} value={value} />)}
      </div>
      <TextBlock label="Observações" value={measurement.notes} />
      <TextBlock label="Alterações" value={measurement.changes} />
    </div>
  )
}

function MeasurementsHistory({ measurements, measurementPath, navigate }) {
  if (!measurements.length) return <EmptyText text="Nenhuma medição registrada ainda." />

  return (
    <div className="space-y-4">
      {measurements.map((measurement) => (
        <article key={measurement.id} className="rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-nirart-text">{formatDateBR(measurement.measurementDate)}</p>
              <p className="mt-1 text-sm text-gray-600">{measurement.type === 'female' ? 'Medição feminina' : 'Medição masculina'}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={measurement.status} />
              <button
                type="button"
                onClick={() => navigate(`${measurementPath}?medidaId=${measurement.id}`)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                aria-label="Editar medição"
                title="Editar medição"
              >
                <Edit2 size={16} />
              </button>
            </div>
          </div>
          {measurement.notes && <p className="mt-3 text-sm text-gray-700">{measurement.notes}</p>}
        </article>
      ))}
    </div>
  )
}

function AdjustmentsHistory({ adjustments }) {
  if (!adjustments.length) return <EmptyText text="Nenhum ajuste registrado ainda." />

  return (
    <div className="space-y-4">
      {adjustments.map((adjustment) => (
        <article key={adjustment.id} className="rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="break-words font-semibold text-nirart-text">{adjustment.piece}</p>
              <p className="mt-1 text-sm text-gray-600">{adjustment.adjustmentType}</p>
              <p className="mt-2 break-words text-sm text-gray-700">{adjustment.description}</p>
            </div>
            <div className="shrink-0 sm:text-right">
              <StatusBadge status={adjustment.status} />
              <p className="mt-2 text-sm text-gray-600">{adjustment.responsible || 'Sem responsável'}</p>
              <p className="mt-1 text-xs text-gray-500">{formatDateBR(adjustment.adjustmentDate)}</p>
            </div>
          </div>
          {adjustment.notes && <p className="mt-3 text-sm text-gray-600">Observações: {adjustment.notes}</p>}
        </article>
      ))}
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-12 items-center justify-center gap-2 px-4 py-3 text-sm font-semibold ${
        active
          ? 'border-b-2 border-nirart-green text-nirart-green'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  )
}

function Card({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 break-words font-semibold text-nirart-text">{value || '—'}</p>
    </div>
  )
}

function TextBlock({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="mb-2 text-sm text-gray-500">{label}</p>
      <p className="break-words text-gray-700">{value || `Sem ${label.toLowerCase()}`}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    Ativa: 'bg-green-100 text-green-800',
    Anterior: 'bg-gray-100 text-gray-700',
    Pendente: 'bg-yellow-100 text-yellow-800',
    'Em andamento': 'bg-blue-100 text-blue-800',
    Concluído: 'bg-green-100 text-green-800',
    Cancelado: 'bg-red-100 text-red-800'
  }
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>
}

function EmptyText({ text }) {
  return <p className="py-8 text-center text-gray-600">{text}</p>
}

function MessageState({ title, onBack }) {
  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-nirart-text">{title}</h1>
          <Button className="mt-6" onClick={onBack}>Voltar para Medidas</Button>
        </div>
      </div>
    </MainLayout>
  )
}

function getErrorMessage(error, fallback) {
  return error?.message ? `${fallback} ${error.message}` : fallback
}
