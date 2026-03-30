export type ExpenseCategory =
  | 'alimentacao'
  | 'delivery'
  | 'transporte'
  | 'viagem'
  | 'entretenimento'
  | 'saude'
  | 'beleza'
  | 'casa'
  | 'compras'
  | 'outros'

export type PaymentType = 'pix_boleto' | 'cartao_fixo' | 'variavel'

export type IncomeSource = 'salario' | 'beneficio' | 'freelance' | 'investimento' | 'outros'

export interface Profile {
  id: string
  name: string | null
  avatar_url: string | null
  currency: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  user_id: string
  description: string
  amount: number
  category: ExpenseCategory
  payment_type: PaymentType
  due_date: string | null
  month: number
  year: number
  is_recurring: boolean
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Income {
  id: string
  user_id: string
  description: string
  amount: number
  source: IncomeSource
  month: number
  year: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Receivable {
  id: string
  user_id: string
  from_person: string
  description: string
  amount: number
  received: boolean
  month: number
  year: number
  created_at: string
  updated_at: string
}

export interface Investment {
  id: string
  user_id: string
  description: string
  amount: number
  month: number
  year: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MonthYear {
  month: number
  year: number
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  alimentacao: 'Alimentação',
  delivery: 'Delivery',
  transporte: 'Transporte',
  viagem: 'Viagem',
  entretenimento: 'Entretenimento',
  saude: 'Saúde',
  beleza: 'Beleza',
  casa: 'Casa/Animais',
  compras: 'Compras',
  outros: 'Outros',
}

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  alimentacao: '#FF6B6B',
  delivery: '#FF9A3C',
  transporte: '#4ECDC4',
  viagem: '#45B7D1',
  entretenimento: '#A78BFA',
  saude: '#34D399',
  beleza: '#F472B6',
  casa: '#FBBF24',
  compras: '#60A5FA',
  outros: '#9090A8',
}

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  alimentacao: '🍽️',
  delivery: '🛵',
  transporte: '🚗',
  viagem: '✈️',
  entretenimento: '🎬',
  saude: '💊',
  beleza: '💄',
  casa: '🏠',
  compras: '🛍️',
  outros: '📌',
}

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  pix_boleto: 'Pix / Boleto',
  cartao_fixo: 'Cartão Fixo',
  variavel: 'Variável',
}

export const PAYMENT_TYPE_COLORS: Record<PaymentType, string> = {
  pix_boleto: '#FF6B6B',
  cartao_fixo: '#A78BFA',
  variavel: '#FF9A3C',
}

export const INCOME_SOURCE_LABELS: Record<IncomeSource, string> = {
  salario: 'Salário',
  beneficio: 'Benefício',
  freelance: 'Freelance',
  investimento: 'Investimento',
  outros: 'Outros',
}

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export const MONTHS_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]
