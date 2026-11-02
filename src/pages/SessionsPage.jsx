import { useState } from 'react'
import { format } from 'date-fns'
import { useStore } from '../store.jsx'
import { PLANS } from '../data/workoutPlans'
import PlanPicker from '../components/PlanPicker'

const glassBorder = { border: '1px solid var(--rule)' }
const glassBg = { background: 'var(--raised)', border: '1px solid var(--rule)' }
const divider = { borderTop: '1px solid var(--rule)' }

export default function SessionsPage() {
  const {
    today, sessions, activeSessionId, workoutHistory,
    createSession, switchSession, updateSession, resetSessionProgress, deleteSession,
  } = useStore()

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('90-Day Cycle')
  const [newStart, setNewStart] = useState(today)
  const [newPlanId, setNewPlanId] = useState('ppl')
  const [newTotalDays, setNewTotalDays] = useState(90)
  const [newGoal, setNewGoal] = useState('recomp')

  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editTotalDays, setEditTotalDays] = useState(90)
  const [editPlanId, setEditPlanId] = useState('ppl')
  const [editGoal, setEditGoal] = useState('recomp')

  const [resetConfirmId, setResetConfirmId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [loading, setLoading] = useState(false)

  function getDayNumber(startDate, totalDays) {
    const diff = Math.floor((new Date(today) - new Date(startDate + 'T00:00:00')) / 86400000)
    return Math.min(diff + 1, totalDays)
  }

  function getWorkoutCount(sessionId) {
    if (sessionId === activeSessionId) return Object.keys(workoutHistory).length
    return '—'
  }

  async function handleCreate() {
    if (!newName.trim()) return
    const days = Math.max(7, Math.min(365, Number(newTotalDays) || 90))
    setLoading(true)
    try {
      await createSession(newName.trim(), newStart, newPlanId, days, newGoal)
      setCreating(false)
      setNewName('90-Day Cycle')
      setNewStart(today)
      setNewPlanId('ppl')
      setNewTotalDays(90)
      setNewGoal('recomp')
    } finally {
      setLoading(false)
    }
  }

  async function handleSwitch(id) {
    if (id === activeSessionId) return
    setLoading(true)
    try { await switchSession(id) }
    finally { setLoading(false) }
  }

  function openEdit(session) {
    setEditingId(session.id)
    setEditName(session.name)
    setEditStart(session.startDate)
    setEditTotalDays(session.totalDays ?? 90)
    setEditPlanId(session.planId ?? 'ppl')
    setEditGoal(session.goal ?? 'recomp')
  }

  async function handleSaveEdit(id) {
    const days = Math.max(7, Math.min(365, Number(editTotalDays) || 90))
    await updateSession(id, { name: editName.trim() || undefined, startDate: editStart, totalDays: days, planId: editPlanId, goal: editGoal })
    setEditingId(null)
  }

  async function handleResetProgress(id) {
    setLoading(true)
    try { await resetSessionProgress(id) }
    finally { setLoading(false); setResetConfirmId(null) }
  }

  async function handleDelete(id) {
    if (sessions.length <= 1) return
    setLoading(true)
    try { await deleteSession(id, sessions) }
    finally { setLoading(false); setDeleteConfirmId(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sessions</h1>
        <button onClick={() => setCreating(true)} className="btn-primary text-sm px-4 py-2">
          + New
        </button>
      </div>

      <p className="text-xs text-muted">
        Each session is an independent cycle with its own workouts, logs, and metrics.
      </p>

      {/* New session form */}
      {creating && (
        <div className="card space-y-3" style={{ borderColor: '#3C4650', background: 'var(--raised)' }}>
          <h3 className="text-sm font-semibold text-ink">New Session</h3>
          <div>
            <label className="text-xs text-muted block mb-1">Session Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Summer Cut 2026"
              className="input-field"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted block mb-1">Start Date (Day 1)</label>
              <input type="date" value={newStart} max={today} onChange={(e) => setNewStart(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Duration (days)</label>
              <input type="number" value={newTotalDays} min={7} max={365} onChange={(e) => setNewTotalDays(e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted block mb-2">Goal</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'fat_loss', label: 'Fat Loss' },
                { value: 'recomp', label: 'Recomp' },
                { value: 'muscle_gain', label: 'Muscle Gain' },
              ].map((g) => (
                <button
                  key={g.value}
                  onClick={() => setNewGoal(g.value)}
                  className="py-2 rounded-xl text-xs font-semibold border transition-colors"
                  style={newGoal === g.value
                    ? { background: 'var(--raised)', border: '1px solid #3C4650', color: 'var(--ink)' }
                    : glassBg}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted block mb-2">Workout Plan</label>
            <PlanPicker value={newPlanId} onChange={setNewPlanId} ask compact />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={loading} className="btn-primary flex-1 py-2 disabled:opacity-50">
              {loading ? 'Creating…' : 'Create & Switch'}
            </button>
            <button onClick={() => setCreating(false)} className="btn-ghost px-4 py-2">Cancel</button>
          </div>
        </div>
      )}

      {/* Session cards */}
      <div className="space-y-3">
        {sessions.map((session) => {
          const totalDays = session.totalDays ?? 90
          const dayNum = getDayNumber(session.startDate, totalDays)
          const pct = Math.round((dayNum / totalDays) * 100)
          const isActive = session.id === activeSessionId
          const isEditingThis = editingId === session.id
          const isResettingThis = resetConfirmId === session.id
          const isDeletingThis = deleteConfirmId === session.id

          return (
            <div
              key={session.id}
              className="card transition-all"
              style={isActive
                ? { borderColor: '#3C4650', background: 'var(--raised)' }
                : {}}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate text-ink">{session.name}</span>
                    {isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'var(--raised)', color: 'var(--ink)' }}>
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    {PLANS[session.planId ?? 'ppl']?.name ?? 'PPL'} · {totalDays} days · Started {format(new Date(session.startDate + 'T00:00:00'), 'MMM d, yyyy')}
                    {' · '}{getWorkoutCount(session.id)} workouts
                    {session.goal && session.goal !== 'recomp' && (
                      <span className="ml-1 text-muted">
                        · {session.goal === 'fat_loss' ? 'Fat Loss' : 'Muscle Gain'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-2xl font-semibold ${isActive ? 'text-ink' : 'text-muted'}`}>{dayNum}</div>
                  <div className="text-xs text-muted">/ {totalDays}</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="progress-bar mt-3">
                <div
                  className="progress-fill"
                  style={{ width: `${pct}%`, background: isActive ? 'linear-gradient(90deg, var(--ink), var(--ink))' : 'var(--rule)' }}
                />
              </div>

              {/* Inline edit form */}
              {isEditingThis && (
                <div className="mt-3 pt-3 space-y-3" style={divider}>
                  <h4 className="text-xs font-semibold text-muted">Edit Session</h4>
                  <div>
                    <label className="text-xs text-muted block mb-1">Name</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input-field text-sm py-1"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(session.id)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted block mb-1">Start Date</label>
                      <input type="date" value={editStart} max={today} onChange={(e) => setEditStart(e.target.value)} className="input-field text-sm py-1" />
                    </div>
                    <div>
                      <label className="text-xs text-muted block mb-1">Duration (days)</label>
                      <input type="number" value={editTotalDays} min={7} max={365} onChange={(e) => setEditTotalDays(e.target.value)} className="input-field text-sm py-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted block mb-2">Goal</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'fat_loss', label: 'Fat Loss' },
                        { value: 'recomp', label: 'Recomp' },
                        { value: 'muscle_gain', label: 'Muscle Gain' },
                      ].map((g) => (
                        <button
                          key={g.value}
                          onClick={() => setEditGoal(g.value)}
                          className="py-1.5 rounded-xl text-xs font-semibold border transition-colors"
                          style={editGoal === g.value
                            ? { background: 'var(--raised)', border: '1px solid #3C4650', color: 'var(--ink)' }
                            : glassBg}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted block mb-2">Workout Plan</label>
                    <PlanPicker value={editPlanId} onChange={setEditPlanId} compact />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(session.id)} className="btn-primary text-xs px-4 py-1.5">Save</button>
                    <button onClick={() => setEditingId(null)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
                  </div>
                </div>
              )}

              {/* Reset progress confirm */}
              {isResettingThis && (
                <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid var(--rule)' }}>
                  <div className="text-xs text-ink font-medium">Reset all progress for "{session.name}"?</div>
                  <div className="text-xs text-muted">
                    This clears all workouts, daily logs, and body metrics and restarts from today. Cannot be undone.
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResetProgress(session.id)}
                      disabled={loading}
                      className="bg-warn text-ink text-xs px-4 py-1.5 rounded-lg disabled:opacity-50 font-medium"
                    >
                      {loading ? 'Resetting…' : 'Yes, reset everything'}
                    </button>
                    <button onClick={() => setResetConfirmId(null)} className="btn-ghost text-xs px-3">Cancel</button>
                  </div>
                </div>
              )}

              {/* Delete confirm */}
              {isDeletingThis && (
                <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid rgba(255,107,91,0.3)' }}>
                  <div className="text-xs text-warn">
                    Delete "{session.name}"? This removes all workouts, logs and metrics permanently.
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(session.id)}
                      disabled={loading}
                      className="bg-warn text-ink text-xs px-4 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      {loading ? 'Deleting…' : 'Yes, delete'}
                    </button>
                    <button onClick={() => setDeleteConfirmId(null)} className="btn-ghost text-xs px-3">Cancel</button>
                  </div>
                </div>
              )}

              {/* Action row */}
              {!isEditingThis && !isResettingThis && !isDeletingThis && (
                <div className="flex gap-2 mt-3 pt-3" style={divider}>
                  {!isActive && (
                    <button onClick={() => handleSwitch(session.id)} disabled={loading} className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50">
                      {loading ? '…' : 'Switch'}
                    </button>
                  )}
                  <button onClick={() => openEdit(session)} className="btn-ghost text-xs px-3 py-1.5">Edit</button>
                  <button onClick={() => setResetConfirmId(session.id)} className="btn-ghost text-xs px-3 py-1.5">Reset Progress</button>
                  {sessions.length > 1 && (
                    <button onClick={() => setDeleteConfirmId(session.id)} className="ml-auto text-xs text-muted hover:text-warn transition-colors px-2 py-1.5">
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
