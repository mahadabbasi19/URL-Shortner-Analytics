import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/cn'
import { useToast } from './ui/Toast'

export function CopyButton({
  value,
  variant = 'default',
}: {
  value: string
  variant?: 'default' | 'icon'
}) {
  const [copied, setCopied] = useState(false)
  const { show } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      show('Link copied to clipboard.')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      show('Could not copy — try selecting the link manually.', 'error')
    }
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy link"
        title="Copy link"
        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-2 hover:text-text"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
        copied
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-border bg-surface-2 text-text-secondary hover:border-border-strong hover:text-text',
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
