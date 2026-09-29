import { Badge } from './ui/Badge'
import type { UrlItem } from '../types'

function isExpired(url: UrlItem): boolean {
  return Boolean(url.expires_at) && new Date(url.expires_at as string) <= new Date()
}

export function StatusBadge({ url }: { url: UrlItem }) {
  if (isExpired(url)) {
    return (
      <Badge tone="warning" dot>
        Expired
      </Badge>
    )
  }
  if (!url.is_active) {
    return (
      <Badge tone="neutral" dot>
        Disabled
      </Badge>
    )
  }
  return (
    <Badge tone="success" dot>
      Active
    </Badge>
  )
}
