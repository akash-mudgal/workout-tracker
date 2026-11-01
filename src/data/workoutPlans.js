import rawPlans from './plans.json'

// Workout days used to each carry their own hue, which put seven decorative
// colours on screen and left colour meaning nothing in particular. Colour now
// carries exactly one meaning in this interface — a target met — so the day
// styling is monochrome. The `color` field in plans.json is kept but no longer
// selects a hue; nothing currently reads colorClasses at all.
const NEUTRAL = {
  bg: 'bg-raised',
  border: 'border-rule',
  text: 'text-ink',
  badge: 'bg-raised text-muted',
  dot: 'bg-muted',
}

function expandPlan(plan) {
  return {
    ...plan,
    days: Object.fromEntries(
      Object.entries(plan.days).map(([id, day]) => [
        id,
        { ...day, colorClasses: NEUTRAL },
      ])
    ),
  }
}

export const PLANS = Object.fromEntries(
  Object.entries(rawPlans).map(([id, plan]) => [id, expandPlan(plan)])
)

export function getPlan(planId) {
  return PLANS[planId] ?? PLANS.ppl
}

export function getWorkoutDays(planId) {
  const plan = getPlan(planId)
  return plan.cycle.map((id) => plan.days[id])
}

export function getWorkoutById(planId, dayId) {
  return getPlan(planId).days[dayId]
}

export function getRecommendedWorkout(planId, workoutHistory, today = new Date().toISOString().slice(0, 10)) {
  const plan = getPlan(planId)
  const sorted = Object.keys(workoutHistory).sort()
  if (!sorted.length) return plan.days[plan.cycle[0]]

  const lastDate = sorted[sorted.length - 1]
  const lastId = workoutHistory[lastDate].workoutId
  const lastIdx = plan.cycle.indexOf(lastId)
  if (lastIdx === -1) return plan.days[plan.cycle[0]]

  const daysSince = Math.floor((new Date(today) - new Date(lastDate)) / 86400000)
  const nextIdx = (lastIdx + Math.max(daysSince, 1)) % plan.cycle.length
  return plan.days[plan.cycle[nextIdx]]
}

export const PHASE_INFO = [
  { weeks: '1–4',  label: 'Foundation',    desc: 'Lock in form, build consistency, slight fat loss begins' },
  { weeks: '5–8',  label: 'Strength Push', desc: 'Push intensity hard, slight calorie increase if needed'  },
  { weeks: '9–12', label: 'Definition',    desc: 'Maintain strength, tighten waist, peak conditioning'     },
]
