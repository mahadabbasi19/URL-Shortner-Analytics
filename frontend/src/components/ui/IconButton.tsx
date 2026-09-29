import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  size?: 'sm' | 'md'
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded-lg text-text-secondary transition-colors duration-150',
        'hover:bg-surface-2 hover:text-text disabled:cursor-not-allowed disabled:opacity-40',
        size === 'sm' ? 'h-7 w-7' : 'h-9 w-9',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})
