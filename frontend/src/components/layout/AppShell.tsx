import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Logo } from '../Logo'
import { SidebarContent } from './Sidebar'

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-surface md:block">
        <SidebarContent />
      </aside>

      {/* Mobile topbar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg/90 px-4 backdrop-blur-md md:hidden">
        <Logo size={22} />
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="animate-slide-up absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-border bg-surface">
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-2"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <main className="md:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
