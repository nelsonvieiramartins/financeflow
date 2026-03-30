import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts'
import { useApp } from '../context/AppContext'
import MonthNavigator from '../components/layout/MonthNavigator'
import type { ExpenseCategory } from '../lib/types'
import {
  CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS, MONTHS,
} from '../lib/types'
import { formatCurrency } from '../lib/utils'

export default function CategoriasPage() {
  const { expenses, currentMonth, currentYear, setCurrentMonth, setCurrentYear } = useApp()

  const byCategory: Partial<Record<ExpenseCategory, number>> = {}
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + Number(e.amount)
  }

  const data = (Object.entries(byCategory) as [ExpenseCategory, number][])
    .map(([cat, amount]) => ({
      cat,
      name: CATEGORY_LABELS[cat],
      shortName: CATEGORY_LABELS[cat].split('/')[0].slice(0, 8),
      value: amount,
      color: CATEGORY_COLORS[cat],
      icon: CATEGORY_ICONS[cat],
    }))
    .sort((a, b) => b.value - a.value)

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="pb-navbar">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 safe-top">
          <h1 className="text-xl font-bold text-white">Categorias</h1>
          <p className="text-xs text-[#9090A8] mt-0.5">{MONTHS[currentMonth - 1]} · {currentYear}</p>
        </div>

        <MonthNavigator
          month={currentMonth}
          year={currentYear}
          onChange={(m, y) => { setCurrentMonth(m); setCurrentYear(y) }}
        />

        <div className="mt-4 px-4 space-y-4">
          {data.length === 0 ? (
            <div className="bg-bg-surface rounded-2xl p-10 border border-white/5 text-center">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-sm font-medium text-white mb-1">Nenhum gasto</p>
              <p className="text-xs text-[#9090A8]">Adicione lançamentos para ver análises</p>
            </div>
          ) : (
            <>
              {/* Bar chart */}
              <motion.div
                className="bg-bg-surface rounded-2xl p-4 border border-white/5"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-sm font-semibold text-white mb-3">Distribuição por Categoria</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="shortName" tick={{ fill: '#9090A8', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9090A8', fontSize: 9 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `R$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                    <Tooltip
                      formatter={(v) => [formatCurrency(Number(v)), 'Total']}
                      contentStyle={{ background: '#242434', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }}
                      itemStyle={{ color: '#F0F0F8' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Total */}
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-[#9090A8]">Total de gastos</span>
                <span className="text-sm font-bold text-[#F87171]">{formatCurrency(total)}</span>
              </div>

              {/* Category cards */}
              <div className="space-y-2">
                {data.map((d, i) => {
                  const pct = total > 0 ? (d.value / total) * 100 : 0
                  return (
                    <motion.div
                      key={d.cat}
                      className="bg-bg-surface rounded-xl p-4 border border-white/5"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: `${d.color}20` }}
                        >
                          {d.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-white">{d.name}</span>
                            <span className="text-sm font-bold text-white">{formatCurrency(d.value)}</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-xs text-[#9090A8]">{pct.toFixed(1)}% do total</span>
                            <span className="text-xs text-[#9090A8]">{expenses.filter(e => e.category === d.cat).length} lançamentos</span>
                          </div>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 bg-bg-overlay rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: d.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.1 + i * 0.04, ease: 'easeOut' }}
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
