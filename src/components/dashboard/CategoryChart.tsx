import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { motion } from 'framer-motion'
import type { Expense, ExpenseCategory } from '../../lib/types'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../lib/types'
import { formatCurrency } from '../../lib/utils'

interface Props {
  expenses: Expense[]
}

export default function CategoryChart({ expenses }: Props) {
  // Group by category
  const byCategory: Record<string, number> = {}
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount)
  }

  const data = Object.entries(byCategory)
    .map(([cat, amount]) => ({
      name: CATEGORY_LABELS[cat as ExpenseCategory] ?? cat,
      value: amount,
      color: CATEGORY_COLORS[cat as ExpenseCategory] ?? '#9090A8',
      category: cat as ExpenseCategory,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const total = data.reduce((s, d) => s + d.value, 0)

  if (data.length === 0) {
    return (
      <div className="mx-4 bg-bg-surface rounded-2xl p-5 border border-white/5 flex items-center justify-center h-40">
        <p className="text-sm text-[#5C5C72]">Nenhum gasto registrado</p>
      </div>
    )
  }

  return (
    <motion.div
      className="mx-4 bg-bg-surface rounded-2xl p-5 border border-white/5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <p className="text-sm font-semibold text-white mb-4">Por Categoria</p>

      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="w-28 h-28 flex-shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={52}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v)), '']}
                contentStyle={{
                  background: '#242434',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  fontSize: 12,
                }}
                itemStyle={{ color: '#F0F0F8' }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center total */}
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-[9px] text-[#9090A8]">Total</span>
            <span className="text-[11px] font-bold text-white">
              {new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(total)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {data.map(d => (
            <div key={d.category} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-xs text-[#9090A8] truncate max-w-[90px]">{d.name}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-white">{formatCurrency(d.value)}</span>
                <span className="text-[10px] text-[#5C5C72] ml-1">
                  {total > 0 ? `${Math.round((d.value / total) * 100)}%` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
