import { useState } from 'react'
import { format, eachDayOfInterval, startOfDay } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar,
} from 'recharts'
import { useStore } from '../store.jsx'
import { getPlan, getWorkoutDays } from '../data/workoutPlans'

export default function Progress() {
  const { startDate, today, workoutHistory, dailyLogs, dayNumber, totalDays, activeSession } = useStore()
  const planId = activeSession?.planId ?? 'ppl'
  const uniqueExercises = [...new Set(getWorkoutDays(planId).flatMap((w) => w.exercises.map((e) => e.name)))]
  const [selectedExercise, setSelectedExercise] = useState(uniqueExercises[0])

  const completedWorkouts = Object.values(workoutHistory)
  const thisWeek = getThisWeekDates()
  const workoutsThisWeek = thisWeek.filter((d) => workoutHistory[d]).length

  const avgSteps = avgOf(dailyLogs, 'steps')
  const avgProtein = avgOf(dailyLogs, 'protein')
  const avgSleep = avgOf(dailyLogs, 'sleep')

  // Strength chart data for selected exercise
  const strengthData = completedWorkouts
    .filter((w) => w.exercises?.some((e) => e.name === selectedExercise))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((w) => {
      const ex = w.exercises.find((e) => e.name === selectedExercise)
      const bestSet = ex?.sets?.reduce((best, s) => (s.weight > (best?.weight ?? 0) ? s : best), null)
      return {
        date: format(new Date(w.date + 'T00:00:00'), 'MMM d'),
        weight: bestSet?.weight ?? 0,
        reps: bestSet?.reps ?? 0,
        volume: ex?.sets?.reduce((sum, s) => sum + s.weight * s.reps, 0) ?? 0,
      }
    })
    .filter((d) => d.weight > 0)

  // Steps chart (last 14 days)
  const stepsData = getLast14Days(today).map((date) => ({
    date: format(new Date(date + 'T00:00:00'), 'EEE'),
    steps: dailyLogs[date]?.steps ?? 0,
  }))

  // 90-day heatmap
  const heatmapDays = getHeatmapDays(startDate, today, workoutHistory, totalDays)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Progress</h1>

      {/* Week Summary */}
      <div className="grid grid-cols-4 gap-2">
        <SummaryCard value={workoutsThisWeek} label="Workouts" sub="this week" color="text-violet-400" />
        <SummaryCard value={completedWorkouts.length} label="Total" sub="sessions" color="text-violet-400" />
        <SummaryCard value={`${Math.round(avgSteps / 1000)}k`} label="Avg Steps" sub="per day" color="text-emerald-400" />
        <SummaryCard value={`${Math.round(avgProtein)}g`} label="Avg Protein" sub="per day" color="text-amber-400" />
      </div>

      {/* 90 Day Heatmap */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-3">
          {totalDays}-Day Journey · Day {dayNumber}
        </h3>
        <div className="flex flex-wrap gap-1">
          {heatmapDays.map(({ date, hasWorkout, isFuture, isToday }) => (
            <div
              key={date}
              title={date}
              className={`w-4 h-4 rounded-sm ${
                isFuture
                  ? 'bg-zinc-800/40'
                  : hasWorkout
                  ? 'bg-violet-500'
                  : isToday
                  ? 'bg-zinc-700 ring-1 ring-violet-500'
                  : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>
        <div className="flex gap-3 mt-2 text-xs text-zinc-600">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-violet-500 inline-block" /> Workout done</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-zinc-800 inline-block" /> Rest / missed</span>
        </div>
      </div>

      {/* Strength Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Strength Progress</h3>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} width={35} />
              <Tooltip
                contentStyle={{ background: '#111118', border: '1px solid #27272a', borderRadius: 8 }}
                formatter={(v, n) => [`${v}${n === 'weight' ? 'kg' : ''}`, n]}
                labelStyle={{ color: '#a1a1aa' }}
              />
              <Line type="monotone" dataKey="weight" name="weight" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-32 flex items-center justify-center text-zinc-600 text-sm">
            Log at least 2 {selectedExercise} sessions to see trend
          </div>
        )}
      </div>

      {/* Steps Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-3">Daily Steps (14 days)</h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={stepsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} />
            <YAxis tick={{ fontSize: 10, fill: '#71717a' }} width={35} />
            <Tooltip
              contentStyle={{ background: '#111118', border: '1px solid #27272a', borderRadius: 8 }}
              labelStyle={{ color: '#a1a1aa' }}
              itemStyle={{ color: '#10b981' }}
            />
            <Bar dataKey="steps" fill="#10b981" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly breakdown */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-3">This Week</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <StatRow label="Workouts" value={`${workoutsThisWeek} / 7`} />
          <StatRow label="Avg Steps" value={`${Math.round(avgSteps).toLocaleString()}`} />
          <StatRow label="Avg Protein" value={`${Math.round(avgProtein)}g`} />
          <StatRow label="Avg Sleep" value={`${avgSleep.toFixed(1)} hrs`} />
        </div>
      </div>

      {/* Workout type breakdown */}
      {completedWorkouts.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold mb-3">Workout Breakdown</h3>
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
                    <span className="capitalize text-zinc-400">{type}</span>
                    <span className="text-zinc-500">{count} sessions</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${type === 'push' ? 'bg-red-500' : type === 'pull' ? 'bg-blue-500' : 'bg-emerald-500'}`}
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
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-zinc-300 font-medium">{label}</div>
      <div className="text-xs text-zinc-600">{sub}</div>
    </div>
  )
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-zinc-800">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-200 font-medium">{value}</span>
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
