import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { useStore } from '../store.jsx'
import { getPlan, getRecommendedWorkout, getWorkoutById, getWorkoutDays } from '../data/workoutPlans'

export default function WorkoutLogger() {
  const { today, workoutHistory, saveWorkout, activeSession } = useStore()
  const planId = activeSession?.planId ?? 'ppl'
  const plan = getPlan(planId)
  const todayWorkout = workoutHistory[today]
  const recommended = getRecommendedWorkout(planId, workoutHistory)

  const [selectedId, setSelectedId] = useState(recommended.id)
  const [phase, setPhase] = useState('select') // select | logging | done
  const [sessionSets, setSessionSets] = useState({})
  const [startTime] = useState(Date.now())

  const workout = getWorkoutById(planId, selectedId)

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

  const finishWorkout = useCallback(() => {
    const exercises = workout.exercises.map((ex) => ({
      name: ex.name,
      sets: sessionSets[ex.name] || [],
    }))
    saveWorkout(today, {
      date: today,
      workoutId: selectedId,
      workoutName: workout.name,
      durationMin: Math.round((Date.now() - startTime) / 60000),
      exercises,
    })
    setPhase('done')
  }, [workout, sessionSets, selectedId, today, startTime, saveWorkout])

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
      <LoggingView
        workout={workout}
        sessionSets={sessionSets}
        workoutHistory={workoutHistory}
        selectedId={selectedId}
        onUpdateSet={updateSet}
        onToggleDone={toggleSetDone}
        onFinish={finishWorkout}
      />
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

function LoggingView({ workout, sessionSets, workoutHistory, selectedId, onUpdateSet, onToggleDone, onFinish }) {
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
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) => onUpdateSet(ex.name, i, 'weight', +e.target.value)}
                            className="input-field text-center text-sm py-1"
                            min="0"
                            step="0.5"
                          />
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) => onUpdateSet(ex.name, i, 'reps', +e.target.value)}
                            className="input-field text-center text-sm py-1"
                            min="0"
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
