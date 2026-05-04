import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useStore } from '../store.jsx'
import { getRecommendedWorkout, PHASE_INFO } from '../data/workoutPlan'

const WATER_GOAL = 10
const STEPS_GOAL = 9000
const PROTEIN_GOAL = 130
const SLEEP_GOAL = 7.5

export default function Dashboard() {
  const { today, dayNumber, todayLog, workoutHistory, updateTodayLog, toggleSupplement } = useStore()
  const navigate = useNavigate()
  const recommended = getRecommendedWorkout(workoutHistory)
  const todayDone = workoutHistory[today]

  const phase = dayNumber <= 28 ? PHASE_INFO[0] : dayNumber <= 56 ? PHASE_INFO[1] : PHASE_INFO[2]
  const weekNum = Math.ceil(dayNumber / 7)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-zinc-500 text-sm">{format(new Date(today + 'T00:00:00'), 'EEEE, MMM d')}</p>
          <h1 className="text-2xl font-bold mt-0.5">Hey Akash 👋</h1>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-500">Day</div>
          <div className="text-3xl font-black text-violet-400">{dayNumber}</div>
          <div className="text-xs text-zinc-500">of 90</div>
        </div>
      </div>

      {/* 90-day progress bar */}
      <div className="card">
        <div className="flex justify-between text-xs text-zinc-500 mb-2">
          <span>Week {weekNum} · {phase.label} Phase</span>
          <span>{Math.round((dayNumber / 90) * 100)}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill bg-gradient-to-r from-violet-600 to-violet-400"
            style={{ width: `${(dayNumber / 90) * 100}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500 mt-2">{phase.desc}</p>
      </div>

      {/* Today's Workout Card */}
      <div
        className={`card ${recommended.colorClasses.bg} ${recommended.colorClasses.border} cursor-pointer`}
        onClick={() => navigate('/workout')}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${recommended.colorClasses.dot}`} />
              <span className="text-xs text-zinc-400">Today's Workout</span>
            </div>
            <h2 className={`text-xl font-bold ${recommended.colorClasses.text}`}>{recommended.name}</h2>
            <p className="text-sm text-zinc-400">{recommended.subtitle}</p>
            {recommended.exercises.length > 0 && (
              <p className="text-xs text-zinc-500 mt-1">{recommended.exercises.length} exercises</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {todayDone ? (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-medium">
                Done ✓
              </span>
            ) : (
              <button className={`text-sm font-semibold px-4 py-2 rounded-xl ${recommended.colorClasses.badge}`}>
                Start →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Water"
          value={todayLog.water}
          goal={WATER_GOAL}
          unit="glasses"
          color="cyan"
          icon="💧"
          onMinus={() => updateTodayLog({ water: Math.max(0, todayLog.water - 1) })}
          onPlus={() => updateTodayLog({ water: Math.min(15, todayLog.water + 1) })}
        />
        <StatCard
          label="Protein"
          value={todayLog.protein}
          goal={PROTEIN_GOAL}
          unit="g"
          color="amber"
          icon="🥩"
          onMinus={() => updateTodayLog({ protein: Math.max(0, todayLog.protein - 10) })}
          onPlus={() => updateTodayLog({ protein: todayLog.protein + 10 })}
        />
        <StatCard
          label="Steps"
          value={todayLog.steps}
          goal={STEPS_GOAL}
          unit="steps"
          color="emerald"
          icon="🚶"
          onMinus={() => updateTodayLog({ steps: Math.max(0, todayLog.steps - 500) })}
          onPlus={() => updateTodayLog({ steps: todayLog.steps + 500 })}
        />
        <StatCard
          label="Sleep"
          value={todayLog.sleep}
          goal={SLEEP_GOAL}
          unit="hrs"
          color="indigo"
          icon="😴"
          onMinus={() => updateTodayLog({ sleep: Math.max(0, +(todayLog.sleep - 0.5).toFixed(1)) })}
          onPlus={() => updateTodayLog({ sleep: +(todayLog.sleep + 0.5).toFixed(1) })}
        />
      </div>

      {/* Supplements */}
      <div className="card">
        <h3 className="text-sm font-semibold text-zinc-400 mb-3">Daily Supplements</h3>
        <div className="space-y-2">
          <SupplementRow
            label="Creatine Monohydrate"
            sub="3–5g · Strength & muscle"
            checked={todayLog.supplements?.creatine}
            onChange={() => toggleSupplement('creatine')}
          />
          <SupplementRow
            label="Vitamin B12"
            sub="Essential for vegetarians"
            checked={todayLog.supplements?.b12}
            onChange={() => toggleSupplement('b12')}
          />
          <SupplementRow
            label="D3 + Magnesium"
            sub="Recovery & sleep quality"
            checked={todayLog.supplements?.d3mag}
            onChange={() => toggleSupplement('d3mag')}
          />
        </div>
      </div>

      {/* Daily Rules */}
      <div className="card border-violet-500/20 bg-violet-500/5">
        <h3 className="text-sm font-semibold text-violet-400 mb-2">Daily Checklist</h3>
        <div className="space-y-1 text-xs text-zinc-400">
          {[
            `120g+ protein ${todayLog.protein >= 120 ? '✓' : `(${todayLog.protein}/${120}g)`}`,
            `8–10k steps ${todayLog.steps >= 8000 ? '✓' : `(${todayLog.steps.toLocaleString()})`}`,
            `10 glasses water ${todayLog.water >= 10 ? '✓' : `(${todayLog.water}/10)`}`,
            `7+ hrs sleep ${todayLog.sleep >= 7 ? '✓' : `(${todayLog.sleep} hrs)`}`,
            `Workout logged ${todayDone ? '✓' : '—'}`,
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-2 ${item.includes('✓') ? 'text-emerald-400' : ''}`}>
              <span>{item.includes('✓') ? '●' : '○'}</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, goal, unit, color, icon, onMinus, onPlus }) {
  const pct = Math.min((value / goal) * 100, 100)
  const done = value >= goal

  const colorMap = {
    cyan: { bar: 'bg-cyan-500', text: 'text-cyan-400' },
    amber: { bar: 'bg-amber-500', text: 'text-amber-400' },
    emerald: { bar: 'bg-emerald-500', text: 'text-emerald-400' },
    indigo: { bar: 'bg-indigo-500', text: 'text-indigo-400' },
  }
  const c = colorMap[color]

  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{icon} {label}</span>
        {done && <span className="text-xs text-emerald-400">✓</span>}
      </div>
      <div className={`text-2xl font-bold ${c.text}`}>
        {value.toLocaleString()} <span className="text-sm font-normal text-zinc-500">{unit}</span>
      </div>
      <div className="progress-bar">
        <div className={`progress-fill ${c.bar}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-zinc-600">
        <span>0</span>
        <span>Goal: {typeof goal === 'number' && goal >= 1000 ? goal.toLocaleString() : goal}</span>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onMinus} className="flex-1 btn-ghost text-lg leading-none py-1">−</button>
        <button onClick={onPlus} className="flex-1 btn-ghost text-lg leading-none py-1">+</button>
      </div>
    </div>
  )
}

function SupplementRow({ label, sub, checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
        checked ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-zinc-800/50 border border-transparent'
      }`}
    >
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        checked ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-600'
      }`}>
        {checked && <span className="text-white text-xs">✓</span>}
      </div>
      <div className="text-left">
        <div className={`text-sm font-medium ${checked ? 'text-emerald-300' : 'text-zinc-300'}`}>{label}</div>
        <div className="text-xs text-zinc-500">{sub}</div>
      </div>
    </button>
  )
}
