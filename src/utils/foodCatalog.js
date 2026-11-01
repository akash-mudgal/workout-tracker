import { supabase } from '../lib/supabase'

// The catalog the app ships with. It seeds a new user's own `foods` table on
// first run, and is also the fallback if the table isn't reachable.
export const SEED_FOODS = [
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

const FOODS_CACHE = 'wt_food_catalog'
const TEMPLATES_CACHE = 'wt_meal_templates'

function readCache(key, def) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : def
  } catch { return def }
}

function writeCache(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
}

// The catalog tables are added by a migration. If that hasn't been applied yet
// the app still has to work, so a missing table degrades to the cached/seed
// list rather than erroring — and, importantly, suppresses further writes so
// the user isn't shown repeated failures for something they can't act on.
function isMissingTable(error) {
  const code = error?.code
  if (code === '42P01' || code === 'PGRST205' || code === 'PGRST204') return true
  return /does not exist|schema cache/i.test(error?.message || '')
}

// DB row -> the shape the food diary already uses ({ name, protein, cal }).
function rowToFood(r) {
  return {
    id: r.id,
    name: r.name,
    protein: Number(r.protein_g) || 0,
    cal: Number(r.kcal) || 0,
    useCount: r.use_count ?? 0,
  }
}

export async function loadCatalog(userId) {
  const cached = readCache(FOODS_CACHE, null)
  if (!userId) return { foods: cached ?? SEED_FOODS, available: false }

  const { data, error } = await supabase
    .from('foods')
    .select('id, name, protein_g, kcal, use_count, last_used_at')
    .eq('user_id', userId)
    .order('use_count', { ascending: false })
    .order('last_used_at', { ascending: false, nullsFirst: false })

  if (error) {
    if (!isMissingTable(error)) {
      console.error('[kinetiq] food catalog load failed:', error.message, error)
    }
    return { foods: cached ?? SEED_FOODS, available: false }
  }

  if (!data.length) return { foods: await seedCatalog(userId), available: true }

  const foods = data.map(rowToFood)
  writeCache(FOODS_CACHE, foods)
  return { foods, available: true }
}

async function seedCatalog(userId) {
  const rows = SEED_FOODS.map((f) => ({
    user_id: userId, name: f.name, protein_g: f.protein, kcal: f.cal,
  }))
  const { data, error } = await supabase
    .from('foods')
    .upsert(rows, { onConflict: 'user_id,name' })
    .select('id, name, protein_g, kcal, use_count, last_used_at')

  if (error) {
    console.error('[kinetiq] food catalog seed failed:', error.message, error)
    return SEED_FOODS
  }
  const foods = data.map(rowToFood)
  writeCache(FOODS_CACHE, foods)
  return foods
}

// Called both when a catalog item is tapped and when a new food is typed, so a
// food is never entered twice and the list reorders around what's actually eaten.
// Single user, so computing the next count client-side is fine.
export async function rememberFood(userId, food, currentUseCount = 0) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('foods')
    .upsert({
      user_id: userId,
      name: food.name,
      protein_g: food.protein ?? 0,
      kcal: food.cal ?? 0,
      use_count: currentUseCount + 1,
      last_used_at: new Date().toISOString(),
    }, { onConflict: 'user_id,name' })
    .select('id, name, protein_g, kcal, use_count, last_used_at')
    .single()

  if (error) {
    if (!isMissingTable(error)) {
      console.error('[kinetiq] remembering food failed:', error.message, error)
    }
    return null
  }
  return rowToFood(data)
}

export async function removeFoodFromCatalog(userId, name) {
  if (!userId) return
  const { error } = await supabase.from('foods').delete().eq('user_id', userId).eq('name', name)
  if (error && !isMissingTable(error)) {
    console.error('[kinetiq] removing food failed:', error.message, error)
  }
}

// ── Saved meals ───────────────────────────────────────────────────────────────

export async function loadTemplates(userId) {
  const cached = readCache(TEMPLATES_CACHE, null)
  if (!userId) return { templates: cached ?? [], available: false }

  const { data, error } = await supabase
    .from('meal_templates')
    .select('id, name, slot, items')
    .eq('user_id', userId)
    .order('name')

  if (error) {
    if (!isMissingTable(error)) {
      console.error('[kinetiq] saved meals load failed:', error.message, error)
    }
    return { templates: cached ?? [], available: false }
  }
  writeCache(TEMPLATES_CACHE, data)
  return { templates: data, available: true }
}

export async function saveTemplate(userId, name, slot, items) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('meal_templates')
    .upsert({ user_id: userId, name, slot, items }, { onConflict: 'user_id,name' })
    .select('id, name, slot, items')
    .single()

  if (error) {
    if (!isMissingTable(error)) {
      console.error('[kinetiq] saving a meal failed:', error.message, error)
    }
    return null
  }
  return data
}

export async function removeTemplate(userId, id) {
  if (!userId) return
  const { error } = await supabase.from('meal_templates').delete().eq('user_id', userId).eq('id', id)
  if (error && !isMissingTable(error)) {
    console.error('[kinetiq] deleting a saved meal failed:', error.message, error)
  }
}
