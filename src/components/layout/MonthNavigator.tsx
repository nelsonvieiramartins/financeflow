import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MONTHS_SHORT } from '../../lib/types'

interface Props {
  month: number
  year: number
  onChange: (month: number, year: number) => void
}

export default function MonthNavigator({ month, year, onChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function prev() {
    if (month === 1) onChange(12, year - 1)
    else onChange(month - 1, year)
  }

  function next() {
    if (month === 12) onChange(1, year + 1)
    else onChange(month + 1, year)
  }

  // Build 12 months visible, centered on current
  const months = MONTHS_SHORT.map((label, i) => ({ label, month: i + 1 }))

  useEffect(() => {
    // Scroll active month into center
    const el = scrollRef.current?.querySelector(`[data-active="true"]`)
    el?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
  }, [month])

  return (
    <div className="flex items-center gap-2 px-4">
      <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-surface text-[#9090A8] hover:text-white transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div ref={scrollRef} className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide month-scroll py-1">
        {months.map(({ label, month: m }) => {
          const isActive = m === month
          return (
            <motion.button
              key={m}
              data-active={isActive}
              onClick={() => onChange(m, year)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-primary text-white shadow-glow-sm'
                  : 'text-[#9090A8] bg-bg-surface hover:bg-bg-elevated hover:text-white'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {label}
            </motion.button>
          )
        })}
      </div>

      <span className="text-xs text-[#5C5C72] font-medium min-w-[2.5rem] text-center">{year}</span>

      <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-surface text-[#9090A8] hover:text-white transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
