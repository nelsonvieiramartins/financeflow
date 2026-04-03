export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount)
}

export function formatCurrencyCompact(amount: number): string {
  if (Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(amount)
  }
  return formatCurrency(amount)
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Returns the effective closing day of a credit card.
 * If closing_day is not set, defaults to due_day - 10 days (with wraparound to previous month).
 * The full billing cycle is 40 days: ~30 days spending + 10 days until payment.
 */
export function getCardClosingDay(dueDay: number, closingDay: number | null): number {
  if (closingDay !== null) return closingDay
  // Wrap around: e.g. due=7 → closing=27 (prev month)
  return ((dueDay - 10 - 1 + 31) % 31) + 1
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}
