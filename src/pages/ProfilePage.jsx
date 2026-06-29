import { useState } from 'react'
import { useStore } from '../store.jsx'
import { getNotifPrefs, saveNotifPrefs, requestNotifPermission, getNotifPermission } from '../utils/notifications'

export default function ProfilePage() {
  const { user, userProfile, updateUserProfile, calorieGoal, activeSession } = useStore()
  const [name, setName] = useState(userProfile.name || '')
  const [weightKg, setWeightKg] = useState(userProfile.weightKg || '')
  const [heightCm, setHeightCm] = useState(userProfile.heightCm || '')
  const [age, setAge] = useState(userProfile.age || '')
  const [sex, setSex] = useState(userProfile.sex || '')
  const [status, setStatus] = useState(null) // 'saving' | 'saved' | 'error'
  const [notifPrefs, setNotifPrefs] = useState(() => getNotifPrefs())
  const [notifPermission, setNotifPermission] = useState(() => getNotifPermission())
  const notifSupported = typeof window !== 'undefined' && 'Notification' in window

  const w = Number(weightKg)
  const h = Number(heightCm)
  const previewProtein = w > 0 ? Math.round((w * 1.8) / 10) * 10 : null
  const bmi = w > 0 && h > 0 ? (w / Math.pow(h / 100, 2)).toFixed(1) : null

  async function handleToggleNotifications() {
    if (!notifPrefs.enabled && notifPermission !== 'granted') {
      const result = await requestNotifPermission()
      setNotifPermission(result)
      if (result !== 'granted') return
    }
    const updated = { ...notifPrefs, enabled: !notifPrefs.enabled }
    setNotifPrefs(updated)
    saveNotifPrefs(updated)
  }

  function handleTimeChange(e) {
    const [hour, minute] = e.target.value.split(':').map(Number)
    const updated = { ...notifPrefs, hour, minute }
    setNotifPrefs(updated)
    saveNotifPrefs(updated)
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
      })
      setStatus('saved')
      setTimeout(() => setStatus(null), 2000)
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* Account */}
      <div className="card space-y-4">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Account</h2>
        <div>
          <label className="text-xs text-zinc-400 block mb-1">Email</label>
          <div className="input-field text-zinc-400 cursor-default select-all">{user?.email}</div>
        </div>
        <div>
          <label className="text-xs text-zinc-400 block mb-1">First Name</label>
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
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Body Stats</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Weight (kg)</label>
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
            <label className="text-xs text-zinc-400 block mb-1">Height (cm)</label>
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
            <label className="text-xs text-zinc-400 block mb-1">Age</label>
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
            <label className="text-xs text-zinc-400 block mb-1">Sex</label>
            <select value={sex} onChange={(e) => setSex(e.target.value)} className="input-field">
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        {/* Derived stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl px-3 py-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
            <div className="text-[10px] text-zinc-500 mb-0.5">Protein Goal</div>
            <div className="text-xl font-black text-amber-400">{previewProtein ?? '—'}<span className="text-xs font-normal text-zinc-400">g</span></div>
          </div>
          <div className="rounded-xl px-3 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-[10px] text-zinc-500 mb-0.5">BMI</div>
            <div className="text-xl font-black text-zinc-300">{bmi ?? '—'}</div>
          </div>
          <div className="rounded-xl px-3 py-3" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.18)' }}>
            <div className="text-[10px] text-zinc-500 mb-0.5">Calorie Target</div>
            <div className="text-xl font-black text-orange-400">{calorieGoal}<span className="text-[10px] font-normal text-zinc-400"> kcal</span></div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {activeSession?.goal === 'fat_loss' ? '−400 deficit' : activeSession?.goal === 'muscle_gain' ? '+300 surplus' : 'Maintenance'}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifSupported && (
        <div className="card space-y-4">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Notifications</h2>

          {notifPermission === 'denied' ? (
            <p className="text-xs text-zinc-400">Notifications are blocked. Enable them in your browser settings to use workout reminders.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Workout reminders</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Daily nudge to log your workout</p>
                </div>
                <button
                  onClick={handleToggleNotifications}
                  className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${notifPrefs.enabled ? 'bg-amber-500' : 'bg-zinc-700'}`}
                  aria-label="Toggle notifications"
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifPrefs.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>

              {notifPrefs.enabled && (
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Reminder time</label>
                  <input
                    type="time"
                    value={`${String(notifPrefs.hour).padStart(2, '0')}:${String(notifPrefs.minute).padStart(2, '0')}`}
                    onChange={handleTimeChange}
                    className="input-field"
                  />
                  <p className="text-xs text-zinc-500 mt-1.5">You'll get a streak-at-risk alert at 9 PM if you haven't logged a workout.</p>
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
        {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save Changes'}
      </button>

      {status === 'error' && (
        <p className="text-xs text-red-400 text-center">Failed to save. Please try again.</p>
      )}
    </div>
  )
}
