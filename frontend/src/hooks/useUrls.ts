import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { UrlItem } from '../types'

export function useUrls() {
  return useQuery({
    queryKey: ['urls'],
    queryFn: async () => {
      const res = await api.get<UrlItem[]>('/api/v1/urls')
      return res.data
    },
  })
}
