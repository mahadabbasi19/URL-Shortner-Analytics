import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'

type ToastTone = 'success' | 'error' | 'info'

interface Toast {
  id: number
  tone: ToastTone
  message: string
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const icons: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const toneClasses: Record<ToastTone, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-brand-2',
}

let idCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = ++idCounter
    setToasts((prev) => [...prev, { id, tone, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
          {toasts.map((toast) => {
            const Icon = icons[toast.tone]
            return (
              <div
                key={toast.id}
                role="status"
                className="animate-slide-up pointer-events-auto flex items-start gap-2.5 rounded-xl border border-border bg-surface-2 px-4 py-3 shadow-xl shadow-black/40"
              >
                <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', toneClasses[toast.tone])} aria-hidden="true" />
                <p className="flex-1 text-[13px] leading-snug text-text">{toast.message}</p>
                <button
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="cursor-pointer text-text-muted transition-colors hover:text-text"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
