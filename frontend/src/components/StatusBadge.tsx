import type { UrlItem } from '../types'

function isExpired(url: UrlItem): boolean {
  return Boolean(url.expires_at) && new Date(url.expires_at as string) <= new Date()
}

export function StatusBadge({ url }: { url: UrlItem }) {
  if (isExpired(url)) {
    return (
      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">Expired</span>
    )
  }
  if (!url.is_active) {
    return <span className="rounded-full bg-ink-700/50 px-2 py-0.5 text-xs font-medium text-ink-400">Disabled</span>
  }
  return (
    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">Active</span>
  )
}
