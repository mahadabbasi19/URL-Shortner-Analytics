import { Link } from 'react-router-dom'
import { Logo } from '../Logo'

const GITHUB_URL = 'https://github.com/mahadabbasi19/URL-Shortner-Analytics'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Analytics', href: '/#analytics' },
      { label: 'Get started', href: '/register' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: `${GITHUB_URL}#readme`, external: true },
      { label: 'GitHub', href: GITHUB_URL, external: true },
      { label: 'System design', href: `${GITHUB_URL}/blob/main/docs/system-design.md`, external: true },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-text-secondary">
              Short links with clear insights — create, share, and understand every click.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{col.title}</h4>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[13px] text-text-secondary transition-colors hover:text-text"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.href} className="text-[13px] text-text-secondary transition-colors hover:text-text">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Snip. All rights reserved.</p>
          <p>Built with FastAPI, PostgreSQL, Redis, and React.</p>
        </div>
      </div>
    </footer>
  )
}
