import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_STUDENTS } from '../data/mockData'

export default function RegistrarAjuste() {
  const navigate = useNavigate()
  const { id } = useParams()
  const student = MOCK_STUDENTS.find((item) => String(item.id) === String(id))

  const [formData, setFormData] = useState({
    piece: '',
    adjustmentType: '',
    description: '',
    responsible: '',
    notes: ''
  })

  if (!student) {
    return (
      <MainLayout>
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Aluno não encontrado</h1>
            <p className="text-gray-600 mt-2">Verifique se o registro está correto e tente novamente.</p>
            <div className="mt-6">
              <Button variant="primary" onClick={() => navigate('/medidas')}>Voltar para Medidas</Button>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Ajuste registrado', { studentId: student.id, ...formData, date: new Date().toLocaleDateString('pt-BR') })
    navigate(`/historico-medidas/${student.id}`)
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <button onClick={() => navigate(`/historico-medidas/${student.id}`)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} className="text-nirart-text" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-nirart-text">{student.fullName}</h1>
            <p className="text-gray-600 text-sm mt-1">Registrar ajuste de peça</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Peça" name="piece" value={formData.piece} onChange={handleChange} placeholder="Ex: Vestido de Formatura" />
            <Field
              label="Tipo de Ajuste"
              name="adjustmentType"
              value={formData.adjustmentType}
              onChange={handleChange}
              type="select"
              options={[
                { value: '', label: 'Selecione o tipo de ajuste' },
                { value: 'Comprimento', label: 'Comprimento' },
                { value: 'Cintura', label: 'Cintura' },
                { value: 'Busto', label: 'Busto' },
                { value: 'Manga', label: 'Manga' },
                { value: 'Bainha', label: 'Bainha' },
                { value: 'Fechamento', label: 'Fechamento' },
                { value: 'Outro', label: 'Outro' }
              ]}
            />
          </div>

          <Field label="Descrição do Ajuste" name="description" value={formData.description} onChange={handleChange} placeholder="Descreva detalhadamente o ajuste a ser realizado" isTextarea />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Responsável" name="responsible" value={formData.responsible} onChange={handleChange} placeholder="Nome do responsável pelo ajuste" />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Data Sugerida</label>
              <input
                type="date"
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                value={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <Field label="Observações" name="notes" value={formData.notes} onChange={handleChange} placeholder="Observações adicionais sobre o ajuste" isTextarea />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(`/historico-medidas/${student.id}`)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              <Save size={18} /> Registrar Ajuste
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

function Field({ label, name, value, onChange, placeholder, isTextarea, type = 'text', options }) {
  if (isTextarea) {
    return (
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={4}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-nirart-green focus:outline-none focus:ring-1 focus:ring-nirart-green text-sm resize-none"
        />
      </div>
    )
  }

  if (type === 'select') {
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-nirart-green focus:outline-none focus:ring-1 focus:ring-nirart-green text-sm"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-nirart-green focus:outline-none focus:ring-1 focus:ring-nirart-green text-sm"
      />
    </div>
  )
}
