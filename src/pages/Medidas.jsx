import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import SearchBar from '../components/SearchBar'
import Button from '../components/Button'
import { AlertCircle, Eye, Edit2, Clock, Plus, MoreHorizontal } from 'lucide-react'
import { MOCK_STUDENTS, MOCK_SCHOOLS, MOCK_CLASSES, MOCK_MEASUREMENTS } from '../data/mockData'

const ACTIONS = [
  { key: 'view', label: 'Visualizar', icon: Eye, handler: 'view' },
  { key: 'edit', label: 'Editar', icon: Edit2, handler: 'edit' },
  { key: 'history', label: 'Histórico', icon: Clock, handler: 'history' },
  { key: 'new', label: 'Nova Medição', icon: Plus, handler: 'new' }
]

export default function Medidas() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSex, setSelectedSex] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [mobileActionRow, setMobileActionRow] = useState(null)

  const rows = MOCK_STUDENTS.map((student) => {
    const history = MOCK_MEASUREMENTS
      .filter((measurement) => measurement.studentId === student.id)
      .sort((a, b) => parseDate(b.date) - parseDate(a.date))

    const latest = history[0]
    return {
      ...student,
      schoolName: MOCK_SCHOOLS.find((school) => school.id === student.schoolId)?.fantasyName || '—',
      className: MOCK_CLASSES.find((schoolClass) => schoolClass.id === student.classId)?.name || '—',
      measurementDate: latest?.date || 'Sem registro',
      status: latest?.status || 'Sem registro',
      latestMeasurement: latest
    }
  })

  const filtered = rows.filter((row) => {
    const matchesSearch =
      row.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.className.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSchool = !selectedSchool || row.schoolId === Number(selectedSchool)
    const matchesClass = !selectedClass || row.classId === Number(selectedClass)
    const matchesSex = !selectedSex || row.sex === selectedSex
    const matchesStatus = !selectedStatus || row.status === selectedStatus

    return matchesSearch && matchesSchool && matchesClass && matchesSex && matchesStatus
  })

  const handleAction = (handler, student) => {
    switch (handler) {
      case 'view':
        navigate(`/aluno/${student.id}`)
        break
      case 'edit':
        navigate(student.sex === 'F' ? `/medidas-femininas/${student.id}` : `/medidas-masculinas/${student.id}`)
        break
      case 'history':
        navigate(`/historico-medidas/${student.id}`)
        break
      case 'new':
        navigate(student.sex === 'F' ? `/medidas-femininas/${student.id}` : `/medidas-masculinas/${student.id}`)
        break
      default:
        break
    }
  }

  const toggleMobileActions = (id) => {
    setMobileActionRow((current) => (current === id ? null : id))
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-nirart-text">Medidas</h1>
            <p className="text-sm text-gray-600 mt-1">Acompanhe as medições dos alunos e registre novas leituras.</p>
          </div>
          <Button variant="primary" onClick={() => navigate('/medidas-femininas/1')}>
            Nova Medição
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-4">
          <SearchBar onSearch={setSearchTerm} placeholder="Buscar por aluno, escola ou turma..." />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="">Todas as Escolas</option>
              {MOCK_SCHOOLS.map((school) => (
                <option key={school.id} value={school.id}>{school.fantasyName}</option>
              ))}
            </select>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="">Todas as Turmas</option>
              {MOCK_CLASSES.map((clazz) => (
                <option key={clazz.id} value={clazz.id}>{clazz.name}</option>
              ))}
            </select>
            <select value={selectedSex} onChange={(e) => setSelectedSex(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="">Todos os Sexos</option>
              <option value="F">Feminino</option>
              <option value="M">Masculino</option>
            </select>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="">Todos os Status</option>
              <option value="Ativa">Ativa</option>
              <option value="Anterior">Anterior</option>
              <option value="Sem registro">Sem registro</option>
            </select>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 text-lg">Nenhum registro de medição encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Escola</th>
                    <th className="px-4 py-3">Turma</th>
                    <th className="px-4 py-3">Sexo</th>
                    <th className="px-4 py-3">Data da medição</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{row.fullName}</td>
                      <td className="px-4 py-3">{row.schoolName}</td>
                      <td className="px-4 py-3">{row.className}</td>
                      <td className="px-4 py-3">{row.sex === 'F' ? 'Feminino' : 'Masculino'}</td>
                      <td className="px-4 py-3">{row.measurementDate}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${row.status === 'Ativa' ? 'bg-green-100 text-green-800' : row.status === 'Anterior' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <div className="hidden md:flex flex-wrap gap-2">
                            {ACTIONS.map((action) => (
                              <ActionButton
                                key={action.key}
                                label={action.label}
                                icon={action.icon}
                                onClick={() => handleAction(action.handler, row)}
                              />
                            ))}
                          </div>
                          <div className="md:hidden relative">
                            <button
                              type="button"
                              onClick={() => toggleMobileActions(row.id)}
                              className="inline-flex items-center gap-2 w-full justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700"
                            >
                              <MoreHorizontal size={16} /> Mais ações
                            </button>
                            {mobileActionRow === row.id && (
                              <div className="absolute right-0 z-10 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                                {ACTIONS.map((action) => (
                                  <button
                                    key={action.key}
                                    type="button"
                                    onClick={() => { handleAction(action.handler, row); setMobileActionRow(null) }}
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

function parseDate(dateString) {
  const [day, month, year] = dateString.split('/')
  return new Date(`${year}-${month}-${day}`)
}
