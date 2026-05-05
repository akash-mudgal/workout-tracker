import { useState } from 'react'
import { format } from 'date-fns'
import { useStore } from '../store.jsx'

export default function SessionsPage() {
  const {
    today, sessions, activeSessionId, workoutHistory,
    createSession, switchSession, renameSession, resetSessionProgress, deleteSession,
  } = useStore()

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('90-Day Recomp')
  const [newStart, setNewStart] = useState(today)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [resetConfirmId, setResetConfirmId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [loading, setLoading] = useState(false)

  function getDayNumber(startDate) {
    const diff = Math.floor((new Date(today) - new Date(startDate + 'T00:00:00')) / 86400000)
    return Math.min(diff + 1, 90)
  }

  function getWorkoutCount(sessionId) {
    // workout_history in store is only for active session — show from local for active
    if (sessionId === activeSessionId) return Object.keys(workoutHistory).length
    return '—'
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setLoading(true)
    try {
      await createSession(newName.trim(), newStart)
      setCreating(false)
      setNewName('90-Day Recomp')
      setNewStart(today)
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

  async function handleRename(id) {
    if (!editName.trim()) return
    await renameSession(id, editName.trim())
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
        <h1 className="text-2xl font-bold">Sessions</h1>
        <button
          onClick={() => setCreating(true)}
          className="btn-primary text-sm px-4 py-2"
        >
          + New
        </button>
      </div>

      <p className="text-xs text-zinc-500">
        Each session is an independent 90-day cycle with its own workouts, logs, and metrics.
      </p>

      {/* New session form */}
      {creating && (
        <div className="card border-violet-500/30 bg-violet-500/5 space-y-3">
          <h3 className="text-sm font-semibold text-violet-400">New Session</h3>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Session Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Summer Cut 2026"
              className="input-field"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Start Date (Day 1)</label>
            <input
              type="date"
              value={newStart}
              max={today}
              onChange={(e) => setNewStart(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={loading} className="btn-primary flex-1 py-2 disabled:opacity-50">
              {loading ? 'Creating…' : 'Create & Switch'}
            </button>
            <button onClick={() => setCreating(false)} className="btn-ghost px-4 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Session cards */}
      <div className="space-y-3">
        {sessions.map((session) => {
          const dayNum = getDayNumber(session.startDate)
          const pct = Math.round((dayNum / 90) * 100)
          const isActive = session.id === activeSessionId
          const isEditingThis = editingId === session.id
          const isResettingThis = resetConfirmId === session.id
          const isDeletingThis = deleteConfirmId === session.id

          return (
            <div
              key={session.id}
              className={`card border transition-colors ${
                isActive
                  ? 'border-violet-500/40 bg-violet-500/5'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {isEditingThis ? (
                    <div className="flex gap-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input-field text-sm py-1 flex-1"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(session.id)}
                      />
                      <button onClick={() => handleRename(session.id)} className="btn-primary text-xs px-3">Save</button>
                      <button onClick={() => setEditingId(null)} className="btn-ghost text-xs px-2">✕</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{session.name}</span>
                      {isActive && (
                        <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full flex-shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Started {format(new Date(session.startDate + 'T00:00:00'), 'MMM d, yyyy')}
                    {' · '}{getWorkoutCount(session.id)} workouts
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className={`text-2xl font-black ${isActive ? 'text-violet-400' : 'text-zinc-400'}`}>
                    {dayNum}
                  </div>
                  <div className="text-xs text-zinc-600">/ 90</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="progress-bar mt-3">
                <div
                  className={`progress-fill ${isActive ? 'bg-violet-500' : 'bg-zinc-600'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Reset progress confirm */}
              {isResettingThis && (
                <div className="mt-3 pt-3 border-t border-orange-500/20 space-y-2">
                  <div className="text-xs text-orange-400 font-medium">Reset all progress for "{session.name}"?</div>
                  <div className="text-xs text-zinc-500">
                    This clears all workouts, daily logs, and body metrics for this cycle and restarts from today. Cannot be undone.
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResetProgress(session.id)}
                      disabled={loading}
                      className="bg-orange-600 hover:bg-orange-500 text-white text-xs px-4 py-1.5 rounded-lg disabled:opacity-50 font-medium"
                    >
                      {loading ? 'Resetting…' : 'Yes, reset everything'}
                    </button>
                    <button onClick={() => setResetConfirmId(null)} className="btn-ghost text-xs px-3">Cancel</button>
                  </div>
                </div>
              )}

              {/* Delete confirm */}
              {isDeletingThis && (
                <div className="mt-3 pt-3 border-t border-red-500/20 space-y-2">
                  <div className="text-xs text-red-400">
                    Delete "{session.name}"? This removes all workouts, logs and metrics for this session permanently.
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(session.id)}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-500 text-white text-xs px-4 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      {loading ? 'Deleting…' : 'Yes, delete'}
                    </button>
                    <button onClick={() => setDeleteConfirmId(null)} className="btn-ghost text-xs px-3">Cancel</button>
                  </div>
                </div>
              )}

              {/* Action row */}
              {!isEditingThis && !isResettingThis && !isDeletingThis && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800/60">
                  {!isActive && (
                    <button
                      onClick={() => handleSwitch(session.id)}
                      disabled={loading}
                      className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
                    >
                      {loading ? '…' : 'Switch'}
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingId(session.id); setEditName(session.name) }}
                    className="btn-ghost text-xs px-3 py-1.5"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => setResetConfirmId(session.id)}
                    className="btn-ghost text-xs px-3 py-1.5"
                  >
                    Reset Progress
                  </button>
                  {sessions.length > 1 && (
                    <button
                      onClick={() => setDeleteConfirmId(session.id)}
                      className="ml-auto text-xs text-zinc-600 hover:text-red-400 transition-colors px-2 py-1.5"
                    >
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
