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
// Based on Jeremy Ethier's 150-day home transformation (26 lb fat, 7 lb muscle)
// 4 days/week · Push / Pull / Legs / Upper+(Pre-Exhaust)
const BWS_DAYS = {
  bws_push: {
    id: 'bws_push', name: 'Push', subtitle: 'Chest · Shoulders · Triceps', type: 'push', colorClasses: COLORS.red,
    exercises: [
      {
        name: 'Incline DB Press', sets: 4, repRange: '8–12', rpe: 8, restSec: 150,
        tip: 'Align arm path with your upper chest fibers — not super wide. Tuck elbows at the bottom and flare slightly on the way up. Higher incline needed if your sternum angle is steep.',
      },
      {
        name: 'Flat DB Press', sets: 3, repRange: '10–12', rpe: 8, restSec: 120,
        tip: 'Targets mid and lower chest fibers. Keep a slight arch and drive through your chest, not your shoulders.',
      },
      {
        name: 'DB Shoulder Press', sets: 3, repRange: '8–12', rpe: 8, restSec: 120,
        tip: 'Tuck elbows at the bottom, then flare on the way up. Avoid pressing straight out wide — that loads the front delt less efficiently and can cause shoulder clicks.',
      },
      {
        name: 'Reverse Drop Set Lateral Raises', sets: 3, repRange: 'To failure + half reps', rpe: 9, restSec: 90,
        tip: 'Do full reps to failure. Then immediately grab a weight 20% heavier and do half reps in the bottom range (hardest zone). This takes the side delt to true failure and overloads the stretched position.',
      },
      {
        name: 'Leaning Lateral Raises', sets: 3, repRange: '12–15', rpe: 8, restSec: 75,
        tip: 'Hold a wall or upright with one hand and lean sideways. This makes the bottom of the movement harder — mimicking the cable effect. Pair with reverse drop set raises on the same day for full delt stimulus.',
      },
      {
        name: 'Overhead DB Triceps Extension', sets: 3, repRange: '12–15', rpe: 9, restSec: 90,
        tip: 'Standing or seated. This is the best single triceps exercise — it stretches and loads the long head (the part that gives arm size). Keep upper arms close to your head.',
      },
    ],
  },
  bws_pull: {
    id: 'bws_pull', name: 'Pull', subtitle: 'Back · Biceps', type: 'pull', colorClasses: COLORS.blue,
    exercises: [
      {
        name: 'Chest-Supported DB Row', sets: 4, repRange: '10–12', rpe: 8, restSec: 150,
        tip: 'Wide elbow angle for mid and upper back thickness. Key cue: fist directly under elbow. Shrug first, then squeeze shoulder blades together — this limits bicep takeover.',
      },
      {
        name: 'Single-Arm DB Row (Lat Focus)', sets: 4, repRange: '10–12', rpe: 8, restSec: 150,
        tip: 'Elbow tight to your side, sweep the arm back toward your hip. Think "wing" not "row". This targets the lats for back width rather than the mid-back.',
      },
      {
        name: 'Incline DB Curl', sets: 3, repRange: '10–12', rpe: 9, restSec: 90,
        tip: 'Lie on incline bench so arms hang behind your body. This stretch-focused position targets the upper biceps peak. Keep upper arms locked — only forearms move.',
      },
      {
        name: 'Preacher Curl (DB)', sets: 3, repRange: '10–12', rpe: 9, restSec: 90,
        tip: 'Use the incline bench as a preacher pad — rest upper arm against the pad. Targets the lower biceps and brachialis. Pairs with incline curl for complete bicep development.',
      },
      {
        name: 'Hammer Curl', sets: 2, repRange: '10–12', rpe: 8, restSec: 75,
        tip: 'Neutral (hammer) grip. Builds the brachialis which pushes the bicep up and adds arm thickness.',
      },
    ],
  },
  bws_legs: {
    id: 'bws_legs', name: 'Legs', subtitle: 'Quads · Glutes · Hamstrings · RF', type: 'legs', colorClasses: COLORS.emerald,
    exercises: [
      {
        name: 'Wide-Stance Bulgarian Split Squat', sets: 3, repRange: '10–12 each', rpe: 8, restSec: 180,
        tip: 'Wider stance shifts emphasis to the glutes. Keep torso upright and drive through the heel. Lower the bench height with foam if the hip angle feels uncomfortable.',
      },
      {
        name: 'Narrow-Stance Bulgarian Split Squat', sets: 3, repRange: '10–12 each', rpe: 8, restSec: 180,
        tip: 'Narrow stance with knee driving forward over the toes. This shifts load to the quads. Same movement, different stance = different muscle emphasis.',
      },
      {
        name: 'DB Romanian Deadlift', sets: 4, repRange: '10–12', rpe: 8, restSec: 150,
        tip: 'Slow and controlled — 3 second lowering. Feel the full hamstring stretch at the bottom. Hinge at the hips, keep back flat and dumbbells close to your legs.',
      },
      {
        name: 'Reverse Nordic', sets: 3, repRange: '5–10', rpe: 9, restSec: 90,
        tip: 'Anchor feet under a bench. Lean back slowly with core braced, butt to heels for full stretch. Targets the rectus femoris — the quad muscle squats/lunges don\'t grow well. Start with partials and progress.',
      },
      {
        name: 'Sissy Squat', sets: 3, repRange: '8–12', rpe: 9, restSec: 90,
        tip: 'Hold a support with one hand. Drive knees forward, back straight, full quad stretch at the bottom. Best alternative to leg extensions for rectus femoris. Even one controlled rep is progress early on.',
      },
      {
        name: 'Calf Raises (Elevated)', sets: 4, repRange: '15–20', rpe: 9, restSec: 60,
        tip: 'Stand on an elevated platform (build one from wood) for full range. Slow lowering to get the stretch. Without elevation this exercise loses most of its benefit.',
      },
    ],
  },
  bws_upper: {
    id: 'bws_upper', name: 'Upper+ (Pre-Exhaust)', subtitle: 'Full Upper · Advanced Technique', type: 'push', colorClasses: COLORS.violet,
    exercises: [
      {
        name: 'DB Fly → Flat DB Press (Superset)', sets: 3, repRange: 'Fly to failure, then press', rpe: 9, restSec: 150,
        tip: 'PRE-EXHAUST: Do DB fly to complete failure. Without resting, switch immediately to flat DB press with heavier weight. Your chest is pre-fatigued so it reaches failure at lighter weight. Add 1–2 extra sets vs normal training to match volume.',
      },
      {
        name: 'Incline DB Press', sets: 3, repRange: '10–12', rpe: 8, restSec: 120,
        tip: 'Upper chest focus. Keep arm path aligned with fiber direction — not too wide. Full stretch at bottom.',
      },
      {
        name: 'Chest-Supported DB Row', sets: 3, repRange: '10–12', rpe: 8, restSec: 120,
        tip: 'Wide elbow for mid-back thickness. Fist under elbow. Shrug first, then row.',
      },
      {
        name: 'Single-Arm DB Row (Lat Focus)', sets: 3, repRange: '10–12', rpe: 8, restSec: 120,
        tip: 'Elbow tight, sweep toward hip for lat width.',
      },
      {
        name: 'Reverse Drop Set Lateral Raises', sets: 3, repRange: 'To failure + half reps', rpe: 9, restSec: 90,
        tip: 'Full reps to failure, then immediately go 20% heavier for bottom-range half reps. True delt failure.',
      },
      {
        name: 'Overhead DB Triceps Extension', sets: 3, repRange: '12–15', rpe: 9, restSec: 90,
        tip: 'Long head focus. Arms close to head. Full stretch at the bottom.',
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
    description: '4 days/week · Science-based · Proven: 26lb fat lost, 7lb muscle gained in 150 days',
    daysPerWeek: 4,
    accentColor: 'violet',
    cycle: ['bws_push', 'bws_pull', 'bws_legs', 'rest', 'bws_upper', 'rest', 'rest'],
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

export function getRecommendedWorkout(planId, workoutHistory) {
  const plan = getPlan(planId)
  const sorted = Object.keys(workoutHistory).sort()
  if (!sorted.length) return plan.days[plan.cycle[0]]
  const lastId = workoutHistory[sorted[sorted.length - 1]].workoutId
  const lastIdx = plan.cycle.indexOf(lastId)
  const nextIdx = lastIdx === -1 ? 0 : (lastIdx + 1) % plan.cycle.length
  return plan.days[plan.cycle[nextIdx]]
}

export const PHASE_INFO = [
  { weeks: '1–4',  label: 'Foundation',     desc: 'Lock in form, build consistency, slight fat loss begins' },
  { weeks: '5–8',  label: 'Strength Push',  desc: 'Push intensity hard, slight calorie increase if needed' },
  { weeks: '9–12', label: 'Definition',     desc: 'Maintain strength, tighten waist, peak conditioning' },
]
