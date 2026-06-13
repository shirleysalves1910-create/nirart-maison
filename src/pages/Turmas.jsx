import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, LoaderCircle, Plus } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import ClassesTable from '../components/ClassesTable'
import ClassDetailModal from '../components/ClassDetailModal'
import ClassFilters from '../components/ClassFilters'
import SearchBar from '../components/SearchBar'
import Button from '../components/Button'
import { listarEscolas } from '../services/escolas'
import { listarTurmas, removerTurma } from '../services/turmas'

export default function Turmas() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [schools, setSchools] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchoolId, setSelectedSchoolId] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [classToRemove, setClassToRemove] = useState(null)
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
        const [classesData, schoolsData] = await Promise.all([
          listarTurmas(),
          listarEscolas()
        ])
        if (!active) return
        setClasses(classesData)
        setSchools(schoolsData)
      } catch (error) {
        if (active) {
          setErrorMessage(getErrorMessage(error, 'Não foi possível carregar as turmas.'))
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

  const filteredClasses = useMemo(() => classes.filter((classData) => {
    const searchable = [
      classData.name,
      classData.eventLocation,
      classData.notes
    ].join(' ').toLowerCase()

    return (
      searchable.includes(searchTerm.toLowerCase()) &&
      (!selectedSchoolId || classData.schoolId === selectedSchoolId) &&
      (!selectedStatus || classData.status === selectedStatus)
    )
  }), [classes, searchTerm, selectedSchoolId, selectedStatus])

  const handleView = (classData) => {
    setSelectedClass(classData)
    setShowDetailModal(true)
  }

  const handleEdit = (classData) => {
    navigate(`/cadastro-turma/${classData.id}`)
  }

  const handleRemoveRequest = (classId) => {
    setClassToRemove(classes.find((classData) => classData.id === classId) || null)
  }

  const confirmRemove = async () => {
    if (!classToRemove) return

    setActionLoading(true)
    setErrorMessage('')
    try {
      const result = await removerTurma(classToRemove.id)

      if (result.action === 'inactivated') {
        setClasses((current) => current.map((classData) => (
          classData.id === result.classData.id ? result.classData : classData
        )))
        setNotification(`${classToRemove.name} possui registros vinculados e foi inativada.`)
      } else {
        setClasses((current) => current.filter((classData) => classData.id !== classToRemove.id))
        setNotification(`${classToRemove.name} foi excluída.`)
      }

      setClassToRemove(null)
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível excluir ou inativar a turma.'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleNavigate = (section, classId) => {
    console.log(`Navegando para ${section} da turma ${classId}`)
  }

  const stats = {
    total: classes.length,
    active: classes.filter((classData) => classData.status === 'Ativa').length,
    inactive: classes.filter((classData) => classData.status === 'Inativa').length,
    pending: classes.filter((classData) => classData.status === 'Pendente').length,
    students: classes.reduce((sum, classData) => sum + classData.students, 0)
  }

  const getSchoolById = (schoolId) => (
    schools.find((school) => school.id === schoolId)
  )

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-nirart-text">Turmas</h1>
            <p className="mt-1 text-sm text-gray-600">{filteredClasses.length} turmas encontradas</p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/cadastro-turma')}
            className="flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} /> Nova Turma
          </Button>
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

        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
          <StatCard label="Total" value={stats.total} valueClass="text-nirart-text" />
          <StatCard label="Ativas" value={stats.active} valueClass="text-green-600" />
          <StatCard label="Inativas" value={stats.inactive} valueClass="text-gray-600" />
          <StatCard label="Pendentes" value={stats.pending} valueClass="text-yellow-600" />
          <StatCard label="Alunos" value={stats.students} valueClass="text-blue-600" />
        </div>

        <div className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-white p-4 md:p-6">
          <SearchBar
            onSearch={setSearchTerm}
            placeholder="Buscar por nome, local ou observações..."
          />
          <ClassFilters
            schools={schools}
            onFilterChange={(filters) => {
              setSelectedSchoolId(filters.schoolId)
              setSelectedStatus(filters.status)
            }}
          />
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-gray-500">
              <LoaderCircle className="animate-spin" size={20} /> Carregando turmas...
            </div>
          ) : filteredClasses.length > 0 ? (
            <ClassesTable
              classes={filteredClasses}
              schools={schools}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleRemoveRequest}
            />
          ) : (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-lg font-medium text-gray-600">Nenhuma turma encontrada</p>
              <p className="mt-2 text-sm text-gray-500">Ajuste sua busca ou filtros</p>
            </div>
          )}
        </div>

        {showDetailModal && (
          <ClassDetailModal
            classData={selectedClass}
            school={getSchoolById(selectedClass?.schoolId)}
            onClose={() => setShowDetailModal(false)}
            onEdit={handleEdit}
            onNavigate={handleNavigate}
          />
        )}

        {classToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
              <AlertCircle className="mb-4 text-nirart-wine" size={32} />
              <h3 className="mb-2 text-lg font-bold text-nirart-text">Excluir ou inativar turma</h3>
              <p className="mb-6 text-gray-600">
                Se <strong>{classToRemove.name}</strong> possuir alunos ou registros operacionais vinculados, ela será inativada para preservar o histórico. Caso contrário, será excluída.
              </p>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setClassToRemove(null)} disabled={actionLoading}>
                  Cancelar
                </Button>
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

function StatCard({ label, value, valueClass }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

function getErrorMessage(error, fallback) {
  return error?.message ? `${fallback} ${error.message}` : fallback
}
