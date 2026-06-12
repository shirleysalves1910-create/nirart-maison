import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, AlertCircle } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import ClassesTable from '../components/ClassesTable'
import ClassDetailModal from '../components/ClassDetailModal'
import ClassFilters from '../components/ClassFilters'
import SearchBar from '../components/SearchBar'
import Button from '../components/Button'

// Dados das Escolas (referência)
const MOCK_SCHOOLS = [
  { id: 1, fantasyName: 'Escola Estadual Professora Maria Silva' },
  { id: 2, fantasyName: 'Colégio Particular São João' },
  { id: 3, fantasyName: 'E.E. Instituto Educacional' },
  { id: 4, fantasyName: 'Escola Municipal Das Flores' },
  { id: 5, fantasyName: 'Colégio e Curso Visão' },
  { id: 6, fantasyName: 'Escola Técnica Profissional' }
]

// Dados Mockados de Turmas
const MOCK_CLASSES = [
  {
    id: 1,
    schoolId: 1,
    name: '6º Ano A',
    turn: 'morning',
    eventDate: '2024-06-15',
    eventLocation: 'Salão Nobre da Escola',
    students: 28,
    notes: 'Primeira formatura da escola',
    status: 'Ativa',
    createdAt: '2024-01-10'
  },
  {
    id: 2,
    schoolId: 1,
    name: '6º Ano B',
    turn: 'afternoon',
    eventDate: '2024-06-15',
    eventLocation: 'Salão Nobre da Escola',
    students: 32,
    notes: 'Turma grande, verificar espaço',
    status: 'Ativa',
    createdAt: '2024-01-10'
  },
  {
    id: 3,
    schoolId: 2,
    name: '3º Ano - Formatura',
    turn: 'morning',
    eventDate: '2024-06-20',
    eventLocation: 'Clube de Eventos',
    students: 45,
    notes: 'Evento premium, todos participam',
    status: 'Ativa',
    createdAt: '2024-02-15'
  },
  {
    id: 4,
    schoolId: 2,
    name: '2º Ano A',
    turn: 'afternoon',
    eventDate: '2024-07-10',
    eventLocation: 'Auditório da Escola',
    students: 38,
    notes: '',
    status: 'Ativa',
    createdAt: '2024-02-20'
  },
  {
    id: 5,
    schoolId: 4,
    name: 'Turma de Encerramento',
    turn: 'morning',
    eventDate: '2024-06-25',
    eventLocation: 'Espaço de Eventos Municipal',
    students: 22,
    notes: 'Evento simples, orçamento limitado',
    status: 'Ativa',
    createdAt: '2024-03-01'
  },
  {
    id: 6,
    schoolId: 5,
    name: '8º Ano - Bife com Batata',
    turn: 'night',
    eventDate: '2024-06-22',
    eventLocation: 'Churrascaria do Bairro',
    students: 50,
    notes: 'Evento temático, roupas formais obrigatórias',
    status: 'Ativa',
    createdAt: '2024-03-05'
  },
  {
    id: 7,
    schoolId: 3,
    name: 'Colação de Grau',
    turn: 'morning',
    eventDate: '2024-05-15',
    eventLocation: 'Teatro Municipal',
    students: 60,
    notes: 'Evento realizado',
    status: 'Inativa',
    createdAt: '2024-01-20'
  },
  {
    id: 8,
    schoolId: 6,
    name: 'Turma X - Técnico em Informática',
    turn: 'afternoon',
    eventDate: '2024-08-10',
    eventLocation: 'A Definir',
    students: 25,
    notes: 'Aguardando confirmação da data',
    status: 'Pendente',
    createdAt: '2024-04-01'
  }
]

export default function Turmas() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState(MOCK_CLASSES)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchoolId, setSelectedSchoolId] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  // Filtros
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = 
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.eventLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.notes.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSchool = !selectedSchoolId || cls.schoolId === selectedSchoolId
    const matchesStatus = !selectedStatus || cls.status === selectedStatus

    return matchesSearch && matchesSchool && matchesStatus
  })

  // Ações
  const handleView = (classData) => {
    setSelectedClass(classData)
    setShowDetailModal(true)
  }

  const handleEdit = (classData) => {
    navigate(`/cadastro-turma/${classData.id}`)
  }

  const handleDelete = (classId) => {
    setShowDeleteConfirm(classId)
  }

  const confirmDelete = (classId) => {
    setClasses(classes.filter(c => c.id !== classId))
    setShowDeleteConfirm(null)
  }

  const handleAddClass = () => {
    navigate('/cadastro-turma')
  }

  const handleNavigate = (section, classId) => {
    // Placeholder para navegações futuras
    console.log(`Navegando para ${section} da turma ${classId}`)
  }

  const stats = {
    total: classes.length,
    active: classes.filter(c => c.status === 'Ativa').length,
    inactive: classes.filter(c => c.status === 'Inativa').length,
    pending: classes.filter(c => c.status === 'Pendente').length,
    students: classes.reduce((sum, c) => sum + c.students, 0)
  }

  const getSchoolById = (schoolId) => {
    return MOCK_SCHOOLS.find(s => s.id === schoolId)
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-nirart-text">Turmas</h1>
            <p className="text-gray-600 text-sm mt-1">{filteredClasses.length} turmas encontradas</p>
          </div>
          <Button
            variant="primary"
            onClick={handleAddClass}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} /> Nova Turma
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-nirart-text">{stats.total}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Ativas</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Inativas</p>
            <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Alunos</p>
            <p className="text-2xl font-bold text-blue-600">{stats.students}</p>
          </div>
        </div>

        {/* Busca e Filtros */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 mb-6 space-y-4">
          <SearchBar
            onSearch={setSearchTerm}
            placeholder="Buscar por nome, local ou observações..."
          />
          <ClassFilters 
            schools={MOCK_SCHOOLS}
            onFilterChange={(filters) => {
              setSelectedSchoolId(filters.schoolId)
              setSelectedStatus(filters.status)
            }} 
          />
        </div>

        {/* Tabela */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          {filteredClasses.length > 0 ? (
            <ClassesTable
              classes={filteredClasses}
              schools={MOCK_SCHOOLS}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 text-lg font-medium">Nenhuma turma encontrada</p>
              <p className="text-gray-500 text-sm mt-2">Ajuste sua busca ou filtros</p>
            </div>
          )}
        </div>

        {/* Modal de Detalhes */}
        {showDetailModal && (
          <ClassDetailModal
            classData={selectedClass}
            school={getSchoolById(selectedClass?.schoolId)}
            onClose={() => setShowDetailModal(false)}
            onEdit={handleEdit}
            onNavigate={handleNavigate}
          />
        )}

        {/* Confirmação de Exclusão */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
              <AlertCircle className="text-nirart-wine mb-4" size={32} />
              <h3 className="text-lg font-bold text-nirart-text mb-2">Confirmar Exclusão</h3>
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => confirmDelete(showDeleteConfirm)}
                >
                  Confirmar Exclusão
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
