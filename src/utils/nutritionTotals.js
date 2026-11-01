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
export function withTotalProtein(meals, totalGrams) {
  const rest = { ...(meals || {}) }
  delete rest[QUICK_ADD_SLOT]
  const fromDiary = mealTotals(rest).protein
  const extra = Math.max(0, Math.round(Number(totalGrams) || 0) - fromDiary)
  return extra > 0
    ? { ...rest, [QUICK_ADD_SLOT]: [{ name: QUICK_ADD_SLOT, protein: extra, cal: 0 }] }
    : rest
}
