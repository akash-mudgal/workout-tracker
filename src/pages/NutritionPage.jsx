import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useStore } from '../store.jsx'

const CALORIE_GOAL = 2100
const TODAY = format(new Date(), 'yyyy-MM-dd')
const MEALS_KEY = `wt_meals_${TODAY}`

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

export default function NutritionPage() {
  const { todayLog, updateTodayLog, proteinGoal } = useStore()
  const [meals, setMeals] = useState(() => {
    const stored = localStorage.getItem(MEALS_KEY)
    if (stored) {
      try { return JSON.parse(stored) } catch { /* noop */ }
    }
    return MEAL_SLOTS.reduce((acc, m) => ({ ...acc, [m]: [] }), {})
  })
  const [activeMeal, setActiveMeal] = useState(null)
  const [customProtein, setCustomProtein] = useState('')
  const [customCal, setCustomCal] = useState('')
  const [customName, setCustomName] = useState('')

  // Sync totals to store whenever meals change (covers mount + every add/remove).
  // Uses meals as the single source of truth for protein and calories.
  useEffect(() => {
    const allFoods = Object.values(meals).flat()
    updateTodayLog({
      protein: Math.round(allFoods.reduce((s, f) => s + f.protein, 0)),
      calories: Math.round(allFoods.reduce((s, f) => s + f.cal, 0)),
    })
  }, [meals]) // eslint-disable-line react-hooks/exhaustive-deps

  const protein = todayLog.protein
  const calories = todayLog.calories || 0

  function addFood(mealSlot, food) {
    setMeals((prev) => {
      const next = { ...prev, [mealSlot]: [...(prev[mealSlot] || []), food] }
      localStorage.setItem(MEALS_KEY, JSON.stringify(next))
      return next
    })
  }

  function removeFood(mealSlot, idx) {
    setMeals((prev) => {
      const next = { ...prev, [mealSlot]: prev[mealSlot].filter((_, i) => i !== idx) }
      localStorage.setItem(MEALS_KEY, JSON.stringify(next))
      return next
    })
  }

  function addCustom(mealSlot) {
    if (!customProtein && !customCal) return
    addFood(mealSlot, {
      name: customName || 'Custom',
      protein: +customProtein || 0,
      cal: +customCal || 0,
    })
    setCustomName('')
    setCustomProtein('')
    setCustomCal('')
  }

  const proteinPct = Math.min((protein / proteinGoal) * 100, 100)
  const calPct = Math.min((calories / CALORIE_GOAL) * 100, 100)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nutrition</h1>

      {/* Macro Overview */}
      <div className="grid grid-cols-2 gap-3">
        <MacroCard label="Protein" value={protein} goal={proteinGoal} unit="g" pct={proteinPct} color="amber" icon="🥩" />
        <MacroCard label="Calories" value={calories} goal={CALORIE_GOAL} unit="kcal" pct={calPct} color="orange" icon="🔥" />
      </div>

      {/* Meal Log */}
      {MEAL_SLOTS.map((slot) => (
        <div key={slot} className="card space-y-2">
          <button
            className="w-full flex items-center justify-between"
            onClick={() => setActiveMeal(activeMeal === slot ? null : slot)}
          >
            <span className="font-semibold text-sm text-white">{slot}</span>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              {meals[slot]?.length > 0 && (
                <span>{meals[slot].reduce((s, f) => s + f.protein, 0)}g protein</span>
              )}
              <span>{activeMeal === slot ? '▲' : '▼'}</span>
            </div>
          </button>

          {meals[slot]?.length > 0 && (
            <div className="space-y-1">
              {meals[slot].map((food, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl px-3 py-1.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-xs text-zinc-300">{food.name}</span>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span>{food.protein}g · {food.cal} kcal</span>
                    <button
                      onClick={() => removeFood(slot, i)}
                      className="text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeMeal === slot && (
            <div className="space-y-2 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {QUICK_FOODS.map((food) => (
                  <button
                    key={food.name}
                    onClick={() => addFood(slot, food)}
                    className="text-left rounded-xl px-2.5 py-2 transition-all hover:border-white/20"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="text-xs font-medium text-zinc-200 leading-tight">{food.name}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">{food.protein}g · {food.cal} kcal</div>
                  </button>
                ))}
              </div>

              <div className="pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-xs text-zinc-400 mb-1.5">Custom item</div>
                <div className="flex gap-1.5">
                  <input
                    placeholder="Name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="input-field text-xs py-1.5 flex-1"
                  />
                  <input
                    placeholder="Protein (g)"
                    type="number"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value)}
                    className="input-field text-xs py-1.5 w-24"
                  />
                  <input
                    placeholder="kcal"
                    type="number"
                    value={customCal}
                    onChange={(e) => setCustomCal(e.target.value)}
                    className="input-field text-xs py-1.5 w-20"
                  />
                  <button onClick={() => addCustom(slot)} className="btn-ghost text-xs px-3">Add</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Protein guide */}
      <div className="card space-y-2" style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)' }}>
        <h3 className="text-sm font-semibold text-amber-400">Protein Sources (Veg)</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-400">
          <span>Soya chunks · 52g/100g</span>
          <span>Paneer · 18g/100g</span>
          <span>Dal · 18g/cup</span>
          <span>Curd · 7g/200g</span>
          <span>Milk · 8g/250ml</span>
          <span>Whey · 24g/scoop</span>
        </div>
      </div>
    </div>
  )
}

function MacroCard({ label, value, goal, unit, pct, color, icon }) {
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
      <div className="text-xs text-zinc-400">{icon} {label}</div>
      <div className={`text-2xl font-bold mt-1 ${c.text}`}>
        {value} <span className="text-sm font-normal text-zinc-400">{unit}</span>
      </div>
      <div className="text-xs text-zinc-400 mt-1">Goal: {goal} {unit}</div>
    </div>
  )
}
