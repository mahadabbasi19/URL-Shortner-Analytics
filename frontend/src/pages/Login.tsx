import { Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'
import { getApiErrorMessage } from '../lib/api'
import { useAuth } from '../lib/auth'

export function Login() {
  const { login } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setError(null)
    setIsSubmitting(true)
    try {
      await login(email, password)
      show('Welcome back.')
      navigate('/dashboard')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem-1px)] max-w-sm flex-col justify-center px-4 py-12">
      <Link to="/" className="mx-auto mb-8">
        <Logo size={32} />
      </Link>

      <h1 className="text-center text-xl font-semibold text-text">Log in to Snip</h1>
      <p className="mt-1.5 text-center text-sm text-text-secondary">Welcome back — manage your links and analytics.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
        <Input
          type="email"
          label="Email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type={showPassword ? 'text' : 'password'}
          label="Password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="cursor-pointer p-1 text-text-muted transition-colors hover:text-text-secondary"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        {error && (
          <p role="alert" className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2.5 text-[13px] text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          {isSubmitting ? 'Logging in' : 'Log in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-text-secondary">
        No account?{' '}
        <Link to="/register" className="font-medium text-brand-2 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
