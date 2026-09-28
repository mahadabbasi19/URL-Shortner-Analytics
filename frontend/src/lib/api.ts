import axios from 'axios'

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000'

export const api = axios.create({ baseURL: API_BASE_URL })

const TOKEN_KEY = 'snip_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 429) {
      const retryAfter = err.response.headers['retry-after']
      return retryAfter
        ? `Too many requests. Try again in ${retryAfter}s.`
        : 'Too many requests. Please wait a moment and try again.'
    }
    const data = err.response?.data as { error?: { message?: string } } | undefined
    if (data?.error?.message) return data.error.message
    if (err.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the backend running?'
  }
  return 'Something went wrong. Please try again.'
}
