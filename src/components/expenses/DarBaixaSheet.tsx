import { useState, useEffect } from 'react'
import BottomSheet from '../ui/BottomSheet'
import { useApp } from '../../context/AppContext'
import type { Expense } from '../../lib/types'
import { formatCurrency } from '../../lib/utils'

interface Props {
  expense: Expense
  open: boolean
  onClose: () => void
}

export default function DarBaixaSheet({ expense, open, onClose }: Props) {
  const { updateExpense } = useApp()
  const [valorPagoStr, setValorPagoStr] = useState('')
  const [loading, setLoading] = useState(false)

  function formatAmount(val: string) {
    const digits = val.replace(/\D/g, '')
    const num = parseInt(digits || '0') / 100
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  useEffect(() => {
    if (open) {
      const base = expense.valor_pago ?? expense.amount
      const centavos = Math.round(Number(base) * 100)
      setValorPagoStr(formatAmount(String(centavos)))
    }
  }, [open, expense.valor_pago, expense.amount])

  const valorPago = parseFloat(valorPagoStr.replace(/\./g, '').replace(',', '.')) || 0
  const valorPrevisto = Number(expense.amount)
  const valorJuros = Math.max(0, valorPago - valorPrevisto)
  const isPaid = !!expense.data_pagamento_real
  const paidDate = expense.data_pagamento_real
    ? new Date(expense.data_pagamento_real + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  async function handleConfirm() {
    if (valorPago <= 0) return
    setLoading(true)
    try {
      await updateExpense(expense.id, {
        data_pagamento_real: new Date().toISOString().split('T')[0],
        valor_pago: valorPago,
        valor_juros: valorJuros,
      })
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleEstornar() {
    setLoading(true)
    try {
      await updateExpense(expense.id, {
        data_pagamento_real: null,
        valor_pago: null,
        valor_juros: null,
      })
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Registrar Pagamento">
      <div className="space-y-3">
        <p className="text-xs text-[#9090A8] text-center -mt-2 mb-1">{expense.description}</p>

        {isPaid && (
          <div className="flex items-center justify-between bg-[#34D399]/10 border border-[#34D399]/20 rounded-xl px-4 py-3">
            <span className="text-sm text-[#34D399]">✓ Pago em {paidDate}</span>
            {Number(expense.valor_juros) > 0 && (
              <span className="text-xs text-[#F87171]">+{formatCurrency(Number(expense.valor_juros))} juros</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between bg-bg-overlay rounded-xl px-4 py-3">
          <span className="text-sm text-[#9090A8]">Valor do boleto</span>
          <span className="text-sm font-semibold text-white">{formatCurrency(valorPrevisto)}</span>
        </div>

        <div className="bg-bg-overlay rounded-xl p-4">
          <p className="text-xs text-[#9090A8] mb-1">Valor pago</p>
          <div className="flex items-center gap-1">
            <span className="text-xl text-[#9090A8] font-light">R$</span>
            <input
              type="text"
              inputMode="numeric"
              value={valorPagoStr}
              onChange={e => setValorPagoStr(formatAmount(e.target.value))}
              className="text-3xl font-bold text-white bg-transparent border-none outline-none w-full"
            />
          </div>
        </div>

        {valorJuros > 0 && (
          <div className="flex items-center justify-between bg-[#F87171]/10 border border-[#F87171]/20 rounded-xl px-4 py-3">
            <span className="text-sm text-[#F87171]">⚠️ Juros / multa</span>
            <span className="text-sm font-bold text-[#F87171]">+{formatCurrency(valorJuros)}</span>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading || valorPago <= 0}
          className="w-full bg-gradient-primary text-white font-semibold py-4 rounded-xl shadow-glow-primary transition-all active:scale-95 disabled:opacity-60"
        >
          {loading ? 'Salvando...' : isPaid ? 'Atualizar Pagamento' : 'Confirmar Pagamento'}
        </button>

        {isPaid && (
          <button
            onClick={handleEstornar}
            disabled={loading}
            className="w-full py-3 text-sm text-[#5C5C72] hover:text-[#F87171] transition-colors"
          >
            Estornar pagamento
          </button>
        )}
      </div>
    </BottomSheet>
  )
}
