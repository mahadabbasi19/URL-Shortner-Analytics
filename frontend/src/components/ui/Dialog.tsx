import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  maxWidth?: string
}

export function Dialog({ open, onClose, title, description, children, maxWidth = 'max-w-md' }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    const timer = setTimeout(() => panelRef.current?.querySelector<HTMLElement>('input, button')?.focus(), 50)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      clearTimeout(timer)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-fade-in absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          'animate-scale-in relative w-full rounded-2xl border border-border bg-surface shadow-2xl shadow-black/50',
          maxWidth,
        )}
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="dialog-title" className="text-[15px] font-semibold text-text">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-[13px] text-text-secondary">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="cursor-pointer rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
