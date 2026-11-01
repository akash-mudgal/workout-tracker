import { useState } from 'react'
import { useStore } from '../store.jsx'
import { QUICK_ADD_SLOT } from '../utils/nutritionTotals'

const QUICK_FOODS = [
  { name: 'Soya Chunks (100g)', protein: 52, cal: 345 },
  { name: 'Paneer (100g)', protein: 18, cal: 265 },
  { name: 'Dal (1 cup)', protein: 18, cal: 230 },
  { name: 'Milk (250ml)', protein: 8, cal: 150 },
  { name: 'Curd (200g)', protein: 7, cal: 120 },
  { name: 'Oats (80g)', protein: 10, cal: 300 },
  { name: 'Whey Protein (1 scoop)', protein: 24, cal: 120 },
  { name: 'Peanuts (30g)', protein: 8, cal: 175 },
  { name: 'Tofu (100g)', protein: 17, cal: 145 },
  { name: 'Roasted Chana (50g)', protein: 11, cal: 190 },
  { name: 'Roti (1 piece)', protein: 3, cal: 80 },
  { name: 'Egg (1 whole)', protein: 6, cal: 70 },
]

const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Before Bed']
const EMPTY_MEALS = MEAL_SLOTS.reduce((acc, m) => ({ ...acc, [m]: [] }), {})

export default function NutritionPage() {
  const { todayLog, updateTodayMeals, todayMeals, proteinGoal, calorieGoal } = useStore()

  // Meals live in the store, which derives protein/calories from them. This page
  // used to keep its own copy and overwrite those totals on every mount, which
  // silently clobbered the Dashboard slider and missed cross-device updates.
  const meals = todayMeals && Object.keys(todayMeals).length > 0 ? todayMeals : EMPTY_MEALS

  function addFood(mealSlot, food) {
    updateTodayMeals({ ...meals, [mealSlot]: [...(meals[mealSlot] || []), food] })
  }

  function removeFood(mealSlot, idx) {
    updateTodayMeals({ ...meals, [mealSlot]: (meals[mealSlot] || []).filter((_, i) => i !== idx) })
  }

  const quickAdded = meals[QUICK_ADD_SLOT] || []
  const quickProtein = quickAdded.reduce((s, f) => s + (Number(f?.protein) || 0), 0)

  const protein = todayLog.protein
  const calories = todayLog.calories || 0
  const proteinPct = Math.min((protein / proteinGoal) * 100, 100)
  const calPct = Math.min((calories / calorieGoal) * 100, 100)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nutrition</h1>

      {/* Macro totals */}
      <div className="grid grid-cols-2 gap-3">
        <MacroCard label="Protein" value={protein} goal={proteinGoal} unit="g" pct={proteinPct} color="amber" />
        <MacroCard label="Calories" value={calories} goal={calorieGoal} unit="kcal" pct={calPct} color="orange" />
      </div>

      {/* Food diary */}
      {MEAL_SLOTS.map((slot) => (
        <MealSection
          key={slot}
          slot={slot}
          foods={meals[slot] || []}
          onAdd={(food) => addFood(slot, food)}
          onRemove={(idx) => removeFood(slot, idx)}
        />
      ))}

      {/* Protein set straight from the Dashboard slider, surfaced here so the
          day's total is always explainable rather than appearing out of nowhere. */}
      {quickProtein > 0 && (
        <div className="card flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="font-semibold text-sm text-white">{QUICK_ADD_SLOT}</span>
            <span className="text-xs text-zinc-500 ml-2">{quickProtein}g protein, set on the Dashboard</span>
          </div>
          <button
            onClick={() => updateTodayMeals({ ...meals, [QUICK_ADD_SLOT]: [] })}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}

function MealSection({ slot, foods, onAdd, onRemove }) {
  const [adding, setAdding] = useState(false)
  const [tab, setTab] = useState('quick') // 'quick' | 'custom'
  const [customName, setCustomName] = useState('')
  const [customProtein, setCustomProtein] = useState('')
  const [customCal, setCustomCal] = useState('')

  const mealProtein = foods.reduce((s, f) => s + f.protein, 0)
  const mealCal = foods.reduce((s, f) => s + f.cal, 0)

  function handleQuickAdd(food) {
    onAdd(food)
    setAdding(false)
  }

  function handleCustomAdd() {
    if (!customName.trim()) return
    onAdd({
      name: customName.trim(),
      protein: +customProtein || 0,
      cal: +customCal || 0,
    })
    setCustomName('')
    setCustomProtein('')
    setCustomCal('')
    setAdding(false)
  }

  return (
    <div className="card space-y-3">
      {/* Meal header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-semibold text-sm text-white">{slot}</span>
          {foods.length > 0 && (
            <span className="text-xs text-zinc-500 ml-2">
              {mealProtein}g protein · {mealCal} kcal
            </span>
          )}
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
          style={{
            background: adding ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.06)',
            color: adding ? '#a78bfa' : '#a1a1aa',
            border: `1px solid ${adding ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          {adding ? 'Done' : '+ Add'}
        </button>
      </div>

      {/* Logged food items */}
      {foods.length > 0 && (
        <div className="space-y-1.5">
          {foods.map((food, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm text-white font-medium truncate">{food.name}</div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {food.protein}g protein · {food.cal} kcal
                </div>
              </div>
              <button
                onClick={() => onRemove(i)}
                className="ml-3 text-zinc-600 hover:text-red-400 transition-colors text-lg leading-none flex-shrink-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {foods.length === 0 && !adding && (
        <p className="text-xs text-zinc-600 italic">Nothing logged yet</p>
      )}

      {/* Add food panel */}
      {adding && (
        <div className="space-y-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Tab switcher */}
          <div className="flex gap-1 p-0.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {['quick', 'custom'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-all capitalize"
                style={{
                  background: tab === t ? 'rgba(124,58,237,0.3)' : 'transparent',
                  color: tab === t ? '#c4b5fd' : '#71717a',
                }}
              >
                {t === 'quick' ? 'Quick Add' : 'Custom'}
              </button>
            ))}
          </div>

          {tab === 'quick' && (
            <div className="space-y-1">
              {QUICK_FOODS.map((food) => (
                <button
                  key={food.name}
                  onClick={() => handleQuickAdd(food)}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left transition-all hover:border-white/15"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="text-sm text-zinc-200">{food.name}</span>
                  <span className="text-xs text-zinc-500 flex-shrink-0 ml-2">
                    {food.protein}g · {food.cal} kcal
                  </span>
                </button>
              ))}
            </div>
          )}

          {tab === 'custom' && (
            <div className="space-y-2">
              <input
                placeholder="Food name (required)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="input-field text-sm w-full"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Protein (g)"
                  type="number"
                  value={customProtein}
                  onChange={(e) => setCustomProtein(e.target.value)}
                  className="input-field text-sm"
                />
                <input
                  placeholder="Calories (kcal)"
                  type="number"
                  value={customCal}
                  onChange={(e) => setCustomCal(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
              <button
                onClick={handleCustomAdd}
                disabled={!customName.trim()}
                className="w-full btn-primary py-2 text-sm disabled:opacity-40"
              >
                Add to {slot}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MacroCard({ label, value, goal, unit, pct, color }) {
  const colorMap = {
    amber: { bar: '#f59e0b', text: 'text-amber-400' },
    orange: { bar: '#f97316', text: 'text-orange-400' },
  }
  const c = colorMap[color]
  return (
    <div className="card overflow-hidden">
      <div className="h-1 w-full -mx-4 -mt-4 mb-3" style={{ width: 'calc(100% + 2rem)' }}>
        <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: c.bar }} />
      </div>
      <div className="text-xs text-zinc-400">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${c.text}`}>
        {value} <span className="text-sm font-normal text-zinc-400">{unit}</span>
      </div>
      <div className="text-xs text-zinc-400 mt-1">Goal: {goal} {unit}</div>
    </div>
  )
}
