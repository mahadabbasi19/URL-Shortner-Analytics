import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart3, ExternalLink, Link2, Power, QrCode } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL, api, getApiErrorMessage } from '../lib/api'
import { extractDomain, formatFullNumber, formatRelativeDate } from '../lib/format'
import type { UrlItem } from '../types'
import { CopyButton } from './CopyButton'
import { DeleteButton } from './DeleteButton'
import { QrModal } from './QrModal'
import { StatusBadge } from './StatusBadge'
import { IconButton } from './ui/IconButton'
import { SkeletonRow } from './ui/Skeleton'
import { useToast } from './ui/Toast'

function shortUrlFor(url: UrlItem): string {
  return `${API_BASE_URL}/${url.short_code}`
}

function Favicon({ url }: { url: string }) {
  const [errored, setErrored] = useState(false)
  const domain = extractDomain(url)

  if (errored || !domain) {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-2 text-text-muted">
        <Link2 className="h-3.5 w-3.5" />
      </div>
    )
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt=""
      width={28}
      height={28}
      className="h-7 w-7 shrink-0 rounded-md bg-surface-2 object-contain p-1"
      onError={() => setErrored(true)}
    />
  )
}

interface LinksTableProps {
  urls: UrlItem[]
  compact?: boolean
  isLoading?: boolean
}

export function LinksTable({ urls, compact = false, isLoading = false }: LinksTableProps) {
  const queryClient = useQueryClient()
  const { show } = useToast()
  const [qrTarget, setQrTarget] = useState<UrlItem | null>(null)

  const toggleActive = useMutation({
    mutationFn: async (url: UrlItem) => {
      await api.patch(`/api/v1/urls/${url.id}`, { is_active: !url.is_active })
    },
    onSuccess: (_, url) => {
      queryClient.invalidateQueries({ queryKey: ['urls'] })
      show(url.is_active ? 'Link disabled.' : 'Link enabled.')
    },
    onError: (err) => show(getApiErrorMessage(err), 'error'),
  })

  const deleteUrl = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/urls/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urls'] })
      show('Link deleted.')
    },
    onError: (err) => show(getApiErrorMessage(err), 'error'),
  })

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="divide-y divide-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (urls.length === 0) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-medium text-text-muted">
              <th className="px-4 py-3 font-medium sm:px-5">Link</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Clicks</th>
              {!compact && <th className="hidden px-4 py-3 font-medium sm:table-cell">Created</th>}
              <th className="px-4 py-3 font-medium sm:px-5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {urls.map((url) => (
              <tr key={url.id} className="group transition-colors hover:bg-surface-2/40">
                <td className="px-4 py-3 sm:px-5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Favicon url={url.original_url} />
                    <div className="min-w-0">
                      <Link
                        to={`/links/${url.id}`}
                        className="block truncate font-mono text-[13px] font-medium text-text hover:text-brand-2"
                      >
                        {url.short_code}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-text-muted" title={url.original_url}>
                        {url.title || url.original_url}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge url={url} />
                </td>
                <td className="px-4 py-3 text-right font-mono text-[13px] font-medium text-text">
                  {formatFullNumber(url.total_clicks)}
                </td>
                {!compact && (
                  <td className="hidden px-4 py-3 text-text-muted sm:table-cell">
                    {formatRelativeDate(url.created_at)}
                  </td>
                )}
                <td className="px-4 py-3 sm:px-5">
                  <div className="flex items-center justify-end gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <CopyButton value={shortUrlFor(url)} variant="icon" />
                    <IconButton label="Open link" size="sm" onClick={() => window.open(shortUrlFor(url), '_blank')}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton label="View QR code" size="sm" onClick={() => setQrTarget(url)}>
                      <QrCode className="h-3.5 w-3.5" />
                    </IconButton>
                    <Link
                      to={`/links/${url.id}`}
                      aria-label="View analytics"
                      title="View analytics"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-2 hover:text-text"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                    </Link>
                    {!compact && (
                      <>
                        <IconButton
                          label={url.is_active ? 'Disable link' : 'Enable link'}
                          size="sm"
                          onClick={() => toggleActive.mutate(url)}
                          disabled={toggleActive.isPending}
                          className={url.is_active ? '' : 'text-success'}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </IconButton>
                        <DeleteButton isDeleting={deleteUrl.isPending} onConfirm={() => deleteUrl.mutate(url.id)} />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {qrTarget && (
        <QrModal urlId={qrTarget.id} shortUrl={shortUrlFor(qrTarget)} onClose={() => setQrTarget(null)} />
      )}
    </div>
  )
}
