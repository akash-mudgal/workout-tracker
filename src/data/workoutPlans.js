// ─── Shared color palettes ────────────────────────────────────────────────────
const COLORS = {
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300', dot: 'bg-red-500' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300', dot: 'bg-blue-500' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300', dot: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300', dot: 'bg-amber-500' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', badge: 'bg-violet-500/20 text-violet-300', dot: 'bg-violet-500' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300', dot: 'bg-orange-500' },
  zinc: { bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-400', badge: 'bg-zinc-500/20 text-zinc-300', dot: 'bg-zinc-500' },
}

const REST_DAY = { id: 'rest', name: 'Rest', subtitle: 'Active Recovery', type: 'rest', colorClasses: COLORS.zinc, exercises: [] }

// ─── Plan: Push / Pull / Legs ─────────────────────────────────────────────────
const PPL_DAYS = {
  push_a: {
    id: 'push_a', name: 'Push A', subtitle: 'Chest Dominant', type: 'push', colorClasses: COLORS.red,
    exercises: [
      { name: 'Incline DB Press',               sets: 4, repRange: '6–10',  rpe: 8, restSec: 150 },
      { name: 'Flat DB Press',                  sets: 3, repRange: '8–12',  rpe: 8, restSec: 150 },
      { name: 'DB Shoulder Press',              sets: 3, repRange: '6–10',  rpe: 8, restSec: 120 },
      { name: 'DB Lateral Raises',              sets: 3, repRange: '12–15', rpe: 9, restSec: 90 },
      { name: 'Overhead DB Triceps Extension',  sets: 3, repRange: '10–15', rpe: 9, restSec: 90 },
    ],
  },
  pull_a: {
    id: 'pull_a', name: 'Pull A', subtitle: 'Back & Thickness', type: 'pull', colorClasses: COLORS.blue,
    exercises: [
      { name: 'One-Arm DB Row',       sets: 4, repRange: '8–12',  rpe: 8, restSec: 150 },
      { name: 'Band Lat Pulldown',    sets: 3, repRange: '10–15', rpe: 8, restSec: 120 },
      { name: 'Incline DB Curl',      sets: 3, repRange: '8–12',  rpe: 9, restSec: 90 },
      { name: 'Rear Delt Fly',        sets: 3, repRange: '12–15', rpe: 9, restSec: 90 },
      { name: 'Hammer Curl',          sets: 2, repRange: '10–12', rpe: 9, restSec: 90 },
    ],
  },
  legs_a: {
    id: 'legs_a', name: 'Legs A', subtitle: 'Quad & Hamstring', type: 'legs', colorClasses: COLORS.emerald,
    exercises: [
      { name: 'Bulgarian Split Squat',  sets: 4, repRange: '8–12',  rpe: 8, restSec: 180 },
      { name: 'DB Romanian Deadlift',   sets: 4, repRange: '8–12',  rpe: 8, restSec: 180 },
      { name: 'Goblet Squat',           sets: 3, repRange: '10–15', rpe: 8, restSec: 120 },
      { name: 'Standing Calf Raises',   sets: 4, repRange: '12–20', rpe: 9, restSec: 75 },
    ],
  },
  push_b: {
    id: 'push_b', name: 'Push B', subtitle: 'Shoulder Dominant', type: 'push', colorClasses: COLORS.red,
    exercises: [
      { name: 'DB Shoulder Press',             sets: 4, repRange: '6–10',  rpe: 8, restSec: 150 },
      { name: 'Incline DB Press',              sets: 3, repRange: '10–12', rpe: 8, restSec: 120 },
      { name: 'DB Lateral Raises',             sets: 4, repRange: '12–15', rpe: 9, restSec: 75 },
      { name: 'DB Front Raises',               sets: 2, repRange: '12–15', rpe: 8, restSec: 75 },
      { name: 'Diamond Push-Ups',              sets: 3, repRange: '10–15', rpe: 8, restSec: 90 },
      { name: 'Overhead DB Triceps Extension', sets: 3, repRange: '10–15', rpe: 9, restSec: 90 },
    ],
  },
  pull_b: {
    id: 'pull_b', name: 'Pull B', subtitle: 'Width & Bicep Peak', type: 'pull', colorClasses: COLORS.blue,
    exercises: [
      { name: 'DB Pullover',                   sets: 3, repRange: '12–15', rpe: 8, restSec: 120 },
      { name: 'One-Arm DB Row (Supinated)',     sets: 3, repRange: '10–12', rpe: 8, restSec: 150 },
      { name: 'Band Lat Pulldown',             sets: 3, repRange: '12–15', rpe: 8, restSec: 120 },
      { name: 'Concentration Curl',            sets: 3, repRange: '10–12', rpe: 9, restSec: 90 },
      { name: 'Rear Delt Fly',                 sets: 3, repRange: '12–15', rpe: 9, restSec: 90 },
      { name: 'Band Face Pull',                sets: 3, repRange: '15–20', rpe: 8, restSec: 75 },
    ],
  },
  legs_b: {
    id: 'legs_b', name: 'Legs B + Core', subtitle: 'Glutes, Calves & Core', type: 'legs', colorClasses: COLORS.emerald,
    exercises: [
      { name: 'Goblet Squat',           sets: 4, repRange: '10–15',     rpe: 8, restSec: 150 },
      { name: 'DB Romanian Deadlift',   sets: 3, repRange: '10–12',     rpe: 8, restSec: 150 },
      { name: 'Reverse Lunges',         sets: 3, repRange: '10–12 each',rpe: 8, restSec: 120 },
      { name: 'Standing Calf Raises',   sets: 4, repRange: '12–20',     rpe: 9, restSec: 75 },
      { name: 'Plank',                  sets: 3, repRange: '30–60s',    rpe: 8, restSec: 60 },
      { name: 'DB Crunch',              sets: 3, repRange: '15–20',     rpe: 9, restSec: 60 },
    ],
  },
  rest: REST_DAY,
}

// ─── Plan: Upper / Lower ──────────────────────────────────────────────────────
const UL_DAYS = {
  upper_a: {
    id: 'upper_a', name: 'Upper A', subtitle: 'Horizontal Push & Pull', type: 'push', colorClasses: COLORS.violet,
    exercises: [
      { name: 'Flat DB Press',        sets: 4, repRange: '8–12',  rpe: 8, restSec: 150 },
      { name: 'One-Arm DB Row',       sets: 4, repRange: '8–12',  rpe: 8, restSec: 150 },
      { name: 'Incline DB Press',     sets: 3, repRange: '10–12', rpe: 8, restSec: 120 },
      { name: 'Band Lat Pulldown',    sets: 3, repRange: '12–15', rpe: 8, restSec: 120 },
      { name: 'DB Shoulder Press',    sets: 3, repRange: '8–12',  rpe: 8, restSec: 120 },
      { name: 'DB Lateral Raises',    sets: 3, repRange: '12–15', rpe: 9, restSec: 75 },
    ],
  },
  lower_a: {
    id: 'lower_a', name: 'Lower A', subtitle: 'Quad Dominant', type: 'legs', colorClasses: COLORS.emerald,
    exercises: [
      { name: 'Bulgarian Split Squat', sets: 4, repRange: '8–12',      rpe: 8, restSec: 180 },
      { name: 'DB Romanian Deadlift',  sets: 3, repRange: '10–12',     rpe: 8, restSec: 150 },
      { name: 'Goblet Squat',          sets: 3, repRange: '12–15',     rpe: 8, restSec: 120 },
      { name: 'Reverse Lunges',        sets: 3, repRange: '10–12 each',rpe: 8, restSec: 120 },
      { name: 'Standing Calf Raises',  sets: 4, repRange: '15–20',     rpe: 9, restSec: 75 },
    ],
  },
  upper_b: {
    id: 'upper_b', name: 'Upper B', subtitle: 'Vertical Pull & Arms', type: 'pull', colorClasses: COLORS.blue,
    exercises: [
      { name: 'DB Pullover',                   sets: 3, repRange: '12–15', rpe: 8, restSec: 120 },
      { name: 'One-Arm DB Row (Supinated)',     sets: 3, repRange: '10–12', rpe: 8, restSec: 150 },
      { name: 'Incline DB Curl',               sets: 3, repRange: '10–12', rpe: 9, restSec: 90 },
      { name: 'Hammer Curl',                   sets: 3, repRange: '10–12', rpe: 9, restSec: 90 },
      { name: 'Overhead DB Triceps Extension', sets: 3, repRange: '12–15', rpe: 9, restSec: 90 },
      { name: 'Rear Delt Fly',                 sets: 3, repRange: '15–20', rpe: 9, restSec: 75 },
    ],
  },
  lower_b: {
    id: 'lower_b', name: 'Lower B + Core', subtitle: 'Posterior Chain & Core', type: 'legs', colorClasses: COLORS.emerald,
    exercises: [
      { name: 'DB Romanian Deadlift',  sets: 4, repRange: '8–12',  rpe: 8, restSec: 180 },
      { name: 'Bulgarian Split Squat', sets: 3, repRange: '10–12', rpe: 8, restSec: 150 },
      { name: 'Goblet Squat',          sets: 3, repRange: '12–15', rpe: 8, restSec: 120 },
      { name: 'Standing Calf Raises',  sets: 4, repRange: '15–20', rpe: 9, restSec: 75 },
      { name: 'Plank',                 sets: 3, repRange: '30–60s',rpe: 8, restSec: 60 },
      { name: 'DB Crunch',             sets: 3, repRange: '15–20', rpe: 9, restSec: 60 },
    ],
  },
  rest: REST_DAY,
}

// ─── Plan: Full Body 3× ───────────────────────────────────────────────────────
const FB_DAYS = {
  full_a: {
    id: 'full_a', name: 'Full Body A', subtitle: 'Squat + Horizontal', type: 'push', colorClasses: COLORS.amber,
    exercises: [
      { name: 'Goblet Squat',       sets: 4, repRange: '8–12',  rpe: 8, restSec: 150 },
      { name: 'Flat DB Press',      sets: 3, repRange: '10–12', rpe: 8, restSec: 120 },
      { name: 'One-Arm DB Row',     sets: 3, repRange: '10–12', rpe: 8, restSec: 120 },
      { name: 'DB Shoulder Press',  sets: 3, repRange: '10–12', rpe: 8, restSec: 120 },
      { name: 'DB Lateral Raises',  sets: 2, repRange: '15–20', rpe: 8, restSec: 75 },
    ],
  },
  full_b: {
    id: 'full_b', name: 'Full Body B', subtitle: 'Hinge + Vertical', type: 'pull', colorClasses: COLORS.amber,
    exercises: [
      { name: 'DB Romanian Deadlift', sets: 4, repRange: '8–12',  rpe: 8, restSec: 150 },
      { name: 'Incline DB Press',     sets: 3, repRange: '10–12', rpe: 8, restSec: 120 },
      { name: 'Band Lat Pulldown',    sets: 3, repRange: '12–15', rpe: 8, restSec: 120 },
      { name: 'DB Shoulder Press',    sets: 3, repRange: '10–12', rpe: 8, restSec: 120 },
      { name: 'Incline DB Curl',      sets: 3, repRange: '10–12', rpe: 9, restSec: 90 },
      { name: 'Standing Calf Raises', sets: 3, repRange: '15–20', rpe: 9, restSec: 75 },
    ],
  },
  full_c: {
    id: 'full_c', name: 'Full Body C', subtitle: 'Lunge + Arms + Core', type: 'legs', colorClasses: COLORS.amber,
    exercises: [
      { name: 'Bulgarian Split Squat',         sets: 3, repRange: '10–12',     rpe: 8, restSec: 150 },
      { name: 'DB Pullover',                   sets: 3, repRange: '12–15',     rpe: 8, restSec: 120 },
      { name: 'Overhead DB Triceps Extension', sets: 3, repRange: '12–15',     rpe: 9, restSec: 90 },
      { name: 'Hammer Curl',                   sets: 3, repRange: '10–12',     rpe: 9, restSec: 90 },
      { name: 'Reverse Lunges',                sets: 3, repRange: '10–12 each',rpe: 8, restSec: 120 },
      { name: 'Plank',                         sets: 3, repRange: '30–60s',    rpe: 8, restSec: 60 },
    ],
  },
  rest: REST_DAY,
}

// ─── Plan: Bro Split ─────────────────────────────────────────────────────────
const BROSPLIT_DAYS = {
  chest: {
    id: 'chest', name: 'Chest', subtitle: 'Chest & Triceps', type: 'push', colorClasses: COLORS.red,
    exercises: [
      { name: 'Incline DB Press',              sets: 4, repRange: '6–10',  rpe: 8, restSec: 150 },
      { name: 'Flat DB Press',                 sets: 4, repRange: '8–12',  rpe: 8, restSec: 150 },
      { name: 'DB Fly',                        sets: 3, repRange: '12–15', rpe: 9, restSec: 90 },
      { name: 'Push-Ups',                      sets: 3, repRange: 'Max',   rpe: 8, restSec: 90 },
      { name: 'Overhead DB Triceps Extension', sets: 3, repRange: '12–15', rpe: 9, restSec: 90 },
    ],
  },
  back: {
    id: 'back', name: 'Back', subtitle: 'Back & Rear Delts', type: 'pull', colorClasses: COLORS.blue,
    exercises: [
      { name: 'One-Arm DB Row',            sets: 4, repRange: '8–12',  rpe: 8, restSec: 150 },
      { name: 'Band Lat Pulldown',         sets: 4, repRange: '10–15', rpe: 8, restSec: 120 },
      { name: 'DB Pullover',               sets: 3, repRange: '12–15', rpe: 8, restSec: 120 },
      { name: 'One-Arm DB Row (Supinated)',sets: 3, repRange: '10–12', rpe: 8, restSec: 150 },
      { name: 'Rear Delt Fly',             sets: 3, repRange: '15–20', rpe: 9, restSec: 75 },
    ],
  },
  shoulders: {
    id: 'shoulders', name: 'Shoulders', subtitle: 'All Three Heads', type: 'push', colorClasses: COLORS.orange,
    exercises: [
      { name: 'DB Shoulder Press', sets: 4, repRange: '8–12',  rpe: 8, restSec: 150 },
      { name: 'DB Lateral Raises', sets: 4, repRange: '12–15', rpe: 9, restSec: 75 },
      { name: 'DB Front Raises',   sets: 3, repRange: '12–15', rpe: 8, restSec: 75 },
      { name: 'Rear Delt Fly',     sets: 3, repRange: '15–20', rpe: 9, restSec: 75 },
      { name: 'Band Face Pull',    sets: 3, repRange: '15–20', rpe: 8, restSec: 75 },
    ],
  },
  arms: {
    id: 'arms', name: 'Arms', subtitle: 'Biceps & Triceps', type: 'pull', colorClasses: COLORS.violet,
    exercises: [
      { name: 'Incline DB Curl',               sets: 3, repRange: '10–12', rpe: 9, restSec: 90 },
      { name: 'Hammer Curl',                   sets: 3, repRange: '10–12', rpe: 9, restSec: 90 },
      { name: 'Concentration Curl',            sets: 3, repRange: '10–12', rpe: 9, restSec: 90 },
      { name: 'Overhead DB Triceps Extension', sets: 3, repRange: '12–15', rpe: 9, restSec: 90 },
      { name: 'Diamond Push-Ups',              sets: 3, repRange: '10–15', rpe: 8, restSec: 90 },
      { name: 'Close-Grip DB Press',           sets: 3, repRange: '10–12', rpe: 8, restSec: 90 },
    ],
  },
  legs: {
    id: 'legs', name: 'Legs', subtitle: 'Full Leg Day + Core', type: 'legs', colorClasses: COLORS.emerald,
    exercises: [
      { name: 'Bulgarian Split Squat', sets: 4, repRange: '8–12',      rpe: 8, restSec: 180 },
      { name: 'DB Romanian Deadlift',  sets: 4, repRange: '8–12',      rpe: 8, restSec: 180 },
      { name: 'Goblet Squat',          sets: 3, repRange: '12–15',     rpe: 8, restSec: 120 },
      { name: 'Reverse Lunges',        sets: 3, repRange: '10–12 each',rpe: 8, restSec: 120 },
      { name: 'Standing Calf Raises',  sets: 4, repRange: '15–20',     rpe: 9, restSec: 75 },
      { name: 'DB Crunch',             sets: 3, repRange: '15–20',     rpe: 9, restSec: 60 },
    ],
  },
  rest: REST_DAY,
}

// ─── Plan: Built With Science Home ───────────────────────────────────────────
// Based on Jeremy Ethier's home transformation program
// 4 days/week · Upper/Lower split · Mon/Tue/Thu/Fri
const BWS_DAYS = {
  bws_upper1: {
    id: 'bws_upper1', name: 'Upper 1', subtitle: 'Chest · Shoulders · Back · Triceps', type: 'push', colorClasses: COLORS.red,
    exercises: [
      {
        name: 'Flat Dumbbell Press', sets: 4, repRange: '8–12', rpe: 8, restSec: 150,
        tip: 'Targets mid and lower chest. Keep a slight arch, drive through the chest not the shoulders. Full stretch at the bottom — let the dumbbells go deep.',
      },
      {
        name: 'Seated Dumbbell Shoulder Press', sets: 4, repRange: '8–12', rpe: 8, restSec: 120,
        tip: 'Tuck elbows at the bottom, then flare slightly on the way up. Avoid pressing straight out wide — that loads the front delt less efficiently and stresses the shoulder joint.',
      },
      {
        name: 'Chest-Supported Dumbbell Row', sets: 4, repRange: '10–12', rpe: 8, restSec: 120,
        tip: 'Lie chest-down on an incline bench. Wide elbow angle targets mid and upper back thickness. Cue: fist directly under elbow. Shrug first, then row — limits bicep takeover.',
      },
      {
        name: 'Lean-In Lateral Raise', sets: 4, repRange: '10–15', rpe: 9, restSec: 75,
        tip: 'Hold a fixed support and lean to one side. This makes the bottom range harder, mimicking a cable — the side delt is loaded throughout the full ROM. Keep a slight bend in the elbow.',
      },
      {
        name: 'Dumbbell Overhead Tricep Extension', sets: 4, repRange: '10–15', rpe: 9, restSec: 90,
        tip: 'Best single tricep exercise — stretches and loads the long head (the bulk of arm size). Keep upper arms close to your head. Full stretch at the bottom is the key stimulus.',
      },
      {
        name: 'Preacher Curl', sets: 3, repRange: '10–15', rpe: 9, restSec: 75,
        tip: 'The bench locks the upper arm and eliminates cheating. Do not curl all the way to the top — stop just before vertical to keep tension on the bicep. The stretched position at the bottom is the key stimulus.',
      },
    ],
  },
  bws_lower1: {
    id: 'bws_lower1', name: 'Lower 1', subtitle: 'Quad Focused', type: 'legs', colorClasses: COLORS.emerald,
    exercises: [
      {
        name: 'Bulgarian Split Squat (Quad Focus)', sets: 4, repRange: '8–12 each', rpe: 8, restSec: 180,
        tip: 'Narrow stance, knee drives forward over the toes. Upright torso. This shifts the load to the quads rather than the glutes. Keep front foot closer to the bench to increase quad stretch.',
      },
      {
        name: 'Dumbbell Romanian Deadlift', sets: 4, repRange: '10–12', rpe: 8, restSec: 150,
        tip: '3-second lowering. Feel the full hamstring stretch at the bottom — that is the stimulus. Hinge at the hips, back flat, dumbbells close to your legs the whole way down.',
      },
      {
        name: 'Heel-Elevated Goblet Squat', sets: 4, repRange: '10–15', rpe: 8, restSec: 120,
        tip: 'Place heels on a weight plate or wedge. This increases quad recruitment by shifting your centre of gravity forward. Keep torso upright and squat as deep as possible.',
      },
      {
        name: 'Single-Leg Weighted Calf Raise', sets: 4, repRange: '12–15 each', rpe: 9, restSec: 60,
        tip: 'Do these on a step for full range — the stretch at the bottom is critical. Lower slowly. Single-leg version loads each calf twice as hard as two-leg raises.',
      },
      {
        name: 'Dead Bug', sets: 3, repRange: '8–10 each side', rpe: 7, restSec: 60,
        tip: 'Lie on your back, arms up, knees at 90°. Lower opposite arm and leg toward the floor while pressing your lower back flat into the ground. Slow and controlled — core stability, not speed.',
      },
    ],
  },
  bws_upper2: {
    id: 'bws_upper2', name: 'Upper 2', subtitle: 'Chest · Back · Shoulders · Triceps', type: 'push', colorClasses: COLORS.violet,
    exercises: [
      {
        name: 'Low Incline Dumbbell Press', sets: 4, repRange: '8–12', rpe: 8, restSec: 150,
        tip: 'Set bench to 15–30 degrees — lower than a standard incline. Hits the upper chest without losing the mid-chest involvement. Arm path aligns with upper chest fibers, not straight up.',
      },
      {
        name: '6-Point Dumbbell Row', sets: 4, repRange: '10–12 each', rpe: 8, restSec: 120,
        tip: 'Place one hand and same-side knee on the bench, other foot wide on the floor. Elbow tight to your side, sweep the arm toward your hip — this targets lat width. Think "wing" not "row".',
      },
      {
        name: 'Dumbbell Lateral Raises', sets: 4, repRange: '12–15', rpe: 9, restSec: 75,
        tip: 'Slight forward lean from the hips. Lead with the elbow, not the hand. Do not shrug — keep traps relaxed. Use a weight where you can feel the side delt burning, not your traps taking over.',
      },
      {
        name: 'Incline Dumbbell Overhead Extension', sets: 4, repRange: '10–15', rpe: 9, restSec: 90,
        tip: 'Lie on an incline bench and extend the dumbbell overhead. The incline increases the stretch on the long head of the tricep at the bottom. Keep upper arms perpendicular to the floor.',
      },
      {
        name: 'Prone Arm Circles', sets: 3, repRange: '10–12', rpe: 7, restSec: 60,
        tip: 'Lie face-down, arms out to the sides. Make slow controlled circles. Strengthens the rotator cuff and rear delts — important for shoulder health and posture when pressing heavy.',
      },
      {
        name: 'Incline Dumbbell Curl', sets: 3, repRange: '10–15', rpe: 9, restSec: 75,
        tip: 'Set bench to 45–60 degrees and let arms hang straight behind you. This pre-stretches the long head of the bicep before the rep starts — one of the highest-stimulus curl variations. Do not let elbows drift forward.',
      },
    ],
  },
  bws_lower2: {
    id: 'bws_lower2', name: 'Lower 2', subtitle: 'Glute Focused', type: 'legs', colorClasses: COLORS.amber,
    exercises: [
      {
        name: 'Bulgarian Split Squat (Glute Focus)', sets: 4, repRange: '8–12 each', rpe: 8, restSec: 180,
        tip: 'Wider stance, torso leaned slightly forward. Drive through the heel. This shifts load to the glutes rather than the quads. Place front foot further from the bench than the quad version.',
      },
      {
        name: 'Single-Leg Weighted Calf Raise', sets: 4, repRange: '12–15 each', rpe: 9, restSec: 60,
        tip: 'Full range on a step — the stretched position at the bottom is what drives calf growth. Slow eccentric (3 seconds down). Hold a dumbbell to add load progressively.',
      },
      {
        name: 'Single-Leg Hip Thrust', sets: 4, repRange: '10–12 each', rpe: 8, restSec: 120,
        tip: 'Upper back on a bench, one foot on the floor, other leg raised. Drive through the heel, squeeze the glute hard at the top. Single-leg keeps the glute from being overshadowed by the quads.',
      },
      {
        name: 'Sliding Hamstring Curl', sets: 3, repRange: '8–12', rpe: 9, restSec: 90,
        tip: 'Lie on your back, feet on a smooth surface (socks on floor or sliders). Bridge up and curl your heels toward your glutes. Isolates the hamstrings at the knee — the part RDLs do not fully train.',
      },
      {
        name: 'Reverse Crunch', sets: 4, repRange: '10–15', rpe: 8, restSec: 60,
        tip: 'Lie flat, legs at 90°. Drive your knees toward your chest by tilting the pelvis — do not just swing the legs. Lower slowly. This targets the lower abs more than standard crunches.',
      },
    ],
  },
  rest: REST_DAY,
}

// ─── Plan registry ────────────────────────────────────────────────────────────
export const PLANS = {
  ppl: {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    description: '6 days/week · 2× frequency per muscle group · Best for muscle gain',
    daysPerWeek: 6,
    accentColor: 'violet',
    cycle: ['push_a', 'pull_a', 'legs_a', 'rest', 'push_b', 'pull_b', 'legs_b'],
    days: PPL_DAYS,
  },
  upper_lower: {
    id: 'upper_lower',
    name: 'Upper / Lower',
    description: '4 days/week · Good recovery · Balanced strength & size',
    daysPerWeek: 4,
    accentColor: 'blue',
    cycle: ['upper_a', 'lower_a', 'rest', 'upper_b', 'lower_b', 'rest', 'rest'],
    days: UL_DAYS,
  },
  full_body: {
    id: 'full_body',
    name: 'Full Body 3×',
    description: '3 days/week · Maximum frequency · Great for beginners',
    daysPerWeek: 3,
    accentColor: 'amber',
    cycle: ['full_a', 'rest', 'full_b', 'rest', 'full_c', 'rest', 'rest'],
    days: FB_DAYS,
  },
  bro_split: {
    id: 'bro_split',
    name: 'Bro Split',
    description: '5 days/week · One muscle group per day · High volume',
    daysPerWeek: 5,
    accentColor: 'orange',
    cycle: ['chest', 'back', 'shoulders', 'arms', 'legs', 'rest', 'rest'],
    days: BROSPLIT_DAYS,
  },
  bws_home: {
    id: 'bws_home',
    name: 'Built With Science Home',
    description: '4 days/week · Upper/Lower split · Mon/Tue/Thu/Fri · Science-based dumbbell program',
    daysPerWeek: 4,
    accentColor: 'violet',
    cycle: ['bws_upper1', 'bws_lower1', 'rest', 'bws_upper2', 'bws_lower2', 'rest', 'rest'],
    days: BWS_DAYS,
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getPlan(planId) {
  return PLANS[planId] ?? PLANS.ppl
}

export function getWorkoutDays(planId) {
  const plan = getPlan(planId)
  return plan.cycle.map((id) => plan.days[id])
}

export function getWorkoutById(planId, dayId) {
  return getPlan(planId).days[dayId]
}

export function getRecommendedWorkout(planId, workoutHistory, today = new Date().toISOString().slice(0, 10)) {
  const plan = getPlan(planId)
  const sorted = Object.keys(workoutHistory).sort()
  if (!sorted.length) return plan.days[plan.cycle[0]]

  const lastDate = sorted[sorted.length - 1]
  const lastId = workoutHistory[lastDate].workoutId
  const lastIdx = plan.cycle.indexOf(lastId)
  if (lastIdx === -1) return plan.days[plan.cycle[0]]

  const daysSince = Math.floor((new Date(today) - new Date(lastDate)) / 86400000)
  const nextIdx = (lastIdx + Math.max(daysSince, 1)) % plan.cycle.length
  return plan.days[plan.cycle[nextIdx]]
}

export const PHASE_INFO = [
  { weeks: '1–4',  label: 'Foundation',     desc: 'Lock in form, build consistency, slight fat loss begins' },
  { weeks: '5–8',  label: 'Strength Push',  desc: 'Push intensity hard, slight calorie increase if needed' },
  { weeks: '9–12', label: 'Definition',     desc: 'Maintain strength, tighten waist, peak conditioning' },
]
