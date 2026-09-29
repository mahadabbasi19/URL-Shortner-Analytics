import { Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export function DeleteButton({ onConfirm, isDeleting }: { onConfirm: () => void; isDeleting?: boolean }) {
  const [confirming, setConfirming] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!confirming) return
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setConfirming(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [confirming])

  if (confirming) {
    return (
      <span ref={ref} className="inline-flex items-center gap-1">
        <button
          onClick={() => onConfirm()}
          disabled={isDeleting}
          className="cursor-pointer rounded-md bg-danger px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-danger/90 disabled:opacity-60"
        >
          {isDeleting ? 'Deleting…' : 'Confirm delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="cursor-pointer rounded-md px-2 py-1 text-xs text-text-muted hover:text-text-secondary"
        >
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      aria-label="Delete link"
      title="Delete link"
      className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-danger/10 hover:text-danger"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )
}
