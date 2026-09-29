import { Link2, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClicksChart } from '../components/ClicksChart'
import { CreateLinkDialog } from '../components/CreateLinkDialog'
import { LinksTable } from '../components/LinksTable'
import { StatCard } from '../components/StatCard'
import { TopList } from '../components/TopList'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorState } from '../components/ui/EmptyState'
import { useOverviewStats } from '../hooks/useOverviewStats'
import { useUrls } from '../hooks/useUrls'
import { useAuth } from '../lib/auth'
import { formatCompactNumber } from '../lib/format'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard() {
  const { user } = useAuth()
  const { data: urls, isLoading, isError, refetch } = useUrls()
  const stats = useOverviewStats(urls)
  const [dialogOpen, setDialogOpen] = useState(false)

  const totalClicks = urls?.reduce((sum, u) => sum + u.total_clicks, 0) ?? 0
  const recent = urls?.slice(0, 5) ?? []
  const hasLinks = (urls?.length ?? 0) > 0

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text">
            {greeting()}
            {user ? `, ${user.email.split('@')[0]}` : ''}
          </h1>
          <p className="mt-0.5 text-[13px] text-text-secondary">Here's how your links are performing.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Create link
        </Button>
      </div>

      {isError && <ErrorState description="We couldn't load your dashboard." onRetry={() => refetch()} />}

      {!isError && !isLoading && !hasLinks && (
        <EmptyState
          icon={Link2}
          title="No links yet"
          description="Create your first short link and start tracking clicks."
          action={
            <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Create link
            </Button>
          }
        />
      )}

      {!isError && (isLoading || hasLinks) && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Total links" value={urls?.length ?? 0} loading={isLoading} />
            <StatCard label="Total clicks" value={formatCompactNumber(totalClicks)} loading={isLoading} />
            <StatCard
              label="Clicks (30d)"
              value={formatCompactNumber(stats.clicksOverTime.reduce((s, p) => s + p.count, 0))}
              loading={isLoading || stats.isLoading}
            />
            <StatCard
              label="Unique visitors (30d)"
              value={formatCompactNumber(stats.uniqueVisitors)}
              loading={isLoading || stats.isLoading}
              hint="Approximate"
            />
          </div>

          <ClicksChart data={stats.clicksOverTime} title="Clicks — last 30 days" />

          {(stats.topReferrers.length > 0 || stats.topCountries.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TopList title="Top referrers" items={stats.topReferrers} />
              <TopList title="Top countries" items={stats.topCountries} />
            </div>
          )}

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">Recent links</h2>
              <Link to="/links" className="text-xs font-medium text-brand-2 hover:underline">
                View all →
              </Link>
            </div>
            <LinksTable urls={recent} compact isLoading={isLoading} />
          </div>
        </>
      )}

      <CreateLinkDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
