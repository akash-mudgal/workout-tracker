import { useRef, useState } from 'react'
import { PLANS, PLAN_GROUPS } from '../data/workoutPlans'
import { recommendPlan } from '../utils/planGuidance'
import ChoiceTick from './ChoiceTick'

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
            className="choice py-2.5 px-2 rounded-xl text-sm font-medium text-ink min-h-[44px]"
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
//
// Only plans for the chosen place (Gym or Home) are listed. With `ask`, nothing
// is listed until that's answered; without it (editing a cycle), the switch
// starts on the current plan's place.
export default function PlanPicker({ value, onChange, ask = false, compact = false }) {
  const equipmentOf = (id) => PLANS[id]?.equipment ?? 'home'
  const [answers, setAnswers] = useState(() => ({
    equipment: ask ? null : equipmentOf(value),
    days: null,
  }))
  const userPicked = useRef(false)
  const rec = ask ? recommendPlan(PLANS, answers) : null

  function answer(key, v) {
    const next = { ...answers, [key]: v }
    setAnswers(next)
    if (!ask) return // editing: keep the current plan until a new one is tapped
    // A plan picked under the other place no longer applies.
    const hidden = value && equipmentOf(value) !== next.equipment
    if (hidden) userPicked.current = false
    const r = recommendPlan(PLANS, next)
    if (r && !userPicked.current) onChange(r.planId)
    else if (hidden) onChange(null)
  }

  function pick(id) {
    userPicked.current = true
    onChange(id)
  }

  // Just the chosen place's plans, with the recommended one at the top.
  const group = PLAN_GROUPS.find((g) => g.id === answers.equipment)
  const plans = group
    ? [...group.plans].sort((a, b) => (b.id === rec?.planId) - (a.id === rec?.planId))
    : []
  const currentHidden = !ask && value && !plans.some((p) => p.id === value)

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Segmented label="Where do you train?" options={WHERE} value={answers.equipment} onChange={(v) => answer('equipment', v)} />
        {ask && (
          <>
            <Segmented label="How many days a week can you reliably train?" options={DAYS} value={answers.days} onChange={(v) => answer('days', v)} />
            <p className="text-xs text-muted">
              {!answers.equipment
                ? 'Pick Gym or Home to see the plans for it.'
                : rec
                  ? 'Recommended plan is marked below — any plan can still be picked.'
                  : 'Add your days and we’ll suggest a plan. Be honest: a plan you can keep up beats a bigger one you can’t.'}
            </p>
          </>
        )}
        {currentHidden && (
          <p className="text-xs text-muted">
            Current plan: <span className="text-ink">{PLANS[value]?.name}</span>. Tap a plan below to switch.
          </p>
        )}
      </div>

      {group && (
        <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">{group.label}</p>
          {plans.map((plan) => {
            const selected = value === plan.id
            const recommended = rec?.planId === plan.id
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => pick(plan.id)}
                aria-pressed={selected}
                className={`choice w-full text-left rounded-xl ${compact ? 'p-3' : 'p-4'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-ink">{plan.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {recommended && (
                      // Neutral, not the signal colour: in this app colour means "target met".
                      <span className="text-xs font-medium text-ink rounded-full px-2 py-0.5" style={{ border: '1px solid #3C4650' }}>Recommended</span>
                    )}
                    <span className="text-xs text-muted">{plan.daysPerWeek}d/wk</span>
                    <ChoiceTick />
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
      )}
    </div>
  )
}
