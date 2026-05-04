export const WORKOUT_DAYS = [
  {
    id: 'push_a',
    name: 'Push A',
    subtitle: 'Chest Dominant',
    type: 'push',
    dayNum: 1,
    color: 'red',
    colorClasses: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      badge: 'bg-red-500/20 text-red-300',
      dot: 'bg-red-500',
    },
    exercises: [
      { name: 'Incline DB Press', sets: 4, repRange: '6–10', rpe: 8, restSec: 150 },
      { name: 'Flat DB Press', sets: 3, repRange: '8–12', rpe: 8, restSec: 150 },
      { name: 'DB Shoulder Press', sets: 3, repRange: '6–10', rpe: 8, restSec: 120 },
      { name: 'DB Lateral Raises', sets: 3, repRange: '12–15', rpe: 9, restSec: 90 },
      { name: 'Overhead DB Triceps Extension', sets: 3, repRange: '10–15', rpe: 9, restSec: 90 },
    ],
  },
  {
    id: 'pull_a',
    name: 'Pull A',
    subtitle: 'Back & Thickness',
    type: 'pull',
    dayNum: 2,
    color: 'blue',
    colorClasses: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-300',
      dot: 'bg-blue-500',
    },
    exercises: [
      { name: 'One-Arm DB Row', sets: 4, repRange: '8–12', rpe: 8, restSec: 150 },
      { name: 'Band Lat Pulldown', sets: 3, repRange: '10–15', rpe: 8, restSec: 120 },
      { name: 'Incline DB Curl', sets: 3, repRange: '8–12', rpe: 9, restSec: 90 },
      { name: 'Rear Delt Fly', sets: 3, repRange: '12–15', rpe: 9, restSec: 90 },
      { name: 'Hammer Curl', sets: 2, repRange: '10–12', rpe: 9, restSec: 90 },
    ],
  },
  {
    id: 'legs_a',
    name: 'Legs A',
    subtitle: 'Quad & Hamstring',
    type: 'legs',
    dayNum: 3,
    color: 'emerald',
    colorClasses: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300',
      dot: 'bg-emerald-500',
    },
    exercises: [
      { name: 'Bulgarian Split Squat', sets: 4, repRange: '8–12', rpe: 8, restSec: 180 },
      { name: 'DB Romanian Deadlift', sets: 4, repRange: '8–12', rpe: 8, restSec: 180 },
      { name: 'Goblet Squat', sets: 3, repRange: '10–15', rpe: 8, restSec: 120 },
      { name: 'Standing Calf Raises', sets: 4, repRange: '12–20', rpe: 9, restSec: 75 },
    ],
  },
  {
    id: 'rest',
    name: 'Rest',
    subtitle: 'Active Recovery',
    type: 'rest',
    dayNum: 4,
    color: 'zinc',
    colorClasses: {
      bg: 'bg-zinc-500/10',
      border: 'border-zinc-500/30',
      text: 'text-zinc-400',
      badge: 'bg-zinc-500/20 text-zinc-300',
      dot: 'bg-zinc-500',
    },
    exercises: [],
  },
  {
    id: 'push_b',
    name: 'Push B',
    subtitle: 'Shoulder Dominant',
    type: 'push',
    dayNum: 5,
    color: 'red',
    colorClasses: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      badge: 'bg-red-500/20 text-red-300',
      dot: 'bg-red-500',
    },
    exercises: [
      { name: 'DB Shoulder Press', sets: 4, repRange: '6–10', rpe: 8, restSec: 150 },
      { name: 'Incline DB Press', sets: 3, repRange: '10–12', rpe: 8, restSec: 120 },
      { name: 'DB Lateral Raises', sets: 4, repRange: '12–15', rpe: 9, restSec: 75 },
      { name: 'DB Front Raises', sets: 2, repRange: '12–15', rpe: 8, restSec: 75 },
      { name: 'Diamond Push-Ups', sets: 3, repRange: '10–15', rpe: 8, restSec: 90 },
      { name: 'Overhead DB Triceps Extension', sets: 3, repRange: '10–15', rpe: 9, restSec: 90 },
    ],
  },
  {
    id: 'pull_b',
    name: 'Pull B',
    subtitle: 'Width & Bicep Peak',
    type: 'pull',
    dayNum: 6,
    color: 'blue',
    colorClasses: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-300',
      dot: 'bg-blue-500',
    },
    exercises: [
      { name: 'DB Pullover', sets: 3, repRange: '12–15', rpe: 8, restSec: 120 },
      { name: 'One-Arm DB Row (Supinated)', sets: 3, repRange: '10–12', rpe: 8, restSec: 150 },
      { name: 'Band Lat Pulldown', sets: 3, repRange: '12–15', rpe: 8, restSec: 120 },
      { name: 'Concentration Curl', sets: 3, repRange: '10–12', rpe: 9, restSec: 90 },
      { name: 'Rear Delt Fly', sets: 3, repRange: '12–15', rpe: 9, restSec: 90 },
      { name: 'Band Face Pull', sets: 3, repRange: '15–20', rpe: 8, restSec: 75 },
    ],
  },
  {
    id: 'legs_b',
    name: 'Legs B + Core',
    subtitle: 'Glutes, Calves & Core',
    type: 'legs',
    dayNum: 7,
    color: 'emerald',
    colorClasses: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300',
      dot: 'bg-emerald-500',
    },
    exercises: [
      { name: 'Goblet Squat', sets: 4, repRange: '10–15', rpe: 8, restSec: 150 },
      { name: 'DB Romanian Deadlift', sets: 3, repRange: '10–12', rpe: 8, restSec: 150 },
      { name: 'Reverse Lunges', sets: 3, repRange: '10–12 each', rpe: 8, restSec: 120 },
      { name: 'Standing Calf Raises', sets: 4, repRange: '12–20', rpe: 9, restSec: 75 },
      { name: 'Plank', sets: 3, repRange: '30–60s', rpe: 8, restSec: 60 },
      { name: 'DB Crunch', sets: 3, repRange: '15–20', rpe: 9, restSec: 60 },
    ],
  },
]

export const WORKOUT_CYCLE = ['push_a', 'pull_a', 'legs_a', 'rest', 'push_b', 'pull_b', 'legs_b']

export function getWorkoutById(id) {
  return WORKOUT_DAYS.find((w) => w.id === id)
}

export function getRecommendedWorkout(workoutHistory) {
  const sorted = Object.keys(workoutHistory).sort()
  if (sorted.length === 0) return WORKOUT_DAYS[0]
  const lastId = workoutHistory[sorted[sorted.length - 1]].workoutId
  const lastIdx = WORKOUT_CYCLE.indexOf(lastId)
  const nextIdx = (lastIdx + 1) % WORKOUT_CYCLE.length
  return getWorkoutById(WORKOUT_CYCLE[nextIdx])
}

export const PHASE_INFO = [
  { weeks: '1–4', label: 'Foundation', desc: 'Lock in form, build consistency, slight fat loss begins' },
  { weeks: '5–8', label: 'Strength Push', desc: 'Push intensity hard, slight calorie increase if needed' },
  { weeks: '9–12', label: 'Definition', desc: 'Maintain strength, tighten waist, peak conditioning' },
]
