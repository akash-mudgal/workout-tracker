import { useState, useCallback, useEffect } from 'react'
import { format } from 'date-fns'
import { useStore } from '../store.jsx'
import { getPlan, getRecommendedWorkout, getWorkoutById, getWorkoutDays } from '../data/workoutPlans'

// An in-progress workout is persisted on every keystroke. Before this, sets lived
// only in component state, so one tap on the nav bar between sets threw the whole
// session away. The draft also means there is no need to block navigation.
const DRAFT_KEY = 'wt_workout_draft'

function readValidDraft(date, sessionId) {
  if (!sessionId) return null
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const d = JSON.parse(raw)
    if (d?.date !== date || d?.sessionId !== sessionId) return null
    if (!d.sessionSets || Object.keys(d.sessionSets).length === 0) return null
    return d
  } catch { return null }
}

function writeDraft(draft) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)) } catch { /* ignore */ }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
}

function NumericInput({ value, onCommit, inputMode = 'decimal', className }) {
  const [display, setDisplay] = useState(String(value ?? 0))

  useEffect(() => { setDisplay(String(value ?? 0)) }, [value])

  return (
    <input
      type="text"
      inputMode={inputMode}
      value={display}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        setDisplay(e.target.value)
        const num = parseFloat(e.target.value)
        if (!isNaN(num)) onCommit(num)
      }}
      onBlur={() => {
        const num = parseFloat(display) || 0
        setDisplay(String(num))
        onCommit(num)
      }}
      className={className}
    />
  )
}

export default function WorkoutLogger() {
  const { today, workoutHistory, saveWorkout, activeSession, activeSessionId } = useStore()
  const planId = activeSession?.planId ?? 'ppl'
  const plan = getPlan(planId)
  const todayWorkout = workoutHistory[today]
  const recommended = getRecommendedWorkout(planId, workoutHistory)

  const [draft] = useState(() => readValidDraft(today, activeSessionId))

  const [selectedId, setSelectedId] = useState(draft?.workoutId ?? recommended.id)
  const [phase, setPhase] = useState(draft ? 'logging' : 'select') // select | logging | done
  const [sessionSets, setSessionSets] = useState(draft?.sessionSets ?? {})
  const [startTime, setStartTime] = useState(draft?.startTime ?? Date.now())
  const [confirmOverwrite, setConfirmOverwrite] = useState(false)

  const workout = getWorkoutById(planId, selectedId)

  // Keep the draft current while logging.
  useEffect(() => {
    if (phase !== 'logging') return
    writeDraft({ sessionId: activeSessionId, date: today, workoutId: selectedId, startTime, sessionSets })
  }, [phase, sessionSets, selectedId, startTime, today, activeSessionId])

  const initSession = useCallback(() => {
    const sets = {}
    workout.exercises.forEach((ex) => {
      const prevWorkouts = Object.values(workoutHistory)
        .filter((w) => w.workoutId === selectedId)
        .sort((a, b) => b.date.localeCompare(a.date))
      const prev = prevWorkouts[0]?.exercises?.find((e) => e.name === ex.name)
      const defaultWeight = prev?.sets?.[0]?.weight ?? 0
      const defaultReps = prev?.sets?.[0]?.reps ?? parseInt(ex.repRange)
      sets[ex.name] = Array.from({ length: ex.sets }, (_, i) => ({
        reps: prev?.sets?.[i]?.reps ?? defaultReps,
        weight: prev?.sets?.[i]?.weight ?? defaultWeight,
        done: false,
      }))
    })
    setSessionSets(sets)
    // Start the clock here, not at mount, so the duration measures the workout
    // rather than however long was spent choosing a day.
    setStartTime(Date.now())
    setPhase('logging')
  }, [workout, selectedId, workoutHistory])

  const updateSet = useCallback((exName, setIdx, field, value) => {
    setSessionSets((prev) => ({
      ...prev,
      [exName]: prev[exName].map((s, i) =>
        i === setIdx ? { ...s, [field]: value } : s
      ),
    }))
  }, [])

  const toggleSetDone = useCallback((exName, setIdx) => {
    setSessionSets((prev) => ({
      ...prev,
      [exName]: prev[exName].map((s, i) =>
        i === setIdx ? { ...s, done: !s.done } : s
      ),
    }))
  }, [])

  // `mode` is 'replace' or 'merge'. A workout row is keyed by date, so a second
  // workout on the same day used to silently destroy the first one.
  const commitFinish = useCallback((mode) => {
    const exercises = workout.exercises.map((ex) => ({
      name: ex.name,
      sets: sessionSets[ex.name] || [],
    }))
    const durationMin = Math.round((Date.now() - startTime) / 60000)
    const existing = workoutHistory[today]

    const payload = mode === 'merge' && existing
      ? {
          date: today,
          workoutId: selectedId,
          workoutName: existing.workoutId === selectedId
            ? workout.name
            : `${existing.workoutName} + ${workout.name}`,
          durationMin: (existing.durationMin || 0) + durationMin,
          exercises: [...(existing.exercises || []), ...exercises],
        }
      : {
          date: today,
          workoutId: selectedId,
          workoutName: workout.name,
          durationMin,
          exercises,
        }

    saveWorkout(today, payload)
    clearDraft()
    setConfirmOverwrite(false)
    setPhase('done')
  }, [workout, sessionSets, selectedId, today, startTime, saveWorkout, workoutHistory])

  const handleFinish = useCallback(() => {
    if (workoutHistory[today]) setConfirmOverwrite(true)
    else commitFinish('replace')
  }, [workoutHistory, today, commitFinish])

  const discardDraft = useCallback(() => {
    clearDraft()
    setSessionSets({})
    setPhase('select')
  }, [])

  if (todayWorkout && phase !== 'logging' && phase !== 'done') {
    return <WorkoutSummary workout={todayWorkout} onRedo={() => {
      setSelectedId(todayWorkout.workoutId)
      setPhase('select')
    }} />
  }

  if (phase === 'done') {
    return <WorkoutComplete workout={workoutHistory[today]} />
  }

  if (phase === 'logging') {
    return (
      <>
        <LoggingView
          workout={workout}
          sessionSets={sessionSets}
          workoutHistory={workoutHistory}
          selectedId={selectedId}
          resumed={!!draft}
          onUpdateSet={updateSet}
          onToggleDone={toggleSetDone}
          onFinish={handleFinish}
          onDiscard={discardDraft}
        />
        {confirmOverwrite && (
          <OverwriteConfirm
            existing={workoutHistory[today]}
            onMerge={() => commitFinish('merge')}
            onReplace={() => commitFinish('replace')}
            onCancel={() => setConfirmOverwrite(false)}
          />
        )}
      </>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Log Workout</h1>
        <p className="text-zinc-400 text-sm mt-1">{format(new Date(today + 'T00:00:00'), 'EEEE, MMMM d')}</p>
      </div>

      <div className={`card ${recommended.colorClasses.bg} ${recommended.colorClasses.border}`}>
        <div className="text-xs text-zinc-400 mb-1">Recommended today</div>
        <div className={`text-lg font-bold ${recommended.colorClasses.text}`}>{recommended.name}</div>
        <div className="text-sm text-zinc-400">{recommended.subtitle}</div>
      </div>

      <div className="text-xs text-zinc-400 px-1">{plan.name} · {plan.daysPerWeek} days/week</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {getWorkoutDays(planId).map((w, i) => (
          <button
            key={`${w.id}-${i}`}
            onClick={() => setSelectedId(w.id)}
            className={`w-full card flex items-center justify-between transition-all ${
              selectedId === w.id
                ? `${w.colorClasses.bg} ${w.colorClasses.border}`
                : 'hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${w.colorClasses.dot}`} />
              <div className="text-left">
                <div className="font-semibold">{w.name}</div>
                <div className="text-xs text-zinc-400">{w.subtitle}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {w.id === recommended.id && (
                <span className="text-xs text-violet-400 font-medium">Recommended</span>
              )}
              {selectedId === w.id && <span className="text-violet-400">●</span>}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={initSession}
        className="w-full btn-primary py-3 text-base"
        disabled={workout?.type === 'rest'}
      >
        {workout?.type === 'rest' ? 'Rest Day — Log steps & sleep instead' : `Start ${workout?.name} →`}
      </button>
    </div>
  )
}

function LoggingView({ workout, sessionSets, workoutHistory, selectedId, resumed, onUpdateSet, onToggleDone, onFinish, onDiscard }) {
  const [expandedEx, setExpandedEx] = useState(workout.exercises[0]?.name)
  const totalSets = Object.values(sessionSets).flat().length
  const doneSets = Object.values(sessionSets).flat().filter((s) => s.done).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${workout.colorClasses.text}`}>{workout.name}</h1>
          <p className="text-xs text-zinc-400">{workout.subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-400">Sets</div>
          <div className="text-lg font-bold text-white">{doneSets}/{totalSets}</div>
        </div>
      </div>

      {resumed && (
        <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p className="text-xs text-emerald-300">Picked up where you left off.</p>
          <button onClick={onDiscard} className="text-xs text-zinc-400 hover:text-zinc-200 flex-shrink-0 px-2 py-1">
            Start over
          </button>
        </div>
      )}

      <div className="progress-bar">
        <div
          className={`progress-fill ${workout.colorClasses.dot}`}
          style={{ width: `${totalSets > 0 ? (doneSets / totalSets) * 100 : 0}%` }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {workout.exercises.map((ex) => {
          const sets = sessionSets[ex.name] || []
          const prevWorkouts = Object.values(workoutHistory)
            .filter((w) => w.workoutId === selectedId)
            .sort((a, b) => b.date.localeCompare(a.date))
          const prev = prevWorkouts[0]?.exercises?.find((e) => e.name === ex.name)
          const exDone = sets.every((s) => s.done)
          const isExpanded = expandedEx === ex.name

          return (
            <div key={ex.name} className={`card border ${exDone ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/[0.08]'}`}>
              <button
                className="w-full flex items-center justify-between"
                onClick={() => setExpandedEx(isExpanded ? null : ex.name)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${exDone ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                  <span className="font-medium text-sm">{ex.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <span>{ex.sets}×{ex.repRange} · RPE {ex.rpe}</span>
                  <span>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-3 space-y-2">
                  {ex.tip && (
                    <div className="flex gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                      <span className="text-violet-400 flex-shrink-0">💡</span>
                      <span className="text-xs text-violet-300">{ex.tip}</span>
                    </div>
                  )}
                  {prev && (
                    <div className="text-xs text-zinc-400 rounded-xl px-3 py-1.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      Last: {prev.sets.map((s) => `${s.weight}kg×${s.reps}`).join(', ')}
                    </div>
                  )}
                  <div className="grid grid-cols-12 gap-1 text-xs text-zinc-400 px-1">
                    <div className="col-span-1">Set</div>
                    <div className="col-span-4 text-center">Weight (kg)</div>
                    <div className="col-span-4 text-center">Reps</div>
                    <div className="col-span-3 text-center">Done</div>
                  </div>
                  {sets.map((set, i) => {
                    const prevSet = prev?.sets?.[i]
                    const improved = prevSet && (set.reps > prevSet.reps || set.weight > prevSet.weight)
                    return (
                      <div key={i} className={`grid grid-cols-12 gap-1 items-center ${set.done ? 'opacity-60' : ''}`}>
                        <div className="col-span-1 text-xs text-zinc-400">{i + 1}</div>
                        <div className="col-span-4">
                          <NumericInput
                            value={set.weight}
                            onCommit={(v) => onUpdateSet(ex.name, i, 'weight', v)}
                            inputMode="decimal"
                            className="input-field text-center text-sm py-1"
                          />
                        </div>
                        <div className="col-span-4">
                          <NumericInput
                            value={set.reps}
                            onCommit={(v) => onUpdateSet(ex.name, i, 'reps', v)}
                            inputMode="numeric"
                            className="input-field text-center text-sm py-1"
                          />
                        </div>
                        <div className="col-span-3 flex justify-center">
                          <button
                            onClick={() => onToggleDone(ex.name, i)}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                              set.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-zinc-500'
                            }`}
                          >
                            {set.done && '✓'}
                          </button>
                        </div>
                        {improved && !set.done && (
                          <div className="col-span-12 text-xs text-emerald-400 text-center">
                            ↑ Better than last time
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button onClick={onFinish} className="w-full btn-primary py-3 text-base">
        Finish Workout ✓
      </button>
    </div>
  )
}

function OverwriteConfirm({ existing, onMerge, onReplace, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onCancel}
    >
      <div className="card-raised w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
        <div>
          <h3 className="font-bold text-base text-white">You already logged a workout today</h3>
          <p className="text-sm text-zinc-400 mt-1">
            {existing?.workoutName} is saved for today with {existing?.exercises?.length ?? 0} exercises.
          </p>
        </div>
        <div className="space-y-2">
          <button onClick={onMerge} className="w-full btn-primary py-2.5 text-sm">
            Add to today's log
          </button>
          <button onClick={onReplace} className="w-full btn-ghost py-2.5 text-sm">
            Replace it
          </button>
          <button onClick={onCancel} className="w-full text-xs text-zinc-500 py-2">
            Keep logging
          </button>
        </div>
      </div>
    </div>
  )
}

function WorkoutComplete({ workout }) {
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const doneSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.done).length, 0)
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
      <div className="text-6xl">🏆</div>
      <div>
        <h2 className="text-2xl font-bold text-emerald-400">Workout Complete!</h2>
        <p className="text-zinc-400 mt-1">{workout.workoutName}</p>
      </div>
      <div className="card w-full">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold text-white">{doneSets}/{totalSets}</div>
            <div className="text-xs text-zinc-400">Sets Done</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{workout.durationMin}m</div>
            <div className="text-xs text-zinc-400">Duration</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{workout.exercises.length}</div>
            <div className="text-xs text-zinc-400">Exercises</div>
          </div>
        </div>
      </div>
      <p className="text-zinc-400 text-sm">Rest well. Come back stronger tomorrow.</p>
    </div>
  )
}

function WorkoutSummary({ workout, onRedo }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Today's Workout</h1>
        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">Done ✓</span>
      </div>
      <div className="card">
        <div className="font-bold text-lg">{workout.workoutName}</div>
        <div className="text-sm text-zinc-400 mt-1">{workout.durationMin} min · {workout.exercises.length} exercises</div>
      </div>
      {workout.exercises.map((ex) => (
        <div key={ex.name} className="card">
          <div className="font-medium text-sm mb-2">{ex.name}</div>
          <div className="flex flex-wrap gap-1">
            {ex.sets.map((s, i) => (
              <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${s.done ? 'bg-emerald-500/20 text-emerald-300' : 'text-zinc-400'}`}
                style={!s.done ? { background: 'rgba(255,255,255,0.05)' } : {}}>
                {s.weight}kg × {s.reps}
              </span>
            ))}
          </div>
        </div>
      ))}
      <button onClick={onRedo} className="w-full btn-ghost py-2 text-sm">
        Log another workout today
      </button>
    </div>
  )
}
