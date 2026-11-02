import { supabase } from '../lib/supabase'

// Reminders are real Web Push now. The previous version of this file scheduled
// them with setTimeout inside the page, so the timers died with the tab and a
// reminder only arrived if the PWA happened to be left open past the trigger
// time. Scheduling lives in the `send-reminders` Edge Function; this module
// only handles permission, the subscription, and the preferences.

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY
const PREFS_CACHE = 'wt_notification_prefs'

export const DEFAULT_PREFS = {
  enabled: false,
  remindHour: 18,
  remindMinute: 0,
  lastCallHour: 21,
  lastCallEnabled: true,
  weeklyDigest: true,
}

export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  )
}

export function getNotifPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function requestNotifPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.requestPermission()
}

function localTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
}

function readCache() {
  try {
    const v = localStorage.getItem(PREFS_CACHE)
    return v ? { ...DEFAULT_PREFS, ...JSON.parse(v) } : DEFAULT_PREFS
  } catch { return DEFAULT_PREFS }
}

function writeCache(prefs) {
  try { localStorage.setItem(PREFS_CACHE, JSON.stringify(prefs)) } catch { /* ignore */ }
}

// The cached copy is only so the settings UI doesn't flash defaults on load.
// The database row is what the sender reads, and therefore what counts.
export function cachedPrefs() {
  return readCache()
}

function rowToPrefs(r) {
  return {
    enabled: r.enabled,
    remindHour: r.remind_hour,
    remindMinute: r.remind_minute,
    lastCallHour: r.last_call_hour,
    lastCallEnabled: r.last_call_enabled,
    weeklyDigest: r.weekly_digest,
  }
}

function isMissingTable(error) {
  const code = error?.code
  if (code === '42P01' || code === 'PGRST205' || code === 'PGRST204') return true
  return /does not exist|schema cache/i.test(error?.message || '')
}

export async function loadPrefs(userId) {
  if (!userId) return { prefs: readCache(), available: false }
  const { data, error } = await supabase
    .from('notification_prefs')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    if (!isMissingTable(error)) console.error('[kinetiq] prefs load failed:', error.message, error)
    return { prefs: readCache(), available: false }
  }
  if (!data) return { prefs: readCache(), available: true }

  const prefs = rowToPrefs(data)
  writeCache(prefs)
  return { prefs, available: true }
}

export async function savePrefs(userId, prefs) {
  writeCache(prefs)
  if (!userId) return false
  const { error } = await supabase.from('notification_prefs').upsert({
    user_id: userId,
    enabled: prefs.enabled,
    remind_hour: prefs.remindHour,
    remind_minute: prefs.remindMinute,
    last_call_hour: prefs.lastCallHour,
    last_call_enabled: prefs.lastCallEnabled,
    weekly_digest: prefs.weeklyDigest,
    // Captured on every save: "remind me at 18:00" is meaningless to a UTC
    // server without knowing whose 18:00 it is.
    timezone: localTimezone(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (error) {
    if (!isMissingTable(error)) console.error('[kinetiq] prefs save failed:', error.message, error)
    return false
  }
  return true
}

// navigator.serviceWorker.ready never settles when no service worker is
// registered — it waits indefinitely rather than rejecting, so a try/catch
// around it catches nothing and the caller simply hangs. That turns "push
// isn't available here" into "the button does nothing", which is worse.
function swReady(timeoutMs = 8000) {
  if (!('serviceWorker' in navigator)) {
    return Promise.reject(new Error('this browser has no service worker support'))
  }
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('the service worker never became ready')), timeoutMs)
    ),
  ])
}

function urlBase64ToUint8Array(base64) {
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

function keyToBase64(subscription, name) {
  const key = subscription.getKey(name)
  if (!key) return null
  return btoa(String.fromCharCode(...new Uint8Array(key)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Returns { ok, reason } where `reason` is shown to the user verbatim. Every
// failure path has to say something specific: a subscription that silently
// doesn't happen looks exactly like one that worked, right up until no
// reminder ever arrives.
export async function subscribeToPush(userId) {
  if (!pushSupported()) {
    return { ok: false, reason: "This browser can't do push notifications." }
  }
  if (!userId) return { ok: false, reason: 'You need to be signed in first.' }
  if (!VAPID_PUBLIC_KEY) {
    return { ok: false, reason: 'This build is missing its push key (VITE_VAPID_PUBLIC_KEY).' }
  }
  if (Notification.permission !== 'granted') {
    return { ok: false, reason: `Notifications are ${Notification.permission} for this site.` }
  }

  let sub
  try {
    const reg = await swReady()
    sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }
  } catch (e) {
    console.error('[kinetiq] push subscribe failed:', e)
    return { ok: false, reason: `The browser refused to subscribe: ${e?.message || e}` }
  }

  const p256dh = keyToBase64(sub, 'p256dh')
  const auth = keyToBase64(sub, 'auth')
  if (!p256dh || !auth) {
    return { ok: false, reason: 'The browser returned a subscription with no keys.' }
  }

  const userAgent = navigator.userAgent.slice(0, 300)
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: sub.endpoint,
    p256dh,
    auth,
    user_agent: userAgent,
  }, { onConflict: 'endpoint' })

  if (error) {
    console.error('[kinetiq] subscription save failed:', error.message, error)
    return {
      ok: false,
      reason: isMissingTable(error)
        ? "The push tables aren't set up yet."
        : `Couldn't save the subscription: ${error.message}`,
    }
  }

  // A device has exactly one live endpoint at a time, but the push service
  // issues a fresh one on every re-subscribe. Toggling reminders off and on a
  // few times therefore leaves stale rows behind, and every reminder then fans
  // out to all of them until they each 404. Collapse this device's older rows.
  const { error: pruneError } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('user_agent', userAgent)
    .neq('endpoint', sub.endpoint)
  if (pruneError) {
    console.error('[kinetiq] pruning old subscriptions failed:', pruneError.message)
  }

  return { ok: true }
}

// Ground truth for "is THIS device registered", rather than inferring it from
// the enabled flag — the two drifted apart once and hid a broken setup.
export async function isDeviceSubscribed(userId) {
  if (!pushSupported() || !userId) return false
  try {
    const reg = await swReady()
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return false
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', sub.endpoint)
      .maybeSingle()
    return !error && !!data
  } catch {
    return false
  }
}

export async function unsubscribeFromPush(userId) {
  if (!pushSupported()) return
  let endpoint
  try {
    const reg = await swReady()
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return
    endpoint = sub.endpoint
    await sub.unsubscribe().catch(() => {})
  } catch (e) {
    // Turning reminders off must never get stuck, even if the service worker
    // is unavailable — the row is removed below regardless.
    console.error('[kinetiq] could not unsubscribe locally:', e)
  }
  if (!userId || !endpoint) return
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  if (error && !isMissingTable(error)) {
    console.error('[kinetiq] subscription delete failed:', error.message, error)
  }
}

// The service worker posts this when the push service rotates an endpoint.
export function listenForResubscribe(userId) {
  if (!pushSupported() || !userId) return () => {}
  function onMessage(event) {
    if (event.data?.type === 'resubscribe-push') subscribeToPush(userId)
  }
  navigator.serviceWorker.addEventListener('message', onMessage)
  return () => navigator.serviceWorker.removeEventListener('message', onMessage)
}
