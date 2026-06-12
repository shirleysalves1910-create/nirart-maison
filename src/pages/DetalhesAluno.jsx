import { useParams, useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { Ruler, CalendarCheck, CreditCard, Clock } from 'lucide-react'
import { MOCK_STUDENTS, MOCK_SCHOOLS, MOCK_CLASSES } from '../data/mockData'

export default function DetalhesAluno() {
  const { id } = useParams()
  const navigate = useNavigate()
  const student = MOCK_STUDENTS.find((item) => String(item.id) === String(id))
  const school = MOCK_SCHOOLS.find((item) => item.id === student?.schoolId)
  const studentClass = MOCK_CLASSES.find((item) => item.id === student?.classId)

  if (!student) {
    return (
      <MainLayout>
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-nirart-text">Aluno não encontrado</h1>
            <p className="text-gray-600 mt-2">Volte para a lista de alunos e selecione um registro válido.</p>
            <div className="mt-6">
              <Button variant="primary" onClick={() => navigate('/alunos')}>Voltar para Alunos</Button>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="min-w-[96px] min-h-[96px] rounded-full bg-gradient-to-br from-nirart-green to-nirart-wine flex items-center justify-center text-3xl font-bold text-white">
              {getInitials(student.fullName)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-nirart-text">{student.fullName}</h1>
              <p className="text-gray-600 text-sm mt-2">Detalhes do aluno e histórico de serviços</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${student.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                  {student.status}
                </span>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                  {student.sex === 'F' ? 'Feminino' : student.sex === 'M' ? 'Masculino' : 'Outro'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-3">{school?.fantasyName} · {studentClass?.name}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/alunos')}>Voltar</Button>
            <Button variant="primary" onClick={() => navigate(`/cadastro-aluno/${id}`)}>Editar</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <StatCard label="Última reserva" value={student.lastReservation} />
          <StatCard label="Próxima prova" value={student.nextTest} />
          <StatCard label="Valor em aberto" value={`R$ ${student.balanceDue},00`} />
          <StatCard label="Última medição" value={student.lastMeasurement} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ClickableCard label="Medidas" value={`${student.measuresCount} registros`} icon={<Ruler size={20} />} onClick={() => navigate(student.sex === 'F' ? `/medidas-femininas/${id}` : `/medidas-masculinas/${id}`)} />
          <ClickableCard label="Nova Medição" value="Registrar nova leitura" icon={<Ruler size={20} />} onClick={() => navigate(student.sex === 'F' ? `/medidas-femininas/${id}` : `/medidas-masculinas/${id}`)} />
          <ClickableCard label="Histórico de Medições" value="Ver histórico completo" icon={<Clock size={20} />} onClick={() => navigate(`/historico-medidas/${id}`)} />
          <ClickableCard label="Reservas" value={`${student.reservationsCount} realizadas`} icon={<CalendarCheck size={20} />} onClick={() => navigate('/reservas')} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="xl:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-nirart-text mb-4">Dados Pessoais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="Nome" value={student.fullName} />
              <InfoRow label="Sexo" value={student.sex === 'F' ? 'Feminino' : student.sex === 'M' ? 'Masculino' : 'Outro'} />
              <InfoRow label="Data Nascimento" value={new Date(student.birthDate).toLocaleDateString('pt-BR')} />
              <InfoRow label="Telefone" value={student.phone} />
              <InfoRow label="Endereço" value={student.address} className="md:col-span-2" />
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-nirart-text mb-4">Responsável</h2>
            <div className="grid grid-cols-1 gap-4">
              <InfoRow label="Nome" value={student.guardianName} />
              <InfoRow label="Telefone" value={student.guardianPhone} />
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-nirart-text mb-4">Dados Escolares</h2>
            <div className="grid grid-cols-1 gap-4">
              <InfoRow label="Escola" value={school?.fantasyName || '—'} />
              <InfoRow label="Turma" value={studentClass?.name || '—'} />
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}

function getInitials(fullName) {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-3 text-xl font-semibold text-nirart-text">{value || '—'}</p>
    </div>
  )
}

function ClickableCard({ label, value, icon, onClick }) {
  return (
    <button onClick={onClick} className="group rounded-lg border border-gray-200 bg-white p-5 text-left transition hover:border-nirart-green hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="text-nirart-green">{icon}</div>
      </div>
      <p className="mt-4 text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-nirart-text">{value}</p>
    </button>
  )
}

function InfoRow({ label, value, className = '' }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold text-nirart-text">{value || '—'}</p>
    </div>
  )
}
