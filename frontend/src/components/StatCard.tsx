import type { LucideIcon } from 'lucide-react'
import { Skeleton } from './ui/Skeleton'

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
}: {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
  loading?: boolean
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-text-muted">{label}</p>
        {Icon && <Icon className="h-3.5 w-3.5 text-text-muted" />}
      </div>
      {loading ? (
        <Skeleton className="mt-2.5 h-7 w-16" />
      ) : (
        <p className="mt-1.5 text-[26px] font-semibold tracking-tight text-text">{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </div>
  )
}
