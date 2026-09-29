import type { NamedCount } from '../types'
import { formatFullNumber } from '../lib/format'
import { Card } from './ui/Card'

export function TopList({ title, items }: { title: string; items: NamedCount[] }) {
  const max = Math.max(1, ...items.map((i) => i.count))

  return (
    <Card className="p-5">
      <h3 className="text-xs font-medium text-text-muted">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">No data yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item.name} className="text-sm">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-text-secondary">{item.name}</span>
                <span className="shrink-0 font-mono text-xs text-text-muted">{formatFullNumber(item.count)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-brand" style={{ width: `${(item.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
