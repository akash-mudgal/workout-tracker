import rawPlans from './plans.json'

const COLORS = {
  red:     { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     badge: 'bg-red-500/20 text-red-300',     dot: 'bg-red-500'     },
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    text: 'text-blue-400',    badge: 'bg-blue-500/20 text-blue-300',    dot: 'bg-blue-500'    },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300', dot: 'bg-emerald-500' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   badge: 'bg-amber-500/20 text-amber-300',   dot: 'bg-amber-500'   },
  violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/30',  text: 'text-violet-400',  badge: 'bg-violet-500/20 text-violet-300',  dot: 'bg-violet-500'  },
  orange:  { bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  text: 'text-orange-400',  badge: 'bg-orange-500/20 text-orange-300',  dot: 'bg-orange-500'  },
  zinc:    { bg: 'bg-zinc-500/10',    border: 'border-zinc-500/30',    text: 'text-zinc-400',    badge: 'bg-zinc-500/20 text-zinc-300',    dot: 'bg-zinc-500'    },
}

function expandPlan(plan) {
  return {
    ...plan,
    days: Object.fromEntries(
      Object.entries(plan.days).map(([id, day]) => [
        id,
        { ...day, colorClasses: COLORS[day.color] ?? COLORS.zinc },
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
