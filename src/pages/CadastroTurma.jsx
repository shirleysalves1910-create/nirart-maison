import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'

const MOCK_SCHOOLS = [
  { id: 1, fantasyName: 'Escola Estadual Professora Maria Silva' },
  { id: 2, fantasyName: 'Colégio Particular São João' },
  { id: 3, fantasyName: 'E.E. Instituto Educacional' },
  { id: 4, fantasyName: 'Escola Municipal Das Flores' },
  { id: 5, fantasyName: 'Colégio e Curso Visão' },
  { id: 6, fantasyName: 'Escola Técnica Profissional' }
]

const MOCK_CLASSES = [
  { id: 1, schoolId: 1, name: '6º Ano A', turn: 'morning', eventDate: '2024-06-15', eventLocation: 'Salão Nobre da Escola', students: 28, notes: '', status: 'Ativa' },
  { id: 2, schoolId: 2, name: '3º Ano - Formatura', turn: 'morning', eventDate: '2024-06-20', eventLocation: 'Clube de Eventos', students: 45, notes: '', status: 'Ativa' }
]

export default function CadastroTurma() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    schoolId: '',
    name: '',
    turn: 'morning',
    eventDate: '',
    eventLocation: '',
    notes: '',
    status: 'Ativa'
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit) {
      const found = MOCK_CLASSES.find(c => String(c.id) === String(id))
      if (found) {
        setFormData({
          schoolId: found.schoolId,
          name: found.name,
          turn: found.turn,
          eventDate: found.eventDate,
          eventLocation: found.eventLocation,
          notes: found.notes || '',
          status: found.status || 'Ativa'
        })
      }
    }
  }, [id, isEdit])

  const validate = () => {
    const e = {}
    if (!formData.schoolId) e.schoolId = 'Selecione a escola'
    if (!formData.name || formData.name.trim().length < 3) e.name = 'Nome inválido'
    if (!formData.eventDate) e.eventDate = 'Data do evento é obrigatória'
    if (!formData.eventLocation || formData.eventLocation.trim().length < 3) e.eventLocation = 'Local inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    // Simula salvamento (a integração real virá depois)
    navigate('/turmas')
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-nirart-text">{isEdit ? 'Editar Turma' : 'Cadastrar Turma'}</h1>
          <p className="text-gray-600 text-sm mt-1">Preencha os dados da turma</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Escola</label>
            <select
              value={formData.schoolId}
              onChange={(e) => setFormData({ ...formData, schoolId: Number(e.target.value) })}
              className={`w-full px-3 py-2 border rounded-lg ${errors.schoolId ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Selecione a escola</option>
              {MOCK_SCHOOLS.map(s => (
                <option key={s.id} value={s.id}>{s.fantasyName}</option>
              ))}
            </select>
            {errors.schoolId && <p className="text-red-600 text-sm mt-1">{errors.schoolId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Turma</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
              <select
                value={formData.turn}
                onChange={(e) => setFormData({ ...formData, turn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="morning">Matutino</option>
                <option value="afternoon">Vespertino</option>
                <option value="night">Noturno</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data do Evento</label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${errors.eventDate ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.eventDate && <p className="text-red-600 text-sm mt-1">{errors.eventDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="Ativa">Ativa</option>
                <option value="Inativa">Inativa</option>
                <option value="Pendente">Pendente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Local do Evento</label>
            <input
              value={formData.eventLocation}
              onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${errors.eventLocation ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.eventLocation && <p className="text-red-600 text-sm mt-1">{errors.eventLocation}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => navigate('/turmas')}>Cancelar</Button>
            <Button type="submit" variant="primary">{isEdit ? 'Salvar Alterações' : 'Criar Turma'}</Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
