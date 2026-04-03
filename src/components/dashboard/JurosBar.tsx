import { motion } from 'framer-motion'
import type { Expense } from '../../lib/types'
import { formatCurrency } from '../../lib/utils'

const MAX_REFERENCE = 200

function resolveBarColor(total: number): string {
  if (total < 50) return '#34D399'
  if (total < 100) return '#FBBF24'
  return '#F87171'
}

interface Props {
  expenses: Expense[]
}

export default function JurosBar({ expenses }: Props) {
  const totalJuros = expenses.reduce((sum, e) => sum + Number(e.valor_juros ?? 0), 0)

  if (totalJuros <= 0) return null

  const fillPercent = Math.min(100, (totalJuros / MAX_REFERENCE) * 100)
  const barColor = resolveBarColor(totalJuros)
  const formatted = formatCurrency(totalJuros)

  return (
    <div className="mx-4 bg-bg-surface rounded-2xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-white">💸 Juros pagos este mês</span>
        <span className="text-xs font-semibold" style={{ color: barColor }}>
          {formatted}
        </span>
      </div>

      <div className="h-2 bg-bg-overlay rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${fillPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      <p className="text-[11px] text-[#9090A8]">
        Você perdeu{' '}
        <strong style={{ color: barColor }}>{formatted}</strong>
        {' '}pagando juros por atraso
      </p>
    </div>
  )
}
