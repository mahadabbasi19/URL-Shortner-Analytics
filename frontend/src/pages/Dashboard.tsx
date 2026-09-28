import { Link } from 'react-router-dom'
import { CreateLinkCard } from '../components/CreateLinkCard'
import { LinksTable } from '../components/LinksTable'
import { StatCard } from '../components/StatCard'
import { useUrls } from '../hooks/useUrls'
import { useAuth } from '../lib/auth'

export function Dashboard() {
  const { user } = useAuth()
  const { data: urls, isLoading, isError } = useUrls()

  const totalClicks = urls?.reduce((sum, u) => sum + u.total_clicks, 0) ?? 0
  const activeCount = urls?.filter((u) => u.is_active).length ?? 0
  const recent = urls?.slice(0, 5) ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome back{user ? `, ${user.email.split('@')[0]}` : ''}</h1>
        <p className="mt-1 text-sm text-ink-400">Here's how your links are doing.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total links" value={urls?.length ?? (isLoading ? '—' : 0)} />
        <StatCard label="Total clicks" value={totalClicks} />
        <StatCard label="Active links" value={activeCount} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-start">
        <CreateLinkCard compact />
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent links</h2>
            <Link to="/links" className="text-xs font-medium text-brand-400 hover:underline">
              View all →
            </Link>
          </div>
          {isError && <p className="text-sm text-red-400">Failed to load your links.</p>}
          {!isError && <LinksTable urls={recent} compact />}
        </div>
      </div>
    </div>
  )
}
