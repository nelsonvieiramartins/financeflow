import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { Pencil, Trash2, GripVertical } from 'lucide-react'
import type { Expense } from '../../lib/types'
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS, PAYMENT_TYPE_LABELS, PAYMENT_TYPE_COLORS } from '../../lib/types'
import { formatCurrency } from '../../lib/utils'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Props {
  expense: Expense
  onEdit: (e: Expense) => void
  onDelete: (id: string) => void
}

export default function ExpenseItem({ expense, onEdit, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: expense.id })
  const x = useMotionValue(0)

  const deleteOpacity = useTransform(x, [-80, -30], [1, 0])
  const editOpacity = useTransform(x, [30, 80], [0, 1])
  const bgDelete = useTransform(x, [-80, 0], ['rgba(248,113,113,0.2)', 'rgba(248,113,113,0)'])
  const bgEdit = useTransform(x, [0, 80], ['rgba(96,165,250,0)', 'rgba(96,165,250,0.2)'])

  function handleDragEnd() {
    const current = x.get()
    if (current < -60) {
      onDelete(expense.id)
    } else if (current > 60) {
      onEdit(expense)
    }
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
  }

  const catColor = CATEGORY_COLORS[expense.category] ?? '#9090A8'
  const catIcon = CATEGORY_ICONS[expense.category] ?? '📌'
  const dueDate = expense.due_date ? new Date(expense.due_date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) : null

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative overflow-hidden rounded-xl">
      {/* Swipe hints */}
      <motion.div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: bgDelete }} />
      <motion.div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: bgEdit }} />

      {/* Delete icon (right swipe reveals left) */}
      <motion.div
        className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ opacity: deleteOpacity }}
      >
        <Trash2 className="w-5 h-5 text-[#F87171]" />
      </motion.div>

      {/* Edit icon (left swipe reveals right) */}
      <motion.div
        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ opacity: editOpacity }}
      >
        <Pencil className="w-5 h-5 text-[#60A5FA]" />
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.2}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className="flex items-center gap-3 p-3.5 bg-bg-surface rounded-xl border border-white/[0.05] cursor-grab active:cursor-grabbing select-none"
      >
        {/* Drag handle */}
        <div {...listeners} {...attributes} className="flex-shrink-0 touch-none cursor-grab">
          <GripVertical className="w-4 h-4 text-[#5C5C72]" />
        </div>

        {/* Category icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
          style={{ background: `${catColor}20` }}
        >
          {catIcon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{expense.description}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: `${catColor}20`, color: catColor }}
            >
              {CATEGORY_LABELS[expense.category]}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ background: `${PAYMENT_TYPE_COLORS[expense.payment_type]}15`, color: PAYMENT_TYPE_COLORS[expense.payment_type] }}
            >
              {PAYMENT_TYPE_LABELS[expense.payment_type]}
            </span>
          </div>
        </div>

        {/* Amount + date */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-white">{formatCurrency(Number(expense.amount))}</p>
          {dueDate && <p className="text-[10px] text-[#5C5C72] mt-0.5">até {dueDate}</p>}
        </div>
      </motion.div>
    </div>
  )
}
