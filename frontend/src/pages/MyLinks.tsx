import { CreateLinkCard } from '../components/CreateLinkCard'
import { LinksTable } from '../components/LinksTable'
import { useUrls } from '../hooks/useUrls'

export function MyLinks() {
  const { data: urls, isLoading, isError } = useUrls()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Links</h1>
        <p className="mt-1 text-sm text-ink-400">Create, manage, and track every link on your account.</p>
      </div>

      <CreateLinkCard />

      {isLoading && (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-700 border-t-brand-400" />
        </div>
      )}
      {isError && <p className="text-sm text-red-400">Failed to load your links. Please refresh.</p>}
      {urls && <LinksTable urls={urls} />}
    </div>
  )
}
