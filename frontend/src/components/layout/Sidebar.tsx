import { LayoutDashboard, Link2, LogOut } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Logo } from '../Logo'
import { useAuth } from '../../lib/auth'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/links', label: 'Links', icon: Link2 },
]

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
    onNavigate?.()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                isActive ? 'bg-surface-2 text-text' : 'text-text-secondary hover:bg-surface-2 hover:text-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`h-4 w-4 ${isActive ? 'text-brand-2' : 'text-text-muted group-hover:text-text-secondary'}`}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand-2">
            {user?.email.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-text">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
            className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
