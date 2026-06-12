import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import SearchBar from '../components/SearchBar'
import Button from '../components/Button'
import { AlertCircle, Eye, Edit2, Ruler, CalendarCheck, CreditCard, Clock, Trash2, MoreHorizontal } from 'lucide-react'
import { MOCK_SCHOOLS, MOCK_CLASSES, MOCK_STUDENTS } from '../data/mockData'

const ACTIONS = [
  { key: 'view', label: 'Visualizar', icon: Eye, handler: 'view' },
  { key: 'edit', label: 'Editar', icon: Edit2, handler: 'edit' },
  { key: 'measure', label: 'Medidas', icon: Ruler, handler: 'measure' },
  { key: 'reservations', label: 'Reservas', icon: CalendarCheck, handler: 'reservations' },
  { key: 'payments', label: 'Pagamentos', icon: CreditCard, handler: 'payments' },
  { key: 'history', label: 'Histórico', icon: Clock, handler: 'history' }
]

export default function Alunos() {
  const navigate = useNavigate()
  const [students, setStudents] = useState(MOCK_STUDENTS)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [showDelete, setShowDelete] = useState(null)
  const [mobileActionRow, setMobileActionRow] = useState(null)

  const filtered = students.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSchool = !selectedSchool || s.schoolId === selectedSchool
    const matchesClass = !selectedClass || s.classId === selectedClass
    return matchesSearch && matchesSchool && matchesClass
  })

  const handleAction = (action, id) => {
    const student = students.find((item) => item.id === id)
    switch (action) {
      case 'view':
        navigate(`/aluno/${id}`)
        break
      case 'edit':
        navigate(`/cadastro-aluno/${id}`)
        break
      case 'measure':
        if (student?.sex === 'F') {
          navigate(`/medidas-femininas/${id}`)
        } else {
          navigate(`/medidas-masculinas/${id}`)
        }
        break
      case 'reservations':
        navigate('/reservas')
        break
      case 'payments':
        navigate('/pagamentos')
        break
      case 'history':
        navigate(`/historico-medidas/${id}`)
        break
      default:
        break
    }
  }

  const toggleMobileActions = (id) => {
    setMobileActionRow((current) => (current === id ? null : id))
  }

  const confirmDelete = (id) => {
    setStudents(students.filter(s => s.id !== id))
    setShowDelete(null)
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-nirart-text">Alunos</h1>
            <p className="text-sm text-gray-600 mt-1">Gerencie os alunos cadastrados</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => navigate('/medidas')}>Medidas</Button>
            <Button variant="outline" onClick={() => navigate('/importar-alunos')}>Importar Alunos</Button>
            <Button variant="primary" onClick={() => navigate('/cadastro-aluno')}>Novo Aluno</Button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-4">
          <SearchBar onSearch={setSearchTerm} placeholder="Buscar por nome, telefone ou responsável..." />
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <select value={selectedSchool || ''} onChange={(e) => setSelectedSchool(e.target.value ? Number(e.target.value) : null)} className="w-full md:w-1/2 px-3 py-2 border rounded-lg">
              <option value="">Todas as Escolas</option>
              {MOCK_SCHOOLS.map(s => <option key={s.id} value={s.id}>{s.fantasyName}</option>)}
            </select>
            <select value={selectedClass || ''} onChange={(e) => setSelectedClass(e.target.value ? Number(e.target.value) : null)} className="w-full md:w-1/2 px-3 py-2 border rounded-lg">
              <option value="">Todas as Turmas</option>
              {MOCK_CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 text-lg">Nenhum aluno encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-left">
                <thead className="bg-gray-50 border-b"><tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Escola</th>
                  <th className="px-4 py-3">Turma</th>
                  <th className="px-4 py-3">Sexo</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ações</th>
                </tr></thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{s.fullName}</td>
                      <td className="px-4 py-3">{MOCK_SCHOOLS.find(x => x.id === s.schoolId)?.fantasyName}</td>
                      <td className="px-4 py-3">{MOCK_CLASSES.find(x => x.id === s.classId)?.name}</td>
                      <td className="px-4 py-3">{s.sex === 'F' ? 'Feminino' : s.sex === 'M' ? 'Masculino' : 'Outro'}</td>
                      <td className="px-4 py-3">{s.phone}</td>
                      <td className="px-4 py-3">{s.guardianName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${s.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <div className="hidden md:flex flex-wrap gap-2">
                            {ACTIONS.map(action => (
                              <ActionButton key={action.key} label={action.label} icon={action.icon} onClick={() => handleAction(action.handler, s.id)} />
                            ))}
                          </div>
                          <div className="md:hidden relative">
                            <button
                              type="button"
                              onClick={() => toggleMobileActions(s.id)}
                              className="inline-flex items-center gap-2 w-full justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700"
                            >
                              <MoreHorizontal size={16} /> Mais ações
                            </button>
                            {mobileActionRow === s.id && (
                              <div className="absolute right-0 z-10 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                                {ACTIONS.map(action => (
                                  <button
                                    key={action.key}
                                    type="button"
                                    onClick={() => { handleAction(action.handler, s.id); setMobileActionRow(null) }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <action.icon size={16} />
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-2">Confirmar exclusão</h3>
              <p className="text-gray-600 mb-4">Deseja excluir o aluno selecionado?</p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDelete(null)}>Cancelar</Button>
                <Button variant="secondary" onClick={() => confirmDelete(showDelete)}>Excluir</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

function ActionButton({ label, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <Icon size={16} />
      {label}
    </button>
  )
}

