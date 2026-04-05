import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import BottomSheet from '../ui/BottomSheet'
import { useApp } from '../../context/AppContext'
import type { Expense, ExpenseCategory, PaymentType, IncomeSource } from '../../lib/types'
import {
  CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS, INCOME_SOURCE_LABELS, MONTHS,
} from '../../lib/types'
import { getCardClosingDay } from '../../lib/utils'

export type EntryType = 'expense' | 'income' | 'receivable' | 'investment' | 'fatura'

interface Props {
  open: boolean
  onClose: () => void
  editExpense?: Expense | null
  initialTab?: EntryType
  initialCardId?: string | null
}

const ENTRY_TABS: { id: EntryType; label: string; emoji: string }[] = [
  { id: 'expense',    label: 'Gasto',        emoji: '💸' },
  { id: 'fatura',     label: 'Fatura',       emoji: '💳' },
  { id: 'income',     label: 'Receita',       emoji: '💰' },
  { id: 'receivable', label: 'A Receber',     emoji: '🤝' },
  { id: 'investment', label: 'Investimento',  emoji: '📈' },
]

const CATEGORIES: ExpenseCategory[] = [
  'alimentacao', 'delivery', 'transporte', 'viagem',
  'entretenimento', 'saude', 'beleza', 'casa', 'compras', 'outros',
]

const INCOME_SOURCES: IncomeSource[] = ['salario', 'beneficio', 'freelance', 'investimento', 'outros']

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Calcula o mês/ano de vencimento da fatura.
 * Se closingDay > dueDay, o vencimento cai no mês seguinte ao fechamento.
 * Ex: fecha dia 24, vence dia 4 → vencimento é no mês seguinte.
 */
function calcFaturaDueMonth(
  billingMonth: number,
  billingYear: number,
  closingDay: number,
  dueDay: number,
): { dueMonth: number; dueYear: number } {
  if (closingDay > 0 && dueDay > 0 && closingDay > dueDay) {
    const nextM = billingMonth === 12 ? 1 : billingMonth + 1
    const nextY = billingMonth === 12 ? billingYear + 1 : billingYear
    return { dueMonth: nextM, dueYear: nextY }
  }
  return { dueMonth: billingMonth, dueYear: billingYear }
}

/** Dado uma data de compra e o dia de fechamento do cartão,
 *  retorna o mês/ano em que a compra cai na fatura. */
function calcCardBillingMonth(purchaseDateStr: string, closingDay: number): { month: number; year: number } {
  const [y, m, d] = purchaseDateStr.split('-').map(Number)
  if (d > closingDay) {
    // Passou do fechamento → vai para a fatura do próximo mês
    const nextM = m === 12 ? 1 : m + 1
    const nextY = m === 12 ? y + 1 : y
    return { month: nextM, year: nextY }
  }
  return { month: m, year: y }
}

export default function AddExpenseModal({ open, onClose, editExpense, initialTab, initialCardId = null }: Props) {
  const { addExpense, updateExpense, addIncome, addReceivable, addInvestment, currentMonth, currentYear, creditCards, expenses } = useApp()

  const [tab, setTab] = useState<EntryType | null>(null)
  const [amountStr, setAmountStr] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('outros')
  // Separado em método (pix/cartão) + tipo (fixo/variável)
  const [paymentMethod, setPaymentMethod] = useState<'pix_boleto' | 'cartao_fixo'>('pix_boleto')
  const [isFixed, setIsFixed] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [installmentsStr, setInstallmentsStr] = useState('')
  const [isRecurrent, setIsRecurrent] = useState(false)
  const [recurEndMonth, setRecurEndMonth] = useState<number>(0)
  const [recurEndYear, setRecurEndYear] = useState<number>(0)
  const [dueDay, setDueDay] = useState<number>(0)
  const [incomeSource, setIncomeSource] = useState<IncomeSource>('salario')
  const [fromPerson, setFromPerson] = useState('')
  const [notes, setNotes] = useState('')
  const [faturaVencimentoDay, setFaturaVencimentoDay] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auto-preenche dia de vencimento ao selecionar cartão na aba Fatura
  useEffect(() => {
    if (tab === 'fatura' && selectedCardId) {
      const card = creditCards.find(c => c.id === selectedCardId)
      if (card) setFaturaVencimentoDay(card.due_day)
    }
  }, [selectedCardId, tab, creditCards])

  useEffect(() => {
    if (editExpense) {
      setTab('expense')
      setDescription(editExpense.description)
      setAmountStr(String(editExpense.amount).replace('.', ','))
      setCategory(editExpense.category)
      setPaymentMethod(editExpense.payment_type === 'cartao_fixo' ? 'cartao_fixo' : 'pix_boleto')
      setIsFixed(editExpense.is_recurring)
      setDueDate(editExpense.due_date ?? todayStr())
      setNotes(editExpense.notes ?? '')
      setSelectedCardId(editExpense.credit_card_id ?? null)
      if (editExpense.recurring_end_date) {
        setIsRecurrent(true)
        const d = new Date(editExpense.recurring_end_date + 'T00:00:00')
        setRecurEndMonth(d.getMonth() + 1)
        setRecurEndYear(d.getFullYear())
      } else if (editExpense.recurring_group_id) {
        setIsRecurrent(true)
      }
      if (editExpense.due_date && editExpense.is_recurring) {
        setDueDay(parseInt(editExpense.due_date.split('-')[2]))
      }
    } else {
      resetForm()
      setTab(initialTab ?? null)
      if (initialCardId) setSelectedCardId(initialCardId)
    }
  }, [editExpense, open, initialTab, initialCardId])

  function resetForm() {
    setAmountStr('')
    setDescription('')
    setCategory('outros')
    setPaymentMethod('pix_boleto')
    setIsFixed(false)
    setDueDate(todayStr())
    setIsRecurrent(false)
    setRecurEndMonth(0)
    setRecurEndYear(0)
    setDueDay(0)
    setSelectedCardId(null)
    setInstallmentsStr('')
    setFaturaVencimentoDay(0)
    setFromPerson('')
    setNotes('')
    setError('')
  }

  function handleClose() { resetForm(); onClose() }

  function formatAmount(val: string) {
    const digits = val.replace(/\D/g, '')
    const num = parseInt(digits || '0') / 100
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function getAmount() {
    return parseFloat(amountStr.replace(/\./g, '').replace(',', '.')) || 0
  }

  async function handleSubmit() {
    setError('')
    if (!tab) { setError('Selecione o tipo de lançamento.'); return }
    if (tab !== 'fatura' && !description.trim()) { setError('Informe a descrição.'); return }
    const amount = getAmount()
    if (amount <= 0) { setError('Informe um valor válido.'); return }

    setLoading(true)
    try {
      // Calcular data fim: cartão usa parcelas, boleto usa mês/ano
      let recurringEndDate: string | null = null
      if (isFixed && isRecurrent) {
        if (paymentMethod === 'cartao_fixo' && installmentsStr && parseInt(installmentsStr) > 0) {
          const n = parseInt(installmentsStr)
          let endM = currentMonth + n - 1
          let endY = currentYear
          while (endM > 12) { endM -= 12; endY++ }
          recurringEndDate = `${endY}-${String(endM).padStart(2, '0')}-01`
        } else if (paymentMethod !== 'cartao_fixo' && recurEndMonth > 0 && recurEndYear > 0) {
          recurringEndDate = `${recurEndYear}-${String(recurEndMonth).padStart(2, '0')}-01`
        }
        // else: null = permanente
      }

      // due_date: cartão fixo não precisa; boleto usa dueDay; variável usa purchaseDate
      const computedDueDate = isFixed && isRecurrent && paymentMethod !== 'cartao_fixo' && dueDay > 0
        ? `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`
        : (!isFixed ? dueDate || todayStr() : null)

      // Mês/ano de alocação: cartão (fixo não-recorrente ou variável) usa data da compra
      let targetMonth = currentMonth
      let targetYear = currentYear
      const useCardBilling = paymentMethod === 'cartao_fixo' && selectedCardId
      if (useCardBilling) {
        const card = creditCards.find(c => c.id === selectedCardId)
        if (card) {
          const closingDay = getCardClosingDay(card.due_day, card.closing_day)
          const purchaseDate = dueDate || todayStr()
          const billing = calcCardBillingMonth(purchaseDate, closingDay)
          targetMonth = billing.month
          targetYear = billing.year
        }
      }

      if (editExpense) {
        // updateExpense permanece awaited — precisa de confirmação antes de fechar
        await updateExpense(editExpense.id, {
          description: description.trim(),
          amount,
          category,
          payment_type: paymentMethod as PaymentType,
          is_recurring: isFixed,
          due_date: isFixed && paymentMethod !== 'cartao_fixo' && dueDay > 0
            ? `${editExpense.year}-${String(editExpense.month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`
            : (!isFixed ? dueDate || null : null),
          notes: notes || null,
          credit_card_id: paymentMethod === 'cartao_fixo' ? selectedCardId : null,
        })
      } else if (tab === 'expense') {
        await addExpense({
          description: description.trim(),
          amount,
          category,
          payment_type: paymentMethod as PaymentType,
          is_recurring: isFixed,
          due_date: computedDueDate,
          month: targetMonth,
          year: targetYear,
          notes: notes || null,
          sort_order: 0,
          recurring_group_id: (isFixed && isRecurrent) ? crypto.randomUUID() : null,
          recurring_end_date: recurringEndDate,
          data_pagamento_real: null,
          valor_pago: null,
          valor_juros: null,
          credit_card_id: paymentMethod === 'cartao_fixo' ? selectedCardId : null,
        })
      } else if (tab === 'income') {
        await addIncome({
          description: description.trim(),
          amount,
          source: incomeSource,
          month: currentMonth,
          year: currentYear,
          notes: notes || null,
        })
      } else if (tab === 'receivable') {
        if (!fromPerson.trim()) { setError('Informe quem irá pagar.'); setLoading(false); return }
        await addReceivable({
          description: description.trim(),
          amount,
          from_person: fromPerson.trim(),
          received: false,
          month: currentMonth,
          year: currentYear,
        })
      } else if (tab === 'investment') {
        await addInvestment({
          description: description.trim(),
          amount,
          month: currentMonth,
          year: currentYear,
          notes: notes || null,
        })
      } else if (tab === 'fatura') {
        if (!selectedCardId) { setError('Selecione um cartão.'); setLoading(false); return }
        const card = creditCards.find(c => c.id === selectedCardId)
        const { dueMonth, dueYear } = calcFaturaDueMonth(
          currentMonth, currentYear,
          card ? getCardClosingDay(card.due_day, card.closing_day) : 0,
          faturaVencimentoDay,
        )
        const faturaDate = faturaVencimentoDay > 0
          ? `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(faturaVencimentoDay).padStart(2, '0')}`
          : null
        await addExpense({
          description: `Fatura ${card?.name ?? 'Cartão'}`,
          amount,
          category: 'outros',
          payment_type: paymentMethod as PaymentType,
          is_recurring: false,
          due_date: faturaDate,
          month: dueMonth,
          year: dueYear,
          notes: notes || null,
          sort_order: 0,
          recurring_group_id: null,
          recurring_end_date: null,
          data_pagamento_real: null,
          valor_pago: null,
          valor_juros: null,
          credit_card_id: null,
        })
      }
      handleClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const cardExpenses = tab === 'fatura' && selectedCardId
    ? expenses.filter(e => e.credit_card_id === selectedCardId)
    : []

  const cardExpensesTotal = cardExpenses.reduce((s, e) => s + e.amount, 0)

  const sectionLabel = (() => {
    if (!tab) return null
    if (tab === 'fatura') {
      const card = selectedCardId ? creditCards.find(c => c.id === selectedCardId) : null
      return card ? `Fatura · ${card.name}` : 'Fatura'
    }
    if (tab !== 'expense') return null
    const tipo = isFixed ? 'Fixo' : 'Variável'
    const metodo = paymentMethod === 'pix_boleto' ? 'Pix/Boleto' : 'Cartão'
    return `${tipo} · ${metodo}`
  })()

  return (
    <BottomSheet open={open} onClose={handleClose} title={editExpense ? 'Editar Lançamento' : 'Novo Lançamento'}>
      <div className="space-y-4">

        {/* Tabs de tipo — sempre visíveis, nenhum selecionado por padrão */}
        {!editExpense && (
          <div>
            {!tab && (
              <p className="text-xs text-[#FF9A3C] font-medium mb-2 text-center">
                Selecione o tipo de lançamento para continuar
              </p>
            )}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {ENTRY_TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setError('') }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all border ${
                    tab === t.id
                      ? 'bg-gradient-primary text-white shadow-glow-sm border-transparent'
                      : 'bg-bg-overlay text-[#9090A8] border-white/10'
                  }`}
                >
                  <span>{t.emoji}</span> {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Valor — só aparece após selecionar tipo */}
        {(tab || editExpense) && (
          <div className="bg-bg-overlay rounded-2xl p-4 text-center">
            {sectionLabel && (
              <p className="text-[10px] text-primary font-medium uppercase tracking-wider mb-1">{sectionLabel}</p>
            )}
            <p className="text-xs text-[#9090A8] mb-1">Valor</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl text-[#9090A8] font-light">R$</span>
              <input
                type="text"
                inputMode="numeric"
                value={amountStr}
                onChange={e => setAmountStr(formatAmount(e.target.value))}
                placeholder="0,00"
                className="text-4xl font-bold text-white bg-transparent border-none outline-none text-center w-48 placeholder-[#5C5C72]"
              />
            </div>
          </div>
        )}

        {/* Campos + botão — só visíveis após escolher o tipo */}
        {/* Descrição — oculta na aba Fatura */}
        {(tab && tab !== 'fatura') && (
          <div>
            <label className="text-xs text-[#9090A8] font-medium mb-1.5 block">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={
                tab === 'income' ? 'Ex: Salário março' :
                tab === 'receivable' ? 'Ex: Aluguel do carro' :
                'Ex: Supermercado'
              }
              className="w-full bg-bg-overlay border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-[#5C5C72] focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        )}

        {/* ── FATURA ───────────────────────────────────────────── */}
        {tab === 'fatura' && !editExpense && (
          <>
            {/* Seletor de cartão (obrigatório) */}
            <div>
              <label className="text-xs text-[#9090A8] font-medium mb-2 block">Cartão</label>
              {creditCards.length === 0 ? (
                <p className="text-xs text-[#5C5C72] bg-bg-overlay rounded-xl px-4 py-3">
                  Nenhum cartão cadastrado. Adicione em Perfil.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {creditCards.map(card => (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCardId(card.id)}
                      className={`px-3 py-2 text-xs rounded-xl transition-all border ${
                        selectedCardId === card.id
                          ? 'bg-[#6C63FF]/20 text-[#6C63FF] border-[#6C63FF]/40'
                          : 'bg-bg-overlay text-[#9090A8] border-transparent'
                      }`}
                    >
                      {card.name}{card.last_four ? ` ••${card.last_four}` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lançamentos vinculados ao cartão no mês atual */}
            {selectedCardId && (
              <div>
                <label className="text-xs text-[#9090A8] font-medium mb-2 block">
                  Lançamentos — {MONTHS[currentMonth - 1]} {currentYear}
                </label>
                {cardExpenses.length === 0 ? (
                  <p className="text-xs text-[#5C5C72] text-center py-4 bg-bg-overlay rounded-xl">
                    Nenhum lançamento encontrado para este cartão
                  </p>
                ) : (
                  <div className="bg-bg-overlay rounded-2xl overflow-hidden">
                    <div className="max-h-44 overflow-y-auto divide-y divide-white/5">
                      {cardExpenses.map(exp => (
                        <div key={exp.id} className="flex items-center justify-between px-3 py-2.5">
                          <span className="text-xs text-white truncate flex-1 mr-2">{exp.description}</span>
                          <span className="text-xs text-[#FF6B6B] font-medium whitespace-nowrap">
                            R$ {exp.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between px-3 py-2.5 border-t border-white/10 bg-white/3">
                      <span className="text-xs font-semibold text-[#9090A8]">Total</span>
                      <span className="text-xs font-bold text-white">
                        R$ {cardExpensesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Método de pagamento */}
            <div>
              <label className="text-xs text-[#9090A8] font-medium mb-2 block">Método de pagamento</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'pix_boleto' as const, label: 'Pix / Boleto', emoji: '📲', color: '#FF6B6B' },
                  { value: 'cartao_fixo' as const, label: 'Outro cartão', emoji: '💳', color: '#6C63FF' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPaymentMethod(opt.value)}
                    className="flex flex-col items-center py-3 rounded-xl border transition-all"
                    style={{
                      background: paymentMethod === opt.value ? `${opt.color}15` : 'rgba(46,46,66,0.5)',
                      borderColor: paymentMethod === opt.value ? opt.color : 'transparent',
                    }}
                  >
                    <span className="text-xl mb-0.5">{opt.emoji}</span>
                    <span className="text-xs font-medium" style={{ color: paymentMethod === opt.value ? opt.color : '#9090A8' }}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Data de vencimento (apenas dia) */}
            <div>
              <label className="text-xs text-[#9090A8] font-medium mb-1.5 block">
                Dia do vencimento
              </label>
              <input
                type="number"
                value={faturaVencimentoDay || ''}
                onChange={e => {
                  const v = Math.min(31, Math.max(1, Number(e.target.value)))
                  setFaturaVencimentoDay(v)
                }}
                placeholder="Ex: 10"
                min={1}
                max={31}
                className="w-full bg-bg-overlay border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-[#5C5C72] focus:outline-none focus:border-primary transition-colors"
              />
              {faturaVencimentoDay > 0 && (() => {
                const card = selectedCardId ? creditCards.find(c => c.id === selectedCardId) : null
                const closingDay = card ? getCardClosingDay(card.due_day, card.closing_day) : 0
                const { dueMonth, dueYear } = calcFaturaDueMonth(currentMonth, currentYear, closingDay, faturaVencimentoDay)
                const shifted = dueMonth !== currentMonth || dueYear !== currentYear
                return (
                  <p className={`text-[10px] mt-1.5 ${shifted ? 'text-[#FF9A3C]' : 'text-[#5C5C72]'}`}>
                    {shifted && '⚠ Virada de mês → '}
                    Vence dia {faturaVencimentoDay} de {MONTHS[dueMonth - 1]} {dueYear}
                  </p>
                )
              })()}
            </div>
          </>
        )}

        {/* Campos de despesa */}
        {(tab === 'expense' || editExpense) && (
          <>
            {/* Categoria */}
            <div>
              <label className="text-xs text-[#9090A8] font-medium mb-2 block">Categoria</label>
              <div className="grid grid-cols-5 gap-2">
                {CATEGORIES.map(cat => {
                  const color = CATEGORY_COLORS[cat]
                  const isActive = category === cat
                  return (
                    <motion.button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      whileTap={{ scale: 0.92 }}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all border"
                      style={{
                        background: isActive ? `${color}20` : 'rgba(46,46,66,0.5)',
                        borderColor: isActive ? color : 'transparent',
                      }}
                    >
                      <span className="text-lg leading-none">{CATEGORY_ICONS[cat]}</span>
                      <span className="text-[9px] text-[#9090A8] leading-tight text-center">
                        {CATEGORY_LABELS[cat].split('/')[0].slice(0, 8)}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Fixo ou Variável */}
            <div>
              <label className="text-xs text-[#9090A8] font-medium mb-2 block">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: true,  label: 'Fixo',     desc: 'Todo mês',    color: '#A78BFA' },
                  { value: false, label: 'Variável',  desc: 'Eventual',    color: '#FF9A3C' },
                ].map(opt => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setIsFixed(opt.value)}
                    className="flex flex-col items-center py-3 rounded-xl border transition-all"
                    style={{
                      background: isFixed === opt.value ? `${opt.color}15` : 'rgba(46,46,66,0.5)',
                      borderColor: isFixed === opt.value ? opt.color : 'transparent',
                    }}
                  >
                    <span className="text-sm font-semibold" style={{ color: isFixed === opt.value ? opt.color : '#9090A8' }}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-[#5C5C72]">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pix/Boleto ou Cartão */}
            <div>
              <label className="text-xs text-[#9090A8] font-medium mb-2 block">Método de pagamento</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'pix_boleto' as const, label: 'Pix / Boleto', emoji: '📲', color: '#FF6B6B' },
                  { value: 'cartao_fixo' as const, label: 'Cartão',       emoji: '💳', color: '#6C63FF' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPaymentMethod(opt.value)}
                    className="flex flex-col items-center py-3 rounded-xl border transition-all"
                    style={{
                      background: paymentMethod === opt.value ? `${opt.color}15` : 'rgba(46,46,66,0.5)',
                      borderColor: paymentMethod === opt.value ? opt.color : 'transparent',
                    }}
                  >
                    <span className="text-xl mb-0.5">{opt.emoji}</span>
                    <span className="text-xs font-medium" style={{ color: paymentMethod === opt.value ? opt.color : '#9090A8' }}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Seletor de cartão — único, aparece só quando método = Cartão */}
            {paymentMethod === 'cartao_fixo' && creditCards.length > 0 && (
              <div>
                <label className="text-xs text-[#9090A8] font-medium mb-2 block">
                  Qual cartão? <span className="text-[#5C5C72]">(opcional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCardId(null)}
                    className={`px-3 py-2 text-xs rounded-xl transition-all border ${
                      selectedCardId === null
                        ? 'bg-[#6C63FF]/20 text-[#6C63FF] border-[#6C63FF]/40'
                        : 'bg-bg-overlay text-[#9090A8] border-transparent'
                    }`}
                  >
                    Não especificado
                  </button>
                  {creditCards.map(card => (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCardId(card.id)}
                      className={`px-3 py-2 text-xs rounded-xl transition-all border ${
                        selectedCardId === card.id
                          ? 'bg-[#6C63FF]/20 text-[#6C63FF] border-[#6C63FF]/40'
                          : 'bg-bg-overlay text-[#9090A8] border-transparent'
                      }`}
                    >
                      {card.name}{card.last_four ? ` ••${card.last_four}` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Data da compra — sempre que método = Cartão */}
            {paymentMethod === 'cartao_fixo' && (() => {
              const card = selectedCardId ? creditCards.find(c => c.id === selectedCardId) : null
              const purchaseDate = dueDate || todayStr()
              const billing = card
                ? calcCardBillingMonth(purchaseDate, getCardClosingDay(card.due_day, card.closing_day))
                : null
              const shifted = billing && (billing.month !== new Date(purchaseDate + 'T00:00:00').getMonth() + 1)
              return (
                <div>
                  <label className="text-xs text-[#9090A8] font-medium mb-1.5 block">
                    Data da compra <span className="text-[#5C5C72]">(padrão: hoje)</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-bg-overlay border border-white/8 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  />
                  {billing && (
                    <p className={`text-[10px] mt-1.5 ${shifted ? 'text-[#FF9A3C]' : 'text-[#5C5C72]'}`}>
                      {shifted
                        ? `⚠ Após fechamento → lançado em ${MONTHS[billing.month - 1]} ${billing.year}`
                        : `✓ Lançado em ${MONTHS[billing.month - 1]} ${billing.year}`}
                    </p>
                  )}
                </div>
              )
            })()}

            {/* Recorrente (apenas para fixos) */}
            {isFixed && (
              <div className="bg-bg-overlay rounded-2xl p-4 space-y-3">
                <button
                  type="button"
                  onClick={() => { setIsRecurrent(v => !v); setRecurEndMonth(0); setRecurEndYear(0); setInstallmentsStr('') }}
                  className="w-full flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-white text-left">Recorrente</p>
                    <p className="text-[10px] text-[#5C5C72] text-left mt-0.5">
                      {isRecurrent ? 'Lança automaticamente nos próximos meses' : 'Apenas este mês'}
                    </p>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${isRecurrent ? 'bg-primary' : 'bg-bg-elevated'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${isRecurrent ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </button>

                {isRecurrent && (
                  <div className="space-y-3">
                    {/* Cartão: apenas parcelas. Pix/Boleto: dia de vencimento + até quando */}
                    {paymentMethod === 'cartao_fixo' ? (
                      <div>
                        <p className="text-xs text-[#9090A8] font-medium mb-2">
                          Parcelas <span className="text-[#5C5C72]">(vazio = permanente)</span>
                        </p>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={installmentsStr}
                          onChange={e => setInstallmentsStr(e.target.value.replace(/\D/g, ''))}
                          placeholder="Ex: 12"
                          min={1}
                          className="w-full bg-bg-elevated border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#5C5C72] focus:outline-none focus:border-primary"
                        />
                        {installmentsStr && parseInt(installmentsStr) > 0 && (
                          <p className="text-[10px] text-[#5C5C72] mt-1">
                            Até {(() => {
                              let m = currentMonth + parseInt(installmentsStr) - 1
                              let y = currentYear
                              while (m > 12) { m -= 12; y++ }
                              return `${String(m).padStart(2,'0')}/${y}`
                            })()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs text-[#9090A8] font-medium mb-2">Dia do vencimento <span className="text-[#5C5C72]">(opcional)</span></p>
                          <input
                            type="number"
                            value={dueDay || ''}
                            onChange={e => {
                              const v = Math.min(31, Math.max(0, Number(e.target.value)))
                              setDueDay(v)
                            }}
                            placeholder="Ex: 15"
                            min={1}
                            max={31}
                            className="w-full bg-bg-elevated border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#5C5C72] focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-[#9090A8] font-medium mb-2">Até quando? <span className="text-[#5C5C72]">(opcional — sem data = permanente)</span></p>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={recurEndMonth}
                              onChange={e => setRecurEndMonth(Number(e.target.value))}
                              className="bg-bg-elevated border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                            >
                              <option value={0}>Mês</option>
                              {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={recurEndYear || ''}
                              onChange={e => setRecurEndYear(Number(e.target.value))}
                              placeholder="Ano"
                              min={currentYear}
                              max={currentYear + 10}
                              className="bg-bg-elevated border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#5C5C72] focus:outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Data do gasto — apenas para variável + pix/boleto */}
            {!isFixed && paymentMethod !== 'cartao_fixo' && (
              <div>
                <label className="text-xs text-[#9090A8] font-medium mb-1.5 block">
                  Data do gasto <span className="text-[#5C5C72]">(padrão: hoje)</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-bg-overlay border border-white/8 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            )}
          </>
        )}

        {/* Fonte da receita */}
        {tab === 'income' && !editExpense && (
          <div>
            <label className="text-xs text-[#9090A8] font-medium mb-2 block">Fonte</label>
            <div className="flex flex-wrap gap-2">
              {INCOME_SOURCES.map(s => (
                <button
                  key={s}
                  onClick={() => setIncomeSource(s)}
                  className={`px-3 py-2 text-xs rounded-xl transition-all ${
                    incomeSource === s
                      ? 'bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/40'
                      : 'bg-bg-overlay text-[#9090A8] border border-transparent'
                  }`}
                >
                  {INCOME_SOURCE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* De quem (A Receber) */}
        {tab === 'receivable' && !editExpense && (
          <div>
            <label className="text-xs text-[#9090A8] font-medium mb-1.5 block">De quem</label>
            <input
              type="text"
              value={fromPerson}
              onChange={e => setFromPerson(e.target.value)}
              placeholder="Nome da pessoa"
              className="w-full bg-bg-overlay border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-[#5C5C72] focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        )}

        {(tab || editExpense) && (
          <>
            {/* Observações */}
            <div>
              <label className="text-xs text-[#9090A8] font-medium mb-1.5 block">Observações (opcional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Detalhes adicionais..."
                rows={2}
                className="w-full bg-bg-overlay border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-[#5C5C72] focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            {error && (
              <p className="text-xs text-[#F87171] bg-[#F87171]/10 border border-[#F87171]/20 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || (!tab && !editExpense)}
              className="w-full bg-gradient-primary text-white font-semibold py-4 rounded-xl shadow-glow-primary transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : editExpense ? 'Salvar alterações' : 'Adicionar lançamento'}
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
