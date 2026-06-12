import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_SCHOOLS, MOCK_CLASSES, MOCK_STUDENTS } from '../data/mockData'

export default function CadastroAluno() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    schoolId: '',
    classId: '',
    fullName: '',
    sex: 'F',
    birthDate: '',
    phone: '',
    address: '',
    guardianName: '',
    guardianPhone: '',
    notes: '',
    status: 'Ativo'
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit) {
      const student = MOCK_STUDENTS.find((item) => String(item.id) === String(id))
      if (student) {
        setFormData({
          schoolId: student.schoolId,
          classId: student.classId,
          fullName: student.fullName,
          sex: student.sex,
          birthDate: student.birthDate,
          phone: student.phone,
          address: student.address,
          guardianName: student.guardianName,
          guardianPhone: student.guardianPhone,
          notes: student.notes,
          status: student.status
        })
      }
    }
  }, [id, isEdit])

  const validateForm = () => {
    const newErrors = {}
    if (!formData.schoolId) newErrors.schoolId = 'Selecione a escola'
    if (!formData.classId) newErrors.classId = 'Selecione a turma'
    if (!formData.fullName.trim()) newErrors.fullName = 'Nome completo é obrigatório'
    if (!formData.sex) newErrors.sex = 'Sexo é obrigatório'
    if (!formData.birthDate) newErrors.birthDate = 'Data de nascimento é obrigatória'
    if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório'
    if (!formData.address.trim()) newErrors.address = 'Endereço é obrigatório'
    if (!formData.guardianName.trim()) newErrors.guardianName = 'Nome do responsável é obrigatório'
    if (!formData.guardianPhone.trim()) newErrors.guardianPhone = 'Telefone do responsável é obrigatório'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validateForm()) return
    navigate('/alunos')
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-nirart-text">{isEdit ? 'Editar Aluno' : 'Cadastrar Aluno'}</h1>
          <p className="text-gray-600 text-sm mt-1">Preencha os dados completos do aluno</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Escola</label>
              <select
                value={formData.schoolId}
                onChange={(e) => setFormData({ ...formData, schoolId: Number(e.target.value), classId: '' })}
                className={`w-full px-3 py-2 border rounded-lg ${errors.schoolId ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Selecione a escola</option>
                {MOCK_SCHOOLS.map((school) => (
                  <option key={school.id} value={school.id}>{school.fantasyName}</option>
                ))}
              </select>
              {errors.schoolId && <p className="text-red-600 text-sm mt-1">{errors.schoolId}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: Number(e.target.value) })}
                className={`w-full px-3 py-2 border rounded-lg ${errors.classId ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Selecione a turma</option>
                {MOCK_CLASSES.filter((item) => !formData.schoolId || item.schoolId === formData.schoolId).map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              {errors.classId && <p className="text-red-600 text-sm mt-1">{errors.classId}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                type="text"
              />
              {errors.fullName && <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
              <select
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${errors.sex ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="O">Outro</option>
              </select>
              {errors.sex && <p className="text-red-600 text-sm mt-1">{errors.sex}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${errors.birthDate ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.birthDate && <p className="text-red-600 text-sm mt-1">{errors.birthDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Responsável</label>
              <input
                type="text"
                value={formData.guardianName}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${errors.guardianName ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.guardianName && <p className="text-red-600 text-sm mt-1">{errors.guardianName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone do Responsável</label>
              <input
                type="tel"
                value={formData.guardianPhone}
                onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${errors.guardianPhone ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.guardianPhone && <p className="text-red-600 text-sm mt-1">{errors.guardianPhone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg h-28"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/alunos')}>Cancelar</Button>
            <Button type="submit" variant="primary">{isEdit ? 'Salvar Alterações' : 'Cadastrar Aluno'}</Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
