import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError('Email ou senha inválidos.')
    } else {
      if (!name.trim()) { setError('Informe seu nome.'); setLoading(false); return }
      const { error } = await signUp(email, password, name)
      if (error) setError(error.message)
      else setSuccess('Conta criada! Verifique seu email para confirmar.')
    }
    setLoading(false)
  }

  return (
    <div className="h-dvh flex flex-col items-center justify-center px-6 bg-bg-base">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#A78BFA]/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-glow-primary">
            <TrendingUp className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-white">FinanceFlow</h1>
          <p className="text-sm text-[#9090A8] mt-1">Seus gastos, sob controle</p>
        </div>

        {/* Mode tabs */}
        <div className="flex bg-bg-surface rounded-xl p-1 mb-6 border border-white/5">
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setSuccess('') }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                mode === m
                  ? 'bg-gradient-primary text-white shadow-glow-sm'
                  : 'text-[#9090A8] hover:text-white'
              }`}
            >
              {m === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence>
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5C72]" />
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-bg-overlay border border-white/8 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-[#5C5C72] focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5C72]" />
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-bg-overlay border border-white/8 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-[#5C5C72] focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5C72]" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-bg-overlay border border-white/8 rounded-xl pl-10 pr-12 py-3.5 text-sm text-white placeholder-[#5C5C72] focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5C5C72] hover:text-white transition-colors"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-sm text-[#F87171] bg-[#F87171]/10 border border-[#F87171]/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-[#34D399] bg-[#34D399]/10 border border-[#34D399]/20 rounded-xl px-4 py-3">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-primary text-white font-semibold py-3.5 rounded-xl shadow-glow-primary transition-all duration-200 active:scale-95 disabled:opacity-60 mt-2"
          >
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
