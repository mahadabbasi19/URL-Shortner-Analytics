import { Link2, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CreateLinkDialog } from '../components/CreateLinkDialog'
import { LinksTable } from '../components/LinksTable'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { useUrls } from '../hooks/useUrls'

export function MyLinks() {
  const { data: urls, isLoading, isError, refetch } = useUrls()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!urls) return []
    const q = search.trim().toLowerCase()
    if (!q) return urls
    return urls.filter(
      (u) =>
        u.short_code.toLowerCase().includes(q) ||
        u.original_url.toLowerCase().includes(q) ||
        (u.title ?? '').toLowerCase().includes(q),
    )
  }, [urls, search])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text">Links</h1>
          <p className="mt-0.5 text-[13px] text-text-secondary">Create, manage, and track every link on your account.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Create link
        </Button>
      </div>

      {(urls?.length ?? 0) > 0 && (
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Search links…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      )}

      {isError && <ErrorState description="We couldn't load your links." onRetry={() => refetch()} />}

      {!isError && isLoading && <LinksTable urls={[]} isLoading />}

      {!isError && !isLoading && urls && urls.length === 0 && (
        <EmptyState
          icon={Link2}
          title="No links yet"
          description="Create your first short link and start tracking clicks."
          action={
            <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Create link
            </Button>
          }
        />
      )}

      {!isError && !isLoading && urls && urls.length > 0 && filtered.length === 0 && (
        <EmptyState icon={Search} title="No matching links" description="Try a different search term." />
      )}

      {!isError && !isLoading && filtered.length > 0 && <LinksTable urls={filtered} />}

      <CreateLinkDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
