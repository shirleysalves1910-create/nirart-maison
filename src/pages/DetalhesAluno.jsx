import { useParams, useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { Ruler, CalendarCheck, Clock, Plus } from 'lucide-react'
import { MOCK_STUDENTS, MOCK_SCHOOLS, MOCK_CLASSES } from '../data/mockData'
import {
  getReservationItem,
  getReservationTotal,
  MOCK_RESERVATIONS
} from '../data/reservationMockData'

export default function DetalhesAluno() {
  const { id } = useParams()
  const navigate = useNavigate()
  const student = MOCK_STUDENTS.find((item) => String(item.id) === String(id))
  const school = MOCK_SCHOOLS.find((item) => item.id === student?.schoolId)
  const studentClass = MOCK_CLASSES.find((item) => item.id === student?.classId)
  const studentReservations = MOCK_RESERVATIONS.filter((item) => String(item.studentId) === String(id))

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
            <Button variant="outline" onClick={() => navigate(`/cadastro-reserva?alunoId=${id}`)} className="inline-flex items-center gap-2">
              <Plus size={17} /> Nova Reserva
            </Button>
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
          <ClickableCard label="Reservas do aluno" value={`${studentReservations.length} registros`} icon={<CalendarCheck size={20} />} onClick={() => navigate(`/reservas?alunoId=${id}`)} />
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

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-nirart-text">Reservas do aluno</h2>
              <p className="mt-1 text-sm text-gray-500">Histórico e próximas reservas vinculadas a este cadastro.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(`/reservas?alunoId=${id}`)}>Ver todas</Button>
          </div>

          {studentReservations.length === 0 ? (
            <div className="mt-5 rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
              Nenhuma reserva cadastrada para este aluno.
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {studentReservations.map((reservation) => (
                <button
                  key={reservation.id}
                  type="button"
                  onClick={() => navigate(`/reservas/${reservation.id}`)}
                  className="rounded-lg border border-gray-200 p-4 text-left transition hover:border-nirart-green hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-nirart-text">Evento em {formatDate(reservation.eventDate)}</p>
                      <p className="mt-1 text-sm text-gray-500">{summarizeReservationItems(reservation)}</p>
                    </div>
                    <ReservationStatus status={reservation.status} />
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
                    <span className="text-gray-500">Valor total</span>
                    <span className="font-bold text-nirart-text">{formatCurrency(getReservationTotal(reservation))}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
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

function ReservationStatus({ status }) {
  const styles = {
    'pré-reserva': 'bg-purple-100 text-purple-800',
    reservado: 'bg-yellow-100 text-yellow-800',
    confirmado: 'bg-green-100 text-green-800',
    entregue: 'bg-blue-100 text-blue-800',
    devolvido: 'bg-gray-100 text-gray-700',
    cancelado: 'bg-red-100 text-red-800'
  }
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function summarizeReservationItems(reservation) {
  return reservation.items.map((entry) => {
    const item = getReservationItem(entry.inventoryId)
    return `${entry.quantity}x ${item?.description || item?.name}`
  }).join(', ')
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}
