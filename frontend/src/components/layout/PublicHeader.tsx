import { Code2, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Logo } from '../Logo'
import { useAuth } from '../../lib/auth'

const GITHUB_URL = 'https://github.com/mahadabbasi19/URL-Shortner-Analytics'

const NAV_LINKS = [
  { label: 'Product', href: '/#product' },
  { label: 'Features', href: '/#features' },
  { label: 'Analytics', href: '/#analytics' },
]

export function PublicHeader() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-lg px-3 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:text-text"
            >
              {link.label}
            </a>
          ))}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:text-text"
          >
            <Code2 className="h-3.5 w-3.5" />
            Developers
          </a>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <Button size="sm" onClick={() => navigate('/dashboard')}>
              Go to dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Log in
              </Button>
              <Button size="sm" onClick={() => navigate('/register')}>
                Get started
              </Button>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary md:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="animate-slide-up border-t border-border bg-bg px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-2 hover:text-text"
              >
                {link.label}
              </a>
            ))}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-2 hover:text-text"
            >
              Developers
            </a>
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')}>Go to dashboard</Button>
            ) : (
              <>
                <Button variant="secondary" onClick={() => navigate('/login')}>
                  Log in
                </Button>
                <Button onClick={() => navigate('/register')}>Get started</Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
