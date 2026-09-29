import { Loader2 } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand-hover disabled:hover:bg-brand shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset]',
  secondary:
    'bg-surface-2 text-text border border-border hover:border-border-strong hover:bg-surface-hover',
  ghost: 'text-text-secondary hover:text-text hover:bg-surface-2',
  danger: 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/15',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] rounded-lg gap-1.5',
  md: 'h-9.5 px-4 text-sm rounded-lg gap-2',
  lg: 'h-11 px-5 text-[15px] rounded-xl gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center whitespace-nowrap font-medium transition-all duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'active:scale-[0.98]',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
})
