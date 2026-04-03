import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type { Expense, Income, Receivable, Investment, CreditCard } from '../lib/types'

interface AppContextType {
  currentMonth: number
  currentYear: number
  setCurrentMonth: (m: number) => void
  setCurrentYear: (y: number) => void
  expenses: Expense[]
  income: Income[]
  receivables: Receivable[]
  investments: Investment[]
  creditCards: CreditCard[]
  loading: boolean
  refresh: () => void
  addExpense: (data: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  deleteRecurringGroup: (groupId: string, fromMonth: number, fromYear: number) => Promise<void>
  addIncome: (data: Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateIncome: (id: string, data: Partial<Income>) => Promise<void>
  deleteIncome: (id: string) => Promise<void>
  addReceivable: (data: Omit<Receivable, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateReceivable: (id: string, data: Partial<Receivable>) => Promise<void>
  deleteReceivable: (id: string) => Promise<void>
  addInvestment: (data: Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  deleteInvestment: (id: string) => Promise<void>
  addCreditCard: (data: Omit<CreditCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateCreditCard: (id: string, data: Partial<CreditCard>) => Promise<void>
  deleteCreditCard: (id: string) => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [income, setIncome] = useState<Income[]>([])
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(false)
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [expRes, incRes, recRes, invRes, cardRes] = await Promise.all([
        supabase.from('expenses').select('*')
          .eq('user_id', user.id).eq('month', currentMonth).eq('year', currentYear)
          .order('sort_order').order('created_at'),
        supabase.from('income').select('*')
          .eq('user_id', user.id).eq('month', currentMonth).eq('year', currentYear),
        supabase.from('receivables').select('*')
          .eq('user_id', user.id).eq('month', currentMonth).eq('year', currentYear),
        supabase.from('investments').select('*')
          .eq('user_id', user.id).eq('month', currentMonth).eq('year', currentYear),
        supabase.from('credit_cards').select('*')
          .eq('user_id', user.id).order('created_at'),
      ])
      setExpenses(expRes.data ?? [])
      setIncome(incRes.data ?? [])
      setReceivables(recRes.data ?? [])
      setInvestments(invRes.data ?? [])
      setCreditCards(cardRes.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [user, currentMonth, currentYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Debounced fetch — coalece múltiplos eventos Realtime (ex: bulk insert) em um único fetch
  const debouncedFetch = useCallback(() => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
    fetchTimerRef.current = setTimeout(() => { fetchData() }, 400)
  }, [fetchData])

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return
    const channel = supabase.channel(`user-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${user.id}` }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'income', filter: `user_id=eq.${user.id}` }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'receivables', filter: `user_id=eq.${user.id}` }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investments', filter: `user_id=eq.${user.id}` }, debouncedFetch)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
    }
  }, [user, debouncedFetch])

  // ---- Expense CRUD ----
  async function addExpense(data: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    if (!user) return

    if (data.is_recurring && data.recurring_group_id) {
      const rows = buildRecurringRows(data, user.id)
      const { error } = await supabase.from('expenses').insert(rows)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase.from('expenses').insert({ ...data, user_id: user.id })
      if (error) throw new Error(error.message)
    }
    // Realtime dispara debouncedFetch automaticamente após o insert
  }

  function buildRecurringRows(
    data: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    userId: string,
  ) {
    const rows = []
    let m = data.month
    let y = data.year
    const endDate = data.recurring_end_date ? new Date(data.recurring_end_date + 'T00:00:00') : null
    const limit = endDate ? 120 : 60
    // Extrai o dia de vencimento do due_date base (ex: "2025-04-15" → 15)
    const dueDateDay = data.due_date ? parseInt(data.due_date.split('-')[2]) : null

    for (let i = 0; i < limit; i++) {
      if (endDate && new Date(y, m - 1, 1) > endDate) break
      rows.push({
        user_id: userId,
        description: data.description,
        amount: data.amount,
        category: data.category,
        payment_type: data.payment_type,
        is_recurring: data.is_recurring,
        due_date: dueDateDay
          ? `${y}-${String(m).padStart(2, '0')}-${String(dueDateDay).padStart(2, '0')}`
          : null,
        month: m,
        year: y,
        notes: data.notes,
        sort_order: data.sort_order,
        recurring_group_id: data.recurring_group_id,
        recurring_end_date: data.recurring_end_date,
      })
      m++
      if (m > 12) { m = 1; y++ }
    }
    return rows
  }

  async function updateExpense(id: string, data: Partial<Expense>) {
    const { error } = await supabase.from('expenses').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw new Error(error.message)
  }

  async function deleteExpense(id: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  async function deleteRecurringGroup(groupId: string, fromMonth: number, fromYear: number) {
    const { error } = await supabase.from('expenses')
      .delete()
      .eq('recurring_group_id', groupId)
      .or(`year.gt.${fromYear},and(year.eq.${fromYear},month.gte.${fromMonth})`)
    if (error) throw new Error(error.message)
    setExpenses(prev => prev.filter(e =>
      !(e.recurring_group_id === groupId &&
        (e.year > fromYear || (e.year === fromYear && e.month >= fromMonth)))
    ))
  }

  // ---- Income CRUD ----
  async function addIncome(data: Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    if (!user) return
    const { error } = await supabase.from('income').insert({ ...data, user_id: user.id })
    if (error) throw new Error(error.message)
  }

  async function updateIncome(id: string, data: Partial<Income>) {
    const { error } = await supabase.from('income').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw new Error(error.message)
  }

  async function deleteIncome(id: string) {
    const { error } = await supabase.from('income').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setIncome(prev => prev.filter(i => i.id !== id))
  }

  // ---- Receivables CRUD ----
  async function addReceivable(data: Omit<Receivable, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    if (!user) return
    const { error } = await supabase.from('receivables').insert({ ...data, user_id: user.id })
    if (error) throw new Error(error.message)
  }

  async function updateReceivable(id: string, data: Partial<Receivable>) {
    const { error } = await supabase.from('receivables').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw new Error(error.message)
  }

  async function deleteReceivable(id: string) {
    const { error } = await supabase.from('receivables').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setReceivables(prev => prev.filter(r => r.id !== id))
  }

  // ---- Investments CRUD ----
  async function addInvestment(data: Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    if (!user) return
    const { error } = await supabase.from('investments').insert({ ...data, user_id: user.id })
    if (error) throw new Error(error.message)
  }

  async function deleteInvestment(id: string) {
    const { error } = await supabase.from('investments').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setInvestments(prev => prev.filter(i => i.id !== id))
  }

  // ---- Credit Cards CRUD ----
  async function addCreditCard(data: Omit<CreditCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    if (!user) return
    const { error } = await supabase.from('credit_cards').insert({ ...data, user_id: user.id })
    if (error) throw new Error(error.message)
    await fetchData()
  }

  async function updateCreditCard(id: string, data: Partial<CreditCard>) {
    const { error } = await supabase.from('credit_cards').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw new Error(error.message)
    await fetchData()
  }

  async function deleteCreditCard(id: string) {
    const { error } = await supabase.from('credit_cards').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setCreditCards(prev => prev.filter(c => c.id !== id))
  }

  return (
    <AppContext.Provider value={{
      currentMonth, currentYear, setCurrentMonth, setCurrentYear,
      expenses, income, receivables, investments, creditCards, loading,
      refresh: fetchData,
      addExpense, updateExpense, deleteExpense, deleteRecurringGroup,
      addIncome, updateIncome, deleteIncome,
      addReceivable, updateReceivable, deleteReceivable,
      addInvestment, deleteInvestment,
      addCreditCard, updateCreditCard, deleteCreditCard,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
