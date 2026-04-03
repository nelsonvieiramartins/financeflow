import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, ChevronRight, Bell, Shield, HelpCircle, Moon, CreditCard, Plus, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import BottomSheet from '../components/ui/BottomSheet'
import { getInitials } from '../lib/utils'
import type { CreditCard as CreditCardType } from '../lib/types'

interface CardFormState {
  name: string
  due_day: string
  last_four: string
}

const emptyForm: CardFormState = { name: '', due_day: '', last_four: '' }

export default function PerfilPage() {
  const { profile, user, signOut, updateProfile } = useAuth()
  const { creditCards, addCreditCard, updateCreditCard, deleteCreditCard } = useApp()
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(profile?.name ?? '')
  const [saving, setSaving] = useState(false)

  const [cardSheetOpen, setCardSheetOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null)
  const [cardForm, setCardForm] = useState<CardFormState>(emptyForm)
  const [cardLoading, setCardLoading] = useState(false)
  const [cardError, setCardError] = useState('')
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null)

  async function saveName() {
    if (!name.trim()) return
    setSaving(true)
    await updateProfile({ name: name.trim() })
    setSaving(false)
    setEditingName(false)
  }

  function openAddCard() {
    setEditingCard(null)
    setCardForm(emptyForm)
    setCardError('')
    setCardSheetOpen(true)
  }

  function openEditCard(card: CreditCardType) {
    setEditingCard(card)
    setCardForm({
      name: card.name,
      due_day: String(card.due_day),
      last_four: card.last_four ?? '',
    })
    setCardError('')
    setCardSheetOpen(true)
  }

  async function saveCard() {
    setCardError('')
    if (!cardForm.name.trim()) { setCardError('Informe o nome do cartão.'); return }
    const dueDay = parseInt(cardForm.due_day)
    if (!dueDay || dueDay < 1 || dueDay > 31) { setCardError('Informe um dia de vencimento válido (1-31).'); return }
    const lastFour = cardForm.last_four.trim()
    if (lastFour && !/^\d{4}$/.test(lastFour)) { setCardError('Os últimos 4 dígitos devem ser numéricos.'); return }

    setCardLoading(true)
    try {
      const data = {
        name: cardForm.name.trim(),
        due_day: dueDay,
        last_four: lastFour || null,
      }
      if (editingCard) {
        await updateCreditCard(editingCard.id, data)
      } else {
        await addCreditCard(data)
      }
      setCardSheetOpen(false)
    } catch (err) {
      setCardError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setCardLoading(false)
    }
  }

  async function confirmDeleteCard(id: string) {
    await deleteCreditCard(id)
    setDeletingCardId(null)
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

        {/* Credit Cards */}
        <div className="mx-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#6C63FF]" />
              <h2 className="text-sm font-semibold text-white">Meus Cartões de Crédito</h2>
            </div>
            <button
              onClick={openAddCard}
              className="w-7 h-7 bg-[#6C63FF]/20 border border-[#6C63FF]/30 rounded-lg flex items-center justify-center"
            >
              <Plus className="w-3.5 h-3.5 text-[#6C63FF]" />
            </button>
          </div>

          {creditCards.length === 0 ? (
            <div className="bg-bg-surface rounded-2xl border border-white/5 px-4 py-5 text-center">
              <p className="text-2xl mb-2">💳</p>
              <p className="text-xs text-[#9090A8]">Nenhum cartão cadastrado</p>
              <button
                onClick={openAddCard}
                className="mt-3 text-xs text-[#6C63FF] font-medium"
              >
                + Adicionar cartão
              </button>
            </div>
          ) : (
            <div className="bg-bg-surface rounded-2xl border border-white/5 overflow-hidden">
              {creditCards.map((card, i) => (
                <AnimatePresence key={card.id}>
                  {deletingCardId === card.id ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`px-4 py-3 bg-[#F87171]/10 ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}
                    >
                      <p className="text-xs text-[#F87171] mb-2">Excluir <strong>{card.name}</strong>?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => confirmDeleteCard(card.id)}
                          className="flex-1 py-1.5 text-xs font-medium bg-[#F87171]/20 text-[#F87171] rounded-lg"
                        >
                          Excluir
                        </button>
                        <button
                          onClick={() => setDeletingCardId(null)}
                          className="flex-1 py-1.5 text-xs font-medium bg-bg-overlay text-[#9090A8] rounded-lg"
                        >
                          Cancelar
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}>
                      <div className="w-8 h-8 rounded-lg bg-[#6C63FF]/20 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-4 h-4 text-[#6C63FF]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{card.name}</p>
                        <p className="text-xs text-[#9090A8]">
                          Vence dia {card.due_day}
                          {card.last_four ? ` · •••• ${card.last_four}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => openEditCard(card)}
                          className="w-7 h-7 rounded-lg bg-bg-overlay flex items-center justify-center"
                        >
                          <Pencil className="w-3 h-3 text-[#9090A8]" />
                        </button>
                        <button
                          onClick={() => setDeletingCardId(card.id)}
                          className="w-7 h-7 rounded-lg bg-bg-overlay flex items-center justify-center"
                        >
                          <Trash2 className="w-3 h-3 text-[#F87171]" />
                        </button>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              ))}
            </div>
          )}
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

      {/* Add/Edit Card Sheet */}
      <BottomSheet
        open={cardSheetOpen}
        onClose={() => setCardSheetOpen(false)}
        title={editingCard ? 'Editar Cartão' : 'Novo Cartão'}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#9090A8] font-medium mb-1.5 block">Nome do cartão *</label>
            <input
              type="text"
              value={cardForm.name}
              onChange={e => setCardForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Nubank, Inter, Itaú..."
              className="w-full bg-bg-overlay border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-[#5C5C72] focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-[#9090A8] font-medium mb-1.5 block">Dia do vencimento *</label>
            <input
              type="number"
              inputMode="numeric"
              value={cardForm.due_day}
              onChange={e => setCardForm(f => ({ ...f, due_day: e.target.value }))}
              placeholder="Ex: 10"
              min={1}
              max={31}
              className="w-full bg-bg-overlay border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-[#5C5C72] focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-[#9090A8] font-medium mb-1.5 block">
              Últimos 4 dígitos <span className="text-[#5C5C72]">(opcional)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={cardForm.last_four}
              onChange={e => setCardForm(f => ({ ...f, last_four: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              placeholder="Ex: 1234"
              className="w-full bg-bg-overlay border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-[#5C5C72] focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {cardError && (
            <p className="text-xs text-[#F87171] bg-[#F87171]/10 border border-[#F87171]/20 rounded-xl px-4 py-3">
              {cardError}
            </p>
          )}

          <button
            onClick={saveCard}
            disabled={cardLoading}
            className="w-full bg-gradient-primary text-white font-semibold py-4 rounded-xl shadow-glow-primary transition-all active:scale-95 disabled:opacity-60"
          >
            {cardLoading ? 'Salvando...' : editingCard ? 'Salvar alterações' : 'Adicionar cartão'}
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
