import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ClicksChart } from '../components/ClicksChart'
import { CopyButton } from '../components/CopyButton'
import { QrModal } from '../components/QrModal'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import { TopList } from '../components/TopList'
import { API_BASE_URL, api } from '../lib/api'
import type { UrlAnalytics, UrlItem } from '../types'

type RangeKey = '1' | '7' | '30' | 'all'

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '1', label: '24h' },
  { key: '7', label: '7 days' },
  { key: '30', label: '30 days' },
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
  const [range, setRange] = useState<RangeKey>('7')
  const [showQr, setShowQr] = useState(false)

  const { data: url } = useQuery({
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
  })

  if (!url) return null

  const shortUrl = `${API_BASE_URL}/${url.short_code}`

  return (
    <div className="space-y-6">
      <div>
        <Link to="/links" className="text-xs font-medium text-ink-500 hover:text-ink-300">
          ← Back to My Links
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-xl font-bold text-white">/{url.short_code}</h1>
          <StatusBadge url={url} />
        </div>
        <p className="mt-1 max-w-2xl truncate text-sm text-ink-400">{url.original_url}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton value={shortUrl} />
          <a
            href={shortUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-ink-700 px-2.5 py-1 text-xs font-medium text-ink-300 hover:border-ink-600 hover:text-white"
          >
            Open
          </a>
          <button
            onClick={() => setShowQr(true)}
            className="rounded-md border border-ink-700 px-2.5 py-1 text-xs font-medium text-ink-300 hover:border-ink-600 hover:text-white"
          >
            View QR
          </button>
        </div>
      </div>

      <div className="flex gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              range === r.key ? 'bg-brand-500 text-white' : 'border border-ink-700 text-ink-300 hover:text-white'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {isError && <p className="text-sm text-red-400">Failed to load analytics.</p>}

      {isLoading && (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-700 border-t-brand-400" />
        </div>
      )}

      {analytics && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total clicks" value={analytics.total_clicks} />
            <StatCard label="Unique visitors" value={analytics.unique_visitors} hint="Approximate, hash-based" />
            <StatCard label="Clicks today" value={analytics.clicks_today} />
          </div>

          <ClicksChart data={analytics.clicks_over_time} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TopList title="Top Referrers" items={analytics.top_referrers} />
            <TopList title="Top Countries" items={analytics.top_countries} />
            <TopList title="Top Cities" items={analytics.top_cities} />
            <TopList title="Browsers" items={analytics.browsers} />
            <TopList title="Operating Systems" items={analytics.operating_systems} />
            <TopList title="Devices" items={analytics.devices} />
          </div>
        </>
      )}

      {showQr && <QrModal urlId={url.id} shortUrl={shortUrl} onClose={() => setShowQr(false)} />}
    </div>
  )
}
