import { useMutation } from '@tanstack/react-query'
import { ArrowRight, BarChart3, ChevronDown, ExternalLink, Link2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { api, getApiErrorMessage } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { UrlCreateResponse } from '../types'
import { CopyButton } from './CopyButton'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { useToast } from './ui/Toast'

interface CreateLinkCardProps {
  onCreated?: (result: UrlCreateResponse) => void
  variant?: 'hero' | 'compact' | 'bare'
}

export function CreateLinkCard({ onCreated, variant = 'hero' }: CreateLinkCardProps) {
  const { isAuthenticated } = useAuth()
  const { show } = useToast()
  const [originalUrl, setOriginalUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [showCustomize, setShowCustomize] = useState(false)
  const [result, setResult] = useState<UrlCreateResponse | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: { original_url: string; custom_alias?: string; expires_at?: string } = {
        original_url: originalUrl.trim(),
      }
      if (customAlias.trim()) payload.custom_alias = customAlias.trim()
      if (expiresAt) payload.expires_at = new Date(expiresAt).toISOString()
      const res = await api.post<UrlCreateResponse>('/api/v1/urls', payload)
      return res.data
    },
    onSuccess: (data) => {
      setResult(data)
      setOriginalUrl('')
      setCustomAlias('')
      setExpiresAt('')
      setShowCustomize(false)
      onCreated?.(data)
    },
    onError: (err) => show(getApiErrorMessage(err), 'error'),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setResult(null)
    mutation.mutate()
  }

  if (result) {
    return (
      <div
        className={
          variant === 'bare'
            ? 'animate-scale-in'
            : 'animate-scale-in rounded-2xl border border-border bg-surface p-5 sm:p-6'
        }
      >
        <div className="flex items-center gap-2 text-xs font-medium text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Your link is ready
        </div>

        <p className="mt-3 truncate text-xs text-text-muted" title={result.original_url}>
          {result.original_url}
        </p>
        <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-border-strong bg-surface-2 px-3.5 py-3">
          <Link2 className="h-4 w-4 shrink-0 text-brand-2" />
          <a
            href={result.short_url}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 truncate font-mono text-sm font-medium text-text hover:text-brand-2"
          >
            {result.short_url.replace(/^https?:\/\//, '')}
          </a>
          <CopyButton value={result.short_url} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            href={result.short_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </a>
          {isAuthenticated && (
            <RouterLink
              to={`/links/${result.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              View analytics
            </RouterLink>
          )}
          <button
            onClick={() => setResult(null)}
            className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text-secondary"
          >
            Create another
          </button>
          {!isAuthenticated && (
            <RouterLink
              to="/register"
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-brand-2 hover:underline"
            >
              Sign up to save &amp; track this link
              <ArrowRight className="h-3 w-3" />
            </RouterLink>
          )}
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        variant === 'hero'
          ? 'rounded-2xl border border-border bg-surface p-5 shadow-2xl shadow-black/20 sm:p-6'
          : variant === 'compact'
            ? 'rounded-xl border border-border bg-surface p-4'
            : ''
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          required
          autoFocus={variant === 'bare'}
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          placeholder="Paste your long URL…"
          className="h-11 flex-1 rounded-lg border border-border bg-surface-2 px-3.5 text-sm text-text placeholder:text-text-muted outline-none transition-colors focus:border-brand focus:ring-4 focus:ring-brand/15"
        />
        <Button type="submit" size="lg" loading={mutation.isPending} className="sm:w-auto">
          {mutation.isPending ? 'Shortening' : 'Shorten'}
        </Button>
      </div>

      <button
        type="button"
        onClick={() => setShowCustomize((v) => !v)}
        className="mt-3 inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-text-secondary hover:text-text"
      >
        Customize link
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showCustomize ? 'rotate-180' : ''}`} />
      </button>

      {showCustomize && (
        <div className="animate-slide-up mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
          <Input
            label="Custom alias"
            placeholder="my-link"
            value={customAlias}
            onChange={(e) => setCustomAlias(e.target.value)}
            mono
          />
          <Input
            label="Expires on"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
      )}
    </form>
  )
}
