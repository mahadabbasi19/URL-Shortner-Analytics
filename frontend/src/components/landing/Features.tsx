import { Globe2, Link2, MonitorSmartphone, Radar, ShieldCheck, TrendingUp, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactElement } from 'react'

interface Feature {
  icon: LucideIcon
  title: string
  body: string
  big?: boolean
  visual?: 'latency' | 'chart' | 'geo' | 'device'
}

const FEATURES: Feature[] = [
  {
    icon: TrendingUp,
    title: 'Understand every click',
    body: 'Watch clicks roll in as they happen, with clear trend charts you can scan in seconds.',
    big: true,
    visual: 'chart',
  },
  {
    icon: Zap,
    title: 'Instant redirects',
    body: 'Visitors reach their destination in milliseconds — no delay, no broken hops.',
    visual: 'latency',
  },
  {
    icon: Link2,
    title: 'Links that never collide',
    body: 'Every short link is guaranteed unique, so nothing ever gets silently overwritten.',
  },
  {
    icon: Globe2,
    title: 'Know your audience',
    body: 'See which countries and cities your traffic comes from, at a glance.',
    visual: 'geo',
  },
  {
    icon: MonitorSmartphone,
    title: 'Device & browser breakdown',
    body: 'Understand whether people click from mobile, desktop, or tablet — and which browser.',
    visual: 'device',
  },
  {
    icon: Radar,
    title: 'Referrer tracking',
    body: 'Know exactly where clicks come from — search, social, or a direct share.',
  },
  {
    icon: ShieldCheck,
    title: 'Built to stay up',
    body: 'A resilient architecture keeps your links working, even when traffic spikes.',
  },
]

function LatencyVisual() {
  const bars = [30, 55, 40, 70, 45, 85, 60]
  return (
    <div className="flex h-14 items-end gap-1.5">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-2 rounded-full bg-gradient-to-t from-brand/40 to-brand-2"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  )
}

function ChartVisual() {
  const points = [20, 35, 28, 45, 38, 58, 48, 65, 55, 78]
  const max = Math.max(...points)
  const path = points
    .map((p, i) => `${(i / (points.length - 1)) * 100},${100 - (p / max) * 100}`)
    .join(' ')
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-16 w-full">
      <polyline points={path} fill="none" stroke="#8D72FF" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function GeoVisual() {
  const rows = [
    { c: 'United States', pct: 42 },
    { c: 'Germany', pct: 24 },
    { c: 'India', pct: 16 },
  ]
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.c} className="flex items-center gap-2 text-xs">
          <span className="w-20 shrink-0 truncate text-text-secondary">{r.c}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-brand-2" style={{ width: `${r.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DeviceVisual() {
  return (
    <div className="flex items-center gap-3">
      {[
        { l: 'Desktop', v: 54 },
        { l: 'Mobile', v: 39 },
        { l: 'Tablet', v: 7 },
      ].map((d) => (
        <div key={d.l} className="flex flex-col items-center gap-1.5">
          <div className="relative h-12 w-12 rounded-full border-4 border-surface-2">
            <div
              className="absolute inset-0 rounded-full border-4 border-brand"
              style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`, opacity: d.v / 60 }}
            />
          </div>
          <span className="text-[10px] text-text-muted">{d.l}</span>
        </div>
      ))}
    </div>
  )
}

const visuals: Record<string, () => ReactElement> = {
  latency: LatencyVisual,
  chart: ChartVisual,
  geo: GeoVisual,
  device: DeviceVisual,
}

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6 sm:py-28">
      <div className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-2">Features</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-text sm:text-4xl">
          More than a shorter link.
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
          Every link comes with the insight to back it up — built in, not bolted on.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => {
          const Visual = f.visual ? visuals[f.visual] : null
          return (
            <div
              key={f.title}
              className={`rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-border-strong ${
                f.big ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2' : ''
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand-2">
                <f.icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-text">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">{f.body}</p>
              {Visual && (
                <div className="mt-5 rounded-lg border border-border bg-bg p-4">
                  <Visual />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
