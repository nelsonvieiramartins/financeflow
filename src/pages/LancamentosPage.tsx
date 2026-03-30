import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, arrayMove
} from '@dnd-kit/sortable'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { Expense } from '../lib/types'
import ExpenseItem from '../components/expenses/ExpenseItem'
import MonthNavigator from '../components/layout/MonthNavigator'
import { formatCurrency } from '../lib/utils'

interface Props {
  onAddExpense: () => void
  onEditExpense: (e: Expense) => void
}

export default function LancamentosPage({ onAddExpense, onEditExpense }: Props) {
  const { expenses, income, receivables, investments, deleteExpense, deleteIncome, deleteReceivable, deleteInvestment, updateExpense, currentMonth, currentYear, setCurrentMonth, setCurrentYear } = useApp()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  function toggleSection(key: string) {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function handleDragEnd(event: DragEndEvent, items: Expense[], paymentType: string) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const filtered = items.filter(e => e.payment_type === paymentType)
    const oldIdx = filtered.findIndex(e => e.id === active.id)
    const newIdx = filtered.findIndex(e => e.id === over.id)
    const reordered = arrayMove(filtered, oldIdx, newIdx)
    reordered.forEach((e, i) => updateExpense(e.id, { sort_order: i }))
  }

  const pixBoleto = expenses.filter(e => e.payment_type === 'pix_boleto')
  const cartaoFixo = expenses.filter(e => e.payment_type === 'cartao_fixo')
  const variavel = expenses.filter(e => e.payment_type === 'variavel')

  function SectionHeader({ title, total, sectionKey, color }: { title: string; total: number; sectionKey: string; color: string }) {
    const isCollapsed = collapsed[sectionKey]
    return (
      <button
        className="w-full flex items-center justify-between px-4 py-2.5"
        onClick={() => toggleSection(sectionKey)}
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 rounded-full" style={{ background: color }} />
          <span className="text-xs font-semibold text-white">{title}</span>
          <span className="text-xs text-[#9090A8] font-medium">{formatCurrency(total)}</span>
        </div>
        {isCollapsed ? <ChevronDown className="w-4 h-4 text-[#5C5C72]" /> : <ChevronUp className="w-4 h-4 text-[#5C5C72]" />}
      </button>
    )
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="pb-navbar">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 safe-top">
          <h1 className="text-xl font-bold text-white">Lançamentos</h1>
          <p className="text-xs text-[#9090A8] mt-0.5">Gerencie seus gastos e receitas</p>
        </div>

        <MonthNavigator
          month={currentMonth}
          year={currentYear}
          onChange={(m, y) => { setCurrentMonth(m); setCurrentYear(y) }}
        />

        <div className="mt-4 space-y-2 px-4">

          {/* Gastos Fixos — Pix/Boleto */}
          <div className="bg-bg-surface rounded-2xl border border-white/5 overflow-hidden">
            <SectionHeader title="Gastos Fixos · Pix/Boleto" total={pixBoleto.reduce((s,e)=>s+Number(e.amount),0)} sectionKey="pix" color="#FF6B6B" />
            <AnimatePresence>
              {!collapsed['pix'] && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-2">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, expenses, 'pix_boleto')}>
                      <SortableContext items={pixBoleto.map(e => e.id)} strategy={verticalListSortingStrategy}>
                        {pixBoleto.map(e => (
                          <ExpenseItem key={e.id} expense={e} onEdit={onEditExpense} onDelete={deleteExpense} />
                        ))}
                      </SortableContext>
                    </DndContext>
                    {pixBoleto.length === 0 && (
                      <p className="text-xs text-[#5C5C72] text-center py-3">Nenhum gasto fixo · Pix/Boleto</p>
                    )}
                    <button onClick={onAddExpense} className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Gastos Fixos — Cartão */}
          <div className="bg-bg-surface rounded-2xl border border-white/5 overflow-hidden">
            <SectionHeader title="Gastos Fixos · Cartão" total={cartaoFixo.reduce((s,e)=>s+Number(e.amount),0)} sectionKey="cartao" color="#A78BFA" />
            <AnimatePresence>
              {!collapsed['cartao'] && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-2">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, expenses, 'cartao_fixo')}>
                      <SortableContext items={cartaoFixo.map(e => e.id)} strategy={verticalListSortingStrategy}>
                        {cartaoFixo.map(e => (
                          <ExpenseItem key={e.id} expense={e} onEdit={onEditExpense} onDelete={deleteExpense} />
                        ))}
                      </SortableContext>
                    </DndContext>
                    {cartaoFixo.length === 0 && (
                      <p className="text-xs text-[#5C5C72] text-center py-3">Nenhum gasto fixo · Cartão</p>
                    )}
                    <button onClick={onAddExpense} className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Gastos Variáveis */}
          <div className="bg-bg-surface rounded-2xl border border-white/5 overflow-hidden">
            <SectionHeader title="Gastos Variáveis" total={variavel.reduce((s,e)=>s+Number(e.amount),0)} sectionKey="variavel" color="#FF9A3C" />
            <AnimatePresence>
              {!collapsed['variavel'] && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-2">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, expenses, 'variavel')}>
                      <SortableContext items={variavel.map(e => e.id)} strategy={verticalListSortingStrategy}>
                        {variavel.map(e => (
                          <ExpenseItem key={e.id} expense={e} onEdit={onEditExpense} onDelete={deleteExpense} />
                        ))}
                      </SortableContext>
                    </DndContext>
                    {variavel.length === 0 && (
                      <p className="text-xs text-[#5C5C72] text-center py-3">Nenhum gasto variável</p>
                    )}
                    <button onClick={onAddExpense} className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Receitas */}
          <div className="bg-bg-surface rounded-2xl border border-white/5 overflow-hidden">
            <button className="w-full flex items-center justify-between px-4 py-2.5" onClick={() => toggleSection('receitas')}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-[#34D399]" />
                <span className="text-xs font-semibold text-white">Receitas</span>
                <span className="text-xs text-[#9090A8]">{formatCurrency(income.reduce((s,i)=>s+Number(i.amount),0))}</span>
              </div>
              {collapsed['receitas'] ? <ChevronDown className="w-4 h-4 text-[#5C5C72]" /> : <ChevronUp className="w-4 h-4 text-[#5C5C72]" />}
            </button>
            <AnimatePresence>
              {!collapsed['receitas'] && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-2">
                    {income.map(inc => (
                      <div key={inc.id} className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-white">{inc.description}</p>
                          <p className="text-xs text-[#34D399] capitalize">{inc.source}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#34D399]">+{formatCurrency(Number(inc.amount))}</p>
                          <button onClick={() => deleteIncome(inc.id)} className="text-[#F87171] opacity-50 hover:opacity-100">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {income.length === 0 && <p className="text-xs text-[#5C5C72] text-center py-3">Nenhuma receita</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* A Receber */}
          <div className="bg-bg-surface rounded-2xl border border-white/5 overflow-hidden">
            <button className="w-full flex items-center justify-between px-4 py-2.5" onClick={() => toggleSection('receber')}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-[#FBBF24]" />
                <span className="text-xs font-semibold text-white">A Receber</span>
                <span className="text-xs text-[#9090A8]">{formatCurrency(receivables.filter(r=>!r.received).reduce((s,r)=>s+Number(r.amount),0))}</span>
              </div>
              {collapsed['receber'] ? <ChevronDown className="w-4 h-4 text-[#5C5C72]" /> : <ChevronUp className="w-4 h-4 text-[#5C5C72]" />}
            </button>
            <AnimatePresence>
              {!collapsed['receber'] && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-2">
                    {receivables.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-white">{r.description}</p>
                          <p className="text-xs text-[#9090A8]">De: {r.from_person}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold ${r.received ? 'text-[#5C5C72] line-through' : 'text-[#FBBF24]'}`}>
                            {formatCurrency(Number(r.amount))}
                          </p>
                          <button onClick={() => deleteReceivable(r.id)} className="text-[#F87171] opacity-50 hover:opacity-100">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {receivables.length === 0 && <p className="text-xs text-[#5C5C72] text-center py-3">Nada a receber</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Investimentos */}
          <div className="bg-bg-surface rounded-2xl border border-white/5 overflow-hidden">
            <button className="w-full flex items-center justify-between px-4 py-2.5" onClick={() => toggleSection('invest')}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-[#10B981]" />
                <span className="text-xs font-semibold text-white">Investimentos</span>
                <span className="text-xs text-[#9090A8]">{formatCurrency(investments.reduce((s,i)=>s+Number(i.amount),0))}</span>
              </div>
              {collapsed['invest'] ? <ChevronDown className="w-4 h-4 text-[#5C5C72]" /> : <ChevronUp className="w-4 h-4 text-[#5C5C72]" />}
            </button>
            <AnimatePresence>
              {!collapsed['invest'] && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-2">
                    {investments.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl">
                        <p className="text-sm font-medium text-white">{inv.description}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#10B981]">{formatCurrency(Number(inv.amount))}</p>
                          <button onClick={() => deleteInvestment(inv.id)} className="text-[#F87171] opacity-50 hover:opacity-100">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {investments.length === 0 && <p className="text-xs text-[#5C5C72] text-center py-3">Nenhum investimento</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
