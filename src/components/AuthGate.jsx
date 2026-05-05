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
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <span className="text-zinc-400 text-sm">Loading…</span>
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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }}
      />

      <div className="w-full max-w-sm space-y-8 relative z-10">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-2"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(91,33,182,0.1))', border: '1px solid rgba(124,58,237,0.3)' }}
          >
            <LogoMark size={36} id="auth" />
          </div>
          <h1 className="text-3xl font-black gradient-text">Kinetiq</h1>
          <p className="text-zinc-400 text-sm">Track every rep, step, and meal.</p>
        </div>

        {/* Form card */}
        <div className="card-raised space-y-5">
          <h2 className="font-bold text-base text-zinc-200">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Email</label>
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
              <label className="text-xs font-medium text-zinc-500 block mb-1.5">Password</label>
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
              <div className="text-xs text-red-400 rounded-xl px-3 py-2.5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="w-full btn-primary py-3 mt-1 disabled:opacity-50">
              {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1"
          >
            {mode === 'login' ? "Don't have an account? Sign up →" : 'Already have an account? Sign in →'}
          </button>
        </div>
      </div>
    </div>
  )
}
