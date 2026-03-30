import { motion } from 'framer-motion'
import { LayoutDashboard, List, Tag, User } from 'lucide-react'

type Tab = 'dashboard' | 'lancamentos' | 'categorias' | 'perfil'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

const tabs = [
  { id: 'dashboard' as Tab, label: 'Início', Icon: LayoutDashboard },
  { id: 'lancamentos' as Tab, label: 'Lançamentos', Icon: List },
  { id: 'categorias' as Tab, label: 'Categorias', Icon: Tag },
  { id: 'perfil' as Tab, label: 'Perfil', Icon: User },
]

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/[0.06]"
      style={{ paddingBottom: 'var(--safe-area-bottom)' }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-x-2 top-1 h-0.5 bg-gradient-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon
                  className="w-5 h-5 transition-colors duration-200"
                  style={{ color: isActive ? '#6C63FF' : '#5C5C72' }}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </motion.div>
              <span
                className="text-[10px] font-medium transition-colors duration-200"
                style={{ color: isActive ? '#6C63FF' : '#5C5C72' }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
