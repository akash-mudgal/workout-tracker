// Assertions for the nutrition arithmetic — the logic most likely to be wrong
// and least visible when it is. Run with `npm test`.
//
// Deliberately dependency-free: src/utils/nutritionTotals.js imports nothing,
// so plain Node can load it without a bundler or test runner.

import {
  mealTotals, withTotalProtein, scaleFood, QUICK_ADD_SLOT as Q,
} from '../src/utils/nutritionTotals.js'

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

const diary = {
  Breakfast: [{ name: 'Oats', protein: 10, cal: 300 }],
  Lunch: [{ name: 'Dal', protein: 18, cal: 230 }],
}
const oats = { name: 'Oats (80g)', protein: 10, cal: 300 }

group('mealTotals')
check('empty', mealTotals({}), { protein: 0, calories: 0 })
check('null-safe', mealTotals(null), { protein: 0, calories: 0 })
check('sums the diary', mealTotals(diary), { protein: 28, calories: 530 })
check('ignores unusable values', mealTotals({ a: [{ protein: 'x', cal: undefined }] }), { protein: 0, calories: 0 })

group('withTotalProtein — the Dashboard slider sets the DAY TOTAL')
check('above the diary, remainder is parked', withTotalProtein(diary, 100)[Q], [{ name: Q, protein: 72, cal: 0 }])
check('the total really is the slider value', mealTotals(withTotalProtein(diary, 100)).protein, 100)
check('diary entries are untouched', withTotalProtein(diary, 100).Breakfast, diary.Breakfast)
check('below the diary, no quick slot', Object.keys(withTotalProtein(diary, 10)).includes(Q), false)
check('below the diary, the diary total stands', mealTotals(withTotalProtein(diary, 10)).protein, 28)
check('exactly the diary total drops the slot', Object.keys(withTotalProtein(diary, 28)).includes(Q), false)
check('zero clears the slot', Object.keys(withTotalProtein(diary, 0)).includes(Q), false)

group('withTotalProtein — repeated slider drags')
let m = withTotalProtein(diary, 100)
m = withTotalProtein(m, 100)
check('re-applying the same total is stable', mealTotals(m).protein, 100)
check('no slot duplication', m[Q].length, 1)
m = withTotalProtein(m, 150)
check('raising replaces rather than appends', mealTotals(m).protein, 150)
check('still a single quick item', m[Q].length, 1)
m = withTotalProtein(m, 40)
check('lowering recomputes from the diary', mealTotals(m).protein, 40)

group('withTotalProtein — a meal added after using the slider')
const withQuick = withTotalProtein(diary, 100)
const plusSnack = { ...withQuick, Snack: [{ name: 'Whey', protein: 24, cal: 120 }] }
check('total rises by the new food', mealTotals(plusSnack).protein, 124)
check('calories come only from real food', mealTotals(plusSnack).calories, 650)
check('slider works with no meals at all', mealTotals(withTotalProtein({}, 60)).protein, 60)

group('scaleFood — portion multipliers')
check('x1 leaves name and macros alone', scaleFood(oats, 1), { name: 'Oats (80g)', protein: 10, cal: 300 })
check('undefined portion behaves as x1', scaleFood(oats, undefined), { name: 'Oats (80g)', protein: 10, cal: 300 })
check('x2 doubles and labels', scaleFood(oats, 2), { name: 'Oats (80g) × 2', protein: 20, cal: 600 })
check('x0.5 halves and labels', scaleFood(oats, 0.5), { name: 'Oats (80g) × 0.5', protein: 5, cal: 150 })
check('x1.5 rounds protein 1dp, kcal int', scaleFood({ name: 'Dal', protein: 18, cal: 230 }, 1.5), { name: 'Dal × 1.5', protein: 27, cal: 345 })
check('odd halving stays clean', scaleFood({ name: 'Egg', protein: 6, cal: 70 }, 0.5), { name: 'Egg × 0.5', protein: 3, cal: 35 })
check('missing macros never produce NaN', scaleFood({ name: 'Water' }, 2), { name: 'Water × 2', protein: 0, cal: 0 })
check('string macros are coerced', scaleFood({ name: 'X', protein: '12', cal: '100' }, 2), { name: 'X × 2', protein: 24, cal: 200 })

group('scaled foods interoperate with the quick-add slot')
const scaledDiary = {
  Breakfast: [scaleFood(oats, 1.5)],
  Lunch: [scaleFood({ name: 'Paneer', protein: 18, cal: 265 }, 2)],
}
check('scaled diary total', mealTotals(scaledDiary), { protein: 51, calories: 980 })
check('remainder parks on top of a scaled diary', mealTotals(withTotalProtein(scaledDiary, 100)).protein, 100)
check('scaled rows survive a slider drag', withTotalProtein(scaledDiary, 100).Breakfast, scaledDiary.Breakfast)
check('clamps to the scaled diary floor', mealTotals(withTotalProtein(scaledDiary, 10)).protein, 51)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
