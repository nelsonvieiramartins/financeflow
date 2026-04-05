import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import LancamentosPage from './pages/LancamentosPage'
import CategoriasPage from './pages/CategoriasPage'
import PerfilPage from './pages/PerfilPage'
import BottomNav from './components/layout/BottomNav'
import FAB from './components/ui/FAB'
import AddExpenseModal from './components/expenses/AddExpenseModal'
import type { Expense } from './lib/types'
import type { EntryType } from './components/expenses/AddExpenseModal'

type Tab = 'dashboard' | 'lancamentos' | 'categorias' | 'perfil'

function AppContent() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<EntryType | undefined>(undefined)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)

  function openAdd(tab?: EntryType) {
    setEditExpense(null)
    setModalTab(tab)      // undefined = mostra seleção de tipo; valor = pula direto
    setModalOpen(true)
  }

  function openEdit(e: Expense) {
    setEditExpense(e)
    setModalOpen(true)
  }

  const pageVariants = {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -16 },
  }

  return (
    <div className="relative w-full h-dvh overflow-hidden max-w-lg mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          className="absolute inset-0"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {tab === 'dashboard' && <DashboardPage />}
          {tab === 'lancamentos' && <LancamentosPage onAddExpense={openAdd} onEditExpense={openEdit} />}
          {tab === 'categorias' && <CategoriasPage />}
          {tab === 'perfil' && <PerfilPage />}
        </motion.div>
      </AnimatePresence>

      <FAB onClick={openAdd} />
      <BottomNav active={tab} onChange={setTab} />

      <AddExpenseModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditExpense(null) }}
        editExpense={editExpense}
        initialTab={modalTab}
      />
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  const [showReload, setShowReload] = useState(false)

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShowReload(true), 5000)
      return () => clearTimeout(timer)
    } else {
      setShowReload(false)
    }
  }, [loading])

  function handleForceReload() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister()
        }
        window.location.reload()
      })
    } else {
      window.location.reload()
    }
  }

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#0F0F14]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(108,99,255,0.3)] animate-pulse"
            style={{ background: 'linear-gradient(135deg,#6C63FF,#8B84FF)' }}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-xs text-[#9090A8]">FinanceFlow</p>
          
          {showReload && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleForceReload}
              className="mt-6 px-4 py-2 text-sm text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors active:scale-95"
            >
              Recarregar Aplicativo
            </motion.button>
          )}
        </div>
      </div>
    )
  }

  if (!user) return <AuthPage />

  return (
    <AppProvider key={user.id}>
      <AppContent />
    </AppProvider>
  )
}
