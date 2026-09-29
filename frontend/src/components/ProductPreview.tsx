import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { Card } from './ui/Card'

const TREND = [
  { v: 12 }, { v: 18 }, { v: 15 }, { v: 24 }, { v: 21 }, { v: 32 }, { v: 28 },
  { v: 38 }, { v: 34 }, { v: 46 }, { v: 41 }, { v: 52 }, { v: 49 }, { v: 61 },
]

const REFERRERS = [
  { name: 'Direct', pct: 38 },
  { name: 'Google', pct: 27 },
  { name: 'X / Twitter', pct: 18 },
  { name: 'LinkedIn', pct: 11 },
]

const DEVICES = [
  { name: 'Desktop', pct: 54 },
  { name: 'Mobile', pct: 39 },
  { name: 'Tablet', pct: 7 },
]

export function ProductPreview() {
  return (
    <Card className="overflow-hidden p-1.5 shadow-2xl shadow-black/30">
      <div className="rounded-[10px] bg-bg p-4 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-muted">Clicks</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-text">24,891</p>
              </div>
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                +18.2%
              </span>
            </div>
            <div className="mt-4 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TREND} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="previewFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C5CFC" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#7C5CFC" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="#8D72FF" strokeWidth={2} fill="url(#previewFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-medium text-text-muted">Countries</p>
              <p className="mt-1 text-xl font-semibold text-text">42</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-medium text-text-muted">Unique visitors</p>
              <p className="mt-1 text-xl font-semibold text-text">9,204</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs font-medium text-text-muted">Top referrers</p>
            <div className="mt-3 space-y-2.5">
              {REFERRERS.map((r) => (
                <div key={r.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{r.name}</span>
                    <span className="font-mono text-text-muted">{r.pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs font-medium text-text-muted">Devices</p>
            <div className="mt-3 space-y-2.5">
              {DEVICES.map((d) => (
                <div key={d.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{d.name}</span>
                    <span className="font-mono text-text-muted">{d.pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-brand-2" style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
