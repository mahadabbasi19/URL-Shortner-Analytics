import { Outlet } from 'react-router-dom'
import { Footer } from './Footer'
import { PublicHeader } from './PublicHeader'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <Outlet />
      <Footer />
    </div>
  )
}
