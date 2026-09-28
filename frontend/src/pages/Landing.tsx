import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CreateLinkCard } from '../components/CreateLinkCard'

const FEATURES = [
  {
    title: 'Collision-resistant links',
    body: 'Base62 codes from a CSPRNG, with the database — not a guess — as the final word on uniqueness.',
  },
  {
    title: 'Sub-millisecond redirects',
    body: 'A Redis cache-aside layer in front of Postgres, with graceful fallback if the cache is ever down.',
  },
  {
    title: 'Real analytics',
    body: 'Referrer, device, browser, and geo breakdowns — computed with SQL aggregation, not client-side counting.',
  },
]

export function Landing() {
  const [createdShortUrl, setCreatedShortUrl] = useState<string | null>(null)

  return (
    <div className="space-y-20 pb-10">
      <section className="grid gap-10 pt-10 lg:grid-cols-2 lg:items-center lg:pt-16">
        <div>
          <span className="inline-flex items-center rounded-full border border-ink-700 bg-ink-900 px-3 py-1 text-xs font-medium text-ink-300">
            FastAPI · PostgreSQL · Redis
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Short links, <span className="text-brand-400">built like a product</span>, not a demo.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-400">
            Shorten a URL, share it anywhere, and watch clicks, referrers, and devices roll in — backed by a
            redirect path designed for speed from day one.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-400"
            >
              Create a free account
            </Link>
            <a
              href="#try-it"
              className="rounded-xl border border-ink-700 px-5 py-3 text-sm font-semibold text-ink-200 transition-colors hover:border-ink-600 hover:text-white"
            >
              Try it without signing up
            </a>
          </div>
        </div>
        <div id="try-it">
          <CreateLinkCard onCreated={(res) => setCreatedShortUrl(res.short_url)} />
          {createdShortUrl && (
            <p className="mt-3 text-center text-sm text-ink-400">
              Anonymous links aren't saved to an account —{' '}
              <Link to="/register" className="text-brand-400 hover:underline">
                sign up
              </Link>{' '}
              to manage and track this one long-term.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-ink-800 bg-ink-900/60 p-6">
            <h3 className="font-semibold text-white">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-400">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
