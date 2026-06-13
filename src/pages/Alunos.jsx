import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  CalendarCheck,
  Clock,
  CreditCard,
  Edit2,
  Eye,
  LoaderCircle,
  MoreHorizontal,
  Ruler,
  Trash2
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import SearchBar from '../components/SearchBar'
import Button from '../components/Button'
import { listarAlunos, removerAluno } from '../services/alunos'
import { listarEscolas } from '../services/escolas'
import { listarTurmas } from '../services/turmas'

const ACTIONS = [
  { key: 'view', label: 'Visualizar', icon: Eye },
  { key: 'edit', label: 'Editar', icon: Edit2 },
  { key: 'measure', label: 'Medidas', icon: Ruler },
  { key: 'reservations', label: 'Reservas', icon: CalendarCheck },
  { key: 'payments', label: 'Pagamentos', icon: CreditCard },
  { key: 'history', label: 'Histórico', icon: Clock },
  { key: 'delete', label: 'Excluir', icon: Trash2, danger: true }
]

export default function Alunos() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [schools, setSchools] = useState([])
  const [classes, setClasses] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [studentToRemove, setStudentToRemove] = useState(null)
  const [mobileActionRow, setMobileActionRow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [notification, setNotification] = useState('')

  useEffect(() => {
    let active = true

    const loadData = async () => {
      setLoading(true)
      setErrorMessage('')
      try {
        const [studentsData, schoolsData, classesData] = await Promise.all([
          listarAlunos(),
          listarEscolas(),
          listarTurmas()
        ])
        if (!active) return
        setStudents(studentsData)
        setSchools(schoolsData)
        setClasses(classesData)
      } catch (error) {
        if (active) {
          setErrorMessage(getErrorMessage(error, 'Não foi possível carregar os alunos.'))
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

  const availableClasses = useMemo(() => (
    selectedSchool
      ? classes.filter((classData) => classData.schoolId === selectedSchool)
      : classes
  ), [classes, selectedSchool])

  const filteredStudents = useMemo(() => students.filter((student) => {
    const searchable = [
      student.fullName,
      student.phone,
      student.guardianName,
      student.guardianPhone
    ].join(' ').toLowerCase()

    return (
      searchable.includes(searchTerm.toLowerCase()) &&
      (!selectedSchool || student.schoolId === selectedSchool) &&
      (!selectedClass || student.classId === selectedClass)
    )
  }), [students, searchTerm, selectedSchool, selectedClass])

  const handleAction = (action, student) => {
    switch (action) {
      case 'view':
        navigate(`/aluno/${student.id}`)
        break
      case 'edit':
        navigate(`/cadastro-aluno/${student.id}`)
        break
      case 'measure':
        navigate(student.sex === 'F'
          ? `/medidas-femininas/${student.id}`
          : `/medidas-masculinas/${student.id}`)
        break
      case 'reservations':
        navigate(`/reservas?alunoId=${student.id}`)
        break
      case 'payments':
        navigate('/pagamentos')
        break
      case 'history':
        navigate(`/historico-medidas/${student.id}`)
        break
      case 'delete':
        setStudentToRemove(student)
        break
      default:
        break
    }
  }

  const confirmRemove = async () => {
    if (!studentToRemove) return

    setActionLoading(true)
    setErrorMessage('')
    try {
      const result = await removerAluno(studentToRemove.id)

      if (result.action === 'inactivated') {
        setStudents((current) => current.map((student) => (
          student.id === result.student.id ? result.student : student
        )))
        setNotification(`${studentToRemove.fullName} possui histórico vinculado e foi inativado.`)
      } else {
        setStudents((current) => current.filter((student) => student.id !== studentToRemove.id))
        setNotification(`${studentToRemove.fullName} foi excluído.`)
      }

      setStudentToRemove(null)
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível excluir ou inativar o aluno.'))
    } finally {
      setActionLoading(false)
    }
  }

  const getSchoolName = (schoolId) => (
    schools.find((school) => school.id === schoolId)?.fantasyName || 'Sem escola'
  )

  const getClassName = (classId) => (
    classes.find((classData) => classData.id === classId)?.name || 'Sem turma'
  )

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-nirart-text">Alunos</h1>
            <p className="mt-1 text-sm text-gray-600">Gerencie os alunos cadastrados</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => navigate('/medidas')}>Medidas</Button>
            <Button variant="outline" onClick={() => navigate('/importar-alunos')}>Importar Alunos</Button>
            <Button variant="primary" onClick={() => navigate('/cadastro-aluno')}>Novo Aluno</Button>
          </div>
        </div>

        {notification && (
          <div className="mb-6 flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <span>{notification}</span>
            <button type="button" onClick={() => setNotification('')} className="shrink-0 font-bold" aria-label="Fechar aviso">×</button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
          <SearchBar onSearch={setSearchTerm} placeholder="Buscar por nome, telefone ou responsável..." />
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <select
              value={selectedSchool}
              onChange={(event) => {
                setSelectedSchool(event.target.value)
                setSelectedClass('')
              }}
              className="w-full rounded-lg border px-3 py-2 md:w-1/2"
            >
              <option value="">Todas as Escolas</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>{school.fantasyName}</option>
              ))}
            </select>
            <select
              value={selectedClass}
              onChange={(event) => setSelectedClass(event.target.value)}
              className="w-full rounded-lg border px-3 py-2 md:w-1/2"
            >
              <option value="">Todas as Turmas</option>
              {availableClasses.map((classData) => (
                <option key={classData.id} value={classData.id}>{classData.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-gray-500">
              <LoaderCircle className="animate-spin" size={20} /> Carregando alunos...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-lg text-gray-600">Nenhum aluno encontrado</p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                <table className="w-full table-fixed text-left">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="w-[16%] px-3 py-3">Nome</th>
                      <th className="w-[13%] px-3 py-3">Escola</th>
                      <th className="w-[10%] px-3 py-3">Turma</th>
                      <th className="w-[8%] px-3 py-3">Sexo</th>
                      <th className="w-[10%] px-3 py-3">Telefone</th>
                      <th className="w-[11%] px-3 py-3">Responsável</th>
                      <th className="w-[8%] px-3 py-3">Status</th>
                      <th className="w-[24%] px-3 py-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="break-words px-3 py-3 font-medium">{student.fullName}</td>
                        <td className="break-words px-3 py-3 text-sm">{getSchoolName(student.schoolId)}</td>
                        <td className="break-words px-3 py-3 text-sm">{getClassName(student.classId)}</td>
                        <td className="px-3 py-3 text-sm">{getSexLabel(student.sex)}</td>
                        <td className="break-words px-3 py-3 text-sm">{student.phone || '—'}</td>
                        <td className="break-words px-3 py-3 text-sm">{student.guardianName || '—'}</td>
                        <td className="px-3 py-3"><StatusBadge status={student.status} /></td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-0.5">
                            {ACTIONS.filter((action) => !action.danger).map((action) => (
                              <DesktopAction
                                key={action.key}
                                action={action}
                                onClick={() => handleAction(action.key, student)}
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
                {filteredStudents.map((student) => (
                  <article key={student.id} className="min-w-0 rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-nirart-text">{student.fullName}</p>
                        <p className="mt-1 break-words text-sm text-gray-500">{getSchoolName(student.schoolId)} · {getClassName(student.classId)}</p>
                      </div>
                      <StatusBadge status={student.status} />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <Info label="Sexo" value={getSexLabel(student.sex)} />
                      <Info label="Telefone" value={student.phone || '—'} />
                      <Info label="Responsável" value={student.guardianName || '—'} className="col-span-2" />
                    </div>
                    <div className="relative mt-4">
                      <button
                        type="button"
                        onClick={() => setMobileActionRow((current) => current === student.id ? null : student.id)}
                        className="inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700"
                      >
                        Ações <MoreHorizontal size={16} />
                      </button>
                      {mobileActionRow === student.id && (
                        <ActionMenu student={student} onAction={handleAction} mobile />
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>

        {studentToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6">
              <h3 className="mb-2 text-lg font-bold">Excluir ou inativar aluno</h3>
              <p className="mb-4 text-gray-600">
                Se <strong>{studentToRemove.fullName}</strong> possuir medidas, reservas ou outro histórico, o cadastro será inativado. Caso contrário, será excluído.
              </p>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setStudentToRemove(null)} disabled={actionLoading}>Cancelar</Button>
                <Button variant="secondary" onClick={confirmRemove} disabled={actionLoading}>
                  {actionLoading ? 'Processando...' : 'Confirmar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

function ActionMenu({ student, onAction, mobile = false }) {
  return (
    <div className={`${mobile ? 'mt-2 w-full' : 'absolute right-0 z-20 mt-2 w-48'} overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg`}>
      {ACTIONS.map((action) => (
        <button
          key={action.key}
          type="button"
          onClick={() => onAction(action.key, student)}
          className={`flex min-h-10 w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
            action.danger ? 'text-red-700' : 'text-gray-700'
          }`}
        >
          <action.icon size={16} />
          {action.label}
        </button>
      ))}
    </div>
  )
}

function DesktopAction({ action, onClick }) {
  if (!action) return null

  const Icon = action.icon
  return (
    <button
      type="button"
      onClick={onClick}
      title={action.label}
      aria-label={action.label}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
        action.danger
          ? 'border-red-200 text-red-700 hover:bg-red-50'
          : 'border-gray-200 text-gray-600 hover:border-nirart-green hover:bg-green-50 hover:text-nirart-green'
      }`}
    >
      <Icon size={15} />
    </button>
  )
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

function Info({ label, value, className = '' }) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 break-words font-medium text-nirart-text">{value}</p>
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
