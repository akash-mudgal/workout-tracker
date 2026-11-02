import { useRef, useState } from 'react'
import { PLANS, PLAN_GROUPS } from '../data/workoutPlans'
import { recommendPlan } from '../utils/planGuidance'

const card = { border: '1px solid var(--rule)', background: 'var(--raised)' }
const cardSelected = { border: '1px solid #3C4650', background: 'var(--raised)' }

const WHERE = [
  { value: 'gym', label: 'Gym' },
  { value: 'home', label: 'Home' },
]
const DAYS = [
  { value: '3', label: '3 days' },
  { value: '4', label: '4 days' },
  { value: '5-6', label: '5–6 days' },
]

function Segmented({ label, options, value, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted">{label}</p>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className="py-2.5 px-2 rounded-xl text-sm font-medium text-ink min-h-[44px]"
            style={value === o.value ? cardSelected : card}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// One plan list for onboarding, new-cycle and edit-cycle. With `ask`, two
// quick questions come first and the matching plan is marked Recommended and
// pre-selected — until the person taps a plan themselves, after which their
// choice is never overridden.
export default function PlanPicker({ value, onChange, ask = false, compact = false }) {
  const [answers, setAnswers] = useState({ equipment: null, days: null })
  const userPicked = useRef(false)
  const rec = ask ? recommendPlan(PLANS, answers) : null

  function answer(key, v) {
    const next = { ...answers, [key]: v }
    setAnswers(next)
    const r = recommendPlan(PLANS, next)
    if (r && !userPicked.current) onChange(r.planId)
  }

  function pick(id) {
    userPicked.current = true
    onChange(id)
  }

  // The chosen equipment's group first, and the recommended plan at its top.
  const groups = [...PLAN_GROUPS]
    .sort((a, b) => (b.id === answers.equipment) - (a.id === answers.equipment))
    .map((g) => ({
      ...g,
      plans: [...g.plans].sort((a, b) => (b.id === rec?.planId) - (a.id === rec?.planId)),
    }))

  return (
    <div className="space-y-4">
      {ask && (
        <div className="space-y-3">
          <Segmented label="Where do you train?" options={WHERE} value={answers.equipment} onChange={(v) => answer('equipment', v)} />
          <Segmented label="How many days a week can you reliably train?" options={DAYS} value={answers.days} onChange={(v) => answer('days', v)} />
          <p className="text-xs text-muted">
            {rec ? 'Recommended plan is marked below — any plan can still be picked.' : 'Answer both and we’ll suggest a plan. Be honest about days: a plan you can keep up beats a bigger one you can’t.'}
          </p>
        </div>
      )}

      {groups.map((group) => (
        <div key={group.id} className={compact ? 'space-y-1.5' : 'space-y-2'}>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">{group.label}</p>
          {group.plans.map((plan) => {
            const selected = value === plan.id
            const recommended = rec?.planId === plan.id
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => pick(plan.id)}
                className={`w-full text-left rounded-xl transition-all ${compact ? 'p-3' : 'p-4'}`}
                style={selected ? cardSelected : card}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-ink">{plan.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {recommended && (
                      // Neutral, not the signal colour: in this app colour means "target met".
                      <span className="text-xs font-medium text-ink rounded-full px-2 py-0.5" style={{ border: '1px solid #3C4650' }}>Recommended</span>
                    )}
                    <span className="text-xs text-muted">{plan.daysPerWeek}d/wk</span>
                    {selected && <span className="text-ink text-xs">●</span>}
                  </div>
                </div>
                {recommended && <p className="text-xs text-ink mt-1">{rec.reason}</p>}
                <p className="text-xs text-muted mt-1">{plan.description}</p>
                {plan.bestFor && (
                  <p className="text-xs text-muted mt-1.5"><span className="text-ink">Best for:</span> {plan.bestFor}</p>
                )}
                {plan.notIdealIf && (
                  <p className="text-xs text-muted mt-0.5"><span className="text-ink">Not ideal if:</span> {plan.notIdealIf}</p>
                )}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
