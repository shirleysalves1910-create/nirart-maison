import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, LoaderCircle, Plus } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import SchoolsTable from '../components/SchoolsTable'
import SchoolDetailModal from '../components/SchoolDetailModal'
import SchoolFilters from '../components/SchoolFilters'
import SearchBar from '../components/SearchBar'
import Button from '../components/Button'
import {
  excluirEscola,
  inativarEscola,
  listarEscolas
} from '../services/escolas'

export default function Escolas() {
  const navigate = useNavigate()
  const [schools, setSchools] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [schoolToRemove, setSchoolToRemove] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [notification, setNotification] = useState('')

  useEffect(() => {
    let active = true

    const loadSchools = async () => {
      setLoading(true)
      setErrorMessage('')
      try {
        const data = await listarEscolas()
        if (active) setSchools(data)
      } catch (error) {
        if (active) {
          setErrorMessage(getErrorMessage(error, 'Não foi possível carregar as escolas.'))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSchools()
    return () => {
      active = false
    }
  }, [])

  const filteredSchools = useMemo(() => schools.filter((school) => {
    const searchable = [
      school.fantasyName,
      school.cnpj,
      school.responsible,
      school.phone
    ].join(' ').toLowerCase()

    return (
      searchable.includes(searchTerm.toLowerCase()) &&
      (!selectedStatus || school.status === selectedStatus)
    )
  }), [schools, searchTerm, selectedStatus])

  const handleView = (school) => {
    setSelectedSchool(school)
    setShowDetailModal(true)
  }

  const handleEdit = (school) => {
    navigate(`/cadastro-escola/${school.id}`)
  }

  const handleRemove = (schoolId) => {
    setSchoolToRemove(schools.find((school) => school.id === schoolId) || null)
  }

  const handleInactivate = async () => {
    if (!schoolToRemove) return

    setActionLoading(true)
    setErrorMessage('')
    try {
      const updatedSchool = await inativarEscola(schoolToRemove.id)
      setSchools((current) => current.map((school) => (
        school.id === updatedSchool.id ? updatedSchool : school
      )))
      setNotification(`${schoolToRemove.fantasyName} foi inativada.`)
      setSchoolToRemove(null)
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível inativar a escola.'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!schoolToRemove) return

    setActionLoading(true)
    setErrorMessage('')
    try {
      await excluirEscola(schoolToRemove.id)
      setSchools((current) => current.filter((school) => school.id !== schoolToRemove.id))
      setNotification(`${schoolToRemove.fantasyName} foi excluída.`)
      setSchoolToRemove(null)
    } catch (error) {
      const dependencyMessage = error?.code === '23503'
        ? 'A escola possui registros vinculados e não pode ser excluída. Utilize a opção Inativar.'
        : 'Não foi possível excluir a escola.'
      setErrorMessage(getErrorMessage(error, dependencyMessage))
    } finally {
      setActionLoading(false)
    }
  }

  const stats = {
    total: schools.length,
    active: schools.filter((school) => school.status === 'Ativa').length,
    inactive: schools.filter((school) => school.status === 'Inativa').length,
    pending: schools.filter((school) => school.status === 'Pendente').length
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-nirart-text">Escolas</h1>
            <p className="mt-1 text-sm text-gray-600">{filteredSchools.length} escolas encontradas</p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/cadastro-escola')}
            className="flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} /> Nova Escola
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

        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatCard label="Total" value={stats.total} valueClass="text-nirart-text" />
          <StatCard label="Ativas" value={stats.active} valueClass="text-green-600" />
          <StatCard label="Inativas" value={stats.inactive} valueClass="text-gray-600" />
          <StatCard label="Pendentes" value={stats.pending} valueClass="text-yellow-600" />
        </div>

        <div className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-white p-4 md:p-6">
          <SearchBar
            onSearch={setSearchTerm}
            placeholder="Buscar por nome, CNPJ, responsável ou telefone..."
          />
          <SchoolFilters onFilterChange={(filters) => setSelectedStatus(filters.status)} />
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-gray-500">
              <LoaderCircle className="animate-spin" size={20} /> Carregando escolas...
            </div>
          ) : filteredSchools.length > 0 ? (
            <SchoolsTable
              schools={filteredSchools}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleRemove}
            />
          ) : (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-lg font-medium text-gray-600">Nenhuma escola encontrada</p>
              <p className="mt-2 text-sm text-gray-500">Ajuste sua busca ou filtros</p>
            </div>
          )}
        </div>

        {showDetailModal && (
          <SchoolDetailModal
            school={selectedSchool}
            onClose={() => setShowDetailModal(false)}
            onEdit={handleEdit}
          />
        )}

        {schoolToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
              <AlertCircle className="mb-4 text-nirart-wine" size={32} />
              <h3 className="mb-2 text-lg font-bold text-nirart-text">Excluir ou inativar escola</h3>
              <p className="mb-6 text-gray-600">
                Escolha como tratar <strong>{schoolToRemove.fantasyName}</strong>. Escolas com registros vinculados devem ser inativadas.
              </p>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setSchoolToRemove(null)} disabled={actionLoading}>
                  Cancelar
                </Button>
                <Button variant="outline" onClick={handleInactivate} disabled={actionLoading}>
                  Inativar
                </Button>
                <Button variant="secondary" onClick={handleDelete} disabled={actionLoading}>
                  {actionLoading ? 'Processando...' : 'Excluir definitivamente'}
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
