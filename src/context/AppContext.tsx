import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type { Expense, Income, Receivable, Investment } from '../lib/types'

interface AppContextType {
  currentMonth: number
  currentYear: number
  setCurrentMonth: (m: number) => void
  setCurrentYear: (y: number) => void
  expenses: Expense[]
  income: Income[]
  receivables: Receivable[]
  investments: Investment[]
  loading: boolean
  refresh: () => void
  addExpense: (data: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  addIncome: (data: Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateIncome: (id: string, data: Partial<Income>) => Promise<void>
  deleteIncome: (id: string) => Promise<void>
  addReceivable: (data: Omit<Receivable, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateReceivable: (id: string, data: Partial<Receivable>) => Promise<void>
  deleteReceivable: (id: string) => Promise<void>
  addInvestment: (data: Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  deleteInvestment: (id: string) => Promise<void>
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
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [expRes, incRes, recRes, invRes] = await Promise.all([
        supabase.from('expenses').select('*')
          .eq('user_id', user.id).eq('month', currentMonth).eq('year', currentYear)
          .order('sort_order').order('created_at'),
        supabase.from('income').select('*')
          .eq('user_id', user.id).eq('month', currentMonth).eq('year', currentYear),
        supabase.from('receivables').select('*')
          .eq('user_id', user.id).eq('month', currentMonth).eq('year', currentYear),
        supabase.from('investments').select('*')
          .eq('user_id', user.id).eq('month', currentMonth).eq('year', currentYear),
      ])
      setExpenses(expRes.data ?? [])
      setIncome(incRes.data ?? [])
      setReceivables(recRes.data ?? [])
      setInvestments(invRes.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [user, currentMonth, currentYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return
    const channel = supabase.channel(`user-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${user.id}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'income', filter: `user_id=eq.${user.id}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'receivables', filter: `user_id=eq.${user.id}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investments', filter: `user_id=eq.${user.id}` }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, fetchData])

  // ---- Expense CRUD ----
  async function addExpense(data: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    if (!user) return
    await supabase.from('expenses').insert({ ...data, user_id: user.id })
    fetchData()
  }

  async function updateExpense(id: string, data: Partial<Expense>) {
    await supabase.from('expenses').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
    fetchData()
  }

  async function deleteExpense(id: string) {
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  // ---- Income CRUD ----
  async function addIncome(data: Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    if (!user) return
    await supabase.from('income').insert({ ...data, user_id: user.id })
    fetchData()
  }

  async function updateIncome(id: string, data: Partial<Income>) {
    await supabase.from('income').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
    fetchData()
  }

  async function deleteIncome(id: string) {
    await supabase.from('income').delete().eq('id', id)
    setIncome(prev => prev.filter(i => i.id !== id))
  }

  // ---- Receivables CRUD ----
  async function addReceivable(data: Omit<Receivable, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    if (!user) return
    await supabase.from('receivables').insert({ ...data, user_id: user.id })
    fetchData()
  }

  async function updateReceivable(id: string, data: Partial<Receivable>) {
    await supabase.from('receivables').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
    fetchData()
  }

  async function deleteReceivable(id: string) {
    await supabase.from('receivables').delete().eq('id', id)
    setReceivables(prev => prev.filter(r => r.id !== id))
  }

  // ---- Investments CRUD ----
  async function addInvestment(data: Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    if (!user) return
    await supabase.from('investments').insert({ ...data, user_id: user.id })
    fetchData()
  }

  async function deleteInvestment(id: string) {
    await supabase.from('investments').delete().eq('id', id)
    setInvestments(prev => prev.filter(i => i.id !== id))
  }

  return (
    <AppContext.Provider value={{
      currentMonth, currentYear, setCurrentMonth, setCurrentYear,
      expenses, income, receivables, investments, loading,
      refresh: fetchData,
      addExpense, updateExpense, deleteExpense,
      addIncome, updateIncome, deleteIncome,
      addReceivable, updateReceivable, deleteReceivable,
      addInvestment, deleteInvestment,
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
