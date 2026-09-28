import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ClicksOverTimePoint } from '../types'

export function ClicksChart({ data }: { data: ClicksOverTimePoint[] }) {
  const points = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    count: d.count,
  }))

  if (points.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-2xl border border-ink-800 bg-ink-900/60">
        <p className="text-sm text-ink-500">No clicks yet in this range.</p>
      </div>
    )
  }

  return (
    <div className="h-56 rounded-2xl border border-ink-800 bg-ink-900/60 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b74ff" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#8b74ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#212133" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#8888a3', fontSize: 12 }} axisLine={{ stroke: '#34344a' }} tickLine={false} />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#8888a3', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: '#131320',
              border: '1px solid #34344a',
              borderRadius: 8,
              fontSize: 12,
              color: '#eeeef5',
            }}
            labelStyle={{ color: '#8888a3' }}
          />
          <Area type="monotone" dataKey="count" stroke="#8b74ff" strokeWidth={2} fill="url(#clicksFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
