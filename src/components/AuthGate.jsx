import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { LogoMark } from './Logo'

const RESEND_COOLDOWN_SEC = 60

// The confirmation link brings people back to wherever they signed up from,
// so local dev and production each land on themselves. Both origins must be
// in Supabase → Authentication → URL Configuration → Redirect URLs.
const redirectTo = () => window.location.origin

// When a confirmation link is expired or already used, Supabase redirects back
// with the reason in the URL hash instead of a session.
function readLinkError() {
  if (typeof window === 'undefined' || !window.location.hash.includes('error')) return ''
  const params = new URLSearchParams(window.location.hash.slice(1))
  const desc = params.get('error_description')
  if (!desc) return ''
  return `${desc.replace(/\+/g, ' ')}. Sign in and we'll offer to send a fresh link.`
}

export default function AuthGate({ children, user, loading }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login') // login | signup | check-email
  const [error, setError] = useState(readLinkError)
  const [submitting, setSubmitting] = useState(false)
  // Set when sign-in is refused because the email isn't confirmed yet.
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const [resendState, setResendState] = useState({ sending: false, message: '', cooldown: 0 })

  // Don't leave the error in the address bar: a reload would show it again.
  useEffect(() => {
    if (window.location.hash.includes('error')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [])

  useEffect(() => {
    if (resendState.cooldown <= 0) return
    const t = setTimeout(() => setResendState((s) => ({ ...s, cooldown: s.cooldown - 1 })), 1000)
    return () => clearTimeout(t)
  }, [resendState.cooldown])

  async function resendConfirmation() {
    setResendState({ sending: true, message: '', cooldown: 0 })
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo() } })
    setResendState(error
      ? { sending: false, message: error.message, cooldown: 0 }
      : { sending: false, message: `Sent another link to ${email}.`, cooldown: RESEND_COOLDOWN_SEC })
  }

  function switchMode(next) {
    setMode(next)
    setError('')
    setNeedsConfirm(false)
    setResendState({ sending: false, message: '', cooldown: 0 })
  }

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
    setNeedsConfirm(false)
    setSubmitting(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error?.code === 'email_not_confirmed') {
          setNeedsConfirm(true)
          return
        }
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: redirectTo() },
        })
        if (error) throw error
        // A session means verification is off: the auth listener signs them in.
        if (data.session) return
        // Supabase answers an already-registered email with a user that has no
        // identities (rather than an error, so emails can't be probed).
        if (data.user?.identities?.length === 0) {
          setMode('login')
          setError('An account with this email already exists. Sign in instead.')
          return
        }
        // Before this, signup just stopped spinning and showed nothing.
        setMode('check-email')
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

        {mode === 'check-email' ? (
          <div className="card-raised space-y-4">
            <h2 className="font-semibold text-base text-ink">Check your inbox</h2>
            <p className="text-sm text-muted">
              We sent a confirmation link to <span className="text-ink font-medium break-all">{email}</span>.
              Open it on this device to finish — it signs you straight in.
            </p>
            <p className="text-xs text-muted">Not there after a minute? Check spam or promotions.</p>
            <ResendButton state={resendState} onResend={resendConfirmation} />
            <button type="button" onClick={() => switchMode('signup')} className="w-full btn-ghost text-xs">
              Use a different email
            </button>
          </div>
        ) : (
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

            {needsConfirm && (
              <div className="space-y-2 rounded-xl px-3 py-2.5" style={{ border: '1px solid var(--rule)' }}>
                <p className="text-xs text-ink">Confirm your email first — we sent a link when you signed up.</p>
                <p className="text-xs text-muted">Can't find it? Check spam, or send a new one.</p>
                <ResendButton state={resendState} onResend={resendConfirmation} />
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
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            className="w-full text-xs text-muted hover:text-ink transition-colors py-1"
          >
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
        )}
      </div>
    </div>
  )
}

function ResendButton({ state, onResend }) {
  const { sending, message, cooldown } = state
  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={onResend}
        disabled={sending || cooldown > 0}
        className="w-full btn-ghost text-xs disabled:opacity-50"
      >
        {sending ? 'Sending…' : cooldown > 0 ? `Resend email (${cooldown}s)` : 'Resend email'}
      </button>
      {message && <p className="text-xs text-muted" role="status">{message}</p>}
    </div>
  )
}
