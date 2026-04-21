import { db } from './client';
import { workouts } from './schema';
import { eq, desc, and } from 'drizzle-orm';
import type { DayKey } from '@/lib/workout-data';

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
