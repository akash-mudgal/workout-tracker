import { useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useStore } from '../store.jsx'
import { getRecommendedWorkout, PHASE_INFO } from '../data/workoutPlans'

const WATER_GOAL = 10
const STEPS_GOAL = 9000
const SLEEP_GOAL = 7.5

export default function Dashboard() {
  const { today, dayNumber, totalDays, todayLog, workoutHistory, updateTodayLog, toggleSupplement, activeSession, proteinGoal } = useStore()
  const navigate = useNavigate()
  const recommended = getRecommendedWorkout(activeSession?.planId ?? 'ppl', workoutHistory)
  const todayDone = workoutHistory[today]

  const phaseIdx = dayNumber <= Math.round(totalDays / 3) ? 0 : dayNumber <= Math.round(totalDays * 2 / 3) ? 1 : 2
  const phase = PHASE_INFO[phaseIdx]
  const pct = dayNumber / totalDays
  const circumference = 2 * Math.PI * 22

  const goals = [
    { label: 'Protein',  done: todayLog.protein >= proteinGoal, current: todayLog.protein,       goal: proteinGoal,  unit: 'g' },
    { label: 'Steps',    done: todayLog.steps >= STEPS_GOAL,    current: todayLog.steps,          goal: STEPS_GOAL,   unit: '' },
    { label: 'Water',    done: todayLog.water >= WATER_GOAL,    current: todayLog.water,          goal: WATER_GOAL,   unit: '' },
    { label: 'Sleep',    done: todayLog.sleep >= 7,             current: todayLog.sleep,          goal: 7,            unit: 'h' },
    { label: 'Workout',  done: !!todayDone,                     current: todayDone ? 1 : 0,       goal: 1,            unit: '' },
  ]
  const doneCount = goals.filter((g) => g.done).length

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-xs font-medium text-zinc-500 tracking-widest uppercase">
            {format(new Date(today + 'T00:00:00'), 'EEE, MMM d')}
          </p>
          <h1 className="text-2xl font-bold mt-0.5 text-white">Hey, Akash</h1>
          {activeSession && (
            <Link to="/sessions" className="text-xs text-violet-400/60 hover:text-violet-400 transition-colors mt-0.5 inline-block">
              {activeSession.name} ›
            </Link>
          )}
        </div>

        {/* Circular day progress */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <circle cx="26" cy="26" r="22" fill="none" stroke="url(#dayGrad)" strokeWidth="3"
              strokeDasharray={`${circumference * pct} ${circumference * (1 - pct)}`}
              strokeLinecap="round" />
            <defs>
              <linearGradient id="dayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-black text-white leading-none">{dayNumber}</span>
            <span className="text-[9px] text-violet-400/70 leading-none mt-0.5">/{totalDays}</span>
          </div>
        </div>
      </div>

      {/* Cycle progress */}
      <div className="card">
        <div className="flex justify-between text-xs text-zinc-500 mb-2">
          <span>Week {Math.ceil(dayNumber / 7)} · <span className="text-zinc-400">{phase.label} Phase</span></span>
          <span className="text-violet-400 font-semibold">{Math.round(pct * 100)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }} />
        </div>
        <p className="text-xs text-zinc-400 mt-2">{phase.desc}</p>
      </div>

      {/* Today's Workout */}
      <WorkoutHeroCard recommended={recommended} todayDone={todayDone} onClick={() => navigate('/workout')} />

      {/* Today's Goals */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Today's Goals</h3>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${doneCount === goals.length ? 'bg-emerald-500/15 text-emerald-400' : 'bg-violet-500/15 text-violet-400'}`}>
            {doneCount} / {goals.length}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {goals.map((g) => (
            <div key={g.label} className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${g.done ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-white/[0.02] border-white/[0.06]'}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-[10px] font-black ${g.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-600 text-zinc-500'}`}>
                {g.done ? '✓' : ''}
              </div>
              <div className="min-w-0">
                <div className={`text-sm font-semibold truncate ${g.done ? 'text-emerald-300' : 'text-zinc-300'}`}>{g.label}</div>
                <div className="text-xs text-zinc-400">
                  {g.label === 'Workout' ? (g.done ? 'Logged' : 'Pending') : `${typeof g.current === 'number' && g.current >= 1000 ? g.current.toLocaleString() : g.current} / ${typeof g.goal === 'number' && g.goal >= 1000 ? g.goal.toLocaleString() : g.goal}${g.unit}`}
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat sliders */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Water" value={todayLog.water} goal={WATER_GOAL} unit="glasses" color="cyan"
          min={0} max={15} step={1}
          onChange={(v) => updateTodayLog({ water: v })} />
        <StatCard label="Protein" value={todayLog.protein} goal={proteinGoal} unit="g" color="amber"
          min={0} max={Math.max(400, proteinGoal * 2)} step={5}
          onChange={(v) => updateTodayLog({ protein: v })} />
        <StatCard label="Steps" value={todayLog.steps} goal={STEPS_GOAL} unit="steps" color="emerald"
          min={0} max={20000} step={500}
          onChange={(v) => updateTodayLog({ steps: v })} />
        <StatCard label="Sleep" value={todayLog.sleep} goal={SLEEP_GOAL} unit="hrs" color="indigo"
          min={0} max={12} step={0.5}
          onChange={(v) => updateTodayLog({ sleep: v })} />
      </div>

      {/* Supplements */}
      <div className="card">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Supplements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <SupplementRow label="Creatine Monohydrate" sub="3–5g · Strength & muscle" checked={todayLog.supplements?.creatine} onChange={() => toggleSupplement('creatine')} />
          <SupplementRow label="Vitamin B12" sub="Essential for vegetarians" checked={todayLog.supplements?.b12} onChange={() => toggleSupplement('b12')} />
          <SupplementRow label="D3 + Magnesium" sub="Recovery & sleep quality" checked={todayLog.supplements?.d3mag} onChange={() => toggleSupplement('d3mag')} />
        </div>
      </div>
    </div>
  )
}

const COLOR_TOKENS = {
  cyan:    { track: '#06b6d4', text: 'text-cyan-400',    done: 'bg-cyan-500/10 border-cyan-500/20' },
  amber:   { track: '#f59e0b', text: 'text-amber-400',   done: 'bg-amber-500/10 border-amber-500/20' },
  emerald: { track: '#10b981', text: 'text-emerald-400', done: 'bg-emerald-500/10 border-emerald-500/20' },
  indigo:  { track: '#6366f1', text: 'text-indigo-400',  done: 'bg-indigo-500/10 border-indigo-500/20' },
}

function StatCard({ label, value, goal, unit, color, min, max, step, onChange }) {
  const pct = Math.min((value / goal) * 100, 100)
  const done = value >= goal
  const c = COLOR_TOKENS[color]
  const displayValue = unit === 'steps' ? value.toLocaleString() : value

  return (
    <div className={`rounded-2xl border overflow-hidden ${done ? c.done : 'bg-white/[0.02] border-white/[0.06]'}`}>
      {/* Color progress track at top */}
      <div className="h-1 w-full bg-white/5">
        <div className="h-full transition-all duration-500 ease-out rounded-full"
          style={{ width: `${pct}%`, background: c.track }} />
      </div>
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">{label}</span>
          {done && <span className={`text-xs font-bold ${c.text}`}>✓</span>}
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-black ${done ? c.text : 'text-white'}`}>{displayValue}</span>
          <span className="text-xs text-zinc-400">{unit}</span>
        </div>
        <div>
          <input
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(+e.target.value)}
          />
          <div className="flex justify-between text-[10px] text-zinc-500 mt-1.5">
            <span>{min}</span>
            <span>Goal: {typeof goal === 'number' && goal >= 1000 ? goal.toLocaleString() : goal}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkoutHeroCard({ recommended, todayDone, onClick }) {
  const colorMap = {
    'bg-red-500/10':     { grad: 'rgba(239,68,68,0.12)',    border: 'rgba(239,68,68,0.25)',    line: '#ef4444' },
    'bg-blue-500/10':    { grad: 'rgba(59,130,246,0.12)',   border: 'rgba(59,130,246,0.25)',   line: '#3b82f6' },
    'bg-violet-500/10':  { grad: 'rgba(124,58,237,0.12)',   border: 'rgba(124,58,237,0.3)',    line: '#7c3aed' },
    'bg-emerald-500/10': { grad: 'rgba(16,185,129,0.12)',   border: 'rgba(16,185,129,0.25)',   line: '#10b981' },
    'bg-amber-500/10':   { grad: 'rgba(245,158,11,0.12)',   border: 'rgba(245,158,11,0.25)',   line: '#f59e0b' },
    'bg-orange-500/10':  { grad: 'rgba(249,115,22,0.12)',   border: 'rgba(249,115,22,0.25)',   line: '#f97316' },
    'bg-zinc-500/10':    { grad: 'rgba(113,113,122,0.08)',  border: 'rgba(113,113,122,0.2)',   line: '#71717a' },
  }
  const c = colorMap[recommended.colorClasses.bg] ?? colorMap['bg-violet-500/10']

  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl p-5 cursor-pointer active:scale-[0.98] transition-all duration-150"
      style={{ background: `linear-gradient(135deg, ${c.grad} 0%, rgba(255,255,255,0.015) 100%)`, border: `1px solid ${c.border}` }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: c.line, opacity: 0.5 }} />
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-1.5 h-1.5 rounded-full ${recommended.colorClasses.dot}`} />
            <span className="text-[10px] font-semibold text-zinc-500 tracking-widest uppercase">{todayDone ? "Next Workout" : "Today's Workout"}</span>
          </div>
          <h2 className={`text-2xl font-bold ${recommended.colorClasses.text}`}>{recommended.name}</h2>
          <p className="text-sm text-zinc-400 mt-0.5">{recommended.subtitle}</p>
          {recommended.exercises.length > 0 && (
            <p className="text-xs text-zinc-400 mt-2">{recommended.exercises.length} exercises</p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          {todayDone ? (
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <span className="text-emerald-400">✓</span>
              </div>
              <span className="text-[10px] text-emerald-500 font-semibold">Done</span>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-xl text-sm font-bold text-zinc-300 bg-white/8 border border-white/10">
              Start →
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SupplementRow({ label, sub, checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left active:scale-[0.98] transition-all duration-150 ${
        checked ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-white/[0.02] border-white/[0.05]'
      }`}
    >
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        checked ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
      }`}>
        {checked && <span className="text-white text-[10px] font-black">✓</span>}
      </div>
      <div>
        <div className={`text-sm font-medium ${checked ? 'text-emerald-300' : 'text-zinc-300'}`}>{label}</div>
        <div className="text-xs text-zinc-400 mt-0.5">{sub}</div>
      </div>
    </button>
  )
}
