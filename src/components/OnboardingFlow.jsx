import { useState } from 'react'
import { format } from 'date-fns'
import { PLANS } from '../data/workoutPlans'
import PlanPicker from './PlanPicker'
import { useStore } from '../store.jsx'

const PLAN_LIST = Object.values(PLANS)
const today = format(new Date(), 'yyyy-MM-dd')

const STEPS = ['Name', 'Plan', 'Schedule', 'Stats']


function calcProtein(weightKg, goal) {
  if (!weightKg || weightKg <= 0) return null
  const multiplier = goal === 'fat_loss' ? 2.2 : goal === 'muscle_gain' ? 1.6 : 1.8
  return Math.round((weightKg * multiplier) / 10) * 10
}

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
}

function calcCalories(weightKg, heightCm, age, sex, goal, activityLevel) {
  if (!weightKg || !heightCm || !age || !sex || !activityLevel) return null
  const bmr = sex === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  const tdee = bmr * (ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.55)
  const adj = goal === 'fat_loss' ? -400 : goal === 'muscle_gain' ? 300 : 0
  return Math.round((tdee + adj) / 50) * 50
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
  const [goal, setGoal] = useState('recomp')
  const [startDate, setStartDate] = useState(today)
  const [totalDays, setTotalDays] = useState(90)
  const [weightKg, setWeightKg] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('')
  const [activityLevel, setActivityLevel] = useState('')
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedPlan = PLAN_LIST.find((p) => p.id === planId)
  const protein = calcProtein(Number(weightKg), goal)
  const calories = calcCalories(Number(weightKg), Number(heightCm), Number(age), sex, goal, activityLevel)
  const bmi = calcBMI(Number(weightKg), Number(heightCm))

  async function handleFinish() {
    if (!name.trim() || !planId) return
    const days = Math.max(7, Math.min(365, Number(totalDays) || 90))
    setLoading(true)
    setError('')
    try {
      // The session is what the app needs to function, so a failed profile write
      // shouldn't stop someone getting in. It's handled separately on purpose.
      try {
        await updateUserProfile({ name: firstName.trim(), weightKg: Number(weightKg) || 0, heightCm: Number(heightCm) || 0, age: Number(age) || 0, sex, activityLevel })
      } catch (e) {
        console.error('[kinetiq] profile save during onboarding failed:', e)
      }
      await createSession(name.trim(), startDate, planId, days, goal)
    } catch (e) {
      // Previously this had no catch at all: the button just stopped spinning
      // and the first-run failure was completely silent.
      setError(e?.message || "Couldn't create your cycle. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-3xl font-semibold tracking-tight">
            Let's get started
          </div>
          <p className="text-muted text-sm">Set up your first training cycle</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold flex-shrink-0 transition-colors ${
                i < step ? 'bg-ink text-ink' :
                i === step ? 'text-ink ring-1 ring-rule' :
                'text-muted'
              }`}
                style={i === step ? { background: 'var(--raised)' } : i > step ? { background: 'var(--raised)' } : {}}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs hidden sm:inline ${i === step ? 'text-ink' : 'text-muted'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px" style={{ background: i < step ? 'var(--ink)' : 'var(--rule)' }} />}
            </div>
          ))}
        </div>

        {/* Step 1: Name */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="card space-y-4">
              <div>
                <h2 className="font-semibold text-lg text-ink mb-1">Name your cycle</h2>
                <p className="text-xs text-muted">Give this training cycle a name you'll remember.</p>
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Cycle Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer Cut 2026"
                  className="input-field"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(1)}
                />
              </div>
            </div>
            <button onClick={() => setStep(1)} disabled={!name.trim()} className="w-full btn-primary py-3 disabled:opacity-40">
              Next
            </button>
          </div>
        )}

        {/* Step 2: Plan */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-semibold text-lg text-ink">Choose your goal & plan</h2>
              <p className="text-xs text-muted">What are you training for? This sets your calorie and protein targets.</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'fat_loss', label: 'Fat Loss', desc: '−400 kcal deficit' },
                { value: 'recomp', label: 'Recomp', desc: 'Maintenance' },
                { value: 'muscle_gain', label: 'Muscle Gain', desc: '+300 kcal surplus' },
              ].map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  className="flex flex-col items-center py-3 px-2 rounded-xl transition-all"
                  style={goal === g.value
                    ? { border: '1px solid #3C4650', background: 'var(--raised)' }
                    : { border: '1px solid var(--rule)', background: 'var(--raised)' }}
                >
                  <span className={`text-xs font-semibold ${goal === g.value ? 'text-ink' : 'text-ink'}`}>{g.label}</span>
                  <span className="text-micro text-muted mt-0.5">{g.desc}</span>
                </button>
              ))}
            </div>
            <PlanPicker value={planId} onChange={setPlanId} ask />
            <div className="flex gap-2">
              <button onClick={() => setStep(0)} className="btn-ghost px-4 py-3">← Back</button>
              <button onClick={() => setStep(2)} disabled={!planId} className="flex-1 btn-primary py-3 disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-semibold text-lg text-ink">Set your schedule</h2>
              <p className="text-xs text-muted">When does your cycle start and how long should it run?</p>
            </div>
            <div className="card space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1">Start Date (Day 1)</label>
                <input type="date" value={startDate} min={today} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-2">Duration</label>
                <div className="flex gap-2 mb-2">
                  {[30, 60, 90, 120].map((d) => (
                    <button
                      key={d}
                      onClick={() => setTotalDays(d)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={Number(totalDays) === d
                        ? { background: 'var(--ink)', color: 'white' }
                        : { background: 'var(--raised)', color: '#8B949E' }}
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
              <button onClick={() => setStep(3)} className="flex-1 btn-primary py-3">Next</button>
            </div>
          </div>
        )}

        {/* Step 4: Stats */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-semibold text-lg text-ink">Your stats</h2>
              <p className="text-xs text-muted">Used to calculate your personalised calorie and protein targets.</p>
            </div>
            <div className="card space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1">First Name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="input-field"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="e.g. 70"
                    className="input-field"
                    min={30}
                    max={200}
                    step={0.5}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Height (cm)</label>
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
                <div>
                  <label className="text-xs text-muted block mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 25"
                    className="input-field"
                    min={10}
                    max={100}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Sex</label>
                  <select value={sex} onChange={(e) => setSex(e.target.value)} className="input-field">
                    <option value="">Select…</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted block mb-2">Activity Level</label>
                <div className="space-y-1.5">
                  {[
                    { value: 'sedentary',   label: 'Sedentary',      desc: 'Desk job, little/no exercise' },
                    { value: 'light',       label: 'Lightly Active',  desc: '1–3 workouts/week' },
                    { value: 'moderate',    label: 'Moderate',        desc: '3–5 workouts/week' },
                    { value: 'active',      label: 'Active',          desc: '6–7 workouts/week' },
                    { value: 'very_active', label: 'Very Active',     desc: 'Athlete / physical job' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setActivityLevel(opt.value)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-colors"
                      style={activityLevel === opt.value
                        ? { background: 'var(--raised)', border: '1px solid #3C4650' }
                        : { background: 'var(--raised)', border: '1px solid var(--rule)' }}
                    >
                      <div>
                        <span className={`text-xs font-semibold ${activityLevel === opt.value ? 'text-ink' : 'text-ink'}`}>{opt.label}</span>
                        <span className="text-xs text-muted ml-1.5">{opt.desc}</span>
                      </div>
                      {activityLevel === opt.value && <span className="text-ink text-xs">●</span>}
                    </button>
                  ))}
                </div>
              </div>

              {protein && (
                <div className="rounded-xl px-4 py-3 space-y-2" style={{ background: 'var(--raised)', border: '1px solid #3C4650' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-ink font-semibold">Daily Protein Target</span>
                    <span className="text-xl font-semibold text-ink">{protein}g</span>
                  </div>
                  {calories && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ink font-semibold">Daily Calorie Target</span>
                      <span className="text-xl font-semibold text-ink">{calories} kcal</span>
                    </div>
                  )}
                  {bmi && <p className="text-xs text-muted">BMI: {bmi}</p>}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="card space-y-2" style={{ borderColor: 'var(--raised)', background: 'var(--raised)' }}>
              <div className="text-xs font-semibold text-ink mb-1">Your cycle</div>
              {[
                { label: 'Name', value: name },
                { label: 'Goal', value: goal === 'fat_loss' ? 'Fat Loss' : goal === 'muscle_gain' ? 'Muscle Gain' : 'Recomp' },
                { label: 'Plan', value: selectedPlan?.name },
                { label: 'Start', value: format(new Date(startDate + 'T00:00:00'), 'MMM d, yyyy') },
                { label: 'Duration', value: `${totalDays} days` },
                protein ? { label: 'Protein goal', value: `${protein}g / day`, valueClass: 'text-ink' } : null,
                calories ? { label: 'Calorie target', value: `${calories} kcal / day`, valueClass: 'text-ink' } : null,
              ].filter(Boolean).map(({ label, value, valueClass }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-muted">{label}</span>
                  <span className={`font-medium ${valueClass ?? 'text-ink'}`}>{value}</span>
                </div>
              ))}
            </div>

            {error && (
              <div className="text-xs text-warn rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(255,107,91,0.1)', border: '1px solid rgba(255,107,91,0.3)' }}>
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="btn-ghost px-4 py-3">← Back</button>
              <button onClick={handleFinish} disabled={loading} className="flex-1 btn-primary py-3 disabled:opacity-50">
                {loading ? 'Creating…' : 'Create my cycle'}
              </button>
            </div>
            <button onClick={handleFinish} disabled={loading} className="w-full text-xs text-muted hover:text-ink transition-colors py-1">
              Skip stats for now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
