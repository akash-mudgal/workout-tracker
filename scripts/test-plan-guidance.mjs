// Assertions for plan recommendation and the "is this plan fitting your week?"
// check-in. Run with `npm test`.
//
// src/utils/planGuidance.js imports nothing, and plans are passed in, so the
// real plan data is read here with fs rather than a JSON import.

import fs from 'node:fs'
import { recommendPlan, planCheckIn } from '../src/utils/planGuidance.js'

const PLANS = JSON.parse(fs.readFileSync(new URL('../src/data/plans.json', import.meta.url), 'utf8'))

let pass = 0
let fail = 0

function check(name, actual, expected) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a === e) {
    pass++
    console.log(`  ok   ${name}`)
  } else {
    fail++
    console.log(`  FAIL ${name}\n       expected ${e}\n       actual   ${a}`)
  }
}

function group(name) { console.log(`\n${name}`) }

const addDays = (s, n) => new Date(new Date(s + 'T12:00:00Z').getTime() + n * 86400000).toISOString().slice(0, 10)

// Log a workout on every planned training day of `planId` from `start` up to
// (not including) `today`, keeping only every `keepEvery`-th one.
function history(planId, start, today, keepEvery = 1) {
  const cycle = PLANS[planId].cycle
  const h = {}
  let n = 0
  for (let d = start; d < today; d = addDays(d, 1)) {
    const offset = Math.round((new Date(d + 'T12:00:00Z') - new Date(start + 'T12:00:00Z')) / 86400000)
    if (cycle[offset % cycle.length] === 'rest') continue
    if (n++ % keepEvery === 0) h[d] = { date: d, workoutId: cycle[offset % cycle.length] }
  }
  return h
}

group('recommendPlan')
check('gym 3', recommendPlan(PLANS, { equipment: 'gym', days: '3' })?.planId, 'gym_full_body')
check('gym 4', recommendPlan(PLANS, { equipment: 'gym', days: '4' })?.planId, 'gym_upper_lower')
check('gym 5-6', recommendPlan(PLANS, { equipment: 'gym', days: '5-6' })?.planId, 'gym_ppl')
check('home 3', recommendPlan(PLANS, { equipment: 'home', days: '3' })?.planId, 'full_body')
check('home 4', recommendPlan(PLANS, { equipment: 'home', days: '4' })?.planId, 'upper_lower')
check('home 5-6', recommendPlan(PLANS, { equipment: 'home', days: '5-6' })?.planId, 'ppl')
check('unanswered → null', recommendPlan(PLANS, { equipment: 'gym' }), null)
check('has a reason', typeof recommendPlan(PLANS, { equipment: 'gym', days: '4' })?.reason, 'string')

group('planCheckIn')
const start = '2026-10-01'
const ppl = { startDate: start, planId: 'gym_ppl' }

check('null before day 14',
  planCheckIn(PLANS, ppl, {}, addDays(start, 10)), null)

check('null when every planned day is trained',
  planCheckIn(PLANS, ppl, history('gym_ppl', start, addDays(start, 30)), addDays(start, 30)), null)

const missing = planCheckIn(PLANS, ppl, history('gym_ppl', start, addDays(start, 30), 3), addDays(start, 30))
check('2 of 6 a week → suggests a lighter gym plan', missing?.suggestion?.planId, 'gym_full_body')
check('per-week figure', missing?.perWeek, 2)

const half = planCheckIn(PLANS, ppl, history('gym_ppl', start, addDays(start, 30), 2), addDays(start, 30))
check('3 of 6 a week → full body', half?.suggestion?.planId, 'gym_full_body')

const homePpl = { startDate: start, planId: 'ppl' }
const homeSuggest = planCheckIn(PLANS, homePpl, history('ppl', start, addDays(start, 30), 3), addDays(start, 30))
check('stays within the same equipment group', PLANS[homeSuggest?.suggestion?.planId]?.equipment, 'home')

check('null when already on the lightest plan',
  planCheckIn(PLANS, { startDate: start, planId: 'gym_full_body' }, {}, addDays(start, 30)), null)

// A busy history from a previous cycle must not count toward this one.
const prevCycle = history('gym_ppl', addDays(start, -60), start)
check('ignores history from before the cycle started',
  planCheckIn(PLANS, ppl, prevCycle, addDays(start, 15))?.suggestion?.planId, 'gym_full_body')

check('today does not count as missed',
  planCheckIn(PLANS, ppl, history('gym_ppl', start, addDays(start, 21)), addDays(start, 21)), null)

console.log(`\n${pass} passed, ${fail} failed`)
if (fail) process.exit(1)
