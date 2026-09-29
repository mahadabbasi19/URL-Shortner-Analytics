import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-text-muted">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-text">{title}</h3>
      <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-text-secondary">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description = "We couldn't load this. Please try again.",
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-6 py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger/10 text-danger">
        <span className="text-lg" aria-hidden="true">
          !
        </span>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-text">{title}</h3>
      <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-text-secondary">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 cursor-pointer rounded-lg border border-border px-3.5 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text"
        >
          Try again
        </button>
      )}
    </div>
  )
}
