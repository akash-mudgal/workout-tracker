import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { supabase } from './lib/supabase'

const StoreContext = createContext(null)

const DEFAULT_LOG = {
  water: 0, steps: 0, protein: 0, calories: 0, sleep: 0,
  supplements: { creatine: false, b12: false, d3mag: false },
}

function load(key, def) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : def
  } catch { return def }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function StoreProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const [startDate, setStartDate] = useState(() => load('wt_start_date', format(new Date(), 'yyyy-MM-dd')))
  const [dailyLogs, setDailyLogs] = useState(() => load('wt_daily_logs', {}))
  const [workoutHistory, setWorkoutHistory] = useState(() => load('wt_workout_history', {}))
  const [bodyMetrics, setBodyMetrics] = useState(() => load('wt_body_metrics', []))
  const [activeWorkout, setActiveWorkout] = useState(null)

  const today = format(new Date(), 'yyyy-MM-dd')
  const userRef = useRef(user)
  const logSyncTimer = useRef(null)

  useEffect(() => { userRef.current = user }, [user])

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load from Supabase when user logs in
  useEffect(() => {
    if (!user) return
    loadAllData(user.id)
  }, [user?.id])

  async function loadAllData(userId) {
    setSyncing(true)
    try {
      const [s, l, w, m] = await Promise.all([
        supabase.from('user_settings').select('start_date').eq('user_id', userId).maybeSingle(),
        supabase.from('daily_logs').select('*').eq('user_id', userId),
        supabase.from('workout_history').select('*').eq('user_id', userId),
        supabase.from('body_metrics').select('*').eq('user_id', userId).order('date'),
      ])

      // First-time user: push local data up to Supabase
      const isNewUser = !l.data?.length && !w.data?.length && !m.data?.length

      if (s.data?.start_date) {
        setStartDate(s.data.start_date)
        save('wt_start_date', s.data.start_date)
      } else {
        // Save start date to Supabase
        const localStart = load('wt_start_date', today)
        await supabase.from('user_settings').upsert({ user_id: userId, start_date: localStart })
      }

      if (isNewUser) {
        await migrateLocalToSupabase(userId)
        return
      }

      if (l.data?.length) {
        const logs = Object.fromEntries(l.data.map((r) => [r.date, {
          water: r.water, steps: r.steps, protein: r.protein,
          calories: r.calories, sleep: r.sleep, supplements: r.supplements,
        }]))
        setDailyLogs(logs)
        save('wt_daily_logs', logs)
      }

      if (w.data?.length) {
        const hist = Object.fromEntries(w.data.map((r) => [r.date, {
          date: r.date, workoutId: r.workout_id, workoutName: r.workout_name,
          durationMin: r.duration_min, exercises: r.exercises,
        }]))
        setWorkoutHistory(hist)
        save('wt_workout_history', hist)
      }

      if (m.data?.length) {
        const metrics = m.data.map((r) => ({ date: r.date, weight: r.weight, waist: r.waist, notes: r.notes }))
        setBodyMetrics(metrics)
        save('wt_body_metrics', metrics)
      }
    } catch (e) {
      console.error('Supabase load failed, using local data', e)
    } finally {
      setSyncing(false)
    }
  }

  async function migrateLocalToSupabase(userId) {
    const localLogs = load('wt_daily_logs', {})
    const localWorkouts = load('wt_workout_history', {})
    const localMetrics = load('wt_body_metrics', [])

    const logRows = Object.entries(localLogs).map(([date, log]) => ({
      user_id: userId, date, ...log,
    }))
    const workoutRows = Object.entries(localWorkouts).map(([date, w]) => ({
      user_id: userId, date,
      workout_id: w.workoutId, workout_name: w.workoutName,
      duration_min: w.durationMin, exercises: w.exercises,
    }))
    const metricRows = localMetrics.map((m) => ({ user_id: userId, ...m }))

    await Promise.all([
      logRows.length && supabase.from('daily_logs').upsert(logRows, { onConflict: 'user_id,date' }),
      workoutRows.length && supabase.from('workout_history').upsert(workoutRows, { onConflict: 'user_id,date' }),
      metricRows.length && supabase.from('body_metrics').upsert(metricRows, { onConflict: 'user_id,date' }),
    ].filter(Boolean))
  }

  // Debounced sync for frequent updates (water taps, etc.)
  function scheduledLogSync(date, log) {
    if (!userRef.current) return
    if (logSyncTimer.current) clearTimeout(logSyncTimer.current)
    logSyncTimer.current = setTimeout(() => {
      supabase.from('daily_logs').upsert({
        user_id: userRef.current.id, date,
        water: log.water, steps: log.steps, protein: log.protein,
        calories: log.calories, sleep: log.sleep, supplements: log.supplements,
      }, { onConflict: 'user_id,date' })
    }, 800)
  }

  const todayLog = dailyLogs[today] || DEFAULT_LOG

  const updateTodayLog = useCallback((updates) => {
    setDailyLogs((prev) => {
      const updated = { ...(prev[today] || DEFAULT_LOG), ...updates }
      const next = { ...prev, [today]: updated }
      save('wt_daily_logs', next)
      scheduledLogSync(today, updated)
      return next
    })
  }, [today])

  const toggleSupplement = useCallback((key) => {
    setDailyLogs((prev) => {
      const log = prev[today] || DEFAULT_LOG
      const updated = { ...log, supplements: { ...log.supplements, [key]: !log.supplements?.[key] } }
      const next = { ...prev, [today]: updated }
      save('wt_daily_logs', next)
      scheduledLogSync(today, updated)
      return next
    })
  }, [today])

  const saveWorkout = useCallback((dateStr, workoutData) => {
    setWorkoutHistory((prev) => {
      const next = { ...prev, [dateStr]: workoutData }
      save('wt_workout_history', next)
      return next
    })
    if (userRef.current) {
      supabase.from('workout_history').upsert({
        user_id: userRef.current.id,
        date: dateStr,
        workout_id: workoutData.workoutId,
        workout_name: workoutData.workoutName,
        duration_min: workoutData.durationMin,
        exercises: workoutData.exercises,
      }, { onConflict: 'user_id,date' })
    }
  }, [])

  const addBodyMetric = useCallback((metric) => {
    setBodyMetrics((prev) => {
      const filtered = prev.filter((m) => m.date !== metric.date)
      const next = [...filtered, metric].sort((a, b) => a.date.localeCompare(b.date))
      save('wt_body_metrics', next)
      return next
    })
    if (userRef.current) {
      supabase.from('body_metrics').upsert({
        user_id: userRef.current.id,
        date: metric.date,
        weight: metric.weight,
        waist: metric.waist,
        notes: metric.notes,
      }, { onConflict: 'user_id,date' })
    }
  }, [])

  const dayNumber = (() => {
    const start = new Date(startDate)
    const now = new Date(today)
    const diff = Math.floor((now - start) / 86400000)
    return Math.min(diff + 1, 90)
  })()

  return (
    <StoreContext.Provider value={{
      user, authLoading, syncing,
      today, startDate, dayNumber,
      todayLog, dailyLogs, workoutHistory, bodyMetrics,
      activeWorkout, setActiveWorkout,
      updateTodayLog, toggleSupplement, saveWorkout, addBodyMetric,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
