import { useState, useRef, useCallback, useId } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { BugzillaBug } from '@/lib/bugzilla/types'
import type { Assignee } from '@/hooks/use-board-assignees'
import { formatAssignee } from '@/lib/bugzilla/display-utils'
import { getQeVerifyStatus, type QeVerifyStatus } from '@/lib/bugzilla/qe-verify'
import { AssigneePicker } from './AssigneePicker'
import { PointsPicker } from './PointsPicker'
import { PriorityPicker } from './PriorityPicker'
import { SeverityPicker } from './SeverityPicker'
import { QeVerifyPicker } from './QeVerifyPicker'

const BUGZILLA_BUG_URL = 'https://bugzilla.mozilla.org/show_bug.cgi?id='

interface CardProps {
  bug: BugzillaBug
  isStaged?: boolean
  isDragging?: boolean
  isSelected?: boolean
  isGrabbed?: boolean
  isAssigneeStaged?: boolean
  stagedAssignee?: string
  isPointsStaged?: boolean
  stagedPoints?: number | string
  isPriorityStaged?: boolean
  stagedPriority?: string
  isSeverityStaged?: boolean
  stagedSeverity?: string
  isQeVerifyStaged?: boolean
  stagedQeVerify?: QeVerifyStatus
  onClick?: (bug: BugzillaBug) => void
  allAssignees?: Assignee[]
  onAssigneeChange?: (bugId: number, newAssignee: string) => void
  onPointsChange?: (bugId: number, points: number | string | undefined) => void
  onPriorityChange?: (bugId: number, priority: string) => void
  onSeverityChange?: (bugId: number, severity: string) => void
  onQeVerifyChange?: (bugId: number, status: QeVerifyStatus) => void
}

const priorityColors: Record<string, string> = {
  P1: 'bg-priority-p1',
  P2: 'bg-priority-p2',
  P3: 'bg-priority-p3',
  P4: 'bg-priority-p4',
  P5: 'bg-priority-p5',
}

const severityColors: Record<string, string> = {
  S1: 'text-accent-error',
  S2: 'text-accent-warning',
  S3: 'text-text-secondary',
  S4: 'text-accent-primary',
  'N/A': 'text-text-tertiary',
}

export function Card({
  bug,
  isStaged = false,
  isDragging = false,
  isSelected = false,
  isGrabbed = false,
  isAssigneeStaged = false,
  stagedAssignee,
  isPointsStaged = false,
  stagedPoints,
  isPriorityStaged = false,
  stagedPriority,
  isSeverityStaged = false,
  stagedSeverity,
  isQeVerifyStaged = false,
  stagedQeVerify,
  onClick,
  allAssignees,
  onAssigneeChange,
  onPointsChange,
  onPriorityChange,
  onSeverityChange,
  onQeVerifyChange,
}: CardProps) {
  const [isAssigneePickerOpen, setIsAssigneePickerOpen] = useState(false)
  const [isPointsPickerOpen, setIsPointsPickerOpen] = useState(false)
  const [isPriorityPickerOpen, setIsPriorityPickerOpen] = useState(false)
  const [isSeverityPickerOpen, setIsSeverityPickerOpen] = useState(false)
  const [isQeVerifyPickerOpen, setIsQeVerifyPickerOpen] = useState(false)
  const [anchorPosition, setAnchorPosition] = useState<{ x: number; y: number } | undefined>()

  // Generate unique IDs for picker listboxes
  const assigneeListboxId = useId()
  const pointsListboxId = useId()
  const priorityListboxId = useId()
  const severityListboxId = useId()
  const qeVerifyListboxId = useId()
  const assigneeButtonRef = useRef<HTMLButtonElement>(null)
  const pointsButtonRef = useRef<HTMLButtonElement>(null)
  const priorityButtonRef = useRef<HTMLButtonElement>(null)
  const severityButtonRef = useRef<HTMLButtonElement>(null)
  const qeVerifyButtonRef = useRef<HTMLButtonElement>(null)
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: bug.id,
  })

  const openAssigneePicker = useCallback(() => {
    if (assigneeButtonRef.current) {
      const rect = assigneeButtonRef.current.getBoundingClientRect()
      setAnchorPosition({ x: rect.left, y: rect.bottom + 4 })
    }
    setIsAssigneePickerOpen(true)
  }, [])

  const openPointsPicker = useCallback(() => {
    if (pointsButtonRef.current) {
      const rect = pointsButtonRef.current.getBoundingClientRect()
      setAnchorPosition({ x: rect.left, y: rect.bottom + 4 })
    }
    setIsPointsPickerOpen(true)
  }, [])

  const openPriorityPicker = useCallback(() => {
    if (priorityButtonRef.current) {
      const rect = priorityButtonRef.current.getBoundingClientRect()
      setAnchorPosition({ x: rect.left, y: rect.bottom + 4 })
    }
    setIsPriorityPickerOpen(true)
  }, [])

  const openSeverityPicker = useCallback(() => {
    if (severityButtonRef.current) {
      const rect = severityButtonRef.current.getBoundingClientRect()
      setAnchorPosition({ x: rect.left, y: rect.bottom + 4 })
    }
    setIsSeverityPickerOpen(true)
  }, [])

  const openQeVerifyPicker = useCallback(() => {
    if (qeVerifyButtonRef.current) {
      const rect = qeVerifyButtonRef.current.getBoundingClientRect()
      setAnchorPosition({ x: rect.left, y: rect.bottom + 4 })
    }
    setIsQeVerifyPickerOpen(true)
  }, [])

  const handleAssigneeButtonClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    openAssigneePicker()
  }

  const handlePointsButtonClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    openPointsPicker()
  }

  const handlePriorityButtonClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    openPriorityPicker()
  }

  const handleSeverityButtonClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    openSeverityPicker()
  }

  const handleQeVerifyButtonClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    openQeVerifyPicker()
  }

  const handleAssigneeSelect = (email: string) => {
    if (onAssigneeChange) {
      onAssigneeChange(bug.id, email)
    }
    setIsAssigneePickerOpen(false)
  }

  const handlePointsSelect = (points: number | string | undefined) => {
    if (onPointsChange) {
      onPointsChange(bug.id, points)
    }
    setIsPointsPickerOpen(false)
  }

  const handlePrioritySelect = (priority: string) => {
    if (onPriorityChange) {
      onPriorityChange(bug.id, priority)
    }
    setIsPriorityPickerOpen(false)
  }

  const handleSeveritySelect = (severity: string) => {
    if (onSeverityChange) {
      onSeverityChange(bug.id, severity)
    }
    setIsSeverityPickerOpen(false)
  }

  const handleQeVerifySelect = (status: QeVerifyStatus) => {
    if (onQeVerifyChange) {
      onQeVerifyChange(bug.id, status)
    }
    setIsQeVerifyPickerOpen(false)
  }

  // Display staged values if available, otherwise original
  const displayedAssignee = isAssigneeStaged && stagedAssignee ? stagedAssignee : bug.assigned_to
  const displayedPoints =
    isPointsStaged && stagedPoints !== undefined ? stagedPoints : bug.cf_fx_points
  const displayedPriority = isPriorityStaged && stagedPriority ? stagedPriority : bug.priority
  const displayedSeverity = isSeverityStaged && stagedSeverity ? stagedSeverity : bug.severity

  const priorityColor = priorityColors[displayedPriority] ?? 'bg-priority-p5'
  const severityColor = severityColors[displayedSeverity] ?? 'text-text-tertiary'

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
      openAssigneePicker()
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
      return 'ring-2 ring-accent-staged'
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
      className={`relative cursor-grab rounded-lg bg-bg-secondary p-4 shadow-lg transition-all active:cursor-grabbing ${
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
        {/* Story Points - top right */}
        {displayedPoints !== undefined &&
          displayedPoints !== 0 &&
          displayedPoints !== '0' &&
          displayedPoints !== '' &&
          (onPointsChange ? (
            <button
              ref={pointsButtonRef}
              type="button"
              aria-label={`Change story points, current: ${String(displayedPoints)}`}
              aria-expanded={isPointsPickerOpen}
              aria-haspopup="listbox"
              aria-controls={pointsListboxId}
              onClick={handlePointsButtonClick}
              className={`ml-auto rounded-full bg-accent-primary/20 px-2 py-0.5 text-xs font-bold text-accent-primary transition-colors hover:bg-accent-primary/30 ${
                isPointsStaged ? 'ring-2 ring-accent-staged' : ''
              }`}
            >
              {displayedPoints}
            </button>
          ) : (
            <span
              aria-label="story points"
              className="ml-auto rounded-full bg-accent-primary/20 px-2 py-0.5 text-xs font-bold text-accent-primary"
            >
              {displayedPoints}
            </span>
          ))}
      </div>

      {/* Summary */}
      <p className="mb-3 line-clamp-2 text-sm font-medium text-text-primary" title={bug.summary}>
        {bug.summary}
      </p>

      {/* Badges row */}
      <div className="mb-2 flex flex-wrap gap-2">
        {/* Priority badge */}
        {onPriorityChange ? (
          <button
            ref={priorityButtonRef}
            type="button"
            aria-label={`Change priority, current: ${displayedPriority}`}
            aria-expanded={isPriorityPickerOpen}
            aria-haspopup="listbox"
            aria-controls={priorityListboxId}
            onClick={handlePriorityButtonClick}
            className={`${priorityColor} rounded px-2 py-0.5 text-xs font-bold text-white transition-colors hover:opacity-80 ${
              isPriorityStaged ? 'ring-2 ring-accent-staged' : ''
            }`}
          >
            {displayedPriority}
          </button>
        ) : (
          <span className={`${priorityColor} rounded px-2 py-0.5 text-xs font-bold text-white`}>
            {displayedPriority}
          </span>
        )}

        {/* Severity badge */}
        {onSeverityChange ? (
          <button
            ref={severityButtonRef}
            type="button"
            aria-label={`Change severity, current: ${displayedSeverity}`}
            aria-expanded={isSeverityPickerOpen}
            aria-haspopup="listbox"
            aria-controls={severityListboxId}
            onClick={handleSeverityButtonClick}
            className={`${severityColor} rounded bg-bg-tertiary px-2 py-0.5 text-xs font-medium transition-colors hover:opacity-80 ${
              isSeverityStaged ? 'ring-2 ring-accent-staged' : ''
            }`}
          >
            {displayedSeverity}
          </button>
        ) : (
          <span
            className={`${severityColor} rounded bg-bg-tertiary px-2 py-0.5 text-xs font-medium`}
          >
            {displayedSeverity}
          </span>
        )}

        {/* Component badge */}
        <span className="rounded bg-bg-tertiary px-2 py-0.5 text-xs text-text-secondary">
          {bug.component}
        </span>
      </div>

      {/* Assignee and QE Verification row */}
      <div className="flex items-center gap-2 text-xs text-text-tertiary">
        {allAssignees && onAssigneeChange ? (
          <button
            ref={assigneeButtonRef}
            type="button"
            aria-label={`Change assignee, current: ${displayedAssignee}`}
            aria-expanded={isAssigneePickerOpen}
            aria-haspopup="listbox"
            aria-controls={assigneeListboxId}
            onClick={handleAssigneeButtonClick}
            className={`flex min-w-0 flex-1 items-center gap-2 rounded p-0.5 transition-colors hover:bg-bg-tertiary hover:text-text-primary ${
              isAssigneeStaged ? 'ring-2 ring-accent-staged' : ''
            }`}
          >
            <span className="material-icons text-sm">person</span>
            <span className="min-w-0 flex-1 truncate text-left">
              {formatAssignee(displayedAssignee)}
            </span>
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="material-icons text-sm">person</span>
            <span className="min-w-0 flex-1 truncate">{formatAssignee(displayedAssignee)}</span>
          </div>
        )}

        {/* QE Verification Indicator */}
        {(() => {
          const currentQeStatus = getQeVerifyStatus(bug.flags)
          const displayedQeStatus =
            isQeVerifyStaged && stagedQeVerify ? stagedQeVerify : currentQeStatus
          const displayText =
            displayedQeStatus === 'unknown' ? 'qe?' : displayedQeStatus === 'minus' ? 'qe-' : 'qe+'
          const isUnknown = displayedQeStatus === 'unknown'
          return onQeVerifyChange ? (
            <button
              ref={qeVerifyButtonRef}
              type="button"
              aria-label="Change QE verification"
              aria-expanded={isQeVerifyPickerOpen}
              aria-haspopup="listbox"
              aria-controls={qeVerifyListboxId}
              onClick={handleQeVerifyButtonClick}
              className={`flex-shrink-0 text-xs text-text-tertiary transition-colors hover:text-text-secondary ${
                isUnknown ? 'underline decoration-wavy decoration-text-tertiary' : ''
              } ${isQeVerifyStaged ? 'ring-2 ring-accent-staged rounded' : ''}`}
            >
              {displayText}
            </button>
          ) : (
            <span
              className={`flex-shrink-0 text-xs text-text-tertiary ${
                isUnknown ? 'underline decoration-wavy decoration-text-tertiary' : ''
              }`}
            >
              {displayText}
            </span>
          )
        })()}
      </div>

      {/* Assignee Picker */}
      {allAssignees && (
        <AssigneePicker
          isOpen={isAssigneePickerOpen}
          onClose={() => {
            setIsAssigneePickerOpen(false)
          }}
          onSelect={handleAssigneeSelect}
          assignees={allAssignees}
          currentAssignee={bug.assigned_to}
          anchorPosition={anchorPosition}
          listboxId={assigneeListboxId}
        />
      )}

      {/* Points Picker */}
      {onPointsChange && (
        <PointsPicker
          isOpen={isPointsPickerOpen}
          onClose={() => {
            setIsPointsPickerOpen(false)
          }}
          onSelect={handlePointsSelect}
          currentPoints={bug.cf_fx_points}
          anchorPosition={anchorPosition}
          listboxId={pointsListboxId}
        />
      )}

      {/* Priority Picker */}
      {onPriorityChange && (
        <PriorityPicker
          isOpen={isPriorityPickerOpen}
          onClose={() => {
            setIsPriorityPickerOpen(false)
          }}
          onSelect={handlePrioritySelect}
          currentPriority={bug.priority}
          anchorPosition={anchorPosition}
          listboxId={priorityListboxId}
        />
      )}

      {/* Severity Picker */}
      {onSeverityChange && (
        <SeverityPicker
          isOpen={isSeverityPickerOpen}
          onClose={() => {
            setIsSeverityPickerOpen(false)
          }}
          onSelect={handleSeveritySelect}
          currentSeverity={bug.severity}
          anchorPosition={anchorPosition}
          listboxId={severityListboxId}
        />
      )}

      {/* QE Verify Picker */}
      {onQeVerifyChange && (
        <QeVerifyPicker
          isOpen={isQeVerifyPickerOpen}
          onClose={() => {
            setIsQeVerifyPickerOpen(false)
          }}
          onSelect={handleQeVerifySelect}
          currentStatus={getQeVerifyStatus(bug.flags)}
          anchorPosition={anchorPosition}
          listboxId={qeVerifyListboxId}
        />
      )}
    </div>
  )
}
