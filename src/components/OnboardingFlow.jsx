import { useState } from 'react'
import { format } from 'date-fns'
import { PLANS } from '../data/workoutPlans'
import { useStore } from '../store.jsx'

const PLAN_LIST = Object.values(PLANS)
const today = format(new Date(), 'yyyy-MM-dd')

const STEPS = ['Name', 'Plan', 'Schedule']

export default function OnboardingFlow() {
  const { createSession } = useStore()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [planId, setPlanId] = useState(null)
  const [startDate, setStartDate] = useState(today)
  const [totalDays, setTotalDays] = useState(90)
  const [loading, setLoading] = useState(false)

  const selectedPlan = PLAN_LIST.find((p) => p.id === planId)

  async function handleFinish() {
    if (!name.trim() || !planId) return
    const days = Math.max(7, Math.min(365, Number(totalDays) || 90))
    setLoading(true)
    try {
      await createSession(name.trim(), startDate, planId, days)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-4xl font-black bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
            Let's get started
          </div>
          <p className="text-zinc-500 text-sm">Set up your first training cycle</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 transition-colors ${
                i < step ? 'bg-violet-500 text-white' :
                i === step ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500' :
                'bg-zinc-800 text-zinc-600'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'text-zinc-300' : 'text-zinc-600'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-violet-500' : 'bg-zinc-800'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Name */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="card space-y-4">
              <div>
                <h2 className="font-semibold text-lg mb-1">Name your cycle</h2>
                <p className="text-xs text-zinc-500">Give this training cycle a name you'll remember.</p>
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Cycle Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer Recomp 2026"
                  className="input-field"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(1)}
                />
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              disabled={!name.trim()}
              className="w-full btn-primary py-3 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}

        {/* Step 2: Plan */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="font-semibold text-lg">Choose your workout plan</h2>
              <p className="text-xs text-zinc-500">Pick the split that fits your schedule. You can change it later from Sessions.</p>
            </div>
            <div className="space-y-2">
              {PLAN_LIST.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setPlanId(plan.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    planId === plan.id
                      ? 'border-violet-500/60 bg-violet-500/10'
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{plan.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{plan.daysPerWeek}d/wk</span>
                      {planId === plan.id && <span className="text-violet-400">●</span>}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{plan.description}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(0)} className="btn-ghost px-4 py-3">← Back</button>
              <button
                onClick={() => setStep(2)}
                disabled={!planId}
                className="flex-1 btn-primary py-3 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="font-semibold text-lg">Set your schedule</h2>
              <p className="text-xs text-zinc-500">When does your cycle start and how long should it run?</p>
            </div>
            <div className="card space-y-4">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Start Date (Day 1)</label>
                <input
                  type="date"
                  value={startDate}
                  max={today}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Duration (days)</label>
                <div className="flex gap-2 mb-2">
                  {[30, 60, 90, 120].map((d) => (
                    <button
                      key={d}
                      onClick={() => setTotalDays(d)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        Number(totalDays) === d
                          ? 'bg-violet-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={totalDays}
                  min={7}
                  max={365}
                  onChange={(e) => setTotalDays(e.target.value)}
                  className="input-field text-sm"
                  placeholder="Custom"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="card border-violet-500/20 bg-violet-500/5 space-y-2">
              <div className="text-xs font-semibold text-violet-400 mb-2">Your cycle</div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Name</span>
                <span className="text-zinc-200 font-medium">{name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Plan</span>
                <span className="text-zinc-200 font-medium">{selectedPlan?.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Start</span>
                <span className="text-zinc-200 font-medium">{format(new Date(startDate + 'T00:00:00'), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Duration</span>
                <span className="text-zinc-200 font-medium">{totalDays} days</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="btn-ghost px-4 py-3">← Back</button>
              <button
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 btn-primary py-3 disabled:opacity-50"
              >
                {loading ? 'Creating…' : "Let's go →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
