import { useState } from 'react'
import { format } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar,
} from 'recharts'
import { useStore } from '../store.jsx'
import { getPlan, getWorkoutDays } from '../data/workoutPlans'

export default function Progress() {
  const { startDate, today, workoutHistory, dailyLogs, dayNumber, totalDays, activeSession } = useStore()
  const planId = activeSession?.planId ?? 'ppl'
  // Planned lifts, plus any machine-busy alternatives that have actually been logged.
  const loggedNames = new Set(Object.values(workoutHistory).flatMap((w) => (w.exercises ?? []).map((e) => e.name)))
  const uniqueExercises = [...new Set(getWorkoutDays(planId).flatMap((w) => w.exercises.flatMap((e) => [
    e.name,
    ...(e.alternatives ?? []).map((a) => a.name).filter((n) => loggedNames.has(n)),
  ])))]
  const [selectedExercise, setSelectedExercise] = useState(uniqueExercises[0])

  const completedWorkouts = Object.values(workoutHistory)
  const thisWeek = getThisWeekDates()
  const workoutsThisWeek = thisWeek.filter((d) => workoutHistory[d]).length

  const avgSteps = avgOf(dailyLogs, 'steps')
  const avgProtein = avgOf(dailyLogs, 'protein')
  const avgSleep = avgOf(dailyLogs, 'sleep')

  const strengthData = completedWorkouts
    .filter((w) => w.exercises?.some((e) => e.name === selectedExercise))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((w) => {
      const ex = w.exercises.find((e) => e.name === selectedExercise)
      // Assisted lifts are logged as negative kg, so don't assume weight > 0.
      const bestSet = ex?.sets?.reduce((best, s) => (best == null || s.weight > best.weight ? s : best), null)
      return {
        date: format(new Date(w.date + 'T00:00:00'), 'MMM d'),
        weight: bestSet?.weight ?? 0,
        reps: bestSet?.reps ?? 0,
        volume: ex?.sets?.reduce((sum, s) => sum + s.weight * s.reps, 0) ?? 0,
      }
    })
    .filter((d) => d.weight !== 0)

  const stepsData = getLast14Days(today).map((date) => ({
    date: format(new Date(date + 'T00:00:00'), 'EEE'),
    steps: dailyLogs[date]?.steps ?? 0,
  }))

  const heatmapDays = getHeatmapDays(startDate, today, workoutHistory, totalDays)

  const tooltipStyle = {
    contentStyle: { background: '#14181D', border: '1px solid var(--rule)', borderRadius: 12 },
    labelStyle: { color: '#8B949E' },
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Progress</h1>

      {/* Week Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <SummaryCard value={workoutsThisWeek} label="Workouts" sub="this week" color="text-ink" />
        <SummaryCard value={completedWorkouts.length} label="Total" sub="sessions" color="text-ink" />
        <SummaryCard value={`${Math.round(avgSteps / 1000)}k`} label="Avg Steps" sub="per day" color="text-ink" />
        <SummaryCard value={`${Math.round(avgProtein)}g`} label="Avg Protein" sub="per day" color="text-ink" />
      </div>

      {/* 90 Day Heatmap */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-3 text-ink">
          {totalDays}-Day Journey · Day {dayNumber}
        </h3>
        <div className="flex flex-wrap gap-1">
          {heatmapDays.map(({ date, hasWorkout, isFuture, isToday }) => (
            <div
              key={date}
              title={date}
              className={`w-4 h-4 rounded-sm ${
                isFuture
                  ? 'bg-raised'
                  : hasWorkout
                  ? 'bg-ink'
                  : isToday
                  ? 'ring-1 ring-rule'
                  : 'bg-rule'
              }`}
              style={isToday && !hasWorkout ? { background: 'var(--rule)' } : {}}
            />
          ))}
        </div>
        <div className="flex gap-3 mt-2 text-xs text-muted">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-ink inline-block" /> Workout done</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-rule inline-block" /> Rest / missed</span>
        </div>
      </div>

      {/* Strength Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink">Strength Progress</h3>
        </div>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="input-field text-sm mb-3"
        >
          {uniqueExercises.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        {strengthData.length >= 2 ? (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={strengthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--raised)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8B949E' }} />
              <YAxis tick={{ fontSize: 12, fill: '#8B949E' }} width={42} />
              <Tooltip {...tooltipStyle} formatter={(v, n) => [`${v}${n === 'weight' ? 'kg' : ''}`, n]} itemStyle={{ color: '#E8EBED' }} />
              <Line type="monotone" dataKey="weight" name="weight" stroke="#E8EBED" strokeWidth={2} dot={{ r: 3, fill: '#E8EBED' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-32 flex items-center justify-center text-muted text-sm">
            Log at least 2 {selectedExercise} sessions to see trend
          </div>
        )}
      </div>

      {/* Steps Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-3 text-ink">Daily Steps (14 days)</h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={stepsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--raised)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8B949E' }} />
            <YAxis tick={{ fontSize: 12, fill: '#8B949E' }} width={42} />
            <Tooltip {...tooltipStyle} itemStyle={{ color: '#8B949E' }} />
            <Bar dataKey="steps" fill="#8B949E" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly breakdown */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-3 text-ink">This Week</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <StatRow label="Workouts" value={`${workoutsThisWeek} / 7`} />
          <StatRow label="Avg Steps" value={`${Math.round(avgSteps).toLocaleString()}`} />
          <StatRow label="Avg Protein" value={`${Math.round(avgProtein)}g`} />
          <StatRow label="Avg Sleep" value={`${avgSleep.toFixed(1)} hrs`} />
        </div>
      </div>

      {/* Workout type breakdown */}
      {completedWorkouts.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold mb-3 text-ink">Workout Breakdown</h3>
          <div className="space-y-2">
            {['push', 'pull', 'legs'].map((type) => {
              const count = completedWorkouts.filter((w) => {
                const wd = getWorkoutDays(planId).find((d) => d.id === w.workoutId)
                return wd?.type === type
              }).length
              const total = completedWorkouts.length
              return (
                <div key={type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize text-muted">{type}</span>
                    <span className="text-muted">{count} sessions</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${type === 'push' ? 'bg-ink' : type === 'pull' ? 'bg-ink/60' : 'bg-ink/30'}`}
                      style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ value, label, sub, color }) {
  return (
    <div className="card text-center p-3">
      <div className={`text-xl font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-ink font-medium">{label}</div>
      <div className="text-xs text-muted">{sub}</div>
    </div>
  )
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between py-1.5" style={{ borderBottom: '1px solid var(--raised)' }}>
      <span className="text-muted">{label}</span>
      <span className="text-ink font-medium">{value}</span>
    </div>
  )
}

function avgOf(logs, key) {
  const vals = Object.values(logs).map((l) => l[key] ?? 0).filter((v) => v > 0)
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function getThisWeekDates() {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return format(d, 'yyyy-MM-dd')
  })
}

function getLast14Days(today) {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today + 'T00:00:00')
    d.setDate(d.getDate() - 13 + i)
    return format(d, 'yyyy-MM-dd')
  })
}

function getHeatmapDays(startDate, today, workoutHistory, totalDays = 90) {
  const start = new Date(startDate + 'T00:00:00')
  const todayDate = new Date(today + 'T00:00:00')
  return Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const dateStr = format(d, 'yyyy-MM-dd')
    return {
      date: dateStr,
      isToday: dateStr === today,
      isFuture: d > todayDate,
      hasWorkout: !!workoutHistory[dateStr],
    }
  })
}
