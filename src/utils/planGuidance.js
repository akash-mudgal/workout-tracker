// Helping someone pick a workout plan, and noticing later when the plan they
// picked doesn't fit their week.
//
// Deliberately import-free (plans are passed in) so scripts/test-plan-guidance.mjs
// can run it with plain Node.

// Two answers → one plan. `days` is '3', '4' or '5-6'.
const RULES = {
  gym:  { '3': 'gym_full_body', '4': 'gym_upper_lower', '5-6': 'gym_ppl' },
  home: { '3': 'full_body',     '4': 'upper_lower',     '5-6': 'ppl' },
}

const REASONS = {
  '3': '3 days fits your week, and a full-body plan still trains every muscle each session.',
  '4': '4 days fits your week, and Upper/Lower trains each muscle twice with recovery days between.',
  '5-6': 'With 5–6 days available, Push/Pull/Legs gives each muscle two sessions a week and the most volume.',
}

export function recommendPlan(plans, { equipment, days } = {}) {
  const planId = RULES[equipment]?.[days]
  if (!planId || !plans[planId]) return null
  return { planId, reason: REASONS[days] }
}

const DAY_MS = 86400000
const toDate = (s) => new Date(s + 'T12:00:00Z')
const toStr = (d) => d.toISOString().slice(0, 10)
const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / DAY_MS)

export const CHECKIN_MIN_DAYS = 14
export const CHECKIN_WINDOW_DAYS = 21
export const CHECKIN_THRESHOLD = 0.7

// Over the last few weeks of the cycle, how many planned training days were
// actually trained? If well under the plan, suggest the lightest plan (same
// equipment) that still covers what's actually being done.
export function planCheckIn(plans, session, workoutHistory, today) {
  if (!session?.startDate) return null
  const plan = plans[session.planId]
  if (!plan) return null

  const age = daysBetween(session.startDate, today)
  if (age < CHECKIN_MIN_DAYS) return null

  // Window ends yesterday — today isn't over yet, so it can't count as missed.
  const windowDays = Math.min(CHECKIN_WINDOW_DAYS, age)
  let planned = 0
  let done = 0
  for (let i = windowDays; i >= 1; i--) {
    const date = toStr(new Date(toDate(today).getTime() - i * DAY_MS))
    const slot = plan.cycle[daysBetween(session.startDate, date) % plan.cycle.length]
    if (slot !== 'rest') planned++
    if (workoutHistory[date]) done++
  }
  if (planned === 0) return null

  const rate = Math.min(done / planned, 1)
  const perWeek = Math.round((done / windowDays) * 7 * 10) / 10
  if (rate >= CHECKIN_THRESHOLD) return null

  const equipment = plan.equipment ?? 'home'
  const lighter = Object.values(plans)
    .filter((p) => (p.equipment ?? 'home') === equipment && p.daysPerWeek < plan.daysPerWeek)
    // Prefer the lightest plan that still covers what's being done; among ties,
    // the plan the recommender would pick for that day count.
    .sort((a, b) => a.daysPerWeek - b.daysPerWeek || preferRecommended(a, b, equipment))
  if (!lighter.length) return null

  const fits = lighter.filter((p) => p.daysPerWeek >= perWeek)
  const pick = fits[0] ?? lighter[lighter.length - 1]
  return {
    rate,
    perWeek,
    suggestion: {
      planId: pick.id,
      reason: `You've trained about ${perWeek} days a week over the last ${Math.round(windowDays / 7)} weeks. ${pick.name} (${pick.daysPerWeek} days) might fit better.`,
    },
  }
}

function preferRecommended(a, b, equipment) {
  const recommended = new Set(Object.values(RULES[equipment] ?? {}))
  return (recommended.has(b.id) ? 1 : 0) - (recommended.has(a.id) ? 1 : 0)
}
