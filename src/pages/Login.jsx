import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import Button from '../components/Button'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    
    // Validação básica
    if (!email || !password) {
      setError('Preencha todos os campos')
      return
    }

    // TODO: Integrar com Supabase Auth
    // Por enquanto, redirecionamos para a home
    navigate('/home')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-nirart-green via-white to-nirart-wine flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-nirart-card rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Logo/Título */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-nirart-green rounded-lg mb-4">
              <span className="text-white font-bold text-xl">NM</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-nirart-green to-nirart-wine bg-clip-text text-transparent">
              Nirart Maison
            </h1>
            <p className="text-gray-600 text-sm mt-2">Gestão de Locação de Roupas</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-nirart-text font-semibold mb-2 text-sm">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-nirart-green focus:outline-none focus:ring-1 focus:ring-nirart-green transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-nirart-text font-semibold mb-2 text-sm">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-nirart-green focus:outline-none focus:ring-1 focus:ring-nirart-green transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Checkbox Lembrar */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-gray-300 text-nirart-green focus:ring-nirart-green"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                Lembrar de mim
              </label>
            </div>

            {/* Botão Login */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="mt-6"
            >
              Entrar
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-nirart-card text-gray-500">ou</span>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-2">
            <button className="w-full text-center text-sm text-nirart-green font-semibold hover:underline">
              Cadastre-se
            </button>
            <button className="w-full text-center text-sm text-nirart-wine font-semibold hover:underline">
              Esqueceu a senha?
            </button>
          </div>

          {/* Demo Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800 font-medium">
              💡 <strong>Demo:</strong> Digite qualquer email/senha para entrar
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-nirart-card text-xs">
            © 2024 Nirart Maison. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
