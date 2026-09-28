import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

interface QrModalProps {
  urlId: string
  shortUrl: string
  onClose: () => void
}

export function QrModal({ urlId, shortUrl, onClose }: QrModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['qr', urlId],
    queryFn: async () => {
      // The QR endpoint requires auth (a Bearer header), so it can't be
      // used directly as an <img src>; fetch the PNG bytes and turn them
      // into a local blob URL instead.
      const res = await api.get<Blob>(`/api/v1/urls/${urlId}/qr`, { responseType: 'blob' })
      return res.data
    },
  })

  useEffect(() => {
    if (!data) return
    const url = URL.createObjectURL(data)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [data])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-xs rounded-2xl border border-ink-800 bg-ink-900 p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-white">QR code</h3>
        <p className="mt-1 truncate font-mono text-xs text-ink-500">{shortUrl}</p>

        <div className="mx-auto mt-4 flex h-48 w-48 items-center justify-center rounded-xl bg-white p-3">
          {isLoading && <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-300 border-t-brand-500" />}
          {isError && <p className="text-xs text-red-500">Failed to load QR code.</p>}
          {objectUrl && <img src={objectUrl} alt={`QR code for ${shortUrl}`} className="h-full w-full" />}
        </div>

        <div className="mt-4 flex justify-center gap-2">
          {objectUrl && (
            <a
              href={objectUrl}
              download="qr-code.png"
              className="rounded-lg border border-ink-700 px-3 py-1.5 text-xs font-medium text-ink-200 hover:border-ink-600 hover:text-white"
            >
              Download
            </a>
          )}
          <button
            onClick={onClose}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
