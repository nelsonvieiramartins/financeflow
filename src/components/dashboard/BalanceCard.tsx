import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'

interface Props {
  totalExpenses: number
  totalIncome: number
}

export default function BalanceCard({ totalExpenses, totalIncome }: Props) {
  const balance = totalIncome - totalExpenses
  const isPositive = balance >= 0

  return (
    <motion.div
      className="mx-4 rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(108,99,255,0.25) 0%, rgba(167,139,250,0.15) 50%, rgba(36,36,52,0.9) 100%)',
        border: '1px solid rgba(108,99,255,0.3)',
        boxShadow: '0 0 40px rgba(108,99,255,0.2), 0 8px 32px rgba(0,0,0,0.4)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Glow orb */}
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

      <p className="text-xs font-medium text-[#9090A8] uppercase tracking-wider mb-1">Saldo do mês</p>

      <motion.p
        className="text-4xl font-bold mb-4"
        style={{ color: isPositive ? '#34D399' : '#F87171' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {formatCurrency(balance)}
      </motion.p>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#34D399]/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-[#34D399]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-[#9090A8]">Receitas</p>
            <p className="text-sm font-semibold text-[#34D399] truncate">{formatCurrency(totalIncome)}</p>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#F87171]/20 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-3.5 h-3.5 text-[#F87171]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-[#9090A8]">Gastos</p>
            <p className="text-sm font-semibold text-[#F87171] truncate">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>
      </div>

      {totalIncome > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-[#9090A8] mb-1">
            <span>Comprometido</span>
            <span>{Math.min(100, Math.round((totalExpenses / totalIncome) * 100))}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: totalExpenses / totalIncome > 0.8
                  ? 'linear-gradient(90deg, #F87171, #EF4444)'
                  : 'linear-gradient(90deg, #6C63FF, #34D399)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (totalExpenses / totalIncome) * 100)}%` }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}
