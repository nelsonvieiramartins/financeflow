import { motion } from 'framer-motion'
import { CreditCard, Zap, HandCoins } from 'lucide-react'
import type { Expense, Receivable } from '../../lib/types'
import { formatCurrency } from '../../lib/utils'

interface Props {
  expenses: Expense[]
  receivables: Receivable[]
}

export default function QuickStats({ expenses, receivables }: Props) {
  const fixedPix = expenses.filter(e => e.payment_type === 'pix_boleto').reduce((s, e) => s + Number(e.amount), 0)
  const fixedCard = expenses.filter(e => e.payment_type === 'cartao_fixo').reduce((s, e) => s + Number(e.amount), 0)
  const variable = expenses.filter(e => e.payment_type === 'variavel').reduce((s, e) => s + Number(e.amount), 0)
  const toReceive = receivables.filter(r => !r.received).reduce((s, r) => s + Number(r.amount), 0)

  const stats = [
    { label: 'Fixos Pix', value: fixedPix, color: '#FF6B6B', Icon: Zap, bg: 'rgba(255,107,107,0.12)' },
    { label: 'Fixos Cartão', value: fixedCard, color: '#A78BFA', Icon: CreditCard, bg: 'rgba(167,139,250,0.12)' },
    { label: 'Variáveis', value: variable, color: '#FF9A3C', Icon: Zap, bg: 'rgba(255,154,60,0.12)' },
    { label: 'A Receber', value: toReceive, color: '#34D399', Icon: HandCoins, bg: 'rgba(52,211,153,0.12)' },
  ]

  return (
    <div className="px-4 grid grid-cols-2 gap-3">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          className="bg-bg-surface rounded-xl p-3.5 border border-white/5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.05 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
              <s.Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
            </div>
            <span className="text-[11px] text-[#9090A8]">{s.label}</span>
          </div>
          <p className="text-base font-bold text-white">{formatCurrency(s.value)}</p>
        </motion.div>
      ))}
    </div>
  )
}
