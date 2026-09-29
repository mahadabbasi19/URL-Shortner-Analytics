import { cn } from '../../lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} aria-hidden="true" />
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-64" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-3.5 w-10" />
    </div>
  )
}
