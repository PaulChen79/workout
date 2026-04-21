export function round25(x: number): number {
  return Math.round(x / 2.5) * 2.5;
}

export function estimate1RM(weight: number, reps: number): number | null {
  if (reps < 1) return null;
  if (reps === 1) return weight;
  if (reps <= 5) return weight * (1 + reps / 30); // Epley
  if (reps <= 12) return weight / (1.0278 - 0.0278 * reps); // Brzycki
  return null;
}

export interface SuggestWeightInput {
  trackable: boolean;
  oneRM?: number | null;          // own 1RM if trackable and set
  currentPct?: number | null;
  pctLow?: number;
  pctHigh?: number;
  lastWeight?: number | null;     // last recorded work weight on this exercise
  derivedMax?: number | null;     // parent-lift max × accessory ratio (1st-time accessory fallback)
  equip?: 'barbell' | 'dumbbell' | 'machine' | 'bodyweight' | 'cable';
  userWeight?: number;
}

// Priority (first non-null wins):
//   1. trackable && own oneRM    → max × scheme pct          (main lifts)
//   2. lastWeight                → last session's load       (accessories after 1st training)
//   3. derivedMax × scheme pct   → parent × ratio × pct      (1st-time accessory, e.g. incline from bench)
//   4. equipment × body weight   → rough starting point      (no mapping available)
//   5. null                       → bodyweight / unknown      (pullup, plank, ab_wheel)
export function suggestWeight(input: SuggestWeightInput): number | null {
  const fromMax = (max: number) => {
    const pct = input.currentPct ?? input.pctLow ?? 0.7;
    return round25(max * pct);
  };

  if (input.trackable && input.oneRM && input.oneRM > 0) return fromMax(input.oneRM);
  if (input.lastWeight && input.lastWeight > 0) return input.lastWeight;
  if (input.derivedMax && input.derivedMax > 0) return fromMax(input.derivedMax);

  const bw = input.userWeight ?? 70;
  switch (input.equip) {
    case 'dumbbell':
      return Math.max(8, Math.round((bw * 0.15) / 2) * 2);
    case 'barbell':
      return Math.max(20, round25(bw * 0.4));
    case 'cable':
      return Math.max(10, round25(bw * 0.3));
    case 'machine':
      return Math.max(10, round25(bw * 0.35));
    case 'bodyweight':
    default:
      return null;
  }
}

export interface ProgressionSet {
  done: boolean;
  reps: number | null;
}
export interface ProgressionScheme {
  pctLow: number;
  pctHigh: number;
  repLow: number;
  repHigh: number;
}
export interface ProgressionState {
  currentPct: number;
  streak: number;
}

// Round pct to 3 decimal places to avoid floating-point drift (e.g. 0.8 + 0.025 = 0.8250000000000001).
function roundPct(p: number): number {
  return Math.round(p * 1000) / 1000;
}

export function updateProgression(args: {
  sets: ProgressionSet[];
  rir: number | null;
  scheme: ProgressionScheme;
  state: ProgressionState;
}): ProgressionState {
  const { sets, rir, scheme, state } = args;
  const done = sets.filter(
    (s) => s.done && s.reps !== null && s.reps > 0,
  ) as { done: true; reps: number }[];
  if (done.length === 0) return state;

  const allHitTop = done.every((s) => s.reps >= scheme.repHigh);
  const bump = (): ProgressionState => ({
    currentPct: roundPct(Math.min(scheme.pctHigh, state.currentPct + 0.025)),
    streak: 0,
  });
  const drop = (): ProgressionState => ({
    currentPct: roundPct(Math.max(scheme.pctLow, state.currentPct - 0.025)),
    streak: 0,
  });

  if (rir !== null) {
    if (rir >= 3 && allHitTop) return bump();
    if (rir <= 0 && !allHitTop) return drop();
  }

  if (allHitTop) {
    const newStreak = state.streak + 1;
    if (newStreak >= 2) return bump();
    return { ...state, streak: newStreak };
  }

  return { ...state, streak: 0 };
}
