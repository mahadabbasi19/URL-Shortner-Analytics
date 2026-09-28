import { useState } from 'react'

export function DeleteButton({ onConfirm, isDeleting }: { onConfirm: () => void; isDeleting?: boolean }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          onClick={() => onConfirm()}
          disabled={isDeleting}
          className="rounded-md bg-red-500/90 px-2 py-1 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-60"
        >
          {isDeleting ? 'Deleting…' : 'Confirm'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-md border border-ink-700 px-2 py-1 text-xs text-ink-300 hover:text-white"
        >
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-md border border-ink-700 px-2 py-1 text-xs font-medium text-ink-300 hover:border-red-500/50 hover:text-red-400"
    >
      Delete
    </button>
  )
}
