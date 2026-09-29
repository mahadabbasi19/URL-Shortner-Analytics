import { useQuery } from '@tanstack/react-query'
import { Download, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { Dialog } from './ui/Dialog'

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
    <Dialog open onClose={onClose} title="QR code" description={shortUrl} maxWidth="max-w-xs">
      <div className="flex flex-col items-center">
        <div className="flex h-52 w-52 items-center justify-center rounded-xl bg-white p-4">
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-text-muted" />}
          {isError && <p className="text-xs text-danger">Failed to load QR code.</p>}
          {objectUrl && <img src={objectUrl} alt={`QR code for ${shortUrl}`} className="h-full w-full" />}
        </div>

        {objectUrl && (
          <a
            href={objectUrl}
            download="snip-qr-code.png"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3.5 py-2 text-xs font-medium text-text transition-colors hover:border-border-strong"
          >
            <Download className="h-3.5 w-3.5" />
            Download PNG
          </a>
        )}
      </div>
    </Dialog>
  )
}
