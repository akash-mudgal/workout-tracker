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
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)) }

export function StoreProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const [sessions, setSessions] = useState(() => load('wt_sessions', []))
  const [activeSessionId, setActiveSessionId] = useState(() => load('wt_active_session_id', null))
  const [dailyLogs, setDailyLogs] = useState(() => load('wt_daily_logs', {}))
  const [workoutHistory, setWorkoutHistory] = useState(() => load('wt_workout_history', {}))
  const [bodyMetrics, setBodyMetrics] = useState(() => load('wt_body_metrics', []))
  const [activeWorkout, setActiveWorkout] = useState(null)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [userProfile, setUserProfile] = useState(() => load('wt_user_profile', { weightKg: 0, heightCm: 0 }))

  const today = format(new Date(), 'yyyy-MM-dd')
  const userRef = useRef(null)
  const sessionIdRef = useRef(activeSessionId)
  const logSyncTimer = useRef(null)

  useEffect(() => { userRef.current = user }, [user])
  useEffect(() => { sessionIdRef.current = activeSessionId }, [activeSessionId])

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? sessions[0] ?? null
  const startDate = activeSession?.startDate ?? today

  // ── Auth ──────────────────────────────────────────────────────────────────
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

  useEffect(() => {
    if (!user) return
    loadAllData(user.id)
  }, [user?.id])

  // Re-sync when the tab becomes visible (other-device edits show up without manual refresh)
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible' && userRef.current && sessionIdRef.current) {
        fetchSessionData(userRef.current.id, sessionIdRef.current)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // ── Data loading ──────────────────────────────────────────────────────────
  async function fetchSessionData(userId, sessionId) {
    const [l, w, m] = await Promise.all([
      supabase.from('daily_logs').select('*').eq('user_id', userId).eq('session_id', sessionId),
      supabase.from('workout_history').select('*').eq('user_id', userId).eq('session_id', sessionId),
      supabase.from('body_metrics').select('*').eq('user_id', userId).eq('session_id', sessionId).order('date'),
    ])

    const logs = l.data?.length
      ? Object.fromEntries(l.data.map((r) => [r.date, {
          water: r.water, steps: r.steps, protein: r.protein,
          calories: r.calories, sleep: r.sleep, supplements: r.supplements,
        }]))
      : {}

    const hist = w.data?.length
      ? Object.fromEntries(w.data.map((r) => [r.date, {
          date: r.date, workoutId: r.workout_id, workoutName: r.workout_name,
          durationMin: r.duration_min, exercises: r.exercises,
        }]))
      : {}

    const metrics = m.data?.length
      ? m.data.map((r) => ({ date: r.date, weight: r.weight, waist: r.waist, notes: r.notes }))
      : []

    setDailyLogs(logs); save('wt_daily_logs', logs)
    setWorkoutHistory(hist); save('wt_workout_history', hist)
    setBodyMetrics(metrics); save('wt_body_metrics', metrics)
  }

  async function insertSession(userId, name, startDate, planId = 'ppl', totalDays = 90) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({ user_id: userId, name, start_date: startDate, plan_id: planId, total_days: totalDays })
      .select()
      .single()
    if (error) throw error
    return { id: data.id, name: data.name, startDate: data.start_date, planId: data.plan_id, totalDays: data.total_days ?? 90, createdAt: data.created_at }
  }

  async function loadAllData(userId) {
    setSyncing(true)
    try {
      const { data: rawSessions } = await supabase
        .from('sessions').select('*').eq('user_id', userId).order('created_at')

      let resolvedSessions
      let resolvedActiveId = load('wt_active_session_id', null)

      if (rawSessions?.length) {
        resolvedSessions = rawSessions.map((s) => ({
          id: s.id, name: s.name, startDate: s.start_date, planId: s.plan_id ?? 'ppl', totalDays: s.total_days ?? 90, createdAt: s.created_at,
        }))
      } else {
        // Check if there's old pre-sessions data to migrate
        const { data: oldLogs } = await supabase
          .from('daily_logs').select('id').eq('user_id', userId).is('session_id', null).limit(1)
        const hasOldData = oldLogs?.length > 0

        if (hasOldData) {
          // Returning user from before sessions feature — migrate silently
          const localStart = load('wt_start_date', today)
          const defaultSession = await insertSession(userId, '90-Day Cycle', localStart)
          resolvedSessions = [defaultSession]
          await Promise.all([
            supabase.from('daily_logs').update({ session_id: defaultSession.id }).eq('user_id', userId).is('session_id', null),
            supabase.from('workout_history').update({ session_id: defaultSession.id }).eq('user_id', userId).is('session_id', null),
            supabase.from('body_metrics').update({ session_id: defaultSession.id }).eq('user_id', userId).is('session_id', null),
          ])
        } else {
          // Brand new user — show onboarding
          setNeedsOnboarding(true)
          setSessions([]); save('wt_sessions', [])
          return
        }
      }

      setSessions(resolvedSessions); save('wt_sessions', resolvedSessions)

      if (!resolvedActiveId || !resolvedSessions.find((s) => s.id === resolvedActiveId)) {
        resolvedActiveId = resolvedSessions[0].id
      }
      setActiveSessionId(resolvedActiveId); save('wt_active_session_id', resolvedActiveId)
      sessionIdRef.current = resolvedActiveId

      await fetchSessionData(userId, resolvedActiveId)
    } catch (e) {
      console.error('Supabase load failed, using local data', e)
    } finally {
      setSyncing(false)
    }
  }

  // ── Session management ────────────────────────────────────────────────────
  const createSession = useCallback(async (name, startDate, planId = 'ppl', totalDays = 90) => {
    let newSession
    if (userRef.current) {
      newSession = await insertSession(userRef.current.id, name, startDate, planId, totalDays)
    } else {
      newSession = { id: crypto.randomUUID(), name, startDate, planId, totalDays, createdAt: new Date().toISOString() }
    }
    setNeedsOnboarding(false)
    setSessions((prev) => { const next = [...prev, newSession]; save('wt_sessions', next); return next })
    // Switch to the new empty session
    setActiveSessionId(newSession.id); save('wt_active_session_id', newSession.id)
    sessionIdRef.current = newSession.id
    setDailyLogs({}); save('wt_daily_logs', {})
    setWorkoutHistory({}); save('wt_workout_history', {})
    setBodyMetrics([]); save('wt_body_metrics', [])
    return newSession
  }, [])

  const switchSession = useCallback(async (sessionId) => {
    setActiveSessionId(sessionId); save('wt_active_session_id', sessionId)
    sessionIdRef.current = sessionId
    if (userRef.current) {
      setSyncing(true)
      try { await fetchSessionData(userRef.current.id, sessionId) }
      finally { setSyncing(false) }
    }
  }, [])

  const updateSession = useCallback(async (sessionId, updates) => {
    setSessions((prev) => {
      const next = prev.map((s) => s.id === sessionId ? { ...s, ...updates } : s)
      save('wt_sessions', next); return next
    })
    if (userRef.current) {
      const dbUpdates = {}
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate
      if (updates.totalDays !== undefined) dbUpdates.total_days = updates.totalDays
      if (updates.planId !== undefined) dbUpdates.plan_id = updates.planId
      await supabase.from('sessions').update(dbUpdates).eq('id', sessionId).eq('user_id', userRef.current.id)
    }
  }, [])

  const resetSessionProgress = useCallback(async (sessionId) => {
    const newStart = format(new Date(), 'yyyy-MM-dd')
    // Update start date
    setSessions((prev) => {
      const next = prev.map((s) => s.id === sessionId ? { ...s, startDate: newStart } : s)
      save('wt_sessions', next); return next
    })
    // Clear data in memory if this is the active session
    if (sessionIdRef.current === sessionId) {
      setDailyLogs({}); save('wt_daily_logs', {})
      setWorkoutHistory({}); save('wt_workout_history', {})
      setBodyMetrics([]); save('wt_body_metrics', [])
    }
    if (userRef.current) {
      await Promise.all([
        supabase.from('sessions').update({ start_date: newStart }).eq('id', sessionId).eq('user_id', userRef.current.id),
        supabase.from('daily_logs').delete().eq('session_id', sessionId).eq('user_id', userRef.current.id),
        supabase.from('workout_history').delete().eq('session_id', sessionId).eq('user_id', userRef.current.id),
        supabase.from('body_metrics').delete().eq('session_id', sessionId).eq('user_id', userRef.current.id),
      ])
    }
  }, [])

  const deleteSession = useCallback(async (sessionId, remainingSessions) => {
    const next = remainingSessions.filter((s) => s.id !== sessionId)
    setSessions(next); save('wt_sessions', next)
    if (userRef.current) {
      await supabase.from('sessions').delete().eq('id', sessionId).eq('user_id', userRef.current.id)
    }
    // If we deleted the active one, switch to first remaining
    if (sessionIdRef.current === sessionId && next.length > 0) {
      setActiveSessionId(next[0].id); save('wt_active_session_id', next[0].id)
      sessionIdRef.current = next[0].id
      if (userRef.current) await fetchSessionData(userRef.current.id, next[0].id)
    }
  }, [])

  // ── Daily data sync ───────────────────────────────────────────────────────
  function scheduledLogSync(date, log) {
    if (!userRef.current || !sessionIdRef.current) return
    if (logSyncTimer.current) clearTimeout(logSyncTimer.current)
    logSyncTimer.current = setTimeout(async () => {
      const { error } = await supabase.from('daily_logs').upsert({
        user_id: userRef.current.id, session_id: sessionIdRef.current, date,
        water: log.water, steps: log.steps, protein: log.protein,
        calories: log.calories, sleep: log.sleep, supplements: log.supplements,
      }, { onConflict: 'user_id,session_id,date' })
      if (error) console.error('[kinetiq] daily_log sync failed:', error.message, error)
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

  const saveWorkout = useCallback(async (dateStr, workoutData) => {
    setWorkoutHistory((prev) => {
      const next = { ...prev, [dateStr]: workoutData }
      save('wt_workout_history', next); return next
    })
    if (userRef.current && sessionIdRef.current) {
      const { error } = await supabase.from('workout_history').upsert({
        user_id: userRef.current.id, session_id: sessionIdRef.current, date: dateStr,
        workout_id: workoutData.workoutId, workout_name: workoutData.workoutName,
        duration_min: workoutData.durationMin, exercises: workoutData.exercises,
      }, { onConflict: 'user_id,session_id,date' })
      if (error) console.error('[kinetiq] workout save failed:', error.message, error)
    }
  }, [])

  const addBodyMetric = useCallback(async (metric) => {
    setBodyMetrics((prev) => {
      const filtered = prev.filter((m) => m.date !== metric.date)
      const next = [...filtered, metric].sort((a, b) => a.date.localeCompare(b.date))
      save('wt_body_metrics', next); return next
    })
    if (userRef.current && sessionIdRef.current) {
      const { error } = await supabase.from('body_metrics').upsert({
        user_id: userRef.current.id, session_id: sessionIdRef.current,
        date: metric.date, weight: metric.weight, waist: metric.waist, notes: metric.notes,
      }, { onConflict: 'user_id,session_id,date' })
      if (error) console.error('[kinetiq] body metric save failed:', error.message, error)
    }
  }, [])

  const updateUserProfile = useCallback((profile) => {
    setUserProfile(profile)
    save('wt_user_profile', profile)
  }, [])

  const proteinGoal = userProfile.weightKg > 0
    ? Math.round((userProfile.weightKg * 2.0) / 5) * 5
    : 130

  const totalDays = activeSession?.totalDays ?? 90
  const dayNumber = (() => {
    const start = new Date(startDate)
    const now = new Date(today)
    const diff = Math.floor((now - start) / 86400000)
    return Math.min(diff + 1, totalDays)
  })()

  return (
    <StoreContext.Provider value={{
      user, authLoading, syncing, needsOnboarding,
      userProfile, updateUserProfile, proteinGoal,
      today, startDate, dayNumber, totalDays,
      sessions, activeSession, activeSessionId,
      todayLog, dailyLogs, workoutHistory, bodyMetrics,
      activeWorkout, setActiveWorkout,
      updateTodayLog, toggleSupplement, saveWorkout, addBodyMetric,
      createSession, switchSession, updateSession, resetSessionProgress, deleteSession,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
