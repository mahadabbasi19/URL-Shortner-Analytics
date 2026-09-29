import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ClicksOverTimePoint } from '../types'
import { Card } from './ui/Card'

export function ClicksChart({ data, title = 'Clicks' }: { data: ClicksOverTimePoint[]; title?: string }) {
  const points = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    count: d.count,
  }))

  return (
    <Card className="p-5">
      <p className="text-xs font-medium text-text-muted">{title}</p>
      {points.length === 0 ? (
        <div className="flex h-56 items-center justify-center">
          <p className="text-sm text-text-muted">No clicks yet in this range.</p>
        </div>
      ) : (
        <div className="mt-2 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8D72FF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#8D72FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#666B78', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#666B78', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: '#11141B',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  fontSize: 12,
                  color: '#F7F8FA',
                }}
                labelStyle={{ color: '#9499A8' }}
                cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
              />
              <Area type="monotone" dataKey="count" stroke="#8D72FF" strokeWidth={2} fill="url(#clicksFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
