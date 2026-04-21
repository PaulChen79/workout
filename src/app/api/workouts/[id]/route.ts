import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import {
  workouts, workoutSets, exerciseMaxes, exerciseFeedback, userProgressionState,
} from '@/lib/db/schema';
import { getSession } from '@/lib/session';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { updateProgression } from '@/lib/formula';
import { EXERCISES, SCHEMES, DAY_TEMPLATES, type DayKey } from '@/lib/workout-data';

const schema = z.object({
  feedback: z.array(z.object({ exerciseId: z.string(), rir: z.number().int().min(0).max(5).nullable() })).optional(),
  maxAccepts: z.array(z.object({ exerciseId: z.string(), newMaxKg: z.number().nonnegative() })).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s.userId) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  const workoutId = Number(params.id);
  if (!Number.isFinite(workoutId)) return NextResponse.json({ error: 'bad id' }, { status: 400 });

  const [w] = await db.select().from(workouts).where(and(eq(workouts.id, workoutId), eq(workouts.userId, s.userId))).limit(1);
  if (!w) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: '格式錯誤' }, { status: 400 });
  const { feedback, maxAccepts } = parsed.data;

  for (const f of feedback ?? []) {
    if (f.rir === null) continue;
    await db.insert(exerciseFeedback).values({ workoutId, exerciseId: f.exerciseId, rir: f.rir })
      .onConflictDoUpdate({
        target: [exerciseFeedback.workoutId, exerciseFeedback.exerciseId],
        set: { rir: f.rir },
      });
  }
  for (const a of maxAccepts ?? []) {
    await db.insert(exerciseMaxes).values({ userId: s.userId, exerciseId: a.exerciseId, valueKg: a.newMaxKg.toString() })
      .onConflictDoUpdate({
        target: [exerciseMaxes.userId, exerciseMaxes.exerciseId],
        set: { valueKg: a.newMaxKg.toString(), updatedAt: new Date() },
      });
  }
  if (maxAccepts?.length) {
    await db.update(workouts).set({ prCount: maxAccepts.length }).where(eq(workouts.id, workoutId));
  }

  const sets = await db.select().from(workoutSets).where(eq(workoutSets.workoutId, workoutId));
  const byExercise = new Map<string, typeof sets>();
  for (const st of sets) {
    if (!byExercise.has(st.exerciseId)) byExercise.set(st.exerciseId, []);
    byExercise.get(st.exerciseId)!.push(st);
  }
  const tpl = DAY_TEMPLATES[w.dayKey as DayKey];
  for (const slot of tpl.slots) {
    const ex = EXERCISES[slot.id];
    if (!ex.trackable) continue;
    const slotSets = (byExercise.get(slot.id) ?? []).map((x) => ({ done: x.done, reps: x.reps }));
    if (!slotSets.length) continue;
    const rir = feedback?.find((f) => f.exerciseId === slot.id)?.rir ?? null;
    const scheme = SCHEMES[slot.scheme];
    const [existing] = await db.select().from(userProgressionState)
      .where(and(
        eq(userProgressionState.userId, s.userId),
        eq(userProgressionState.exerciseId, slot.id),
        eq(userProgressionState.scheme, slot.scheme),
      )).limit(1);
    const current = existing ? { currentPct: Number(existing.currentPct), streak: existing.streak } : { currentPct: scheme.pctLow, streak: 0 };
    const next = updateProgression({ sets: slotSets, rir, scheme, state: current });
    await db.insert(userProgressionState).values({
      userId: s.userId, exerciseId: slot.id, scheme: slot.scheme,
      currentPct: next.currentPct.toFixed(3), streak: next.streak,
    }).onConflictDoUpdate({
      target: [userProgressionState.userId, userProgressionState.exerciseId, userProgressionState.scheme],
      set: { currentPct: next.currentPct.toFixed(3), streak: next.streak, updatedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
