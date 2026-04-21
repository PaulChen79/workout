import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { workouts, workoutSets, exerciseMaxes, lastWeights } from '@/lib/db/schema';
import { getSession } from '@/lib/session';
import { workoutPostSchema } from '@/lib/validation';
import { estimate1RM, round25 } from '@/lib/formula';
import { EXERCISES } from '@/lib/workout-data';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request) {
  const s = await getSession();
  if (!s.userId) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  const userId = s.userId;

  const parsed = workoutPostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: '格式錯誤' }, { status: 400 });
  const { dayKey, sets } = parsed.data;

  const done = sets.filter((x) => x.done && x.reps && x.weightKg);
  const totalVolume = done.reduce((a, x) => a + Number(x.weightKg) * (x.reps ?? 0), 0);

  const byExercise = new Map<string, typeof sets>();
  for (const st of sets) {
    if (!byExercise.has(st.exerciseId)) byExercise.set(st.exerciseId, []);
    byExercise.get(st.exerciseId)!.push(st);
  }

  // Compute 1RM proposals for each trackable trained
  const proposals: { exerciseId: string; oldMax: number | null; estimate: number }[] = [];
  for (const [exId, xs] of byExercise) {
    const ex = EXERCISES[exId];
    if (!ex?.trackable) continue;
    const doneX = xs.filter((x) => x.done && x.reps && x.weightKg);
    if (!doneX.length) continue;
    let best = 0;
    for (const x of doneX) {
      const v = estimate1RM(Number(x.weightKg), x.reps!);
      if (v && v > best) best = v;
    }
    if (best > 0) {
      const [oldRow] = await db.select().from(exerciseMaxes)
        .where(and(eq(exerciseMaxes.userId, userId), eq(exerciseMaxes.exerciseId, exId))).limit(1);
      const oldMax = oldRow ? Number(oldRow.valueKg) : null;
      proposals.push({ exerciseId: exId, oldMax, estimate: round25(best) });
    }
  }

  const { workoutId } = await db.transaction(async (tx) => {
    const [w] = await tx.insert(workouts).values({
      userId, dayKey, doneCount: done.length,
      totalVolume: totalVolume.toString(), prCount: 0,
    }).returning({ id: workouts.id });

    if (sets.length) {
      await tx.insert(workoutSets).values(sets.map((x) => ({
        workoutId: w.id, exerciseId: x.exerciseId, setIndex: x.setIndex,
        weightKg: x.weightKg !== null ? x.weightKg.toString() : null,
        reps: x.reps, done: x.done, isCore: x.isCore,
      })));
    }

    for (const [exId, xs] of byExercise) {
      const doneX = xs.filter((x) => x.done && x.weightKg);
      if (!doneX.length) continue;
      const top = Math.max(...doneX.map((x) => Number(x.weightKg)));
      await tx.insert(lastWeights).values({ userId, exerciseId: exId, valueKg: top.toString() })
        .onConflictDoUpdate({
          target: [lastWeights.userId, lastWeights.exerciseId],
          set: { valueKg: top.toString(), updatedAt: new Date() },
        });
    }

    return { workoutId: w.id };
  });

  return NextResponse.json({ workoutId, proposals });
}
