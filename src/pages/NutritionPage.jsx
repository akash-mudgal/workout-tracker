import { useState, useEffect, useCallback } from 'react'
import { format, addDays, parseISO } from 'date-fns'
import { useStore } from '../store.jsx'
import { QUICK_ADD_SLOT, mealTotals, scaleFood } from '../utils/nutritionTotals'
import {
  SEED_FOODS, loadCatalog, rememberFood, loadTemplates, saveTemplate,
  removeTemplate,
} from '../utils/foodCatalog'

const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Before Bed']
const PORTIONS = [0.5, 1, 1.5, 2]

function byRank(a, b) {
  const d = (b.useCount ?? 0) - (a.useCount ?? 0)
  return d !== 0 ? d : a.name.localeCompare(b.name)
}

export default function NutritionPage() {
  const { user, today, proteinGoal, calorieGoal, getMealsForDate, updateMealsForDate } = useStore()

  const [date, setDate] = useState(today)
  const [catalog, setCatalog] = useState(SEED_FOODS)
  const [catalogAvailable, setCatalogAvailable] = useState(false)
  const [templates, setTemplates] = useState([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { foods, available } = await loadCatalog(user?.id)
      if (cancelled) return
      setCatalog([...foods].sort(byRank))
      setCatalogAvailable(available)
      const t = await loadTemplates(user?.id)
      if (!cancelled) setTemplates(t.templates)
    })()
    return () => { cancelled = true }
  }, [user?.id])

  const meals = getMealsForDate(date) || {}
  const totals = mealTotals(meals)
  const yesterday = format(addDays(parseISO(date), -1), 'yyyy-MM-dd')
  const yesterdayMeals = getMealsForDate(yesterday) || {}

  const setMeals = useCallback((next) => updateMealsForDate(date, next), [date, updateMealsForDate])

  function addFoods(slot, foods) {
    setMeals({ ...meals, [slot]: [...(meals[slot] || []), ...foods] })
  }

  function removeFood(slot, idx) {
    setMeals({ ...meals, [slot]: (meals[slot] || []).filter((_, i) => i !== idx) })
  }

  // Every add also teaches the catalog, so the list reorders around what's
  // actually eaten and a typed food is never typed twice.
  async function remember(food) {
    if (!catalogAvailable || !user?.id) return
    const saved = await rememberFood(
      user.id,
      { name: food.name, protein: food.protein, cal: food.cal },
      food.useCount ?? 0
    )
    if (saved) {
      setCatalog((prev) => [saved, ...prev.filter((f) => f.name !== saved.name)].sort(byRank))
    }
  }

  async function logFood(slot, food, portion) {
    addFoods(slot, [scaleFood(food, portion)])
    await remember(food)
  }

  async function logCustom(slot, name, protein, cal) {
    const food = { name: name.trim(), protein: Number(protein) || 0, cal: Number(cal) || 0 }
    addFoods(slot, [food])
    await remember(food)
  }

  async function handleSaveTemplate(slot, name) {
    const items = (meals[slot] || []).map((f) => ({ name: f.name, protein: f.protein, cal: f.cal }))
    if (!items.length || !name.trim()) return
    const saved = await saveTemplate(user?.id, name.trim(), slot, items)
    if (saved) setTemplates((prev) => [saved, ...prev.filter((t) => t.id !== saved.id)])
  }

  async function handleDeleteTemplate(id) {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    await removeTemplate(user?.id, id)
  }

  const proteinLeft = Math.max(0, proteinGoal - totals.protein)
  const calLeft = Math.max(0, calorieGoal - totals.calories)
  const isToday = date === today

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center justify-between gap-3">
          <p className="text-micro text-muted">Nutrition</p>
          {!isToday && (
            <button onClick={() => setDate(today)} className="text-micro text-muted hover:text-ink px-2 py-1">
              Back to today
            </button>
          )}
        </div>

        {/* Past days can be corrected — the page used to show only today. */}
        <div className="flex items-center gap-2 mt-1.5">
          <button
            onClick={() => setDate(format(addDays(parseISO(date), -1), 'yyyy-MM-dd'))}
            aria-label="Previous day"
            className="w-11 h-11 flex items-center justify-center rounded-lg text-muted hover:text-ink"
            style={{ border: '1px solid var(--rule)' }}
          >
            ‹
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold truncate">
              {isToday ? 'Today' : format(parseISO(date), 'EEE d MMM')}
            </h1>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="text-micro text-muted bg-transparent min-h-[44px] -ml-0.5"
              aria-label="Pick a date"
            />
          </div>
          <button
            onClick={() => setDate(format(addDays(parseISO(date), 1), 'yyyy-MM-dd'))}
            disabled={isToday}
            aria-label="Next day"
            className="w-11 h-11 flex items-center justify-center rounded-lg text-muted hover:text-ink disabled:opacity-30"
            style={{ border: '1px solid var(--rule)' }}
          >
            ›
          </button>
        </div>
      </header>

      {/* What's left, which is the number you actually act on while eating. */}
      <div className="panel rule-group">
        <MacroRow label="Protein" value={totals.protein} goal={proteinGoal} left={proteinLeft} unit="g" />
        <MacroRow label="Calories" value={totals.calories} goal={calorieGoal} left={calLeft} unit="kcal" />
      </div>

      {MEAL_SLOTS.map((slot) => (
        <MealSection
          key={slot}
          slot={slot}
          foods={meals[slot] || []}
          catalog={catalog}
          templates={templates.filter((t) => !t.slot || t.slot === slot)}
          yesterdayFoods={yesterdayMeals[slot] || []}
          canSaveMeals={catalogAvailable}
          onLog={(food, portion) => logFood(slot, food, portion)}
          onLogCustom={(n, p, c) => logCustom(slot, n, p, c)}
          onLogMany={(foods) => addFoods(slot, foods)}
          onRemove={(idx) => removeFood(slot, idx)}
          onSaveTemplate={(name) => handleSaveTemplate(slot, name)}
          onDeleteTemplate={handleDeleteTemplate}
        />
      ))}

      {/* Protein set from the Dashboard slider, surfaced so the day's total is
          always explainable rather than appearing out of nowhere. */}
      {(meals[QUICK_ADD_SLOT] || []).length > 0 && (
        <div className="panel px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-sm block">{QUICK_ADD_SLOT}</span>
            <span className="text-micro text-muted num block mt-0.5">
              {mealTotals({ q: meals[QUICK_ADD_SLOT] }).protein}g protein, set on the Dashboard
            </span>
          </div>
          <button
            onClick={() => setMeals({ ...meals, [QUICK_ADD_SLOT]: [] })}
            className="text-micro text-muted hover:text-ink px-3 py-2 flex-shrink-0"
          >
            Clear
          </button>
        </div>
      )}

      {!catalogAvailable && (
        <p className="text-micro text-muted px-1">
          Your food list isn't syncing yet — run the food catalog migration and it
          will start learning what you eat. Logging works either way.
        </p>
      )}
    </div>
  )
}

function MacroRow({ label, value, goal, left, unit }) {
  const met = value >= goal
  const pct = Math.min((value / goal) * 100, 100)
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-micro num text-muted">
          {met ? 'met' : `${left} ${unit} left`}
        </span>
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className={`num-lg text-[26px] ${met ? 'text-signal' : 'text-ink'}`}>{value}</span>
        <span className="text-xs text-muted num">of {goal} {unit}</span>
      </div>
      <div className="progress-bar mt-2.5">
        <div className="progress-fill" data-met={met} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function MealSection({
  slot, foods, catalog, templates, yesterdayFoods, canSaveMeals,
  onLog, onLogCustom, onLogMany, onRemove, onSaveTemplate, onDeleteTemplate,
}) {
  const [adding, setAdding] = useState(false)
  const [tab, setTab] = useState('list')
  const [query, setQuery] = useState('')
  const [portion, setPortion] = useState(1)
  const [customName, setCustomName] = useState('')
  const [customProtein, setCustomProtein] = useState('')
  const [customCal, setCustomCal] = useState('')
  const [namingMeal, setNamingMeal] = useState(false)
  const [mealName, setMealName] = useState('')

  const t = mealTotals({ s: foods })
  const q = query.trim().toLowerCase()
  const matches = q ? catalog.filter((f) => f.name.toLowerCase().includes(q)) : catalog

  function log(food) {
    onLog(food, portion)
    setPortion(1)
    setQuery('')
    setAdding(false)
  }

  function addCustom() {
    if (!customName.trim()) return
    onLogCustom(customName, customProtein, customCal)
    setCustomName(''); setCustomProtein(''); setCustomCal('')
    setAdding(false)
  }

  function commitMealName() {
    if (!mealName.trim()) return
    onSaveTemplate(mealName)
    setMealName('')
    setNamingMeal(false)
  }

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 mb-2 px-1">
        <h3 className="text-xs font-medium text-muted">{slot}</h3>
        {foods.length > 0 && (
          <span className="text-micro text-muted num">{t.protein}g protein, {t.calories} kcal</span>
        )}
      </div>

      <div className="panel rule-group">
        {foods.map((food, i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="min-w-0">
              <div className="text-sm truncate">{food.name}</div>
              <div className="text-micro text-muted num mt-0.5">{food.protein}g protein, {food.cal} kcal</div>
            </div>
            <button
              onClick={() => onRemove(i)}
              aria-label={`Remove ${food.name}`}
              className="w-11 h-11 flex items-center justify-center text-muted hover:text-warn flex-shrink-0"
            >
              ×
            </button>
          </div>
        ))}

        {foods.length === 0 && !adding && (
          <p className="px-4 py-3 text-xs text-muted">Nothing logged.</p>
        )}

        {/* One-tap paths before the full picker, because they cover most days. */}
        {!adding && (
          <div className="px-3 py-2.5 flex flex-wrap gap-2">
            <button onClick={() => setAdding(true)} className="btn-ghost px-3 text-xs">Add food</button>

            {/* A saved meal needs a reachable delete, not a hidden long-press. */}
            {templates.map((tpl) => (
              <span
                key={tpl.id}
                className="inline-flex items-stretch rounded-lg overflow-hidden"
                style={{ border: '1px solid var(--rule)' }}
              >
                <button
                  onClick={() => onLogMany(tpl.items)}
                  className="text-xs text-muted hover:text-ink px-3 min-h-[44px]"
                >
                  {tpl.name}
                </button>
                <button
                  onClick={() => onDeleteTemplate(tpl.id)}
                  aria-label={`Delete saved meal ${tpl.name}`}
                  className="text-xs text-muted hover:text-warn px-2.5 min-h-[44px]"
                  style={{ borderLeft: '1px solid var(--rule)' }}
                >
                  ×
                </button>
              </span>
            ))}

            {foods.length === 0 && yesterdayFoods.length > 0 && (
              <button onClick={() => onLogMany(yesterdayFoods)} className="btn-ghost px-3 text-xs">
                Repeat yesterday
              </button>
            )}

            {foods.length > 0 && canSaveMeals && !namingMeal && (
              <button onClick={() => setNamingMeal(true)} className="btn-ghost px-3 text-xs">
                Save as meal
              </button>
            )}
          </div>
        )}

        {namingMeal && (
          <div className="px-3 py-3 flex gap-2">
            <input
              autoFocus
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && commitMealName()}
              placeholder="Name this meal"
              className="input-field text-sm flex-1"
            />
            <button onClick={commitMealName} disabled={!mealName.trim()} className="btn-primary px-3 text-xs">
              Save
            </button>
            <button onClick={() => { setNamingMeal(false); setMealName('') }} className="btn-ghost px-3 text-xs">
              Cancel
            </button>
          </div>
        )}

        {adding && (
          <div className="px-3 py-3 space-y-3">
            <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'var(--raised)' }}>
              {[['list', 'My foods'], ['custom', 'Something new']].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  aria-pressed={tab === id}
                  className={`flex-1 text-xs py-2 rounded-md font-medium transition-colors ${
                    tab === id ? 'bg-ink text-ground' : 'text-muted hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'list' && (
              <>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your foods"
                  className="input-field text-sm"
                />

                {/* One shared portion control instead of per-row steppers: pick
                    a portion, then tap the food. Resets to 1 after each add. */}
                <div className="flex items-center gap-2">
                  <span className="text-micro text-muted">Portion</span>
                  {PORTIONS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPortion(p)}
                      aria-pressed={portion === p}
                      className={`choice text-micro num px-2.5 py-2 rounded-md min-h-[36px] ${portion === p ? 'text-ink' : 'text-muted'}`}
                    >
                      <span className="x">×</span>{p}
                    </button>
                  ))}
                </div>

                <div className="rule-group" style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {matches.map((food) => (
                    <button
                      key={food.name}
                      onClick={() => log(food)}
                      className="w-full flex items-center justify-between gap-3 px-1 py-3 text-left min-h-[48px]"
                    >
                      <span className="text-sm truncate">{food.name}</span>
                      <span className="text-micro text-muted num flex-shrink-0">
                        {Math.round(food.protein * portion * 10) / 10}g, {Math.round(food.cal * portion)} kcal
                      </span>
                    </button>
                  ))}
                  {matches.length === 0 && (
                    <p className="px-1 py-3 text-xs text-muted">
                      Nothing matches. Add it under “Something new” and it'll be here next time.
                    </p>
                  )}
                </div>
              </>
            )}

            {tab === 'custom' && (
              <div className="space-y-2">
                <input
                  placeholder="Food name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="input-field text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Protein (g)" inputMode="decimal"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value)}
                    className="input-field num text-sm"
                  />
                  <input
                    placeholder="Calories" inputMode="numeric"
                    value={customCal}
                    onChange={(e) => setCustomCal(e.target.value)}
                    className="input-field num text-sm"
                  />
                </div>
                <button onClick={addCustom} disabled={!customName.trim()} className="w-full btn-primary text-sm">
                  Add to {slot}
                </button>
                {canSaveMeals && (
                  <p className="text-micro text-muted">Saved to your food list, so you won't type it again.</p>
                )}
              </div>
            )}

            <button onClick={() => setAdding(false)} className="w-full btn-ghost text-xs">
              Done
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
