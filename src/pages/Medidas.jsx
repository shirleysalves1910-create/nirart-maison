import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Clock,
  Edit2,
  Eye,
  LoaderCircle,
  MoreHorizontal,
  Plus
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import SearchBar from '../components/SearchBar'
import Button from '../components/Button'
import { listarAlunos } from '../services/alunos'
import { listarEscolas } from '../services/escolas'
import { listarTurmas } from '../services/turmas'
import { listarMedidas } from '../services/medidas'
import { formatDateBR } from '../utils/date'

const ACTIONS = [
  { key: 'view', label: 'Visualizar', icon: Eye },
  { key: 'edit', label: 'Editar', icon: Edit2 },
  { key: 'history', label: 'Histórico', icon: Clock },
  { key: 'new', label: 'Nova Medição', icon: Plus }
]

export default function Medidas() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [schools, setSchools] = useState([])
  const [classes, setClasses] = useState([])
  const [measurements, setMeasurements] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSex, setSelectedSex] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [mobileActionRow, setMobileActionRow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true

    const loadData = async () => {
      setLoading(true)
      setErrorMessage('')
      try {
        const [studentsData, schoolsData, classesData, measurementsData] = await Promise.all([
          listarAlunos(),
          listarEscolas(),
          listarTurmas(),
          listarMedidas()
        ])
        if (!active) return
        setStudents(studentsData)
        setSchools(schoolsData)
        setClasses(classesData)
        setMeasurements(measurementsData)
      } catch (error) {
        if (active) {
          setErrorMessage(getErrorMessage(error, 'Não foi possível carregar as medições.'))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [])

  const rows = useMemo(() => students.map((student) => {
    const history = measurements.filter((measurement) => measurement.studentId === student.id)
    const latest = history.find((measurement) => measurement.status === 'Ativa') || history[0]

    return {
      ...student,
      schoolName: schools.find((school) => school.id === student.schoolId)?.fantasyName || '—',
      className: classes.find((classData) => classData.id === student.classId)?.name || '—',
      measurementDate: latest?.measurementDate || '',
      measurementStatus: latest?.status || 'Sem registro',
      latestMeasurement: latest || null
    }
  }), [classes, measurements, schools, students])

  const availableClasses = useMemo(() => (
    selectedSchool
      ? classes.filter((classData) => classData.schoolId === selectedSchool)
      : classes
  ), [classes, selectedSchool])

  const filteredRows = useMemo(() => rows.filter((row) => {
    const searchable = `${row.fullName} ${row.schoolName} ${row.className}`.toLowerCase()
    return (
      searchable.includes(searchTerm.toLowerCase()) &&
      (!selectedSchool || row.schoolId === selectedSchool) &&
      (!selectedClass || row.classId === selectedClass) &&
      (!selectedSex || row.sex === selectedSex) &&
      (!selectedStatus || row.measurementStatus === selectedStatus)
    )
  }), [rows, searchTerm, selectedSchool, selectedClass, selectedSex, selectedStatus])

  const measurementPath = (student) => (
    student.sex === 'F'
      ? `/medidas-femininas/${student.id}`
      : `/medidas-masculinas/${student.id}`
  )

  const handleAction = (action, student) => {
    if (action === 'view') {
      navigate(`/historico-medidas/${student.id}?tab=current`)
      return
    }
    if (action === 'history') {
      navigate(`/historico-medidas/${student.id}`)
      return
    }
    if (action === 'edit' && student.latestMeasurement) {
      navigate(`${measurementPath(student)}?medidaId=${student.latestMeasurement.id}`)
      return
    }
    navigate(measurementPath(student))
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-nirart-text">Medidas</h1>
            <p className="mt-1 text-sm text-gray-600">Acompanhe as medições dos alunos e registre novas leituras.</p>
          </div>
          <Button variant="primary" onClick={() => navigate('/alunos')}>
            Selecionar Aluno
          </Button>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
          <SearchBar onSearch={setSearchTerm} placeholder="Buscar por aluno, escola ou turma..." />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <select
              value={selectedSchool}
              onChange={(event) => {
                setSelectedSchool(event.target.value)
                setSelectedClass('')
              }}
              className={selectClass}
            >
              <option value="">Todas as Escolas</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>{school.fantasyName}</option>
              ))}
            </select>
            <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)} className={selectClass}>
              <option value="">Todas as Turmas</option>
              {availableClasses.map((classData) => (
                <option key={classData.id} value={classData.id}>{classData.name}</option>
              ))}
            </select>
            <select value={selectedSex} onChange={(event) => setSelectedSex(event.target.value)} className={selectClass}>
              <option value="">Todos os Sexos</option>
              <option value="F">Feminino</option>
              <option value="M">Masculino</option>
              <option value="O">Outro</option>
            </select>
            <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} className={selectClass}>
              <option value="">Todos os Status</option>
              <option value="Ativa">Ativa</option>
              <option value="Anterior">Anterior</option>
              <option value="Sem registro">Sem registro</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-gray-500">
              <LoaderCircle className="animate-spin" size={20} /> Carregando medições...
            </div>
          ) : filteredRows.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="hidden lg:block">
                <table className="w-full table-fixed text-left">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="w-[18%] px-4 py-3">Nome</th>
                      <th className="w-[18%] px-4 py-3">Escola</th>
                      <th className="w-[14%] px-4 py-3">Turma</th>
                      <th className="w-[10%] px-4 py-3">Sexo</th>
                      <th className="w-[14%] px-4 py-3">Data da medição</th>
                      <th className="w-[11%] px-4 py-3">Status</th>
                      <th className="w-[15%] px-4 py-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.id} className="border-b hover:bg-gray-50">
                        <td className="break-words px-4 py-3">{row.fullName}</td>
                        <td className="break-words px-4 py-3 text-sm">{row.schoolName}</td>
                        <td className="break-words px-4 py-3 text-sm">{row.className}</td>
                        <td className="px-4 py-3 text-sm">{getSexLabel(row.sex)}</td>
                        <td className="px-4 py-3 text-sm">{row.measurementDate ? formatDateBR(row.measurementDate) : 'Sem registro'}</td>
                        <td className="px-4 py-3"><StatusBadge status={row.measurementStatus} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {ACTIONS.map((action) => (
                              <IconAction
                                key={action.key}
                                action={action}
                                disabled={action.key === 'edit' && !row.latestMeasurement}
                                onClick={() => handleAction(action.key, row)}
                              />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-3 lg:hidden">
                {filteredRows.map((row) => (
                  <article key={row.id} className="min-w-0 rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-nirart-text">{row.fullName}</p>
                        <p className="mt-1 break-words text-sm text-gray-500">{row.schoolName} · {row.className}</p>
                      </div>
                      <StatusBadge status={row.measurementStatus} />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <Info label="Sexo" value={getSexLabel(row.sex)} />
                      <Info label="Data" value={row.measurementDate ? formatDateBR(row.measurementDate) : 'Sem registro'} />
                    </div>
                    <div className="relative mt-4">
                      <button
                        type="button"
                        onClick={() => setMobileActionRow((current) => current === row.id ? null : row.id)}
                        className="inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
                      >
                        Ações <MoreHorizontal size={16} />
                      </button>
                      {mobileActionRow === row.id && (
                        <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                          {ACTIONS.map((action) => (
                            <button
                              key={action.key}
                              type="button"
                              disabled={action.key === 'edit' && !row.latestMeasurement}
                              onClick={() => {
                                handleAction(action.key, row)
                                setMobileActionRow(null)
                              }}
                              className="flex min-h-11 w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left text-sm text-gray-700 last:border-0 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <action.icon size={16} /> {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

function IconAction({ action, onClick, disabled }) {
  const Icon = action.icon
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={action.label}
      aria-label={action.label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-nirart-green hover:bg-green-50 hover:text-nirart-green disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon size={16} />
    </button>
  )
}

function StatusBadge({ status }) {
  const style = status === 'Ativa'
    ? 'bg-green-100 text-green-800'
    : status === 'Anterior'
      ? 'bg-gray-100 text-gray-700'
      : 'bg-yellow-100 text-yellow-700'

  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${style}`}>{status}</span>
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 break-words font-medium text-nirart-text">{value}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="p-12 text-center">
      <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
      <p className="text-lg text-gray-600">Nenhum registro de medição encontrado</p>
    </div>
  )
}

function getSexLabel(sex) {
  if (sex === 'F') return 'Feminino'
  if (sex === 'M') return 'Masculino'
  return 'Outro'
}

function getErrorMessage(error, fallback) {
  return error?.message ? `${fallback} ${error.message}` : fallback
}

const selectClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-nirart-green focus:ring-1 focus:ring-nirart-green'
