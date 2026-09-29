import { useQueryClient } from '@tanstack/react-query'
import { CreateLinkCard } from './CreateLinkCard'
import { Dialog } from './ui/Dialog'
import { useToast } from './ui/Toast'

export function CreateLinkDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { show } = useToast()

  return (
    <Dialog open={open} onClose={onClose} title="Create a link" description="Shorten a URL and start tracking it.">
      <CreateLinkCard
        variant="bare"
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['urls'] })
          show('Link created.')
        }}
      />
    </Dialog>
  )
}
