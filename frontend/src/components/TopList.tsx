import type { NamedCount } from '../types'

export function TopList({ title, items }: { title: string; items: NamedCount[] }) {
  const max = Math.max(1, ...items.map((i) => i.count))

  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-ink-500">No data yet.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {items.map((item) => (
            <li key={item.name} className="text-sm">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-ink-200">{item.name}</span>
                <span className="shrink-0 font-mono text-xs text-ink-400">{item.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
