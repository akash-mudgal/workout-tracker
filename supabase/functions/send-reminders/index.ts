// Sends the daily logging reminders as real Web Push, so they arrive with the
// app closed. Previously this was setTimeout inside the page, which meant it
// only ever fired if the PWA was left open past the trigger time.
//
// Invoked by Supabase Cron every 15 minutes (see the migration). Deciding what
// is due happens here rather than in the schedule, because "remind me at 18:00"
// depends on the user's timezone and on whether they already logged.
//
// Secrets required:
//   VAPID_KEYS  — JWK pair from `node scripts/generate-vapid-keys.mjs`
//   VAPID_CONTACT — mailto: address, required by RFC 8292
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by the platform.

import * as webpush from 'jsr:@negrel/webpush@^0.5.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_KEYS = Deno.env.get('VAPID_KEYS')!
const VAPID_CONTACT = Deno.env.get('VAPID_CONTACT') ?? 'mailto:admin@example.com'

type Prefs = {
  user_id: string
  enabled: boolean
  remind_hour: number
  remind_minute: number
  last_call_hour: number
  last_call_enabled: boolean
  weekly_digest: boolean
  timezone: string
}

type Sub = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string }

type Kind = 'daily' | 'last_call' | 'weekly'

async function rest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`)
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// The database runs in UTC; the user does not. Everything scheduling-related is
// decided in the user's own local time.
function localNow(timeZone: string, now: Date) {
  let parts: Record<string, string>
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
      weekday: 'short',
    })
    parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]))
  } catch {
    // An unknown IANA zone shouldn't silently stop someone's reminders.
    console.warn(`[send-reminders] unknown timezone "${timeZone}", falling back to UTC`)
    return localNow('UTC', now)
  }
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    weekday: parts.weekday,
  }
}

function message(kind: Kind, extra: { workouts?: number; sets?: number }) {
  if (kind === 'daily') {
    return {
      title: 'Nothing logged today',
      body: 'Open Kinetiq to log your session, food and water.',
      tag: 'dailylog',
    }
  }
  if (kind === 'last_call') {
    return {
      title: 'Last call for today',
      body: "Today's log is still empty. A couple of taps keeps it honest.",
      tag: 'lastcall',
    }
  }
  const w = extra.workouts ?? 0
  const s = extra.sets ?? 0
  return {
    title: 'Last week in review',
    body: `${w} ${w === 1 ? 'workout' : 'workouts'}, ${s} sets logged. Here's the next one.`,
    tag: 'weekly',
  }
}

async function send(server: webpush.ApplicationServer, sub: Sub, payload: unknown, tag: string) {
  const subscriber = server.subscribe({
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  })
  try {
    await subscriber.pushTextMessage(JSON.stringify(payload), {
      ttl: 6 * 60 * 60,
      urgency: 'normal' as never,
      topic: tag,
    })
    return true
  } catch (err) {
    const text = String(err)
    // A push service returns 404/410 once a subscription is permanently dead,
    // e.g. the PWA was uninstalled. Keeping it would retry forever.
    if (/\b(404|410)\b|gone|not found/i.test(text)) {
      console.log(`[send-reminders] dropping dead subscription ${sub.id}`)
      await rest(`push_subscriptions?id=eq.${sub.id}`, { method: 'DELETE' }).catch(() => {})
    } else {
      console.error(`[send-reminders] push to ${sub.id} failed: ${text}`)
    }
    return false
  }
}

Deno.serve(async (req) => {
  // Only the cron job (service role) may call this.
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${SERVICE_KEY}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: { test?: boolean } = {}
  try { body = await req.json() } catch { /* no body is fine */ }
  const testMode = body.test === true

  const vapidKeys = await webpush.importVapidKeys(JSON.parse(VAPID_KEYS), { extractable: false })
  const server = await webpush.ApplicationServer.new({
    contactInformation: VAPID_CONTACT,
    vapidKeys,
  })

  const prefs: Prefs[] = await rest('notification_prefs?select=*&enabled=is.true') ?? []
  const now = new Date()
  const results: Record<string, string[]> = {}

  for (const p of prefs) {
    const local = localNow(p.timezone, now)
    const subs: Sub[] = await rest(
      `push_subscriptions?select=id,user_id,endpoint,p256dh,auth&user_id=eq.${p.user_id}`
    ) ?? []
    if (!subs.length) continue

    const sent: string[] = []

    if (testMode) {
      for (const s of subs) {
        await send(server, s, {
          title: 'Reminders are working',
          body: `Sent at ${local.date} ${String(Math.floor(local.minutes / 60)).padStart(2, '0')}:${String(local.minutes % 60).padStart(2, '0')} ${p.timezone}.`,
          tag: 'test',
          url: '/',
        }, 'test')
      }
      results[p.user_id] = ['test']
      continue
    }

    // Already-sent rows are the source of truth for "once per local day", which
    // is what lets this run every 15 minutes without repeating itself.
    const logged: { kind: Kind }[] = await rest(
      `notification_log?select=kind&user_id=eq.${p.user_id}&local_date=eq.${local.date}`
    ) ?? []
    const already = new Set(logged.map((l) => l.kind))

    const workoutToday: unknown[] = await rest(
      `workout_history?select=date&user_id=eq.${p.user_id}&date=eq.${local.date}&limit=1`
    ) ?? []
    const didLog = workoutToday.length > 0

    const due: Kind[] = []
    // Fire at the first tick at or after the chosen time. The log prevents
    // repeats, so a generous window also recovers from a missed run rather
    // than skipping the day entirely.
    const remindAt = p.remind_hour * 60 + p.remind_minute
    if (!didLog && !already.has('daily') && local.minutes >= remindAt) due.push('daily')
    if (
      !didLog && p.last_call_enabled && !already.has('last_call') &&
      local.minutes >= p.last_call_hour * 60
    ) due.push('last_call')
    if (
      p.weekly_digest && !already.has('weekly') &&
      local.weekday === 'Mon' && local.minutes >= 9 * 60
    ) due.push('weekly')

    for (const kind of due) {
      let extra = {}
      if (kind === 'weekly') {
        const since = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10)
        const rows: { exercises: { sets?: unknown[] }[] }[] = await rest(
          `workout_history?select=exercises&user_id=eq.${p.user_id}&date=gte.${since}`
        ) ?? []
        const sets = rows.reduce(
          (n, r) => n + (r.exercises ?? []).reduce((m, ex) => m + (ex.sets?.length ?? 0), 0),
          0
        )
        extra = { workouts: rows.length, sets }
      }

      const msg = message(kind, extra)
      let delivered = false
      for (const s of subs) {
        if (await send(server, s, { ...msg, url: '/' }, msg.tag)) delivered = true
      }
      // Only record it if it actually went somewhere, so a transient failure
      // gets retried on the next tick instead of being silently swallowed.
      if (delivered) {
        await rest('notification_log', {
          method: 'POST',
          headers: { Prefer: 'resolution=ignore-duplicates' },
          body: JSON.stringify({ user_id: p.user_id, kind, local_date: local.date }),
        })
        sent.push(kind)
      }
    }

    if (sent.length) results[p.user_id] = sent
  }

  return new Response(JSON.stringify({ ok: true, testMode, users: prefs.length, sent: results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
