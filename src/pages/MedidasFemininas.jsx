import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { MOCK_STUDENTS, MOCK_MEASUREMENTS } from '../data/mockData'

export default function MedidasFemininas() {
  const navigate = useNavigate()
  const { id } = useParams()
  const student = MOCK_STUDENTS.find((item) => String(item.id) === String(id))
  const isEditing = !!student

  const [formData, setFormData] = useState({
    altura: '',
    busto: '',
    abaixoBusto: '',
    cintura: '',
    quadril: '',
    comprimento: '',
    shoeSize: '',
    notes: ''
  })

  useEffect(() => {
    if (student) {
      const latest = [...MOCK_MEASUREMENTS]
        .filter((measurement) => measurement.studentId === student.id && measurement.type === 'female')
        .sort((a, b) => parseDate(b.date) - parseDate(a.date))[0]

      if (latest) {
        setFormData({
          altura: latest.altura,
          busto: latest.busto,
          abaixoBusto: latest.abaixoBusto,
          cintura: latest.cintura,
          quadril: latest.quadril,
          comprimento: latest.comprimento,
          shoeSize: latest.shoeSize,
          notes: latest.notes || ''
        })
      }
    }
  }, [student])

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

  if (student.sex !== 'F') {
    return (
      <MainLayout>
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Medição Feminina indisponível</h1>
            <p className="text-gray-600 mt-2">Este aluno é do sexo masculino. Utilize a página de medidas masculinas.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row justify-center">
              <Button variant="outline" onClick={() => navigate('/medidas')}>Voltar</Button>
              <Button variant="primary" onClick={() => navigate(`/medidas-masculinas/${student.id}`)}>Ir para Medidas Masculinas</Button>
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
    console.log('Medição feminina salva', { studentId: student.id, ...formData })
    navigate(`/historico-medidas/${student.id}`)
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <button onClick={() => navigate('/medidas')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} className="text-nirart-text" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-nirart-text">{student.fullName}</h1>
            <p className="text-gray-600 text-sm mt-1">Registro de medidas femininas</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Altura" name="altura" value={formData.altura} onChange={handleChange} placeholder="Ex: 1,65m" />
            <Field label="Busto" name="busto" value={formData.busto} onChange={handleChange} placeholder="Ex: 88 cm" />
            <Field label="Abaixo do busto" name="abaixoBusto" value={formData.abaixoBusto} onChange={handleChange} placeholder="Ex: 74 cm" />
            <Field label="Cintura" name="cintura" value={formData.cintura} onChange={handleChange} placeholder="Ex: 68 cm" />
            <Field label="Quadril" name="quadril" value={formData.quadril} onChange={handleChange} placeholder="Ex: 96 cm" />
            <Field label="Comprimento" name="comprimento" value={formData.comprimento} onChange={handleChange} placeholder="Ex: 120 cm" />
            <Field label="Número do sapato" name="shoeSize" value={formData.shoeSize} onChange={handleChange} placeholder="Ex: 37" />
            <TextareaField label="Observações" name="notes" value={formData.notes} onChange={handleChange} placeholder="Observações adicionais" />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/medidas')}>Cancelar</Button>
            <Button type="submit" variant="primary"><Save size={18} /> Salvar Medição</Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

function Field({ label, name, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-nirart-green focus:outline-none focus:ring-1 focus:ring-nirart-green text-sm"
      />
    </div>
  )
}

function TextareaField({ label, name, value, onChange, placeholder }) {
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

function parseDate(dateString) {
  const [day, month, year] = dateString.split('/')
  return new Date(`${year}-${month}-${day}`)
}
