import { parseISO, differenceInCalendarDays, format, addDays, startOfWeek } from 'date-fns'

export function isScheduledRestDay(dateStr, sessionStartDate, planCycle) {
  const start = parseISO(sessionStartDate)
  const date = parseISO(dateStr)
  if (date < start) return false
  const dayIndex = differenceInCalendarDays(date, start)
  const cycleIndex = dayIndex % planCycle.length
  return planCycle[cycleIndex] === 'rest'
}

export function getStreakFreezeState(todayStr) {
  const monday = format(startOfWeek(parseISO(todayStr), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  try {
    const raw = localStorage.getItem('wt_streak_freeze')
    if (raw) {
      const state = JSON.parse(raw)
      if (state.weekOf === monday) return state
    }
  } catch { /* ignore */ }
  return { freezesUsed: 0, weekOf: monday, frozenDates: [] }
}

export function applyStreakFreeze(missedDate, todayStr, planCycle, sessionStartDate) {
  if (isScheduledRestDay(missedDate, sessionStartDate, planCycle)) return null
  const current = getStreakFreezeState(todayStr)
  if (current.freezesUsed >= 1) return null
  const updated = {
    ...current,
    freezesUsed: current.freezesUsed + 1,
    frozenDates: [...current.frozenDates, missedDate],
  }
  localStorage.setItem('wt_streak_freeze', JSON.stringify(updated))
  return updated
}

export function computeStreak(workoutHistory, activeSession, planCycle, todayStr, freezeState) {
  const zero = { currentStreak: 0, longestStreak: 0, streakBroken: false, missedDate: null }
  if (!activeSession) return zero

  const sessionStart = activeSession.startDate
  const today = parseISO(todayStr)
  const start = parseISO(sessionStart)
  if (today < start) return zero

  const frozenDates = freezeState?.frozenDates ?? []

  function qualifies(dateStr) {
    if (workoutHistory[dateStr]) return true
    if (isScheduledRestDay(dateStr, sessionStart, planCycle)) return true
    if (frozenDates.includes(dateStr)) return true
    return false
  }

  // Compute longest streak (forward scan from sessionStart to today)
  function computeLongest() {
    let max = 0
    let run = 0
    const totalDays = differenceInCalendarDays(today, start) + 1
    for (let i = 0; i < totalDays; i++) {
      const d = format(addDays(start, i), 'yyyy-MM-dd')
      if (qualifies(d)) {
        run++
        if (run > max) max = run
      } else {
        run = 0
      }
    }
    return max
  }

  // Current streak: walk backward from yesterday (or today if logged)
  const startFrom = workoutHistory[todayStr] ? todayStr : format(addDays(today, -1), 'yyyy-MM-dd')
  let streak = 0
  let cursor = parseISO(startFrom)

  while (cursor >= start) {
    const dateStr = format(cursor, 'yyyy-MM-dd')
    if (qualifies(dateStr)) {
      streak++
      cursor = addDays(cursor, -1)
    } else {
      const longestStreak = computeLongest()
      return { currentStreak: streak, longestStreak, streakBroken: true, missedDate: dateStr }
    }
  }

  const longestStreak = computeLongest()
  return { currentStreak: streak, longestStreak, streakBroken: false, missedDate: null }
}

export function getWeeklySummary(workoutHistory, dailyLogs, weekStartDate, activeSession, planCycle, proteinGoal) {
  if (!activeSession) return null

  const sessionStart = parseISO(activeSession.startDate)
  const weekStart = parseISO(weekStartDate)

  // weekNumber
  const weeksSinceStart = Math.floor(differenceInCalendarDays(weekStart, sessionStart) / 7)
  const weekNumber = Math.max(1, weeksSinceStart + 1)

  // 7-day window
  const days = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'))

  // workoutsPlanned: non-rest cycle slots in the window (from sessionStart onward)
  let workoutsPlanned = 0
  let workoutsDone = 0
  for (const d of days) {
    const date = parseISO(d)
    if (date < sessionStart) continue
    if (!isScheduledRestDay(d, activeSession.startDate, planCycle)) workoutsPlanned++
    if (workoutHistory[d]) workoutsDone++
  }
  if (workoutsPlanned === 0) workoutsPlanned = 1 // guard division by zero

  // goalsHitPerDay (5 goals: protein, steps, water, sleep, workout)
  const STEPS_GOAL = 9000
  const WATER_GOAL = 10
  const SLEEP_GOAL = 7
  const goalsHitPerDay = days.map((d) => {
    const log = dailyLogs[d] || {}
    let count = 0
    if ((log.protein || 0) >= proteinGoal) count++
    if ((log.steps || 0) >= STEPS_GOAL) count++
    if ((log.water || 0) >= WATER_GOAL) count++
    if ((log.sleep || 0) >= SLEEP_GOAL) count++
    if (workoutHistory[d]) count++
    return count
  })
  const avgGoalsPerDay = goalsHitPerDay.reduce((a, b) => a + b, 0) / 7

  // bestDailyGoalStreak: longest run of days with all 5 goals hit
  let bestDailyGoalStreak = 0
  let run = 0
  for (const c of goalsHitPerDay) {
    if (c === 5) { run++; if (run > bestDailyGoalStreak) bestDailyGoalStreak = run }
    else run = 0
  }

  // totalVolume: done===true sets only
  let totalVolume = 0
  for (const d of days) {
    const workout = workoutHistory[d]
    if (!workout?.exercises) continue
    for (const ex of workout.exercises) {
      for (const set of ex.sets || []) {
        if (set.done) totalVolume += (set.weight || 0) * (set.reps || 0)
      }
    }
  }

  // topImprovement: largest max-weight increase vs prior week
  const prevDays = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i - 7), 'yyyy-MM-dd'))

  function buildBests(dayList) {
    const bests = {}
    for (const d of dayList) {
      const workout = workoutHistory[d]
      if (!workout?.exercises) continue
      for (const ex of workout.exercises) {
        for (const set of ex.sets || []) {
          if (set.done && set.weight > 0) {
            bests[ex.name] = Math.max(bests[ex.name] ?? 0, set.weight)
          }
        }
      }
    }
    return bests
  }

  const thisBests = buildBests(days)
  const prevBests = buildBests(prevDays)

  let topImprovement = null
  let bestDelta = 0
  for (const [exercise, thisWeight] of Object.entries(thisBests)) {
    const prevWeight = prevBests[exercise]
    if (prevWeight !== undefined) {
      const delta = thisWeight - prevWeight
      if (delta > bestDelta) {
        bestDelta = delta
        topImprovement = { exercise, prevWeight, thisWeight }
      }
    }
  }

  const completionPct = Math.round((workoutsDone / workoutsPlanned) * 100)
  const tagline = completionPct >= 80
    ? 'Strong week. Keep the momentum.'
    : completionPct >= 50
    ? 'Solid effort — push harder next week.'
    : 'Every rep counts. Show up this week.'

  return {
    weekNumber,
    workoutsDone,
    workoutsPlanned,
    goalsHitPerDay,
    bestDailyGoalStreak,
    avgGoalsPerDay: Math.round(avgGoalsPerDay * 10) / 10,
    totalVolume: Math.round(totalVolume),
    topImprovement,
    completionPct,
    tagline,
  }
}
