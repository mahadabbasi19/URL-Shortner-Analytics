import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
  trailing?: ReactNode
  mono?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, trailing, mono, className, id, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            'h-10 w-full rounded-lg border bg-surface-2 px-3.5 text-sm text-text placeholder:text-text-muted',
            'outline-none transition-colors duration-150',
            'border-border focus:border-brand focus:ring-4 focus:ring-brand/15',
            error && 'border-danger/50 focus:border-danger focus:ring-danger/15',
            icon && 'pl-9.5',
            trailing && 'pr-10',
            mono && 'font-mono',
            className,
          )}
          {...props}
        />
        {trailing && <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-text-muted">
          {hint}
        </p>
      )}
    </div>
  )
})
