import './styles/index.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import Escolas from './pages/Escolas'
import CadastroEscola from './pages/CadastroEscola'
import Turmas from './pages/Turmas'
import CadastroTurma from './pages/CadastroTurma'
import Alunos from './pages/Alunos'
import CadastroAluno from './pages/CadastroAluno'
import DetalhesAluno from './pages/DetalhesAluno'
import ImportarAlunos from './pages/ImportarAlunos'
import Medidas from './pages/Medidas'
import MedidasFemininas from './pages/MedidasFemininas'
import MedidasMasculinas from './pages/MedidasMasculinas'
import HistoricoMedidas from './pages/HistoricoMedidas'
import RegistrarAjuste from './pages/RegistrarAjuste'
import Estoque from './pages/Estoque'
import CadastroRoupa from './pages/CadastroRoupa'
import CadastroSapato from './pages/CadastroSapato'
import CadastroAcessorio from './pages/CadastroAcessorio'
import KitsLocacao from './pages/KitsLocacao'
import Reservas from './pages/Reservas'
import Pagamentos from './pages/Pagamentos'
import Agenda from './pages/Agenda'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'

function App() {
  return (
    <Router>
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
        <Route path="/pagamentos" element={<Pagamentos />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
