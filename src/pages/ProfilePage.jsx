import { useState } from 'react'
import { useStore } from '../store.jsx'

export default function ProfilePage() {
  const { user, userProfile, updateUserProfile, proteinGoal } = useStore()
  const [name, setName] = useState(userProfile.name || '')
  const [weightKg, setWeightKg] = useState(userProfile.weightKg || '')
  const [heightCm, setHeightCm] = useState(userProfile.heightCm || '')
  const [status, setStatus] = useState(null) // 'saving' | 'saved' | 'error'

  const bmi = weightKg && heightCm
    ? (Number(weightKg) / Math.pow(Number(heightCm) / 100, 2)).toFixed(1)
    : null

  async function handleSave() {
    setStatus('saving')
    try {
      await updateUserProfile({
        name: name.trim(),
        weightKg: Number(weightKg) || 0,
        heightCm: Number(heightCm) || 0,
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
        </div>

        {/* Derived stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
            <div className="text-xs text-zinc-500 mb-0.5">Daily Protein Goal</div>
            <div className="text-xl font-black text-amber-400">{proteinGoal}g</div>
          </div>
          <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-xs text-zinc-500 mb-0.5">BMI</div>
            <div className="text-xl font-black text-zinc-300">{bmi ?? '—'}</div>
          </div>
        </div>
      </div>

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
