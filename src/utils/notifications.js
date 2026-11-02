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

export async function subscribeToPush(userId) {
  if (!pushSupported() || !userId) return { ok: false, reason: 'unsupported' }
  if (!VAPID_PUBLIC_KEY) {
    console.error('[kinetiq] VITE_VAPID_PUBLIC_KEY is not set, cannot subscribe to push')
    return { ok: false, reason: 'no-key' }
  }
  if (Notification.permission !== 'granted') return { ok: false, reason: 'permission' }

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const p256dh = keyToBase64(sub, 'p256dh')
  const auth = keyToBase64(sub, 'auth')
  if (!p256dh || !auth) return { ok: false, reason: 'no-keys' }

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: sub.endpoint,
    p256dh,
    auth,
    user_agent: navigator.userAgent.slice(0, 300),
  }, { onConflict: 'endpoint' })

  if (error) {
    if (!isMissingTable(error)) console.error('[kinetiq] subscription save failed:', error.message, error)
    return { ok: false, reason: 'save-failed' }
  }
  return { ok: true }
}

export async function unsubscribeFromPush(userId) {
  if (!pushSupported()) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  const endpoint = sub.endpoint
  await sub.unsubscribe().catch(() => {})
  if (!userId) return
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
