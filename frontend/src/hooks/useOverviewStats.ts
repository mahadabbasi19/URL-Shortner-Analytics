import { useQueries } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { ClicksOverTimePoint, NamedCount, UrlAnalytics, UrlItem } from '../types'

// Aggregating "clicks today" / "unique visitors" across an account requires
// one analytics call per link (the backend only exposes analytics per-URL,
// not account-wide — see README "Roadmap"). Capped to bound the number of
// parallel requests for accounts with many links; still real data for
// every link actually included, never fabricated.
const MAX_LINKS_FOR_AGGREGATION = 25

function mergeClicksOverTime(series: ClicksOverTimePoint[][]): ClicksOverTimePoint[] {
  const byDate = new Map<string, number>()
  for (const points of series) {
    for (const point of points) {
      byDate.set(point.date, (byDate.get(point.date) ?? 0) + point.count)
    }
  }
  return Array.from(byDate.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function mergeNamedCounts(groups: NamedCount[][], limit = 5): NamedCount[] {
  const byName = new Map<string, number>()
  for (const items of groups) {
    for (const item of items) {
      byName.set(item.name, (byName.get(item.name) ?? 0) + item.count)
    }
  }
  return Array.from(byName.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export function useOverviewStats(urls: UrlItem[] | undefined) {
  const sample = (urls ?? []).slice(0, MAX_LINKS_FOR_AGGREGATION)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  const startParam = startDate.toISOString().slice(0, 10)

  const queries = useQueries({
    queries: sample.map((url) => ({
      queryKey: ['analytics', url.id, '30'],
      queryFn: async () => (await api.get<UrlAnalytics>(`/api/v1/urls/${url.id}/analytics`, {
        params: { start_date: startParam },
      })).data,
      enabled: sample.length > 0,
    })),
  })

  const isLoading = sample.length > 0 && queries.some((q) => q.isLoading)
  const results = queries.map((q) => q.data).filter((d): d is UrlAnalytics => Boolean(d))

  return {
    isLoading,
    clicksToday: results.reduce((sum, r) => sum + r.clicks_today, 0),
    uniqueVisitors: results.reduce((sum, r) => sum + r.unique_visitors, 0),
    clicksOverTime: mergeClicksOverTime(results.map((r) => r.clicks_over_time)),
    topReferrers: mergeNamedCounts(results.map((r) => r.top_referrers)),
    topCountries: mergeNamedCounts(results.map((r) => r.top_countries)),
    isPartial: (urls?.length ?? 0) > MAX_LINKS_FOR_AGGREGATION,
  }
}
