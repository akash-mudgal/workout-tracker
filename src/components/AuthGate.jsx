import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LogoMark } from './Logo'

export default function AuthGate({ children, user, loading }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-ink border-t-transparent animate-spin" />
          <span className="text-muted text-sm">Loading…</span>
        </div>
      </div>
    )
  }

  if (user) return children

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Wordmark. The glow and the gradient plate that used to sit here were
            decoration that carried no information. */}
        <div className="space-y-2">
          <div className="text-ink">
            <LogoMark size={30} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Kinetiq</h1>
          <p className="text-muted text-sm">Track every rep, step and meal.</p>
        </div>

        {/* Form card */}
        <div className="card-raised space-y-5">
          <h2 className="font-semibold text-base text-ink">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="input-field"
              />
            </div>

            {error && (
              <div className="text-xs text-warn rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,107,91,0.1)', border: '1px solid rgba(255,107,91,0.3)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="w-full btn-primary py-3 mt-1 disabled:opacity-50">
              {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid var(--raised)' }} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            className="w-full text-xs text-muted hover:text-ink transition-colors py-1"
          >
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
