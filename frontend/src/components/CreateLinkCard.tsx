import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { api, getApiErrorMessage } from '../lib/api'
import type { UrlCreateResponse } from '../types'
import { CopyButton } from './CopyButton'

interface CreateLinkCardProps {
  onCreated?: (result: UrlCreateResponse) => void
  compact?: boolean
}

export function CreateLinkCard({ onCreated, compact = false }: CreateLinkCardProps) {
  const [originalUrl, setOriginalUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [showAlias, setShowAlias] = useState(false)
  const [result, setResult] = useState<UrlCreateResponse | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: { original_url: string; custom_alias?: string } = { original_url: originalUrl }
      if (customAlias.trim()) payload.custom_alias = customAlias.trim()
      const res = await api.post<UrlCreateResponse>('/api/v1/urls', payload)
      return res.data
    },
    onSuccess: (data) => {
      setResult(data)
      setOriginalUrl('')
      setCustomAlias('')
      onCreated?.(data)
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setResult(null)
    mutation.mutate()
  }

  return (
    <div className={`rounded-2xl border border-ink-800 bg-ink-900/60 p-6 ${compact ? '' : 'shadow-2xl shadow-black/20'}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-400">Long URL</label>
          <input
            type="text"
            required
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            placeholder="https://example.com/your-long-link"
            className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-white placeholder:text-ink-500 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {showAlias ? (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-400">Custom alias (optional)</label>
            <input
              type="text"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
              placeholder="my-cool-link"
              className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-white placeholder:text-ink-500 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAlias(true)}
            className="text-xs font-medium text-brand-400 hover:text-brand-300"
          >
            + Use a custom alias
          </button>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mutation.isPending ? 'Shortening…' : 'Shorten link'}
        </button>

        {mutation.isError && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {getApiErrorMessage(mutation.error)}
          </p>
        )}
      </form>

      {result && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-brand-500/30 bg-brand-500/10 px-3.5 py-3">
          <a
            href={result.short_url}
            target="_blank"
            rel="noreferrer"
            className="truncate font-mono text-sm font-medium text-brand-300 hover:underline"
          >
            {result.short_url}
          </a>
          <CopyButton value={result.short_url} />
        </div>
      )}
    </div>
  )
}
