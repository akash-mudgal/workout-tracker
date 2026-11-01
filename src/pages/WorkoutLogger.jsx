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
    <div className="space-y-6">
      <header>
        <p className="text-micro text-muted">{format(new Date(today + 'T00:00:00'), 'EEE d MMM')}</p>
        <h1 className="text-2xl font-semibold mt-1.5">Log a workout</h1>
        <p className="text-xs text-muted mt-1">{plan.name}, {plan.daysPerWeek} days a week</p>
      </header>

      <section>
        <div className="flex items-baseline justify-between gap-3 mb-2 px-1">
          <h3 className="text-xs font-medium text-muted">Choose a day</h3>
        </div>
        <div className="panel rule-group">
          {getWorkoutDays(planId).map((w, i) => {
            const isSelected = selectedId === w.id
            return (
              <button
                key={`${w.id}-${i}`}
                onClick={() => setSelectedId(w.id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left min-h-[56px] transition-colors"
                style={isSelected ? { background: 'var(--raised)' } : undefined}
                aria-pressed={isSelected}
              >
                <span className="min-w-0">
                  <span className={`block text-sm ${isSelected ? 'text-ink font-medium' : 'text-muted'}`}>{w.name}</span>
                  <span className="block text-micro text-muted mt-0.5 truncate">{w.subtitle}</span>
                </span>
                {w.id === recommended.id && (
                  <span className="text-micro text-muted flex-shrink-0">up next</span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <button
        onClick={initSession}
        className="w-full btn-primary text-sm"
        disabled={workout?.type === 'rest'}
      >
        {workout?.type === 'rest' ? 'Rest day — log steps and sleep instead' : 'Start training'}
      </button>
    </div>
  )
}

function LoggingView({ workout, sessionSets, workoutHistory, selectedId, resumed, onUpdateSet, onToggleDone, onFinish, onDiscard }) {
  const [expandedEx, setExpandedEx] = useState(workout.exercises[0]?.name)
  const totalSets = Object.values(sessionSets).flat().length
  const doneSets = Object.values(sessionSets).flat().filter((s) => s.done).length

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold truncate">{workout.name}</h1>
          <p className="text-xs text-muted mt-0.5">{workout.subtitle}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="num-lg text-[22px]">
            <span className={doneSets === totalSets && totalSets > 0 ? 'text-signal' : 'text-ink'}>{doneSets}</span>
            <span className="text-muted"> / {totalSets}</span>
          </div>
          <div className="text-micro text-muted mt-0.5">sets</div>
        </div>
      </div>

      {resumed && (
        <div className="panel flex items-center justify-between gap-3 px-3 py-2.5">
          <p className="text-xs text-muted">Picked up where you left off.</p>
          <button onClick={onDiscard} className="text-xs text-muted hover:text-ink flex-shrink-0 px-2 py-1">
            Start over
          </button>
        </div>
      )}

      <div className="progress-bar">
        <div
          className="progress-fill"
          data-met={totalSets > 0 && doneSets === totalSets}
          style={{ width: `${totalSets > 0 ? (doneSets / totalSets) * 100 : 0}%` }}
        />
      </div>

      <div className="panel rule-group">
        {workout.exercises.map((ex) => {
          const sets = sessionSets[ex.name] || []
          const prevWorkouts = Object.values(workoutHistory)
            .filter((w) => w.workoutId === selectedId)
            .sort((a, b) => b.date.localeCompare(a.date))
          const prev = prevWorkouts[0]?.exercises?.find((e) => e.name === ex.name)
          const exDone = sets.length > 0 && sets.every((s) => s.done)
          const isExpanded = expandedEx === ex.name

          return (
            <div key={ex.name}>
              <button
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left min-h-[56px]"
                onClick={() => setExpandedEx(isExpanded ? null : ex.name)}
                aria-expanded={isExpanded}
              >
                <span className="min-w-0">
                  <span className={`block text-sm ${exDone ? 'text-signal' : 'text-ink'}`}>{ex.name}</span>
                  <span className="block text-micro text-muted mt-0.5 num">
                    {ex.sets} × {ex.repRange}, RPE {ex.rpe}
                  </span>
                </span>
                <span className="text-micro text-muted flex-shrink-0">
                  {exDone ? 'done' : isExpanded ? 'close' : 'open'}
                </span>
              </button>

              {/* The one raised surface in the app: the exercise being logged. */}
              {isExpanded && (
                <div className="px-3 pb-4 pt-1 space-y-3" style={{ background: 'var(--raised)' }}>
                  {prev && (
                    <p className="text-micro text-muted num">
                      Last time: {prev.sets.map((s) => `${s.weight}kg × ${s.reps}`).join(', ')}
                    </p>
                  )}

                  <div className="grid grid-cols-12 gap-2 text-micro text-muted px-1">
                    <div className="col-span-2">Set</div>
                    <div className="col-span-4 text-center">kg</div>
                    <div className="col-span-3 text-center">Reps</div>
                    <div className="col-span-3 text-center">Done</div>
                  </div>

                  {sets.map((set, i) => {
                    const prevSet = prev?.sets?.[i]
                    const improved = prevSet && (set.reps > prevSet.reps || set.weight > prevSet.weight)
                    return (
                      <div key={i} className="space-y-1">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-2 text-xs text-muted num">{i + 1}</div>
                          <div className="col-span-4">
                            <NumericInput
                              value={set.weight}
                              onCommit={(v) => onUpdateSet(ex.name, i, 'weight', v)}
                              inputMode="decimal"
                              className="input-field num text-center"
                            />
                          </div>
                          <div className="col-span-3">
                            <NumericInput
                              value={set.reps}
                              onCommit={(v) => onUpdateSet(ex.name, i, 'reps', v)}
                              inputMode="numeric"
                              className="input-field num text-center"
                            />
                          </div>
                          <div className="col-span-3 flex justify-center">
                            <button
                              onClick={() => onToggleDone(ex.name, i)}
                              aria-label={`Mark set ${i + 1} done`}
                              aria-pressed={!!set.done}
                              className="w-11 h-11 rounded-full flex items-center justify-center"
                            >
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center ${set.done ? 'set-logged' : ''}`}
                                style={{
                                  border: `1.5px solid ${set.done ? 'var(--signal)' : 'var(--rule)'}`,
                                  background: set.done ? 'var(--signal)' : 'transparent',
                                }}
                              >
                                {set.done && (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                    <path d="M2.5 6.5L4.8 8.8L9.5 3.5" stroke="#0B0D10" strokeWidth="1.9"
                                      strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </span>
                            </button>
                          </div>
                        </div>
                        {/* Shown whether or not the set is ticked — it used to
                            vanish the instant you marked it done. */}
                        {improved && (
                          <p className="text-micro text-signal text-center">Up on last time</p>
                        )}
                      </div>
                    )
                  })}

                  {/* Coaching note sits below the inputs rather than above them,
                      so a long paragraph doesn't push the numbers off screen. */}
                  {ex.tip && (
                    <p className="text-micro text-muted leading-relaxed rule-top pt-3">{ex.tip}</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button onClick={onFinish} className="w-full btn-primary text-sm">
        Finish workout
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
          <h3 className="font-semibold text-base text-ink">You already logged a workout today</h3>
          <p className="text-sm text-muted mt-1">
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
          <button onClick={onCancel} className="w-full text-xs text-muted py-2">
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
    <div className="flex flex-col justify-center min-h-[60vh] space-y-8">
      <div>
        <p className="text-micro text-signal font-semibold">Logged</p>
        <h2 className="text-2xl font-semibold mt-1.5">{workout.workoutName}</h2>
        <p className="text-xs text-muted mt-1">Rest well. Come back stronger.</p>
      </div>

      <div className="panel rule-group">
        <SummaryStat label="Sets completed" value={`${doneSets} of ${totalSets}`} />
        <SummaryStat label="Duration" value={`${workout.durationMin} min`} />
        <SummaryStat label="Exercises" value={workout.exercises.length} />
      </div>
    </div>
  )
}

function SummaryStat({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 py-3.5">
      <span className="text-xs text-muted">{label}</span>
      <span className="num text-base">{value}</span>
    </div>
  )
}

function WorkoutSummary({ workout, onRedo }) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-micro text-signal font-semibold">Logged</p>
        <h1 className="text-2xl font-semibold mt-1.5">{workout.workoutName}</h1>
        <p className="text-xs text-muted mt-1 num">
          {workout.durationMin} min, {workout.exercises.length} exercises
        </p>
      </header>

      <div className="panel rule-group">
        {workout.exercises.map((ex) => (
          <div key={ex.name} className="px-4 py-3">
            <div className="text-sm">{ex.name}</div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
              {ex.sets.map((s, i) => (
                <span key={i} className={`text-micro num ${s.done ? 'text-ink' : 'text-muted'}`}>
                  {s.weight}kg × {s.reps}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={onRedo} className="w-full btn-ghost text-sm">
        Log another workout today
      </button>
    </div>
  )
}
