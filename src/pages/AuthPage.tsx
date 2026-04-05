import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, TrendingUp, MailCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'confirm'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [registeredEmail, setRegisteredEmail] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError('Email ou senha inválidos.')

    } else if (mode === 'register') {
      if (!name.trim()) { setError('Informe seu nome.'); setLoading(false); return }
      if (password !== confirmPassword) { setError('As senhas não coincidem.'); setLoading(false); return }
      if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); setLoading(false); return }
      const { error } = await signUp(email, password, name)
      if (error) {
        setError(error.message)
      } else {
        setRegisteredEmail(email)
        setMode('confirm')
      }

    } else if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) setError('Erro ao enviar email. Verifique o endereço.')
      else setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.')
    }

    setLoading(false)
  }

  function switchMode(m: typeof mode) {
    setMode(m)
    setError('')
    setSuccess('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="h-dvh flex flex-col items-center justify-center px-6 bg-bg-base overflow-y-auto">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#A78BFA]/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10 py-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-glow-primary">
            <TrendingUp className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-white">FinanceFlow</h1>
          <p className="text-sm text-[#9090A8] mt-1">Seus gastos, sob controle</p>
        </div>

        {/* ── Tela de confirmação de email ── */}
        <AnimatePresence>
          {mode === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 bg-[#34D399]/15 border border-[#34D399]/30 rounded-3xl flex items-center justify-center">
                  <MailCheck className="w-10 h-10 text-[#34D399]" strokeWidth={1.5} />
                </div>
              </div>

              <h2 className="text-xl font-bold text-white mb-2">Confirme seu email</h2>
              <p className="text-sm text-[#9090A8] leading-relaxed mb-1">
                Enviamos um link de ativação para:
              </p>
              <p className="text-sm font-semibold text-primary mb-5 break-all">
                {registeredEmail}
              </p>

              <div className="bg-bg-overlay border border-white/8 rounded-2xl p-4 mb-6 text-left space-y-2.5">
                {[
                  'Abra o email que acabamos de enviar',
                  'Clique no link "Confirmar email"',
                  'Após confirmar, volte aqui e faça login',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-[#9090A8]">{step}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => switchMode('login')}
                className="w-full bg-gradient-primary text-white font-semibold py-3.5 rounded-xl shadow-glow-primary transition-all duration-200 active:scale-95"
              >
                Ir para o login
              </button>

              <p className="text-xs text-[#5C5C72] mt-4">
                Não recebeu?{' '}
                <button
                  onClick={async () => {
                    await supabase.auth.resend({ type: 'signup', email: registeredEmail })
                  }}
                  className="text-primary underline underline-offset-2"
                >
                  Reenviar email
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode tabs (only login / register) */}
        {mode !== 'forgot' && mode !== 'confirm' && (
          <div className="flex bg-bg-surface rounded-xl p-1 mb-6 border border-white/5">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
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
        )}

        {/* Forgot password header */}
        {mode === 'forgot' && (
          <div className="mb-6">
            <button onClick={() => switchMode('login')} className="text-xs text-primary flex items-center gap-1 mb-3">
              ← Voltar ao login
            </button>
            <h2 className="text-lg font-bold text-white">Recuperar senha</h2>
            <p className="text-xs text-[#9090A8] mt-1">Enviaremos um link para redefinir sua senha.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={`space-y-4 ${mode === 'confirm' ? 'hidden' : ''}`}>
          {/* Name field (register only) */}
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

          {/* Email */}
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

          {/* Password (login + register) */}
          <AnimatePresence>
            {mode !== 'forgot' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
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

                {/* Confirm password (register only) */}
                <AnimatePresence>
                  {mode === 'register' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5C72]" />
                        <input
                          type={showConfirmPass ? 'text' : 'password'}
                          placeholder="Confirmar senha"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          required
                          className={`w-full bg-bg-overlay border rounded-xl pl-10 pr-12 py-3.5 text-sm text-white placeholder-[#5C5C72] focus:outline-none transition-colors ${
                            confirmPassword && confirmPassword !== password
                              ? 'border-[#F87171]/60 focus:border-[#F87171]'
                              : confirmPassword && confirmPassword === password
                              ? 'border-[#34D399]/60 focus:border-[#34D399]'
                              : 'border-white/8 focus:border-primary'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5C5C72] hover:text-white transition-colors"
                        >
                          {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {/* Match indicator */}
                        {confirmPassword.length > 0 && (
                          <p className={`text-[11px] mt-1 ml-1 ${confirmPassword === password ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
                            {confirmPassword === password ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Forgot password link (login only) */}
                {mode === 'login' && (
                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-primary hover:text-primary-light transition-colors"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

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
            className="w-full bg-gradient-primary text-white font-semibold py-3.5 rounded-xl shadow-glow-primary transition-all duration-200 active:scale-95 disabled:opacity-60"
          >
            {loading
              ? 'Aguarde...'
              : mode === 'login'
              ? 'Entrar'
              : mode === 'register'
              ? 'Criar conta'
              : 'Enviar link de recuperação'}
          </button>
        </form>
      </div>
    </div>
  )
}
