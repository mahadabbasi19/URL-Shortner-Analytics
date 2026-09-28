import { useState } from 'react'

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API can be unavailable (e.g. insecure context); fail silently.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded-md border border-ink-700 bg-ink-900 px-2.5 py-1 text-xs font-medium text-ink-200 transition-colors hover:border-ink-600 hover:text-white"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
