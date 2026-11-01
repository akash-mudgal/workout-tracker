import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useStore } from '../store.jsx'
import { getRecommendedWorkout, PHASE_INFO } from '../data/workoutPlans'
import { requestNotifPermission, getNotifPermission } from '../utils/notifications'

const WATER_GOAL = 10
const STEPS_GOAL = 9000
const SLEEP_GOAL = 7.5
const NOTIF_PROMPT_DISMISSED = 'wt_notif_prompt_dismissed'

export default function Dashboard() {
  const {
    today, dayNumber, totalDays, todayLog, workoutHistory, updateTodayLog, setTotalProtein,
    toggleSupplement, activeSession, proteinGoal, userProfile, streakData, streakFreezeState,
    useStreakFreeze,
  } = useStore()
  const navigate = useNavigate()

  // "Later" is remembered — it used to be component state only, so the card
  // came back every single time you navigated home.
  const [showNotifPrompt, setShowNotifPrompt] = useState(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false
    if (getNotifPermission() !== 'default') return false
    try { return localStorage.getItem(NOTIF_PROMPT_DISMISSED) !== '1' } catch { return true }
  })

  function dismissNotifPrompt() {
    try { localStorage.setItem(NOTIF_PROMPT_DISMISSED, '1') } catch { /* ignore */ }
    setShowNotifPrompt(false)
  }

  const recommended = getRecommendedWorkout(activeSession?.planId ?? 'ppl', workoutHistory)
  const todayDone = workoutHistory[today]
  const isRestDay = recommended?.type === 'rest'

  const phaseIdx = dayNumber <= Math.round(totalDays / 3) ? 0 : dayNumber <= Math.round(totalDays * 2 / 3) ? 1 : 2
  const phase = PHASE_INFO[phaseIdx]
  const pct = Math.min(dayNumber / totalDays, 1)

  const metDone =
    (todayLog.protein >= proteinGoal ? 1 : 0) +
    (todayLog.steps >= STEPS_GOAL ? 1 : 0) +
    (todayLog.water >= WATER_GOAL ? 1 : 0) +
    (todayLog.sleep >= SLEEP_GOAL ? 1 : 0) +
    (todayDone || isRestDay ? 1 : 0)

  return (
    <div className="space-y-6">

      {showNotifPrompt && (
        <div className="panel px-4 py-3.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">Turn on daily reminders</p>
            <p className="text-xs text-muted mt-0.5">A nudge in the evening if the day isn't logged.</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => { requestNotifPermission(); setShowNotifPrompt(false) }}
              className="btn-primary px-3 text-xs"
            >
              Turn on
            </button>
            <button onClick={dismissNotifPrompt} className="text-xs text-muted px-3 py-2 min-h-[44px]">
              Not now
            </button>
          </div>
        </div>
      )}

      {/* Header — the cycle is the context for everything below it */}
      <header>
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-micro text-muted">{format(new Date(today + 'T00:00:00'), 'EEE d MMM')}</p>
          <p className="text-micro text-muted num">day {dayNumber} of {totalDays}</p>
        </div>

        <h1 className="text-2xl font-semibold mt-1.5">
          Hey{userProfile.name ? `, ${userProfile.name}` : ''}
        </h1>

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {activeSession && (
            <Link to="/sessions" className="text-xs text-muted hover:text-ink transition-colors">
              {activeSession.name}
            </Link>
          )}
          {activeSession && streakData && (
            <>
              <span className="text-xs text-muted num">
                <span className={streakData.currentStreak > 0 ? 'text-ink font-medium' : ''}>
                  {streakData.currentStreak}
                </span>
                {' '}day streak
              </span>
              {streakData.longestStreak > streakData.currentStreak && (
                <span className="text-micro text-muted num">best {streakData.longestStreak}</span>
              )}
              {streakData.streakBroken && streakFreezeState && streakFreezeState.freezesUsed < 1 && (
                <button
                  onClick={useStreakFreeze}
                  className="text-micro font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                  style={{ border: '1px solid var(--rule)', color: 'var(--muted)' }}
                >
                  Use a freeze
                </button>
              )}
            </>
          )}
        </div>

        <div className="progress-bar mt-4">
          <div className="progress-fill" style={{ width: `${pct * 100}%` }} />
        </div>
        <p className="text-micro text-muted mt-2">
          Week {Math.ceil(dayNumber / 7)}, {phase.label.toLowerCase()} phase — {phase.desc}
        </p>
      </header>

      {/* Today's session */}
      <section className="panel px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-micro text-muted">{todayDone ? 'Next session' : 'Today'}</p>
            <h2 className="text-lg font-semibold mt-0.5 truncate">{recommended.name}</h2>
            <p className="text-xs text-muted mt-0.5">
              {isRestDay
                ? 'Scheduled rest — log steps and sleep'
                : `${recommended.exercises?.length ?? 0} exercises, ${recommended.subtitle}`}
            </p>
          </div>
          <div className="flex-shrink-0">
            {todayDone ? (
              <span className="text-micro font-semibold text-signal">logged</span>
            ) : isRestDay ? null : (
              <button onClick={() => navigate('/workout')} className="btn-primary px-4 text-sm">
                Start training
              </button>
            )}
          </div>
        </div>
      </section>

      {/* The day's numbers. Rules group them; the numerals carry the emphasis. */}
      <section>
        <SectionHead title="Today's numbers" meta={`${metDone} of 5 met`} />
        <div className="panel rule-group">
          <MetricRow
            label="Protein" value={todayLog.protein} goal={proteinGoal} unit="g"
            min={0} max={Math.max(400, proteinGoal * 2)} step={5}
            onChange={setTotalProtein}
          />
          <MetricRow
            label="Water" value={todayLog.water} goal={WATER_GOAL} unit="glasses"
            min={0} max={15} step={1}
            onChange={(v) => updateTodayLog({ water: v })}
          />
          <MetricRow
            label="Steps" value={todayLog.steps} goal={STEPS_GOAL}
            min={0} max={20000} step={500}
            onChange={(v) => updateTodayLog({ steps: v })}
          />
          <MetricRow
            label="Sleep" value={todayLog.sleep} goal={SLEEP_GOAL} unit="h"
            min={0} max={12} step={0.5}
            onChange={(v) => updateTodayLog({ sleep: v })}
          />
          <div className="px-4 py-3.5 flex items-center justify-between gap-3">
            <span className="text-xs text-muted">Workout</span>
            <span className={`text-xs font-medium ${todayDone || isRestDay ? 'text-signal' : 'text-muted'}`}>
              {todayDone ? 'logged' : isRestDay ? 'rest day' : 'not yet'}
            </span>
          </div>
        </div>
      </section>

      <section>
        <SectionHead title="Supplements" />
        <div className="panel rule-group">
          <SupplementRow label="Creatine monohydrate" sub="3–5 g, strength and muscle"
            checked={todayLog.supplements?.creatine} onChange={() => toggleSupplement('creatine')} />
          <SupplementRow label="Vitamin B12" sub="Essential on a vegetarian diet"
            checked={todayLog.supplements?.b12} onChange={() => toggleSupplement('b12')} />
          <SupplementRow label="D3 and magnesium" sub="Recovery and sleep quality"
            checked={todayLog.supplements?.d3mag} onChange={() => toggleSupplement('d3mag')} />
        </div>
      </section>
    </div>
  )
}

function SectionHead({ title, meta }) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-2 px-1">
      <h3 className="text-xs font-medium text-muted">{title}</h3>
      {meta && <span className="text-micro text-muted num">{meta}</span>}
    </div>
  )
}

function MetricRow({ label, value, goal, unit, min, max, step, onChange }) {
  const met = value >= goal
  const shown = value >= 1000 ? value.toLocaleString('en-US') : value
  const goalShown = goal >= 1000 ? goal.toLocaleString('en-US') : goal

  return (
    <div className="px-4 pt-3.5 pb-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-muted">{label}</span>
        {met && <span className="text-micro font-semibold text-signal">met</span>}
      </div>

      <div className="flex items-baseline gap-2 mt-1">
        <span className={`num-lg text-[28px] ${met ? 'text-signal' : 'text-ink'}`}>{shown}</span>
        <span className="text-xs text-muted num">of {goalShown}{unit ? ` ${unit}` : ''}</span>
      </div>

      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        aria-label={`${label}, ${shown} of ${goalShown}`}
        onChange={(e) => onChange(+e.target.value)}
      />
    </div>
  )
}

function SupplementRow({ label, sub, checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-center gap-3 px-4 py-3 text-left min-h-[56px] transition-colors"
      aria-pressed={!!checked}
    >
      <span
        className="w-[18px] h-[18px] rounded-md flex items-center justify-center flex-shrink-0"
        style={{
          border: `1px solid ${checked ? 'var(--signal)' : 'var(--rule)'}`,
          background: checked ? 'var(--signal)' : 'transparent',
        }}
      >
        {checked && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2.5 6.5L4.8 8.8L9.5 3.5" stroke="#0B0D10" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="min-w-0">
        <span className={`block text-sm ${checked ? 'text-ink' : 'text-muted'}`}>{label}</span>
        <span className="block text-micro text-muted mt-0.5">{sub}</span>
      </span>
    </button>
  )
}
