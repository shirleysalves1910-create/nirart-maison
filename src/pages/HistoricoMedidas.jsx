import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Clock, Wrench } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_STUDENTS, MOCK_MEASUREMENTS, MOCK_ADJUSTMENTS } from '../data/mockData'

export default function HistoricoMedidas() {
  const navigate = useNavigate()
  const { id } = useParams()
  const student = MOCK_STUDENTS.find((item) => String(item.id) === String(id))
  const [activeTab, setActiveTab] = useState('measurements')

  if (!student) {
    return (
      <MainLayout>
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Aluno não encontrado</h1>
            <p className="text-gray-600 mt-2">Verifique se o registro está correto e tente novamente.</p>
            <div className="mt-6">
              <Button variant="primary" onClick={() => navigate('/medidas')}>Voltar para Medidas</Button>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  const measurementHistory = [...MOCK_MEASUREMENTS]
    .filter((measurement) => measurement.studentId === student.id)
    .sort((a, b) => parseDate(b.date) - parseDate(a.date))

  const adjustmentHistory = [...MOCK_ADJUSTMENTS]
    .filter((adjustment) => adjustment.studentId === student.id)
    .sort((a, b) => parseDate(b.date) - parseDate(a.date))

  const latestMeasurement = measurementHistory[0]

  return (
    <MainLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-nirart-text">Histórico de Medidas</h1>
            <p className="text-sm text-gray-600 mt-1">Acompanhe todas as medições e ajustes de {student.fullName}.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/medidas')}>Voltar</Button>
            <Button variant="primary" onClick={() => navigate(student.sex === 'F' ? `/medidas-femininas/${student.id}` : `/medidas-masculinas/${student.id}`)}>
              <Plus size={18} /> Nova Medição
            </Button>
          </div>
        </div>

        {/* Abas */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('current')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'current'
                  ? 'border-b-2 border-nirart-green text-nirart-green'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Dados da Medição
            </button>
            <button
              onClick={() => setActiveTab('measurements')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'measurements'
                  ? 'border-b-2 border-nirart-green text-nirart-green'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock size={16} className="inline mr-2" />
              Histórico de Medições ({measurementHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('adjustments')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'adjustments'
                  ? 'border-b-2 border-nirart-green text-nirart-green'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Wrench size={16} className="inline mr-2" />
              Ajustes ({adjustmentHistory.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'current' && latestMeasurement && (
              <CurrentMeasurement measurement={latestMeasurement} student={student} />
            )}

            {activeTab === 'measurements' && (
              <MeasurementsHistory measurements={measurementHistory} />
            )}

            {activeTab === 'adjustments' && (
              <AdjustmentsHistory adjustments={adjustmentHistory} />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

function CurrentMeasurement({ measurement, student }) {
  const isFemale = measurement.type === 'female'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card label="Data da Medição" value={measurement.date} />
        <Card label="Responsável" value={measurement.user} />
        <Card label="Status" value={measurement.status} />
        <Card label="Tipo" value={isFemale ? 'Feminina' : 'Masculina'} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {isFemale ? (
          <>
            <Card label="Altura" value={measurement.altura} />
            <Card label="Busto" value={measurement.busto} />
            <Card label="Abaixo do Busto" value={measurement.abaixoBusto} />
            <Card label="Cintura" value={measurement.cintura} />
            <Card label="Quadril" value={measurement.quadril} />
            <Card label="Comprimento" value={measurement.comprimento} />
            <Card label="Número do Sapato" value={measurement.shoeSize} />
          </>
        ) : (
          <>
            <Card label="Altura" value={measurement.altura} />
            <Card label="Tamanho do Terno" value={measurement.suitSize} />
            <Card label="Manga" value={measurement.sleeve} />
            <Card label="Tamanho da Camisa" value={measurement.shirtSize} />
            <Card label="Tamanho da Calça" value={measurement.pantsSize} />
            <Card label="Cintura da Calça" value={measurement.waist} />
            <Card label="Comprimento da Calça" value={measurement.pantsLength} />
            <Card label="Número do Sapato" value={measurement.shoeSize} />
          </>
        )}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-500 mb-2">Observações</p>
        <p className="text-gray-700">{measurement.notes || 'Sem observações'}</p>
      </div>
    </div>
  )
}

function MeasurementsHistory({ measurements }) {
  if (measurements.length === 0) {
    return <p className="text-gray-600">Nenhuma medição registrada ainda</p>
  }

  return (
    <div className="space-y-4">
      {measurements.map((record) => (
        <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-nirart-text">{record.date}</p>
              <p className="text-sm text-gray-600">Responsável: {record.user}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                record.status === 'Ativa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
              }`}>
                {record.status}
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                {record.type === 'female' ? 'Feminina' : 'Masculina'}
              </span>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-700">{record.notes}</p>
        </div>
      ))}
    </div>
  )
}

function AdjustmentsHistory({ adjustments }) {
  if (adjustments.length === 0) {
    return <p className="text-gray-600">Nenhum ajuste registrado ainda</p>
  }

  return (
    <div className="space-y-4">
      {adjustments.map((adjustment) => (
        <div key={adjustment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <p className="font-semibold text-nirart-text">{adjustment.piece}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-600">{adjustment.adjustmentType}</span>
                <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800 font-semibold">
                  {adjustment.adjustmentType}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-2">{adjustment.description}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{adjustment.responsible}</p>
              <p className="text-xs text-gray-500 mt-1">{adjustment.date}</p>
            </div>
          </div>
          {adjustment.notes && (
            <p className="mt-3 text-sm text-gray-600">Observações: {adjustment.notes}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function Card({ label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-nirart-text">{value}</p>
    </div>
  )
}

function parseDate(dateString) {
  const [day, month, year] = dateString.split('/')
  return new Date(`${year}-${month}-${day}`)
}
