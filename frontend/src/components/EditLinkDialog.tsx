import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { api, getApiErrorMessage } from '../lib/api'
import type { UrlItem } from '../types'
import { Button } from './ui/Button'
import { Dialog } from './ui/Dialog'
import { Input } from './ui/Input'
import { useToast } from './ui/Toast'

function toLocalInputValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function EditLinkDialog({ url, onClose }: { url: UrlItem; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { show } = useToast()
  const [title, setTitle] = useState(url.title ?? '')
  const [expiresAt, setExpiresAt] = useState(toLocalInputValue(url.expires_at))
  const [isActive, setIsActive] = useState(url.is_active)

  const mutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/api/v1/urls/${url.id}`, {
        title: title.trim() || null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: isActive,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['url', url.id] })
      queryClient.invalidateQueries({ queryKey: ['urls'] })
      show('Link updated.')
      onClose()
    },
    onError: (err) => show(getApiErrorMessage(err), 'error'),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <Dialog open onClose={onClose} title="Edit link" description={url.short_code}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title" placeholder="Optional label" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input
          label="Expires on"
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          hint="Leave blank for no expiration."
        />
        <label className="flex items-center gap-2.5 text-[13px] text-text">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-border-strong bg-surface-2 accent-brand"
          />
          Link is active
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {mutation.isPending ? 'Saving' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
