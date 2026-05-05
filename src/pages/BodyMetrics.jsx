import { useState } from 'react'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useStore } from '../store.jsx'

const tooltipStyle = {
  contentStyle: { background: 'rgba(10,10,18,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, backdropFilter: 'blur(16px)' },
  labelStyle: { color: '#a1a1aa' },
}

export default function BodyMetrics() {
  const { today, bodyMetrics, addBodyMetric } = useStore()
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)

  const todayMetric = bodyMetrics.find((m) => m.date === today)

  function handleSave() {
    if (!weight && !waist) return
    addBodyMetric({
      date: today,
      weight: +weight || todayMetric?.weight,
      waist: +waist || todayMetric?.waist,
      notes,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setWeight('')
    setWaist('')
    setNotes('')
  }

  const weightData = bodyMetrics.filter((m) => m.weight).map((m) => ({
    date: format(new Date(m.date + 'T00:00:00'), 'MMM d'),
    weight: m.weight,
  }))
  const waistData = bodyMetrics.filter((m) => m.waist).map((m) => ({
    date: format(new Date(m.date + 'T00:00:00'), 'MMM d'),
    waist: m.waist,
  }))

  const latest = bodyMetrics[bodyMetrics.length - 1]
  const first = bodyMetrics[0]
  const weightChange = latest && first && latest.weight && first.weight
    ? (latest.weight - first.weight).toFixed(1)
    : null
  const waistChange = latest && first && latest.waist && first.waist
    ? (latest.waist - first.waist).toFixed(1)
    : null

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Body Metrics</h1>

      {/* Log Form */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-sm text-white">Log Today's Measurements</h3>
        {todayMetric && (
          <div className="text-xs text-zinc-400 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
            Last logged today: {todayMetric.weight && `${todayMetric.weight}kg`} {todayMetric.waist && `· ${todayMetric.waist}cm waist`}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              placeholder={todayMetric?.weight ?? '66.0'}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Waist (cm)</label>
            <input
              type="number"
              step="0.5"
              placeholder={todayMetric?.waist ?? '82.0'}
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-400 block mb-1">Notes (optional)</label>
          <input
            type="text"
            placeholder="How do you feel today?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-field"
          />
        </div>
        <button
          onClick={handleSave}
          className={`w-full py-2.5 rounded-xl font-semibold transition-colors ${
            saved ? 'bg-emerald-600 text-white' : 'btn-primary'
          }`}
        >
          {saved ? 'Saved ✓' : 'Save Measurements'}
        </button>
      </div>

      {/* Change Summary */}
      {bodyMetrics.length >= 2 && (
        <div className="grid grid-cols-2 gap-3">
          <ChangeCard label="Weight" value={latest?.weight} change={weightChange} unit="kg" goodDirection="down" />
          <ChangeCard label="Waist" value={latest?.waist} change={waistChange} unit="cm" goodDirection="down" />
        </div>
      )}

      {/* Weight Chart */}
      {weightData.length >= 2 && (
        <div className="card">
          <h3 className="text-sm font-semibold mb-3 text-white">Weight Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} domain={['auto', 'auto']} width={35} />
              <Tooltip {...tooltipStyle} itemStyle={{ color: '#a78bfa' }} />
              <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Waist Chart */}
      {waistData.length >= 2 && (
        <div className="card">
          <h3 className="text-sm font-semibold mb-3 text-white">Waist Trend (cm)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={waistData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} domain={['auto', 'auto']} width={35} />
              <Tooltip {...tooltipStyle} itemStyle={{ color: '#10b981' }} />
              <Line type="monotone" dataKey="waist" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History List */}
      {bodyMetrics.length > 0 && (
        <div className="card space-y-2">
          <h3 className="text-sm font-semibold text-white">History</h3>
          {[...bodyMetrics].reverse().slice(0, 10).map((m, i) => (
            <div key={i} className="flex justify-between text-sm py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-zinc-400">{format(new Date(m.date + 'T00:00:00'), 'EEE, MMM d')}</span>
              <div className="text-right">
                <span className="text-white">{m.weight && `${m.weight}kg`}</span>
                {m.waist && <span className="text-zinc-400 ml-2">· {m.waist}cm</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {bodyMetrics.length === 0 && (
        <div className="text-center py-8 text-zinc-400 text-sm">
          Log your first measurement to start tracking progress.
        </div>
      )}
    </div>
  )
}

function ChangeCard({ label, value, change, unit, goodDirection }) {
  const num = parseFloat(change)
  const isGood = goodDirection === 'down' ? num <= 0 : num >= 0
  const color = num === 0 ? 'text-zinc-400' : isGood ? 'text-emerald-400' : 'text-red-400'
  return (
    <div className="card">
      <div className="text-xs text-zinc-400 mb-1">{label}</div>
      <div className="text-xl font-bold text-white">{value}{unit}</div>
      {change !== null && (
        <div className={`text-sm font-medium ${color} mt-1`}>
          {num > 0 ? '+' : ''}{change}{unit} total
        </div>
      )}
    </div>
  )
}
