import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, ChevronRight, Bell, Shield, HelpCircle, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getInitials } from '../lib/utils'

export default function PerfilPage() {
  const { profile, user, signOut, updateProfile } = useAuth()
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(profile?.name ?? '')
  const [saving, setSaving] = useState(false)

  async function saveName() {
    if (!name.trim()) return
    setSaving(true)
    await updateProfile({ name: name.trim() })
    setSaving(false)
    setEditingName(false)
  }

  const displayName = profile?.name ?? 'Usuário'

  const menuItems = [
    { icon: Bell, label: 'Notificações', desc: 'Alertas de gastos', color: '#A78BFA' },
    { icon: Shield, label: 'Privacidade', desc: 'Segurança da conta', color: '#34D399' },
    { icon: Moon, label: 'Aparência', desc: 'Tema escuro ativo', color: '#60A5FA' },
    { icon: HelpCircle, label: 'Ajuda', desc: 'Suporte e FAQ', color: '#FF9A3C' },
  ]

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="pb-navbar">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 safe-top">
          <h1 className="text-xl font-bold text-white">Perfil</h1>
        </div>

        {/* Profile Card */}
        <motion.div
          className="mx-4 bg-bg-surface rounded-2xl p-5 border border-white/5 mb-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-glow-sm">
              {getInitials(displayName)}
            </div>
            <div className="flex-1">
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="flex-1 bg-bg-overlay border border-primary/40 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && saveName()}
                  />
                  <button
                    onClick={saveName}
                    disabled={saving}
                    className="px-3 py-1.5 text-xs bg-gradient-primary text-white rounded-lg disabled:opacity-60"
                  >
                    {saving ? '...' : 'OK'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setName(profile?.name ?? ''); setEditingName(true) }}
                  className="text-left"
                >
                  <p className="text-base font-semibold text-white">{displayName}</p>
                  <p className="text-xs text-primary mt-0.5">Toque para editar</p>
                </button>
              )}
              <p className="text-xs text-[#9090A8] mt-1">{user?.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mx-4 grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Membro desde', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '-', color: '#6C63FF' },
            { label: 'Conta', value: 'Pessoal', color: '#34D399' },
          ].map(s => (
            <div key={s.label} className="bg-bg-surface rounded-xl p-3.5 border border-white/5">
              <p className="text-xs text-[#9090A8] mb-1">{s.label}</p>
              <p className="text-sm font-semibold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div className="mx-4 bg-bg-surface rounded-2xl border border-white/5 overflow-hidden mb-4">
          {menuItems.map((item, i) => (
            <motion.button
              key={item.label}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}
              whileTap={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}20` }}>
                <item.icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-[#9090A8]">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#5C5C72]" />
            </motion.button>
          ))}
        </div>

        {/* Sign out */}
        <div className="mx-4">
          <motion.button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171] rounded-2xl font-medium text-sm"
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-4 h-4" />
            Sair da conta
          </motion.button>
        </div>

        <p className="text-center text-[10px] text-[#5C5C72] mt-4 px-4">
          FinanceFlow v1.0 · Seus dados são privados e seguros
        </p>
      </div>
    </div>
  )
}
