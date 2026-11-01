// Pure nutrition arithmetic, kept out of the store so it can be tested directly.

// Meal slot used by the Dashboard protein slider. Holding the slider's value
// inside `meals` is what keeps the meal diary the single writer of
// protein/calories — two writers is what made the slider silently stop working.
export const QUICK_ADD_SLOT = 'Quick add'

export function mealTotals(meals) {
  const foods = Object.values(meals || {}).flat()
  return {
    protein: Math.round(foods.reduce((s, f) => s + (Number(f?.protein) || 0), 0)),
    calories: Math.round(foods.reduce((s, f) => s + (Number(f?.cal) || 0), 0)),
  }
}

// The Dashboard slider expresses the day's TOTAL protein, which is also what it
// displays. Anything above what the diary already accounts for is parked in a
// single Quick add item, so the displayed number is always explainable and the
// diary's own entries are never touched.
// Scale a food's macros for a portion multiplier, keeping the name honest
// about what was actually logged.
export function scaleFood(food, multiplier) {
  const p = Number(food?.protein) || 0
  const c = Number(food?.cal) || 0
  if (!multiplier || multiplier === 1) return { name: food.name, protein: p, cal: c }
  return {
    name: `${food.name} × ${multiplier}`,
    protein: Math.round(p * multiplier * 10) / 10,
    cal: Math.round(c * multiplier),
  }
}

export function withTotalProtein(meals, totalGrams) {
  const rest = { ...(meals || {}) }
  delete rest[QUICK_ADD_SLOT]
  const fromDiary = mealTotals(rest).protein
  const extra = Math.max(0, Math.round(Number(totalGrams) || 0) - fromDiary)
  return extra > 0
    ? { ...rest, [QUICK_ADD_SLOT]: [{ name: QUICK_ADD_SLOT, protein: extra, cal: 0 }] }
    : rest
}
