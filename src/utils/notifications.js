const PREFS_KEY = 'wt_notification_prefs'

export function getNotifPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { enabled: false, hour: 18, minute: 0 }
}

export function saveNotifPrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export async function requestNotifPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.requestPermission()
}

export function getNotifPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function showNotification(title, body, tag = 'workout') {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(title, {
        body,
        icon: '/icons/icon-192.svg',
        tag,
        requireInteraction: false,
      })
    } else {
      // Fallback to basic Notification API
      new Notification(title, { body, icon: '/icons/icon-192.svg', tag })
    }
  } catch { /* ignore if SW not available */ }
}

export function scheduleDailyNotifications(streakCount, todayDone, prefs) {
  clearScheduledNotifications()
  if (!prefs.enabled || getNotifPermission() !== 'granted') return

  const now = new Date()
  const timers = []

  // Daily workout reminder
  if (!todayDone) {
    const reminderTime = new Date(now)
    reminderTime.setHours(prefs.hour, prefs.minute, 0, 0)

    if (reminderTime > now) {
      const body = streakCount > 0
        ? `🔥 Keep your ${streakCount}-day streak going — log your workout today.`
        : 'Time to work out. Your body recomposition journey continues.'
      timers.push(
        setTimeout(() => showNotification("Today's workout", body, 'daily-reminder'), reminderTime - now)
      )
    }

    // Streak-at-risk alert at 9 PM
    if (streakCount > 0) {
      const riskTime = new Date(now)
      riskTime.setHours(21, 0, 0, 0)
      if (riskTime > now) {
        timers.push(
          setTimeout(
            () => showNotification(
              '⚠️ Streak at risk',
              `Your ${streakCount}-day streak ends at midnight if you don't log a workout today.`,
              'streak-risk'
            ),
            riskTime - now
          )
        )
      }
    }
  }

  window._notifTimers = timers
}

export function clearScheduledNotifications() {
  if (window._notifTimers) {
    window._notifTimers.forEach(clearTimeout)
    window._notifTimers = []
  }
}

export async function sendWeeklyDigestNotif(summary) {
  if (!summary || getNotifPermission() !== 'granted') return
  const body = `${summary.workoutsDone} workouts · ${summary.totalVolume.toLocaleString()} kg lifted. ${summary.tagline}`
  await showNotification(`Week ${summary.weekNumber} recap`, body, 'weekly-digest')
}
