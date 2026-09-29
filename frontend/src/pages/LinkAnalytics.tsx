import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, Pencil, QrCode, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ClicksChart } from '../components/ClicksChart'
import { CopyButton } from '../components/CopyButton'
import { DeleteButton } from '../components/DeleteButton'
import { EditLinkDialog } from '../components/EditLinkDialog'
import { QrModal } from '../components/QrModal'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import { TopList } from '../components/TopList'
import { Skeleton } from '../components/ui/Skeleton'
import { useToast } from '../components/ui/Toast'
import { API_BASE_URL, api, getApiErrorMessage } from '../lib/api'
import { formatCompactNumber } from '../lib/format'
import type { UrlAnalytics, UrlItem } from '../types'
import { useMutation, useQueryClient } from '@tanstack/react-query'

type RangeKey = '1' | '7' | '30' | 'all'

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '1', label: '24H' },
  { key: '7', label: '7D' },
  { key: '30', label: '30D' },
  { key: 'all', label: 'All time' },
]

function startDateFor(range: RangeKey): string | undefined {
  if (range === 'all') return undefined
  const d = new Date()
  d.setDate(d.getDate() - Number(range))
  return d.toISOString().slice(0, 10)
}

export function LinkAnalytics() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { show } = useToast()
  const [range, setRange] = useState<RangeKey>('7')
  const [showQr, setShowQr] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const { data: url, isLoading: urlLoading } = useQuery({
    queryKey: ['url', id],
    queryFn: async () => (await api.get<UrlItem>(`/api/v1/urls/${id}`)).data,
  })

  const {
    data: analytics,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['analytics', id, range],
    queryFn: async () => {
      const startDate = startDateFor(range)
      const res = await api.get<UrlAnalytics>(`/api/v1/urls/${id}/analytics`, {
        params: startDate ? { start_date: startDate } : {},
      })
      return res.data
    },
    enabled: Boolean(url),
  })

  const deleteUrl = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/v1/urls/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urls'] })
      show('Link deleted.')
      navigate('/links')
    },
    onError: (err) => show(getApiErrorMessage(err), 'error'),
  })

  if (urlLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-56" />
      </div>
    )
  }

  if (!url) return null

  const shortUrl = `${API_BASE_URL}/${url.short_code}`

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/links"
          className="inline-flex items-center gap-1 text-xs font-medium text-text-muted transition-colors hover:text-text-secondary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Links
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-xl font-semibold text-text">{url.short_code}</h1>
          <StatusBadge url={url} />
        </div>
        <p className="mt-1 max-w-2xl truncate text-[13px] text-text-secondary" title={url.original_url}>
          {url.original_url}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CopyButton value={shortUrl} />
          <a
            href={shortUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </a>
          <button
            onClick={() => setShowQr(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text"
          >
            <QrCode className="h-3.5 w-3.5" />
            QR code
          </button>
          <button
            onClick={() => setShowEdit(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <DeleteButton isDeleting={deleteUrl.isPending} onConfirm={() => deleteUrl.mutate()} />
        </div>
      </div>

      <div className="flex gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              range === r.key
                ? 'bg-brand text-white'
                : 'border border-border text-text-secondary hover:border-border-strong hover:text-text'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {isError && (
        <p className="rounded-lg border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
          Failed to load analytics.
        </p>
      )}

      {isLoading && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-56 rounded-xl" />
        </div>
      )}

      {analytics && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total clicks" value={formatCompactNumber(analytics.total_clicks)} />
            <StatCard
              label="Unique visitors"
              value={formatCompactNumber(analytics.unique_visitors)}
              hint="Approximate"
              icon={Users}
            />
            <StatCard label="Clicks today" value={formatCompactNumber(analytics.clicks_today)} />
          </div>

          <ClicksChart data={analytics.clicks_over_time} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TopList title="Top referrers" items={analytics.top_referrers} />
            <TopList title="Top countries" items={analytics.top_countries} />
            <TopList title="Top cities" items={analytics.top_cities} />
            <TopList title="Browsers" items={analytics.browsers} />
            <TopList title="Operating systems" items={analytics.operating_systems} />
            <TopList title="Devices" items={analytics.devices} />
          </div>
        </>
      )}

      {showQr && <QrModal urlId={url.id} shortUrl={shortUrl} onClose={() => setShowQr(false)} />}
      {showEdit && <EditLinkDialog url={url} onClose={() => setShowEdit(false)} />}
    </div>
  )
}
