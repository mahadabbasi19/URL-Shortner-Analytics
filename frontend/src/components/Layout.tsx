import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-bold text-white">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-sm">
        S
      </span>
      <span className="text-lg tracking-tight">Snip</span>
    </Link>
  )
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-ink-800 text-white' : 'text-ink-400 hover:text-white'
  }`

export function Layout() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="sticky top-0 z-10 border-b border-ink-800/80 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Logo />
            {isAuthenticated && (
              <nav className="hidden items-center gap-1 sm:flex">
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/links" className={navLinkClass}>
                  My Links
                </NavLink>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="hidden text-sm text-ink-400 sm:inline">{user?.email}</span>
                <button
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                  className="rounded-lg border border-ink-700 px-3 py-1.5 text-sm font-medium text-ink-200 transition-colors hover:border-ink-600 hover:text-white"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-300 hover:text-white"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-brand-500 px-3.5 py-1.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-400"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
