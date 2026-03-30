import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { Expense } from '../lib/types'
import { INCOME_SOURCE_LABELS } from '../lib/types'
import ExpenseItem from '../components/expenses/ExpenseItem'
import MonthNavigator from '../components/layout/MonthNavigator'
import { formatCurrency } from '../lib/utils'

import type { EntryType } from '../components/expenses/AddExpenseModal'

interface Props {
  onAddExpense: (tab?: EntryType) => void
  onEditExpense: (e: Expense) => void
}

type SectionKey = 'pix_fixo' | 'cartao_fixo' | 'pix_var' | 'cartao_var' | 'receitas' | 'receber' | 'invest'

export default function LancamentosPage({ onAddExpense, onEditExpense }: Props) {
  const {
    expenses, income, receivables, investments,
    deleteExpense, deleteIncome, deleteReceivable, deleteInvestment,
    updateExpense, currentMonth, currentYear, setCurrentMonth, setCurrentYear,
  } = useApp()
  const [collapsed, setCollapsed] = useState<Partial<Record<SectionKey, boolean>>>({})
  const [pendingDelete, setPendingDelete] = useState<{ id: string; fn: (id: string) => void } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  function toggle(key: SectionKey) {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function requestDelete(fn: (id: string) => void, id: string) {
    setPendingDelete({ id, fn })
  }

  function confirmPendingDelete() {
    if (pendingDelete) {
      pendingDelete.fn(pendingDelete.id)
      setPendingDelete(null)
    }
  }

  function handleDragEnd(event: DragEndEvent, items: Expense[]) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = items.findIndex(e => e.id === active.id)
    const newIdx = items.findIndex(e => e.id === over.id)
    const reordered = arrayMove(items, oldIdx, newIdx)
    reordered.forEach((e, i) => updateExpense(e.id, { sort_order: i }))
  }

  // Seções de despesas — filtro por payment_type + is_recurring
  const fixosPix     = expenses.filter(e => e.payment_type === 'pix_boleto' && e.is_recurring)
  const fixosCartao  = expenses.filter(e => e.payment_type === 'cartao_fixo' && e.is_recurring)
  const varPix       = expenses.filter(e => e.payment_type === 'pix_boleto' && !e.is_recurring)
  const varCartao    = expenses.filter(e => e.payment_type === 'cartao_fixo' && !e.is_recurring)
  // legado: entradas antigas com payment_type='variavel'
  const legado       = expenses.filter(e => e.payment_type === 'variavel')

  function Section({
    sectionKey, title, color, items, emptyText,
  }: {
    sectionKey: SectionKey
    title: string
    color: string
    items: Expense[]
    emptyText: string
  }) {
    const isCollapsed = collapsed[sectionKey]
    const total = items.reduce((s, e) => s + Number(e.amount), 0)
    return (
      <div className="bg-bg-surface rounded-2xl border border-white/5 overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-2.5"
          onClick={() => toggle(sectionKey)}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full" style={{ background: color }} />
            <span className="text-xs font-semibold text-white">{title}</span>
            <span className="text-xs text-[#9090A8] font-medium">{formatCurrency(total)}</span>
          </div>
          {isCollapsed
            ? <ChevronDown className="w-4 h-4 text-[#5C5C72]" />
            : <ChevronUp className="w-4 h-4 text-[#5C5C72]" />}
        </button>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={e => handleDragEnd(e, items)}
                >
                  <SortableContext items={items.map(e => e.id)} strategy={verticalListSortingStrategy}>
                    {items.map(e => (
                      <ExpenseItem key={e.id} expense={e} onEdit={onEditExpense} onDelete={(id) => requestDelete(deleteExpense, id)} />
                    ))}
                  </SortableContext>
                </DndContext>
                {items.length === 0 && (
                  <p className="text-xs text-[#5C5C72] text-center py-3">{emptyText}</p>
                )}
                <button
                  onClick={() => onAddExpense('expense')}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="pb-navbar">
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

          <Section sectionKey="pix_fixo"    title="Gastos Fixos · Pix/Boleto"    color="#FF6B6B" items={fixosPix}    emptyText="Nenhum gasto fixo · Pix/Boleto" />
          <Section sectionKey="cartao_fixo" title="Gastos Fixos · Cartão"         color="#A78BFA" items={fixosCartao} emptyText="Nenhum gasto fixo · Cartão" />
          <Section sectionKey="pix_var"     title="Gastos Variáveis · Pix/Boleto" color="#FF9A3C" items={varPix}      emptyText="Nenhum gasto variável · Pix/Boleto" />
          <Section sectionKey="cartao_var"  title="Gastos Variáveis · Cartão"     color="#60A5FA" items={varCartao}   emptyText="Nenhum gasto variável · Cartão" />

          {/* Legado: entradas antigas com tipo 'variavel' */}
          {legado.length > 0 && (
            <Section sectionKey="cartao_var" title="Gastos Variáveis (outros)" color="#9090A8" items={legado} emptyText="" />
          )}

          {/* Receitas */}
          <div className="bg-bg-surface rounded-2xl border border-white/5 overflow-hidden">
            <button className="w-full flex items-center justify-between px-4 py-2.5" onClick={() => toggle('receitas')}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-[#34D399]" />
                <span className="text-xs font-semibold text-white">Receitas</span>
                <span className="text-xs text-[#9090A8]">{formatCurrency(income.reduce((s, i) => s + Number(i.amount), 0))}</span>
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
                          <p className="text-xs text-[#34D399]">{INCOME_SOURCE_LABELS[inc.source]}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#34D399]">+{formatCurrency(Number(inc.amount))}</p>
                          <button onClick={() => requestDelete(deleteIncome, inc.id)} className="text-[#F87171] opacity-50 hover:opacity-100">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {income.length === 0 && <p className="text-xs text-[#5C5C72] text-center py-3">Nenhuma receita</p>}
                    <button
                      onClick={() => onAddExpense('income')}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-[#34D399] border border-[#34D399]/30 rounded-xl hover:bg-[#34D399]/5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* A Receber */}
          <div className="bg-bg-surface rounded-2xl border border-white/5 overflow-hidden">
            <button className="w-full flex items-center justify-between px-4 py-2.5" onClick={() => toggle('receber')}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-[#FBBF24]" />
                <span className="text-xs font-semibold text-white">A Receber</span>
                <span className="text-xs text-[#9090A8]">{formatCurrency(receivables.filter(r => !r.received).reduce((s, r) => s + Number(r.amount), 0))}</span>
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
                          <button onClick={() => requestDelete(deleteReceivable, r.id)} className="text-[#F87171] opacity-50 hover:opacity-100">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {receivables.length === 0 && <p className="text-xs text-[#5C5C72] text-center py-3">Nada a receber</p>}
                    <button
                      onClick={() => onAddExpense('receivable')}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-[#FBBF24] border border-[#FBBF24]/30 rounded-xl hover:bg-[#FBBF24]/5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Investimentos */}
          <div className="bg-bg-surface rounded-2xl border border-white/5 overflow-hidden">
            <button className="w-full flex items-center justify-between px-4 py-2.5" onClick={() => toggle('invest')}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-[#10B981]" />
                <span className="text-xs font-semibold text-white">Investimentos</span>
                <span className="text-xs text-[#9090A8]">{formatCurrency(investments.reduce((s, i) => s + Number(i.amount), 0))}</span>
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
                          <button onClick={() => requestDelete(deleteInvestment, inv.id)} className="text-[#F87171] opacity-50 hover:opacity-100">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {investments.length === 0 && <p className="text-xs text-[#5C5C72] text-center py-3">Nenhum investimento</p>}
                    <button
                      onClick={() => onAddExpense('investment')}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-[#10B981] border border-[#10B981]/30 rounded-xl hover:bg-[#10B981]/5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Confirmação de exclusão */}
      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setPendingDelete(null)} />
            <motion.div
              className="relative w-full max-w-lg bg-[#1A1A24] rounded-t-2xl px-4 py-5 border-t border-white/10"
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            >
              <p className="text-sm font-semibold text-white text-center mb-1">Excluir item?</p>
              <p className="text-xs text-[#9090A8] text-center mb-4">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPendingDelete(null)}
                  className="flex-1 py-3 text-sm font-medium text-[#9090A8] bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmPendingDelete}
                  className="flex-1 py-3 text-sm font-medium text-white bg-[#F87171]/20 text-[#F87171] rounded-xl hover:bg-[#F87171]/30 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
