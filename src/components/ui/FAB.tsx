import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

interface Props {
  onClick: () => void
}

export default function FAB({ onClick }: Props) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-20 right-5 z-30 w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow-primary"
      style={{ bottom: 'calc(var(--navbar-height) + var(--safe-area-bottom) + 12px)' }}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
    </motion.button>
  )
}
