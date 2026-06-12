# Nirart Maison - Fase 1

## Sistema de Gestão de Locação de Roupas para Eventos Escolares

### Tecnologias Utilizadas
- **React 18** - Framework UI
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS
- **React Router v6** - Navegação entre páginas
- **Supabase** - Backend e autenticação

### Estrutura do Projeto

```
src/
├── pages/              # Páginas da aplicação
│   ├── Login.jsx
│   ├── Home.jsx
│   ├── Escolas.jsx
│   ├── CadastroEscola.jsx
│   ├── Turmas.jsx
│   ├── Alunos.jsx
│   ├── Estoque.jsx
│   ├── Reservas.jsx
│   ├── Pagamentos.jsx
│   └── Agenda.jsx
├── components/         # Componentes reutilizáveis
│   ├── Header.jsx
│   ├── Button.jsx
│   └── BottomNav.jsx
├── layouts/            # Layouts
│   └── MainLayout.jsx
├── styles/             # Estilos globais
│   └── index.css
├── services/           # Serviços (API calls, etc)
├── context/            # Context API
├── utils/              # Funções utilitárias
├── App.jsx             # Componente raiz
└── main.jsx            # Ponto de entrada
```

### Cores da Identidade Visual
- **Verde Principal**: #6FBFA9
- **Vinho Destaque**: #B2181B
- **Fundo**: #F8F6F2
- **Cards**: #FFFFFF
- **Texto**: #2B2B2B

### Instalação

1. **Clone ou abra o projeto**
```bash
cd nirart-maison
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env.local` na raiz do projeto:
```
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

### Como Executar

**Ambiente de Desenvolvimento:**
```bash
npm run dev
```
O projeto abrirá automaticamente em `http://localhost:5173`

**Build para Produção:**
```bash
npm run build
```

**Preview da Build:**
```bash
npm run preview
```

### Páginas Implementadas na Fase 1

✅ **Login** - Página de autenticação
✅ **Home/Dashboard** - Página inicial com resumo
✅ **Escolas** - Listagem de escolas
✅ **Cadastro de Escola** - Formulário completo para cadastrar escolas

### Navegação

A aplicação possui uma navegação por barra inferior (mobile) com os seguintes itens:
- 🏠 Home
- 🏫 Escolas
- 👥 Turmas
- 📚 Alunos
- 📦 Estoque
- 📅 Reservas
- 💳 Pagamentos
- 📋 Agenda

### Próximos Passos (Fase 2+)

- [ ] Integração com Supabase Authentication
- [ ] Implementar páginas de Turmas
- [ ] Implementar páginas de Alunos
- [ ] Implementar módulo de Estoque
- [ ] Implementar módulo de Reservas
- [ ] Implementar módulo de Pagamentos
- [ ] Implementar calendário/agenda
- [ ] Relatórios e dashboards

### Notas Importantes

- Esta é a **Fase 1** - Fundação do sistema
- A integração com Supabase ainda não foi implementada
- Use dados mockados para teste no momento
- Todos os componentes seguem o padrão de cores definido

### Responsividade

O projeto foi desenvolvido com foco em:
- ✅ Mobile (primeira abordagem)
- ✅ Tablet (suporte com grid responsivo)
- ✅ Desktop (experiência completa)

---

**Nirart Maison © 2024**
