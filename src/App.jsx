import './styles/index.css'
import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

const Login = lazy(() => import('./pages/Login'))
const Home = lazy(() => import('./pages/Home'))
const Escolas = lazy(() => import('./pages/Escolas'))
const CadastroEscola = lazy(() => import('./pages/CadastroEscola'))
const Turmas = lazy(() => import('./pages/Turmas'))
const CadastroTurma = lazy(() => import('./pages/CadastroTurma'))
const Alunos = lazy(() => import('./pages/Alunos'))
const CadastroAluno = lazy(() => import('./pages/CadastroAluno'))
const DetalhesAluno = lazy(() => import('./pages/DetalhesAluno'))
const ImportarAlunos = lazy(() => import('./pages/ImportarAlunos'))
const Medidas = lazy(() => import('./pages/Medidas'))
const MedidasFemininas = lazy(() => import('./pages/MedidasFemininas'))
const MedidasMasculinas = lazy(() => import('./pages/MedidasMasculinas'))
const HistoricoMedidas = lazy(() => import('./pages/HistoricoMedidas'))
const RegistrarAjuste = lazy(() => import('./pages/RegistrarAjuste'))
const Estoque = lazy(() => import('./pages/Estoque'))
const CadastroRoupa = lazy(() => import('./pages/CadastroRoupa'))
const CadastroSapato = lazy(() => import('./pages/CadastroSapato'))
const CadastroAcessorio = lazy(() => import('./pages/CadastroAcessorio'))
const KitsLocacao = lazy(() => import('./pages/KitsLocacao'))
const Reservas = lazy(() => import('./pages/Reservas'))
const CadastroReserva = lazy(() => import('./pages/CadastroReserva'))
const DetalhesReserva = lazy(() => import('./pages/DetalhesReserva'))
const Entregas = lazy(() => import('./pages/Entregas'))
const RegistrarEntrega = lazy(() => import('./pages/RegistrarEntrega'))
const Devolucoes = lazy(() => import('./pages/Devolucoes'))
const RegistrarDevolucao = lazy(() => import('./pages/RegistrarDevolucao'))
const Pagamentos = lazy(() => import('./pages/Pagamentos'))
const CadastroPagamento = lazy(() => import('./pages/CadastroPagamento'))
const DetalhesPagamento = lazy(() => import('./pages/DetalhesPagamento'))
const BaixaParcela = lazy(() => import('./pages/BaixaParcela'))
const ReciboPagamento = lazy(() => import('./pages/ReciboPagamento'))
const Agenda = lazy(() => import('./pages/Agenda'))
const CadastroEvento = lazy(() => import('./pages/CadastroEvento'))
const DetalhesEvento = lazy(() => import('./pages/DetalhesEvento'))
const Relatorios = lazy(() => import('./pages/Relatorios'))
const DashboardFinanceiro = lazy(() => import('./pages/DashboardFinanceiro'))
const Configuracoes = lazy(() => import('./pages/Configuracoes'))
const Usuarios = lazy(() => import('./pages/Usuarios'))
const CadastroUsuario = lazy(() => import('./pages/CadastroUsuario'))

function App() {
  return (
    <Router>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/escolas" element={<Escolas />} />
          <Route path="/cadastro-escola" element={<CadastroEscola />} />
          <Route path="/cadastro-escola/:id" element={<CadastroEscola />} />
          <Route path="/turmas" element={<Turmas />} />
          <Route path="/cadastro-turma" element={<CadastroTurma />} />
          <Route path="/cadastro-turma/:id" element={<CadastroTurma />} />
          <Route path="/alunos" element={<Alunos />} />
          <Route path="/cadastro-aluno" element={<CadastroAluno />} />
          <Route path="/cadastro-aluno/:id" element={<CadastroAluno />} />
          <Route path="/aluno/:id" element={<DetalhesAluno />} />
          <Route path="/importar-alunos" element={<ImportarAlunos />} />
          <Route path="/medidas" element={<Medidas />} />
          <Route path="/medidas-femininas/:id" element={<MedidasFemininas />} />
          <Route path="/medidas-masculinas/:id" element={<MedidasMasculinas />} />
          <Route path="/historico-medidas/:id" element={<HistoricoMedidas />} />
          <Route path="/registrar-ajuste/:id" element={<RegistrarAjuste />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/cadastro-roupa" element={<CadastroRoupa />} />
          <Route path="/cadastro-roupa/:id" element={<CadastroRoupa />} />
          <Route path="/cadastro-sapato" element={<CadastroSapato />} />
          <Route path="/cadastro-sapato/:id" element={<CadastroSapato />} />
          <Route path="/cadastro-acessorio" element={<CadastroAcessorio />} />
          <Route path="/cadastro-acessorio/:id" element={<CadastroAcessorio />} />
          <Route path="/kits-locacao" element={<KitsLocacao />} />
          <Route path="/kits-locacao/:id" element={<KitsLocacao />} />
          <Route path="/reservas" element={<Reservas />} />
          <Route path="/reservas/:id" element={<DetalhesReserva />} />
          <Route path="/cadastro-reserva" element={<CadastroReserva />} />
          <Route path="/cadastro-reserva/:id" element={<CadastroReserva />} />
          <Route path="/entregas" element={<Entregas />} />
          <Route path="/registrar-entrega" element={<RegistrarEntrega />} />
          <Route path="/registrar-entrega/:reservaId" element={<RegistrarEntrega />} />
          <Route path="/devolucoes" element={<Devolucoes />} />
          <Route path="/registrar-devolucao" element={<RegistrarDevolucao />} />
          <Route path="/registrar-devolucao/:reservaId" element={<RegistrarDevolucao />} />
          <Route path="/pagamentos" element={<Pagamentos />} />
          <Route path="/cadastro-pagamento" element={<CadastroPagamento />} />
          <Route path="/cadastro-pagamento/:id" element={<CadastroPagamento />} />
          <Route path="/pagamentos/:id" element={<DetalhesPagamento />} />
          <Route path="/pagamentos/:id/baixa/:parcelaId" element={<BaixaParcela />} />
          <Route path="/pagamentos/:id/recibo" element={<ReciboPagamento />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/agenda/:id" element={<DetalhesEvento />} />
          <Route path="/cadastro-evento" element={<CadastroEvento />} />
          <Route path="/cadastro-evento/:id" element={<CadastroEvento />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/dashboard-financeiro" element={<DashboardFinanceiro />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/cadastro-usuario" element={<CadastroUsuario />} />
          <Route path="/cadastro-usuario/:id" element={<CadastroUsuario />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-nirart-background px-4">
      <div className="rounded-lg border border-gray-200 bg-white px-6 py-4 text-sm font-medium text-gray-600 shadow-sm">
        Carregando...
      </div>
    </div>
  )
}

export default App
