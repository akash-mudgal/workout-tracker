import { useState, useEffect } from 'react'
import { useStore } from '../store.jsx'
import { supabase } from '../lib/supabase'
import ChoiceTick from '../components/ChoiceTick'
import {
  cachedPrefs, loadPrefs, savePrefs, requestNotifPermission, getNotifPermission,
  subscribeToPush, unsubscribeFromPush, pushSupported, isDeviceSubscribed,
} from '../utils/notifications'

export default function ProfilePage() {
  const { user, userProfile, updateUserProfile, calorieGoal, activeSession } = useStore()
  const [name, setName] = useState(userProfile.name || '')
  const [weightKg, setWeightKg] = useState(userProfile.weightKg || '')
  const [heightCm, setHeightCm] = useState(userProfile.heightCm || '')
  const [age, setAge] = useState(userProfile.age || '')
  const [sex, setSex] = useState(userProfile.sex || '')
  const [activityLevel, setActivityLevel] = useState(userProfile.activityLevel || '')
  const [status, setStatus] = useState(null) // 'saving' | 'saved' | 'error'
  const [notifPrefs, setNotifPrefs] = useState(cachedPrefs)
  const [notifPermission, setNotifPermission] = useState(() => getNotifPermission())
  const [prefsSynced, setPrefsSynced] = useState(true)
  const [notifError, setNotifError] = useState('')
  const [deviceSubscribed, setDeviceSubscribed] = useState(null)
  const notifSupported = pushSupported()
  const timezone = (() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return 'UTC' }
  })()

  // Preferences live in the database now, because the server that sends the
  // reminders has to be able to read them. localStorage was invisible to it.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { prefs, available } = await loadPrefs(user?.id)
      if (cancelled) return
      setNotifPrefs(prefs)
      setPrefsSynced(available)
      const subscribed = await isDeviceSubscribed(user?.id)
      if (!cancelled) setDeviceSubscribed(subscribed)
    })()
    return () => { cancelled = true }
  }, [user?.id])

  async function persist(updated) {
    setNotifPrefs(updated)
    const ok = await savePrefs(user?.id, updated)
    setPrefsSynced(ok)
  }

  const w = Number(weightKg)
  const h = Number(heightCm)
  const previewProtein = w > 0 ? Math.round((w * 1.8) / 10) * 10 : null
  const bmi = w > 0 && h > 0 ? (w / Math.pow(h / 100, 2)).toFixed(1) : null

  async function handleToggleNotifications() {
    const turningOn = !notifPrefs.enabled
    setNotifError('')

    if (turningOn) {
      if (notifPermission !== 'granted') {
        const result = await requestNotifPermission()
        setNotifPermission(result)
        if (result !== 'granted') {
          setNotifError('Notifications need permission before reminders can be sent.')
          return
        }
      }
      // Registering the browser's push subscription is what actually makes
      // delivery possible with the app closed. If it fails, reminders must NOT
      // be recorded as on — that combination silently guarantees nothing ever
      // arrives, which is exactly the bug this feature replaced.
      const result = await subscribeToPush(user?.id)
      if (!result.ok) {
        setNotifError(result.reason)
        setDeviceSubscribed(false)
        return
      }
      setDeviceSubscribed(true)
    } else {
      await unsubscribeFromPush(user?.id)
      setDeviceSubscribed(false)
    }

    await persist({ ...notifPrefs, enabled: turningOn })
  }

  function handleTimeChange(e) {
    const [h, m] = e.target.value.split(':').map(Number)
    persist({ ...notifPrefs, remindHour: h, remindMinute: m })
  }

  function handleLastCallChange(e) {
    const [h] = e.target.value.split(':').map(Number)
    persist({ ...notifPrefs, lastCallHour: h })
  }

  async function handleSave() {
    setStatus('saving')
    try {
      await updateUserProfile({
        name: name.trim(),
        weightKg: Number(weightKg) || 0,
        heightCm: Number(heightCm) || 0,
        age: Number(age) || 0,
        sex,
        activityLevel,
      })
      setStatus('saved')
      setTimeout(() => setStatus(null), 2000)
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Profile</h1>

      {/* Account */}
      <div className="card space-y-4">
        <h2 className="text-xs font-medium text-muted">Account</h2>
        <div>
          <label className="text-xs text-muted block mb-1">Email</label>
          {/* A div, not an input (the email can't be edited here), so it needs
              its own vertical centring — inputs centre their text natively.
              Same ink colour as every other field; it used to be muted, which
              read as an inconsistency rather than as "read-only". */}
          <div className="input-field flex items-center cursor-default select-all break-all">{user?.email}</div>
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">First Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your first name"
            className="input-field"
          />
        </div>
      </div>

      {/* Body stats */}
      <div className="card space-y-4">
        <h2 className="text-xs font-medium text-muted">Body stats</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted block mb-1">Weight (kg)</label>
            <input
              type="number"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="e.g. 70"
              min={30} max={200} step={0.5}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Height (cm)</label>
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="e.g. 175"
              min={100} max={250}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 25"
              min={10} max={100}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Sex</label>
            <select value={sex} onChange={(e) => setSex(e.target.value)} className="input-field">
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted block mb-2">Activity Level</label>
          <div className="space-y-1.5">
            {[
              { value: 'sedentary',  label: 'Sedentary',     desc: 'Desk job, little/no exercise' },
              { value: 'light',      label: 'Lightly Active', desc: '1–3 workouts/week' },
              { value: 'moderate',   label: 'Moderate',      desc: '3–5 workouts/week' },
              { value: 'active',     label: 'Active',        desc: '6–7 workouts/week' },
              { value: 'very_active',label: 'Very Active',   desc: 'Athlete / physical job' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setActivityLevel(opt.value)}
                aria-pressed={activityLevel === opt.value}
                className="choice w-full flex items-center justify-between gap-3 px-3 min-h-[48px] rounded-xl text-left"
              >
                <div>
                  <span className="text-sm font-medium text-ink">{opt.label}</span>
                  <span className="text-xs text-muted ml-2">{opt.desc}</span>
                </div>
                <ChoiceTick />
              </button>
            ))}
          </div>
        </div>

        {/* Derived stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl px-3 py-3" style={{ background: 'var(--raised)', border: '1px solid var(--raised)' }}>
            <div className="text-micro text-muted mb-0.5">Protein Goal</div>
            <div className="text-xl font-semibold text-ink">{previewProtein ?? '—'}<span className="text-xs font-normal text-muted">g</span></div>
          </div>
          <div className="rounded-xl px-3 py-3" style={{ background: 'var(--raised)', border: '1px solid var(--rule)' }}>
            <div className="text-micro text-muted mb-0.5">BMI</div>
            <div className="text-xl font-semibold text-ink">{bmi ?? '—'}</div>
          </div>
          <div className="rounded-xl px-3 py-3" style={{ background: 'var(--raised)', border: '1px solid var(--raised)' }}>
            <div className="text-micro text-muted mb-0.5">Calorie Target</div>
            <div className="text-xl font-semibold text-ink">{calorieGoal}<span className="text-micro font-normal text-muted"> kcal</span></div>
            <div className="text-micro text-muted mt-0.5">
              {activeSession?.goal === 'fat_loss' ? '−400 deficit' : activeSession?.goal === 'muscle_gain' ? '+300 surplus' : 'Maintenance'}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifSupported && (
        <div className="card space-y-4">
          <h2 className="text-xs font-medium text-muted">Notifications</h2>

          {notifPermission === 'denied' ? (
            <p className="text-xs text-muted">Notifications are blocked. Enable them in your browser settings to use workout reminders.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm">Daily reminders</p>
                  <p className="text-micro text-muted mt-0.5">
                    Sent from the server, so they arrive with the app closed
                  </p>
                </div>
                <Toggle
                  on={notifPrefs.enabled}
                  onClick={handleToggleNotifications}
                  label="Toggle daily reminders"
                />
              </div>

              {notifError && (
                <p className="text-micro" style={{ color: 'var(--warn)' }}>{notifError}</p>
              )}

              {/* Whether THIS device is registered, read from the database
                  rather than inferred from the toggle. The two can disagree,
                  and when they do nothing is delivered. */}
              {notifPrefs.enabled && deviceSubscribed !== null && (
                deviceSubscribed ? (
                  <p className="text-micro text-muted">This device is registered for reminders.</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-micro" style={{ color: 'var(--warn)' }}>
                      Reminders are on, but this device isn't registered — nothing will arrive here.
                    </p>
                    <button
                      onClick={async () => {
                        setNotifError('')
                        const r = await subscribeToPush(user?.id)
                        if (r.ok) setDeviceSubscribed(true)
                        else setNotifError(r.reason)
                      }}
                      className="btn-ghost px-3 text-xs"
                    >
                      Register this device
                    </button>
                  </div>
                )
              )}

              {notifPrefs.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted block mb-1">Remind me at</label>
                    <input
                      type="time"
                      value={`${String(notifPrefs.remindHour).padStart(2, '0')}:${String(notifPrefs.remindMinute).padStart(2, '0')}`}
                      onChange={handleTimeChange}
                      className="input-field"
                    />
                    <p className="text-micro text-muted mt-1.5">
                      Only if the day isn't logged yet. Times are in {timezone}.
                    </p>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm">Last call</p>
                      <p className="text-micro text-muted mt-0.5">A final nudge later in the evening</p>
                    </div>
                    <Toggle
                      on={notifPrefs.lastCallEnabled}
                      onClick={() => persist({ ...notifPrefs, lastCallEnabled: !notifPrefs.lastCallEnabled })}
                      label="Toggle last call"
                    />
                  </div>

                  {notifPrefs.lastCallEnabled && (
                    <input
                      type="time"
                      value={`${String(notifPrefs.lastCallHour).padStart(2, '0')}:00`}
                      onChange={handleLastCallChange}
                      className="input-field"
                      aria-label="Last call time"
                    />
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm">Weekly recap</p>
                      <p className="text-micro text-muted mt-0.5">Monday morning summary of last week</p>
                    </div>
                    <Toggle
                      on={notifPrefs.weeklyDigest}
                      onClick={() => persist({ ...notifPrefs, weeklyDigest: !notifPrefs.weeklyDigest })}
                      label="Toggle weekly recap"
                    />
                  </div>

                  {!prefsSynced && (
                    <p className="text-micro" style={{ color: 'var(--warn)' }}>
                      These settings aren't saved to the server yet, so reminders
                      won't send. Run the push notifications migration.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={status === 'saving'}
        className="w-full btn-primary py-3 disabled:opacity-50"
      >
        {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Save changes'}
      </button>

      {status === 'error' && (
        <p className="text-xs text-center" style={{ color: 'var(--warn)' }}>
          That didn't save. Check your connection and try again.
        </p>
      )}

      {/* Sign out lives here rather than floating over every screen, where it
          was a one-tap action with no confirmation. */}
      <div className="rule-top pt-4">
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full btn-ghost text-sm"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

function Toggle({ on, onClick, label }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={!!on}
      aria-label={label}
      className="relative w-11 h-11 flex items-center justify-center flex-shrink-0"
    >
      <span
        className="block w-10 h-6 rounded-full transition-colors"
        style={{ background: on ? 'var(--ink)' : 'var(--rule)' }}
      />
      <span
        className="absolute w-4 h-4 rounded-full transition-transform"
        style={{
          background: on ? 'var(--ground)' : 'var(--muted)',
          transform: on ? 'translateX(8px)' : 'translateX(-8px)',
        }}
      />
    </button>
  )
}
