import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { BugzillaBug } from '@/lib/bugzilla/types'

interface CardProps {
  bug: BugzillaBug
  isStaged?: boolean
  isDragging?: boolean
  onClick?: (bug: BugzillaBug) => void
}

const priorityColors: Record<string, string> = {
  P1: 'bg-priority-p1',
  P2: 'bg-priority-p2',
  P3: 'bg-priority-p3',
  P4: 'bg-priority-p4',
  P5: 'bg-priority-p5',
}

const severityColors: Record<string, string> = {
  blocker: 'text-accent-error',
  critical: 'text-accent-error',
  major: 'text-accent-warning',
  normal: 'text-text-tertiary',
  minor: 'text-accent-success',
  trivial: 'text-accent-success',
  enhancement: 'text-accent-primary',
}

export function Card({ bug, isStaged = false, isDragging = false, onClick }: CardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: bug.id,
  })

  const priorityColor = priorityColors[bug.priority] ?? 'bg-priority-p5'
  const severityColor = severityColors[bug.severity] ?? 'text-text-tertiary'

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined

  const handleClick = () => {
    if (onClick) {
      onClick(bug)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onClick && event.key === 'Enter') {
      onClick(bug)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      role="article"
      aria-label={`Bug #${bug.id.toString()}: ${bug.summary}`}
      tabIndex={onClick ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`cursor-grab rounded-lg bg-bg-secondary p-4 shadow-lg transition-all active:cursor-grabbing ${
        onClick ? 'cursor-pointer' : ''
      } ${isStaged ? 'ring-2 ring-accent-primary' : ''} ${
        isDragging
          ? 'scale-105 opacity-90 shadow-2xl ring-2 ring-accent-primary'
          : 'hover:shadow-xl'
      }`}
    >
      {/* Header with drag handle and bug ID */}
      <div className="mb-2 flex items-center gap-2">
        <span className="material-icons text-text-tertiary">drag_indicator</span>
        <span className="font-mono text-sm font-bold text-accent-primary">
          #{bug.id.toString()}
        </span>
        {isStaged && (
          <span className="flex items-center gap-1 rounded bg-accent-primary/20 px-2 py-0.5 text-xs text-accent-primary">
            <span className="material-icons text-sm">pending</span>
            Staged
          </span>
        )}
      </div>

      {/* Summary */}
      <p className="mb-3 truncate text-sm font-medium text-text-primary">{bug.summary}</p>

      {/* Badges row */}
      <div className="mb-2 flex flex-wrap gap-2">
        {/* Priority badge */}
        <span className={`${priorityColor} rounded px-2 py-0.5 text-xs font-bold text-white`}>
          {bug.priority}
        </span>

        {/* Severity badge */}
        <span className={`${severityColor} rounded bg-bg-tertiary px-2 py-0.5 text-xs font-medium`}>
          {bug.severity}
        </span>

        {/* Component badge */}
        <span className="rounded bg-bg-tertiary px-2 py-0.5 text-xs text-text-secondary">
          {bug.component}
        </span>
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-2 text-xs text-text-tertiary">
        <span className="material-icons text-sm">person</span>
        <span className="truncate">{bug.assigned_to}</span>
      </div>
    </div>
  )
}
