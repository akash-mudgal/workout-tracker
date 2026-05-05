import { useState } from 'react'
import { format } from 'date-fns'
import { PLANS } from '../data/workoutPlans'
import { useStore } from '../store.jsx'

const PLAN_LIST = Object.values(PLANS)
const today = format(new Date(), 'yyyy-MM-dd')

const STEPS = ['Name', 'Plan', 'Schedule', 'Stats']

const glassBg = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }

function calcProtein(weightKg) {
  if (!weightKg || weightKg <= 0) return null
  return Math.round((weightKg * 2.0) / 5) * 5
}

function calcBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0) return null
  return (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1)
}

export default function OnboardingFlow() {
  const { createSession, updateUserProfile } = useStore()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [planId, setPlanId] = useState(null)
  const [startDate, setStartDate] = useState(today)
  const [totalDays, setTotalDays] = useState(90)
  const [weightKg, setWeightKg] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedPlan = PLAN_LIST.find((p) => p.id === planId)
  const protein = calcProtein(Number(weightKg))
  const bmi = calcBMI(Number(weightKg), Number(heightCm))

  async function handleFinish() {
    if (!name.trim() || !planId) return
    const days = Math.max(7, Math.min(365, Number(totalDays) || 90))
    setLoading(true)
    try {
      if (weightKg || heightCm) {
        updateUserProfile({ weightKg: Number(weightKg) || 0, heightCm: Number(heightCm) || 0 })
      }
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
          <p className="text-zinc-400 text-sm">Set up your first training cycle</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 transition-colors ${
                i < step ? 'bg-violet-500 text-white' :
                i === step ? 'text-violet-400 ring-1 ring-violet-500' :
                'text-zinc-500'
              }`}
                style={i === step ? { background: 'rgba(124,58,237,0.2)' } : i > step ? { background: 'rgba(255,255,255,0.05)' } : {}}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs hidden sm:inline ${i === step ? 'text-zinc-300' : 'text-zinc-500'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px" style={{ background: i < step ? '#7c3aed' : 'rgba(255,255,255,0.08)' }} />}
            </div>
          ))}
        </div>

        {/* Step 1: Name */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="card space-y-4">
              <div>
                <h2 className="font-semibold text-lg text-white mb-1">Name your cycle</h2>
                <p className="text-xs text-zinc-400">Give this training cycle a name you'll remember.</p>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Cycle Name</label>
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
            <button onClick={() => setStep(1)} disabled={!name.trim()} className="w-full btn-primary py-3 disabled:opacity-40">
              Next →
            </button>
          </div>
        )}

        {/* Step 2: Plan */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-semibold text-lg text-white">Choose your workout plan</h2>
              <p className="text-xs text-zinc-400">Pick the split that fits your schedule. You can change it later from Sessions.</p>
            </div>
            <div className="space-y-2">
              {PLAN_LIST.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setPlanId(plan.id)}
                  className="w-full text-left p-4 rounded-2xl transition-all"
                  style={planId === plan.id
                    ? { border: '1px solid rgba(124,58,237,0.6)', background: 'rgba(124,58,237,0.1)' }
                    : glassBg}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-zinc-200">{plan.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400 rounded-full px-2 py-0.5" style={{ background: 'rgba(255,255,255,0.06)' }}>{plan.daysPerWeek}d/wk</span>
                      {planId === plan.id && <span className="text-violet-400">●</span>}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{plan.description}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(0)} className="btn-ghost px-4 py-3">← Back</button>
              <button onClick={() => setStep(2)} disabled={!planId} className="flex-1 btn-primary py-3 disabled:opacity-40">
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-semibold text-lg text-white">Set your schedule</h2>
              <p className="text-xs text-zinc-400">When does your cycle start and how long should it run?</p>
            </div>
            <div className="card space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Start Date (Day 1)</label>
                <input type="date" value={startDate} max={today} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-2">Duration</label>
                <div className="flex gap-2 mb-2">
                  {[30, 60, 90, 120].map((d) => (
                    <button
                      key={d}
                      onClick={() => setTotalDays(d)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={Number(totalDays) === d
                        ? { background: '#7c3aed', color: 'white' }
                        : { background: 'rgba(255,255,255,0.06)', color: '#a1a1aa' }}
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
                  placeholder="Custom days"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="btn-ghost px-4 py-3">← Back</button>
              <button onClick={() => setStep(3)} className="flex-1 btn-primary py-3">Next →</button>
            </div>
          </div>
        )}

        {/* Step 4: Stats */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-semibold text-lg text-white">Your stats</h2>
              <p className="text-xs text-zinc-400">Used to calculate your daily protein target. You can update these anytime.</p>
            </div>
            <div className="card space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="e.g. 70"
                    className="input-field"
                    min={30}
                    max={200}
                    step={0.5}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="e.g. 175"
                    className="input-field"
                    min={100}
                    max={250}
                  />
                </div>
              </div>

              {protein && (
                <div className="rounded-xl px-4 py-3 space-y-1" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-400 font-semibold">Daily Protein Target</span>
                    <span className="text-xl font-black text-amber-400">{protein}g</span>
                  </div>
                  <p className="text-xs text-zinc-400">Based on 2g per kg bodyweight — optimal for muscle building and recomposition.</p>
                  {bmi && <p className="text-xs text-zinc-400">BMI: {bmi}</p>}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="card space-y-2" style={{ borderColor: 'rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.05)' }}>
              <div className="text-xs font-semibold text-violet-400 mb-1">Your cycle</div>
              {[
                { label: 'Name', value: name },
                { label: 'Plan', value: selectedPlan?.name },
                { label: 'Start', value: format(new Date(startDate + 'T00:00:00'), 'MMM d, yyyy') },
                { label: 'Duration', value: `${totalDays} days` },
                protein && { label: 'Protein goal', value: `${protein}g / day`, valueClass: 'text-amber-400' },
              ].filter(Boolean).map(({ label, value, valueClass }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-zinc-400">{label}</span>
                  <span className={`font-medium ${valueClass ?? 'text-zinc-200'}`}>{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="btn-ghost px-4 py-3">← Back</button>
              <button onClick={handleFinish} disabled={loading} className="flex-1 btn-primary py-3 disabled:opacity-50">
                {loading ? 'Creating…' : "Let's go →"}
              </button>
            </div>
            <button onClick={handleFinish} disabled={loading} className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1">
              Skip stats for now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
