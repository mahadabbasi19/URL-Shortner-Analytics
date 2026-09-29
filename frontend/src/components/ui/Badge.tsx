import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'brand'

const toneClasses: Record<Tone, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  neutral: 'bg-surface-2 text-text-secondary border border-border',
  brand: 'bg-brand/10 text-brand-hover',
}

export function Badge({
  tone = 'neutral',
  children,
  dot = false,
  className,
}: {
  tone?: Tone
  children: ReactNode
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            tone === 'success' && 'bg-success',
            tone === 'warning' && 'bg-warning',
            tone === 'danger' && 'bg-danger',
            tone === 'brand' && 'bg-brand',
            tone === 'neutral' && 'bg-text-muted',
          )}
        />
      )}
      {children}
    </span>
  )
}
