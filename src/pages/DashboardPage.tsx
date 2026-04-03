import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import MonthNavigator from '../components/layout/MonthNavigator'
import BalanceCard from '../components/dashboard/BalanceCard'
import CategoryChart from '../components/dashboard/CategoryChart'
import QuickStats from '../components/dashboard/QuickStats'
import JurosBar from '../components/dashboard/JurosBar'
import { getInitials } from '../lib/utils'
import { MONTHS } from '../lib/types'

export default function DashboardPage() {
  const { profile } = useAuth()
  const { expenses, income, receivables, investments, currentMonth, currentYear, setCurrentMonth, setCurrentYear, loading } = useApp()

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalIncome = income.reduce((s, i) => s + Number(i.amount), 0)
  const totalInvested = investments.reduce((s, i) => s + Number(i.amount), 0)

  const name = profile?.name ?? 'Usuário'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="pb-navbar">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between safe-top">
          <div>
            <p className="text-xs text-[#9090A8]">{greeting},</p>
            <h1 className="text-lg font-bold text-white">{name.split(' ')[0]} 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 bg-bg-surface rounded-xl flex items-center justify-center border border-white/5">
              <Bell className="w-4 h-4 text-[#9090A8]" />
            </button>
            <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center text-xs font-bold text-white">
              {getInitials(name)}
            </div>
          </div>
        </div>

        {/* Month Navigator */}
        <MonthNavigator
          month={currentMonth}
          year={currentYear}
          onChange={(m, y) => { setCurrentMonth(m); setCurrentYear(y) }}
        />

        <div className="mt-3 space-y-3">
          {/* Balance Hero Card */}
          <BalanceCard totalExpenses={totalExpenses} totalIncome={totalIncome} />

          {/* Quick Stats */}
          <QuickStats expenses={expenses} receivables={receivables} />

          {/* Juros Bar — aparece só quando há juros registrados no mês */}
          <JurosBar expenses={expenses} />

          {/* Category Chart */}
          {expenses.length > 0 && <CategoryChart expenses={expenses} />}

          {/* Investments */}
          {totalInvested > 0 && (
            <motion.div
              className="mx-4 bg-bg-surface rounded-2xl p-4 border border-white/5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#9090A8]">Investimentos</p>
                  <p className="text-lg font-bold text-[#10B981]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInvested)}
                  </p>
                </div>
                <div className="text-2xl">💰</div>
              </div>
            </motion.div>
          )}

          {/* Empty state */}
          {!loading && expenses.length === 0 && income.length === 0 && (
            <motion.div
              className="mx-4 bg-bg-surface rounded-2xl p-6 border border-white/5 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-4xl mb-3">📊</p>
              <p className="text-sm font-medium text-white mb-1">Nenhum dado em {MONTHS[currentMonth - 1]}</p>
              <p className="text-xs text-[#9090A8]">Toque no + para adicionar seus gastos e receitas</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
