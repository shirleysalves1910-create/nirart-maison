import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, AlertCircle } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import SchoolsTable from '../components/SchoolsTable'
import SchoolDetailModal from '../components/SchoolDetailModal'
import SchoolFilters from '../components/SchoolFilters'
import SearchBar from '../components/SearchBar'
import Button from '../components/Button'

// Dados Mockados
const MOCK_SCHOOLS = [
  {
    id: 1,
    fantasyName: 'Escola Estadual Professora Maria Silva',
    cnpj: '12.345.678/0001-99',
    address: 'Rua das Flores, 123',
    city: 'São Paulo',
    state: 'SP',
    zipcode: '01234-567',
    phone: '(11) 3456-7890',
    email: 'contato@escolamaria.com',
    responsible: 'Maria Silva',
    status: 'Ativa',
    notes: 'Parceira desde 2020. Ótima comunicação.',
    createdAt: '2020-05-15'
  },
  {
    id: 2,
    fantasyName: 'Colégio Particular São João',
    cnpj: '98.765.432/0001-11',
    address: 'Avenida Paulista, 1000',
    city: 'São Paulo',
    state: 'SP',
    zipcode: '01311-100',
    phone: '(11) 3088-5555',
    email: 'contato@saojoao.com.br',
    responsible: 'João Silva',
    status: 'Ativa',
    notes: 'Evento anual em junho.',
    createdAt: '2020-08-22'
  },
  {
    id: 3,
    fantasyName: 'E.E. Instituto Educacional',
    cnpj: '55.555.555/0001-55',
    address: 'Rua do Comércio, 456',
    city: 'Santo André',
    state: 'SP',
    zipcode: '09050-570',
    phone: '(11) 4456-7890',
    email: 'contato@instituto.edu.br',
    responsible: 'Carlos Santos',
    status: 'Inativa',
    notes: 'Inativa desde dezembro 2023',
    createdAt: '2019-03-10'
  },
  {
    id: 4,
    fantasyName: 'Escola Municipal Das Flores',
    cnpj: '11.111.111/0001-11',
    address: 'Av. Brasil, 789',
    city: 'Diadema',
    state: 'SP',
    zipcode: '09960-000',
    phone: '(11) 4056-1234',
    email: 'contato@municipal.sp.gov.br',
    responsible: 'Ana Costa',
    status: 'Ativa',
    notes: 'Reserva usual em setembro',
    createdAt: '2021-01-20'
  },
  {
    id: 5,
    fantasyName: 'Colégio e Curso Visão',
    cnpj: '22.222.222/0001-22',
    address: 'Rua das Acácias, 200',
    city: 'São Bernardo do Campo',
    state: 'SP',
    zipcode: '09715-000',
    phone: '(11) 4125-8765',
    email: 'contato@visaocolegio.com.br',
    responsible: 'Fernanda Lima',
    status: 'Pendente',
    notes: 'Aguardando documentação completa',
    createdAt: '2024-04-05'
  },
  {
    id: 6,
    fantasyName: 'Escola Técnica Profissional',
    cnpj: '33.333.333/0001-33',
    address: 'Estrada da Imigrante, 3456',
    city: 'Mauá',
    state: 'SP',
    zipcode: '09310-310',
    phone: '(11) 4525-7890',
    email: 'contato@tecnica.edu.br',
    responsible: 'Roberto Mendes',
    status: 'Ativa',
    notes: 'Especializada em eventos técnicos',
    createdAt: '2022-06-18'
  }
]

export default function Escolas() {
  const navigate = useNavigate()
  const [schools, setSchools] = useState(MOCK_SCHOOLS)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  // Filtros
  const filteredSchools = schools.filter(school => {
    const matchesSearch = 
      school.fantasyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.cnpj.includes(searchTerm) ||
      school.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.phone.includes(searchTerm)
    
    const matchesStatus = !selectedStatus || school.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  // Ações
  const handleView = (school) => {
    setSelectedSchool(school)
    setShowDetailModal(true)
  }

  const handleEdit = (school) => {
    navigate(`/cadastro-escola/${school.id}`)
  }

  const handleDelete = (schoolId) => {
    setShowDeleteConfirm(schoolId)
  }

  const confirmDelete = (schoolId) => {
    setSchools(schools.filter(s => s.id !== schoolId))
    setShowDeleteConfirm(null)
  }

  const handleAddSchool = () => {
    navigate('/cadastro-escola')
  }

  const stats = {
    total: schools.length,
    active: schools.filter(s => s.status === 'Ativa').length,
    inactive: schools.filter(s => s.status === 'Inativa').length,
    pending: schools.filter(s => s.status === 'Pendente').length
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-nirart-text">Escolas</h1>
            <p className="text-gray-600 text-sm mt-1">{filteredSchools.length} escolas encontradas</p>
          </div>
          <Button
            variant="primary"
            onClick={handleAddSchool}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} /> Nova Escola
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
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
        </div>

        {/* Busca e Filtros */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 mb-6 space-y-4">
          <SearchBar
            onSearch={setSearchTerm}
            placeholder="Buscar por nome, CNPJ, responsável ou telefone..."
          />
          <SchoolFilters onFilterChange={(filters) => setSelectedStatus(filters.status)} />
        </div>

        {/* Tabela */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          {filteredSchools.length > 0 ? (
            <SchoolsTable
              schools={filteredSchools}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 text-lg font-medium">Nenhuma escola encontrada</p>
              <p className="text-gray-500 text-sm mt-2">Ajuste sua busca ou filtros</p>
            </div>
          )}
        </div>

        {/* Modal de Detalhes */}
        {showDetailModal && (
          <SchoolDetailModal
            school={selectedSchool}
            onClose={() => setShowDetailModal(false)}
            onEdit={handleEdit}
          />
        )}

        {/* Confirmação de Exclusão */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
              <AlertCircle className="text-nirart-wine mb-4" size={32} />
              <h3 className="text-lg font-bold text-nirart-text mb-2">Confirmar Exclusão</h3>
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja excluir esta escola? Esta ação não pode ser desfeita.
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
