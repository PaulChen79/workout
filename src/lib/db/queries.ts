import { db } from './client';
import { bodyLogs, exerciseMaxes, lastWeights, profiles, userProgressionState, workouts } from './schema';
import { eq, desc, and } from 'drizzle-orm';
import { DAY_TEMPLATES, SCHEMES, EXERCISES, ACCESSORY_RATIOS, type DayKey } from '@/lib/workout-data';
import { suggestWeight } from '@/lib/formula';

export async function lastWorkoutPerDay(userId: string): Promise<Record<DayKey, Date | null>> {
  const rows = await db.select({ dayKey: workouts.dayKey, finishedAt: workouts.finishedAt })
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.finishedAt));
  const seen: Record<string, Date | null> = { push: null, pull: null, legs: null };
  for (const r of rows) if (!seen[r.dayKey]) seen[r.dayKey] = r.finishedAt;
  return seen as Record<DayKey, Date | null>;
}

export function suggestedDay(last: Record<DayKey, Date | null>): DayKey {
  const order: DayKey[] = ['push','pull','legs'];
  order.sort((a, b) => {
    const ta = last[a]?.getTime() ?? -Infinity;
    const tb = last[b]?.getTime() ?? -Infinity;
    return ta - tb;
  });
  return order[0];
}

export interface PlannedSlot {
  exerciseId: string;
  name: string;
  muscles: string[];
  scheme: string;
  schemeDisplay: string;
  sets: number;
  repLow: number;
  repHigh: number;
  pctLabel: string;     // e.g. "80% 1RM"
  suggestedWeight: number | null;
  trackable: boolean;
  isCore: boolean;
}

export async function buildPlan(userId: string, day: DayKey): Promise<PlannedSlot[]> {
  const tpl = DAY_TEMPLATES[day];
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  void profile;
  const [latestLog] = await db.select({ weightKg: bodyLogs.weightKg })
    .from(bodyLogs)
    .where(eq(bodyLogs.userId, userId))
    .orderBy(desc(bodyLogs.loggedAt))
    .limit(1);
  const userWeight = latestLog ? Number(latestLog.weightKg) : 70;
  const maxesRows = await db.select().from(exerciseMaxes).where(eq(exerciseMaxes.userId, userId));
  const maxes = new Map(maxesRows.map((r) => [r.exerciseId, Number(r.valueKg)]));
  const lastRows = await db.select().from(lastWeights).where(eq(lastWeights.userId, userId));
  const lasts = new Map(lastRows.map((r) => [r.exerciseId, Number(r.valueKg)]));
  const progRows = await db.select().from(userProgressionState).where(eq(userProgressionState.userId, userId));
  const progMap = new Map(progRows.map((r) => [`${r.exerciseId}:${r.scheme}`, Number(r.currentPct)]));

  const derive = (exerciseId: string): number | null => {
    const r = ACCESSORY_RATIOS[exerciseId];
    if (!r) return null;
    const parentMax = maxes.get(r.parent);
    if (!parentMax) return null;
    return parentMax * r.ratio;
  };

  const out: PlannedSlot[] = [];
  for (const slot of tpl.slots) {
    const ex = EXERCISES[slot.id];
    const scheme = SCHEMES[slot.scheme];
    const currentPct = progMap.get(`${slot.id}:${slot.scheme}`) ?? null;
    const weight = suggestWeight({
      trackable: ex.trackable,
      oneRM: maxes.get(slot.id) ?? null,
      currentPct, pctLow: scheme.pctLow, pctHigh: scheme.pctHigh,
      lastWeight: lasts.get(slot.id) ?? null,
      derivedMax: derive(slot.id),
      equip: ex.equip, userWeight,
    });
    out.push({
      exerciseId: slot.id, name: ex.name, muscles: ex.muscles, scheme: slot.scheme,
      schemeDisplay: `${scheme.repLow}-${scheme.repHigh} @ ${Math.round((currentPct ?? scheme.pctLow) * 100)}% 1RM`,
      sets: slot.sets, repLow: scheme.repLow, repHigh: scheme.repHigh,
      pctLabel: `${Math.round((currentPct ?? scheme.pctLow) * 100)}%`,
      suggestedWeight: weight, trackable: ex.trackable, isCore: false,
    });
  }
  for (const coreId of tpl.core) {
    const ex = EXERCISES[coreId];
    out.push({
      exerciseId: coreId, name: ex.name, muscles: ex.muscles, scheme: 'pump',
      schemeDisplay: ex.timed ? '3×30-60秒' : '3×12-20', sets: 3, repLow: 12, repHigh: 20,
      pctLabel: '', suggestedWeight: suggestWeight({
        trackable: false,
        lastWeight: lasts.get(coreId) ?? null,
        derivedMax: derive(coreId),
        equip: ex.equip, userWeight,
      }),
      trackable: false, isCore: true,
    });
  }
  return out;
}
