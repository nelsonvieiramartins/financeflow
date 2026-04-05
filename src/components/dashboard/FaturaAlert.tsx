import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, AlertCircle } from 'lucide-react'
import type { CreditCard as CreditCardType, Expense } from '../../lib/types'
import { getCardClosingDay } from '../../lib/utils'

interface Props {
  creditCards: CreditCardType[]
  expenses: Expense[]
  currentMonth: number
  currentYear: number
  onLancarFatura: (cardId: string) => void
}

function dismissKey(cardId: string, month: number, year: number) {
  return `fatura-dismissed-${cardId}-${year}-${month}`
}

export default function FaturaAlert({ creditCards, expenses, currentMonth, currentYear, onLancarFatura }: Props) {
  const today = new Date()
  const isCurrentMonth = today.getMonth() + 1 === currentMonth && today.getFullYear() === currentYear
  const todayDay = today.getDate()

  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    const set = new Set<string>()
    creditCards.forEach(c => {
      if (localStorage.getItem(dismissKey(c.id, currentMonth, currentYear))) {
        set.add(c.id)
      }
    })
    return set
  })

  function dismiss(cardId: string) {
    localStorage.setItem(dismissKey(cardId, currentMonth, currentYear), '1')
    setDismissed(prev => new Set([...prev, cardId]))
  }

  // Cards cujo fechamento já passou este mês e que ainda não têm fatura lançada
  const alerts = creditCards.filter(card => {
    if (dismissed.has(card.id)) return false
    if (!isCurrentMonth) return false

    const closingDay = getCardClosingDay(card.due_day, card.closing_day)
    if (todayDay < closingDay) return false

    // Verifica se já existe uma fatura (despesa variável) tagueada a este cartão no mês
    const hasFatura = expenses.some(e =>
      e.credit_card_id === card.id && !e.is_recurring
    )
    return !hasFatura
  })

  if (alerts.length === 0) return null

  return (
    <div className="mx-4 space-y-2">
      <AnimatePresence>
        {alerts.map(card => {
          const closingDay = getCardClosingDay(card.due_day, card.closing_day)
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="bg-[#FF9A3C]/10 border border-[#FF9A3C]/30 rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#FF9A3C]/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4 text-[#FF9A3C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <CreditCard className="w-3 h-3 text-[#FF9A3C]" />
                    <p className="text-xs font-semibold text-[#FF9A3C]">{card.name}</p>
                    {card.last_four && (
                      <p className="text-[10px] text-[#FF9A3C]/70">•••• {card.last_four}</p>
                    )}
                  </div>
                  <p className="text-xs text-white mb-2">
                    Fatura fechou no dia <strong>{closingDay}</strong>. Lembre de lançar o valor total da fatura.
                  </p>
                  <button
                    onClick={() => onLancarFatura(card.id)}
                    className="text-xs font-semibold text-[#FF9A3C] bg-[#FF9A3C]/20 px-3 py-1.5 rounded-lg"
                  >
                    Lançar fatura
                  </button>
                </div>
                <button
                  onClick={() => dismiss(card.id)}
                  className="w-6 h-6 flex items-center justify-center text-[#FF9A3C]/60 flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
