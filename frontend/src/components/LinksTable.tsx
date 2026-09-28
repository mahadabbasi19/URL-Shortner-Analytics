import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL, api } from '../lib/api'
import type { UrlItem } from '../types'
import { CopyButton } from './CopyButton'
import { DeleteButton } from './DeleteButton'
import { QrModal } from './QrModal'
import { StatusBadge } from './StatusBadge'

function shortUrlFor(url: UrlItem): string {
  return `${API_BASE_URL}/${url.short_code}`
}

interface LinksTableProps {
  urls: UrlItem[]
  compact?: boolean
}

export function LinksTable({ urls, compact = false }: LinksTableProps) {
  const queryClient = useQueryClient()
  const [qrTarget, setQrTarget] = useState<UrlItem | null>(null)

  const toggleActive = useMutation({
    mutationFn: async (url: UrlItem) => {
      await api.patch(`/api/v1/urls/${url.id}`, { is_active: !url.is_active })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['urls'] }),
  })

  const deleteUrl = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/urls/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['urls'] }),
  })

  if (urls.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-800 bg-ink-900/30 p-10 text-center">
        <p className="text-sm text-ink-400">No links yet. Create your first one above.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/60">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-800 text-xs uppercase tracking-wide text-ink-500">
              <th className="px-4 py-3 font-medium">Link</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Clicks</th>
              {!compact && <th className="px-4 py-3 font-medium">Created</th>}
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {urls.map((url) => (
              <tr key={url.id} className="border-b border-ink-800/60 last:border-0 hover:bg-ink-800/30">
                <td className="max-w-xs px-4 py-3">
                  <Link
                    to={`/links/${url.id}`}
                    className="block truncate font-mono text-sm font-medium text-brand-300 hover:underline"
                  >
                    /{url.short_code}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-ink-500">{url.title || url.original_url}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge url={url} />
                </td>
                <td className="px-4 py-3 font-semibold text-white">{url.total_clicks}</td>
                {!compact && (
                  <td className="px-4 py-3 text-ink-500">{new Date(url.created_at).toLocaleDateString()}</td>
                )}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <CopyButton value={shortUrlFor(url)} />
                    <a
                      href={shortUrlFor(url)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-ink-700 px-2 py-1 text-xs font-medium text-ink-300 hover:border-ink-600 hover:text-white"
                    >
                      Open
                    </a>
                    <button
                      onClick={() => setQrTarget(url)}
                      className="rounded-md border border-ink-700 px-2 py-1 text-xs font-medium text-ink-300 hover:border-ink-600 hover:text-white"
                    >
                      QR
                    </button>
                    {!compact && (
                      <>
                        <button
                          onClick={() => toggleActive.mutate(url)}
                          disabled={toggleActive.isPending}
                          className="rounded-md border border-ink-700 px-2 py-1 text-xs font-medium text-ink-300 hover:border-ink-600 hover:text-white disabled:opacity-60"
                        >
                          {url.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <DeleteButton
                          isDeleting={deleteUrl.isPending}
                          onConfirm={() => deleteUrl.mutate(url.id)}
                        />
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
