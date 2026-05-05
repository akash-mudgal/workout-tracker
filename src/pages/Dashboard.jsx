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

  const phase = dayNumber <= Math.round(totalDays / 3) ? PHASE_INFO[0] : dayNumber <= Math.round(totalDays * 2 / 3) ? PHASE_INFO[1] : PHASE_INFO[2]
  const pct = dayNumber / totalDays
  const circumference = 2 * Math.PI * 22

  const checklistItems = [
    { label: `${proteinGoal}g protein`, done: todayLog.protein >= proteinGoal, current: todayLog.protein, goal: proteinGoal, unit: 'g' },
    { label: '9k steps', done: todayLog.steps >= STEPS_GOAL, current: todayLog.steps.toLocaleString(), goal: STEPS_GOAL.toLocaleString(), unit: '' },
    { label: '10 glasses water', done: todayLog.water >= WATER_GOAL, current: todayLog.water, goal: WATER_GOAL, unit: '' },
    { label: '7+ hrs sleep', done: todayLog.sleep >= 7, current: todayLog.sleep, goal: 7, unit: 'h' },
    { label: 'Workout logged', done: !!todayDone, current: null, goal: null },
  ]
  const doneCount = checklistItems.filter((i) => i.done).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-xs font-medium text-zinc-500 tracking-widest uppercase">
            {format(new Date(today + 'T00:00:00'), 'EEE, MMM d')}
          </p>
          <h1 className="text-2xl font-bold mt-0.5">Hey, Akash</h1>
          {activeSession && (
            <Link to="/sessions" className="inline-flex items-center gap-1 text-xs mt-0.5 transition-colors" style={{ color: 'rgba(167,139,250,0.6)' }}>
              {activeSession.name} ›
            </Link>
          )}
        </div>

        {/* Circular day progress */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <circle
              cx="26" cy="26" r="22" fill="none"
              stroke="url(#dayGrad)" strokeWidth="3"
              strokeDasharray={`${circumference * pct} ${circumference * (1 - pct)}`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="dayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-black text-white leading-none">{dayNumber}</span>
            <span className="text-[9px] font-medium leading-none mt-0.5" style={{ color: 'rgba(167,139,250,0.7)' }}>/{totalDays}</span>
          </div>
        </div>
      </div>

      {/* Phase strip */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-zinc-500">Week {Math.ceil(dayNumber / 7)} · <span className="text-zinc-400">{phase.label} Phase</span></span>
        <span className="text-xs font-semibold" style={{ color: '#a78bfa' }}>{Math.round(pct * 100)}%</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${pct * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }}
        />
      </div>

      {/* Today's Workout — hero card */}
      <div
        onClick={() => navigate('/workout')}
        className="relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all duration-200 active:scale-[0.98]"
        style={{
          background: `linear-gradient(135deg, ${recommended.colorClasses.bg.replace('bg-', '').includes('red') ? 'rgba(239,68,68,0.12)' : recommended.colorClasses.bg.replace('bg-', '').includes('blue') ? 'rgba(59,130,246,0.12)' : recommended.colorClasses.bg.replace('bg-', '').includes('violet') ? 'rgba(124,58,237,0.12)' : recommended.colorClasses.bg.replace('bg-', '').includes('emerald') ? 'rgba(16,185,129,0.12)' : recommended.colorClasses.bg.replace('bg-', '').includes('amber') ? 'rgba(245,158,11,0.12)' : 'rgba(124,58,237,0.12)'} 0%, rgba(255,255,255,0.02) 100%)`,
          border: `1px solid ${recommended.colorClasses.border.replace('border-', '').includes('red') ? 'rgba(239,68,68,0.25)' : recommended.colorClasses.border.replace('border-', '').includes('blue') ? 'rgba(59,130,246,0.25)' : recommended.colorClasses.border.replace('border-', '').includes('violet') ? 'rgba(124,58,237,0.3)' : recommended.colorClasses.border.replace('border-', '').includes('emerald') ? 'rgba(16,185,129,0.25)' : recommended.colorClasses.border.replace('border-', '').includes('amber') ? 'rgba(245,158,11,0.25)' : 'rgba(124,58,237,0.25)'}`,
        }}
      >
        {/* Top accent line */}
        <div className={`absolute top-0 left-0 right-0 h-px ${recommended.colorClasses.dot}`} style={{ opacity: 0.6 }} />

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-1.5 h-1.5 rounded-full ${recommended.colorClasses.dot}`} />
              <span className="text-xs font-medium text-zinc-400 tracking-wide">TODAY'S WORKOUT</span>
            </div>
            <h2 className={`text-2xl font-bold ${recommended.colorClasses.text}`}>{recommended.name}</h2>
            <p className="text-sm text-zinc-400 mt-0.5">{recommended.subtitle}</p>
            {recommended.exercises.length > 0 && (
              <p className="text-xs text-zinc-500 mt-2">{recommended.exercises.length} exercises</p>
            )}
          </div>
          <div>
            {todayDone ? (
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <span className="text-emerald-400 text-base">✓</span>
                </div>
                <span className="text-[10px] text-emerald-500 font-medium">Done</span>
              </div>
            ) : (
              <div
                className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                Start →
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily checklist summary strip */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-zinc-400">Today's Goals</span>
        <span className="text-xs font-bold" style={{ color: doneCount === checklistItems.length ? '#10b981' : '#a78bfa' }}>
          {doneCount}/{checklistItems.length}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {checklistItems.map((item, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1 rounded-xl py-2 px-1 transition-all"
            style={{
              background: item.done ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${item.done ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
              style={{ background: item.done ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)', color: item.done ? '#10b981' : '#52525b' }}
            >
              {item.done ? '✓' : '○'}
            </div>
            <span className="text-[8.5px] font-medium text-center leading-tight" style={{ color: item.done ? '#6ee7b7' : '#71717a' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Water" value={todayLog.water} goal={WATER_GOAL} unit="glasses" color="cyan"
          onMinus={() => updateTodayLog({ water: Math.max(0, todayLog.water - 1) })}
          onPlus={() => updateTodayLog({ water: Math.min(15, todayLog.water + 1) })} />
        <StatCard label="Protein" value={todayLog.protein} goal={proteinGoal} unit="g" color="amber"
          onMinus={() => updateTodayLog({ protein: Math.max(0, todayLog.protein - 10) })}
          onPlus={() => updateTodayLog({ protein: todayLog.protein + 10 })} />
        <StatCard label="Steps" value={todayLog.steps} goal={STEPS_GOAL} unit="steps" color="emerald"
          onMinus={() => updateTodayLog({ steps: Math.max(0, todayLog.steps - 500) })}
          onPlus={() => updateTodayLog({ steps: todayLog.steps + 500 })} />
        <StatCard label="Sleep" value={todayLog.sleep} goal={SLEEP_GOAL} unit="hrs" color="indigo"
          onMinus={() => updateTodayLog({ sleep: Math.max(0, +(todayLog.sleep - 0.5).toFixed(1)) })}
          onPlus={() => updateTodayLog({ sleep: +(todayLog.sleep + 0.5).toFixed(1) })} />
      </div>

      {/* Supplements */}
      <div className="card">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Supplements</h3>
        <div className="space-y-2">
          <SupplementRow label="Creatine Monohydrate" sub="3–5g · Strength & muscle" checked={todayLog.supplements?.creatine} onChange={() => toggleSupplement('creatine')} />
          <SupplementRow label="Vitamin B12" sub="Essential for vegetarians" checked={todayLog.supplements?.b12} onChange={() => toggleSupplement('b12')} />
          <SupplementRow label="D3 + Magnesium" sub="Recovery & sleep quality" checked={todayLog.supplements?.d3mag} onChange={() => toggleSupplement('d3mag')} />
        </div>
      </div>
    </div>
  )
}

const colorTokens = {
  cyan:    { bar: '#06b6d4', text: '#22d3ee', bg: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.2)' },
  amber:   { bar: '#f59e0b', text: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)' },
  emerald: { bar: '#10b981', text: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)' },
  indigo:  { bar: '#6366f1', text: '#818cf8', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.2)' },
}

function StatCard({ label, value, goal, unit, color, onMinus, onPlus }) {
  const pct = Math.min((value / goal) * 100, 100)
  const done = value >= goal
  const c = colorTokens[color]

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: done ? c.bg : 'rgba(255,255,255,0.03)',
        border: `1px solid ${done ? c.border : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      {/* Top progress bar */}
      <div className="h-1 w-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c.bar}99, ${c.bar})` }}
        />
      </div>

      <div className="p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500">{label}</span>
          {done && <span className="text-[10px] font-bold" style={{ color: c.text }}>✓</span>}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black" style={{ color: done ? c.text : 'white' }}>
            {typeof value === 'number' && value >= 1000 ? value.toLocaleString() : value}
          </span>
          <span className="text-xs text-zinc-600">{unit}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-zinc-700">
          <span>0</span>
          <span>/{typeof goal === 'number' && goal >= 1000 ? goal.toLocaleString() : goal}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          <button
            onClick={onMinus}
            className="rounded-lg py-1.5 text-sm font-bold text-zinc-400 transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
          >−</button>
          <button
            onClick={onPlus}
            className="rounded-lg py-1.5 text-sm font-bold transition-all active:scale-95"
            style={{ background: `${c.bar}22`, border: `1px solid ${c.bar}44`, color: c.text }}
          >+</button>
        </div>
      </div>
    </div>
  )
}

function SupplementRow({ label, sub, checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left active:scale-[0.98]"
      style={{
        background: checked ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${checked ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
        style={{
          background: checked ? '#10b981' : 'transparent',
          border: `2px solid ${checked ? '#10b981' : 'rgba(255,255,255,0.15)'}`,
        }}
      >
        {checked && <span className="text-white text-[10px] font-bold">✓</span>}
      </div>
      <div>
        <div className="text-sm font-medium" style={{ color: checked ? '#6ee7b7' : '#d4d4d8' }}>{label}</div>
        <div className="text-xs text-zinc-600 mt-0.5">{sub}</div>
      </div>
    </button>
  )
}
