import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { api, getToken, setToken } from './api'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [hasToken, setHasToken] = useState<boolean>(() => Boolean(getToken()))

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<User>('/api/v1/auth/me')
      return res.data
    },
    enabled: hasToken,
    retry: false,
  })

  const login = async (email: string, password: string) => {
    const res = await api.post<{ access_token: string }>('/api/v1/auth/login', { email, password })
    setToken(res.data.access_token)
    setHasToken(true)
    await queryClient.invalidateQueries({ queryKey: ['me'] })
  }

  const register = async (email: string, password: string) => {
    await api.post('/api/v1/auth/register', { email, password })
    await login(email, password)
  }

  const logout = () => {
    setToken(null)
    setHasToken(false)
    queryClient.clear()
  }

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: hasToken && isLoading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
