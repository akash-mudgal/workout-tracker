import { useState } from 'react'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useStore } from '../store.jsx'

const tooltipStyle = {
  contentStyle: { background: '#14181D', border: '1px solid var(--rule)', borderRadius: 12 },
  labelStyle: { color: '#8B949E' },
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
      <h1 className="text-2xl font-semibold">Body Metrics</h1>

      {/* Log Form */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-sm text-ink">Log Today's Measurements</h3>
        {todayMetric && (
          <div className="text-xs text-muted rounded-xl px-3 py-2" style={{ background: 'var(--raised)' }}>
            Last logged today: {todayMetric.weight && `${todayMetric.weight}kg`} {todayMetric.waist && `· ${todayMetric.waist}cm waist`}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted block mb-1">Weight (kg)</label>
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
            <label className="text-xs text-muted block mb-1">Waist (cm)</label>
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
          <label className="text-xs text-muted block mb-1">Notes (optional)</label>
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
          className="w-full btn-primary text-sm"
        >
          {saved ? 'Saved' : 'Save measurements'}
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
          <h3 className="text-sm font-semibold mb-3 text-ink">Weight Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--raised)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8B949E' }} />
              <YAxis tick={{ fontSize: 12, fill: '#8B949E' }} domain={['auto', 'auto']} width={42} />
              <Tooltip {...tooltipStyle} itemStyle={{ color: 'var(--ink)' }} />
              <Line type="monotone" dataKey="weight" stroke="#E8EBED" strokeWidth={2} dot={{ fill: '#E8EBED', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Waist Chart */}
      {waistData.length >= 2 && (
        <div className="card">
          <h3 className="text-sm font-semibold mb-3 text-ink">Waist Trend (cm)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={waistData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--raised)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8B949E' }} />
              <YAxis tick={{ fontSize: 12, fill: '#8B949E' }} domain={['auto', 'auto']} width={42} />
              <Tooltip {...tooltipStyle} itemStyle={{ color: '#8B949E' }} />
              <Line type="monotone" dataKey="waist" stroke="#8B949E" strokeWidth={2} dot={{ fill: '#8B949E', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History List */}
      {bodyMetrics.length > 0 && (
        <div className="card space-y-2">
          <h3 className="text-sm font-semibold text-ink">History</h3>
          {[...bodyMetrics].reverse().slice(0, 10).map((m, i) => (
            <div key={i} className="flex justify-between text-sm py-1.5" style={{ borderBottom: '1px solid var(--raised)' }}>
              <span className="text-muted">{format(new Date(m.date + 'T00:00:00'), 'EEE, MMM d')}</span>
              <div className="text-right">
                <span className="text-ink">{m.weight && `${m.weight}kg`}</span>
                {m.waist && <span className="text-muted ml-2">· {m.waist}cm</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {bodyMetrics.length === 0 && (
        <div className="text-center py-8 text-muted text-sm">
          Log your first measurement to start tracking progress.
        </div>
      )}
    </div>
  )
}

function ChangeCard({ label, value, change, unit, goodDirection }) {
  const num = parseFloat(change)
  const isGood = goodDirection === 'down' ? num <= 0 : num >= 0
  const color = num === 0 ? 'text-muted' : isGood ? 'text-signal' : 'text-warn'
  return (
    <div className="card">
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="text-xl font-semibold text-ink">{value}{unit}</div>
      {change !== null && (
        <div className={`text-sm font-medium ${color} mt-1`}>
          {num > 0 ? '+' : ''}{change}{unit} total
        </div>
      )}
    </div>
  )
}
