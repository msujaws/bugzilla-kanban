import { useState, useRef, useCallback } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { BugzillaBug } from '@/lib/bugzilla/types'
import type { Assignee } from '@/hooks/use-board-assignees'
import { AssigneePicker } from './AssigneePicker'

const BUGZILLA_BUG_URL = 'https://bugzilla.mozilla.org/show_bug.cgi?id='

interface CardProps {
  bug: BugzillaBug
  isStaged?: boolean
  isDragging?: boolean
  isSelected?: boolean
  isGrabbed?: boolean
  isAssigneeStaged?: boolean
  stagedAssignee?: string
  onClick?: (bug: BugzillaBug) => void
  allAssignees?: Assignee[]
  onAssigneeChange?: (bugId: number, newAssignee: string) => void
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

export function Card({
  bug,
  isStaged = false,
  isDragging = false,
  isSelected = false,
  isGrabbed = false,
  isAssigneeStaged = false,
  stagedAssignee,
  onClick,
  allAssignees,
  onAssigneeChange,
}: CardProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [anchorPosition, setAnchorPosition] = useState<{ x: number; y: number } | undefined>()
  const assigneeButtonRef = useRef<HTMLButtonElement>(null)
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: bug.id,
  })

  const openPicker = useCallback(() => {
    if (assigneeButtonRef.current) {
      const rect = assigneeButtonRef.current.getBoundingClientRect()
      setAnchorPosition({ x: rect.left, y: rect.bottom + 4 })
    }
    setIsPickerOpen(true)
  }, [])

  const handleAssigneeButtonClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    openPicker()
  }

  const handleAssigneeSelect = (email: string) => {
    if (onAssigneeChange) {
      onAssigneeChange(bug.id, email)
    }
    setIsPickerOpen(false)
  }

  // Display staged assignee if available, otherwise original
  const displayedAssignee = isAssigneeStaged && stagedAssignee ? stagedAssignee : bug.assigned_to

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
    // Space key opens assignee picker when card is selected
    if (event.key === ' ' && isSelected && allAssignees && onAssigneeChange) {
      event.preventDefault()
      openPicker()
    }
  }

  // Build className based on state priority: isDragging > isGrabbed > isSelected > isStaged
  const getStateClasses = () => {
    if (isDragging) {
      return 'scale-105 opacity-90 shadow-2xl ring-2 ring-accent-primary'
    }
    if (isGrabbed) {
      return 'scale-105 shadow-2xl ring-2 ring-accent-warning animate-pulse'
    }
    if (isSelected) {
      return 'ring-2 ring-accent-primary shadow-xl'
    }
    if (isStaged) {
      return 'ring-2 ring-accent-primary/50'
    }
    return 'hover:shadow-xl'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      role="article"
      aria-label={`Bug #${bug.id.toString()}: ${bug.summary}`}
      tabIndex={onClick || (allAssignees && onAssigneeChange) ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`cursor-grab rounded-lg bg-bg-secondary p-4 shadow-lg transition-all active:cursor-grabbing ${
        onClick ? 'cursor-pointer' : ''
      } ${getStateClasses()}`}
    >
      {/* Header with drag handle and bug ID */}
      <div className="mb-2 flex items-center gap-2">
        <span className="material-icons text-text-tertiary">drag_indicator</span>
        <a
          href={`${BUGZILLA_BUG_URL}${bug.id.toString()}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation()
          }}
          className="font-mono text-sm font-bold text-accent-primary hover:underline"
        >
          #{bug.id.toString()}
        </a>
        {isStaged && (
          <span className="flex items-center gap-1 rounded bg-accent-primary/20 px-2 py-0.5 text-xs text-accent-primary">
            <span className="material-icons text-sm">pending</span>
            Staged
          </span>
        )}
      </div>

      {/* Summary */}
      <p className="mb-3 truncate text-sm font-medium text-text-primary" title={bug.summary}>
        {bug.summary}
      </p>

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
        {allAssignees && onAssigneeChange ? (
          <button
            ref={assigneeButtonRef}
            type="button"
            aria-label="Change assignee"
            onClick={handleAssigneeButtonClick}
            className={`flex items-center rounded p-0.5 transition-colors hover:bg-bg-tertiary hover:text-text-primary ${
              isAssigneeStaged ? 'ring-2 ring-accent-primary/50' : ''
            }`}
          >
            <span className="material-icons text-sm">person</span>
          </button>
        ) : (
          <span className="material-icons text-sm">person</span>
        )}
        <span className="min-w-0 flex-1 truncate">{displayedAssignee}</span>
      </div>

      {/* Assignee Picker */}
      {allAssignees && (
        <AssigneePicker
          isOpen={isPickerOpen}
          onClose={() => {
            setIsPickerOpen(false)
          }}
          onSelect={handleAssigneeSelect}
          assignees={allAssignees}
          currentAssignee={bug.assigned_to}
          anchorPosition={anchorPosition}
        />
      )}
    </div>
  )
}
