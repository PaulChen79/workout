import { redirect } from 'next/navigation';
import { and, desc, eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db/client';
import { users, profiles, bodyLogs, workouts, workoutSets, exerciseMaxes } from '@/lib/db/schema';
import Dashboard, { type DashboardData } from '@/components/Dashboard';
import { EXERCISES } from '@/lib/workout-data';
import { estimate1RM } from '@/lib/formula';

const TRACKABLE = ['bench_press','back_squat','deadlift','ohp','barbell_row'];

export default async function Page() {
  const s = await getSession();
  if (!s.userId) redirect('/auth');
  const userId = s.userId;

  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const [p] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  const logs = await db.select().from(bodyLogs).where(eq(bodyLogs.userId, userId)).orderBy(bodyLogs.loggedAt);
  const ws = await db.select().from(workouts).where(eq(workouts.userId, userId)).orderBy(desc(workouts.finishedAt));
  const maxesRows = await db.select().from(exerciseMaxes).where(eq(exerciseMaxes.userId, userId));
  const currentMaxes = new Map(maxesRows.map((m) => [m.exerciseId, Number(m.valueKg)]));

  // Max history: for each trackable, compute 1RM estimate across time from workout_sets
  const maxes: DashboardData['maxes'] = [];
  for (const id of TRACKABLE) {
    const curr = currentMaxes.get(id);
    if (!curr) continue;
    // history: best 1RM estimate per past workout containing this exercise
    const sets = await db.select({
      weightKg: workoutSets.weightKg, reps: workoutSets.reps, finishedAt: workouts.finishedAt, workoutId: workoutSets.workoutId,
    }).from(workoutSets)
      .innerJoin(workouts, eq(workoutSets.workoutId, workouts.id))
      .where(and(eq(workouts.userId, userId), eq(workoutSets.exerciseId, id), eq(workoutSets.done, true)))
      .orderBy(workouts.finishedAt);
    const byWorkout = new Map<number, number>();
    for (const x of sets) {
      if (!x.weightKg || !x.reps) continue;
      const e = estimate1RM(Number(x.weightKg), x.reps);
      if (!e) continue;
      const prev = byWorkout.get(x.workoutId) ?? 0;
      if (e > prev) byWorkout.set(x.workoutId, e);
    }
    const history = [...byWorkout.values()].map((v) => Math.round(v));
    const first = history[0] ?? curr;
    maxes.push({ exerciseId: id, current: curr, first, history: history.length ? history : [curr] });
  }

  const lastLog = logs.at(-1);
  const data: DashboardData = {
    username: u.username,
    name: p?.name ?? null,
    heightCm: p?.heightCm ? Number(p.heightCm) : null,
    age: p?.age ?? null,
    latestWeight: lastLog ? Number(lastLog.weightKg) : null,
    firstWeight: logs[0] ? Number(logs[0].weightKg) : null,
    bodyFat: lastLog?.bodyFat ? Number(lastLog.bodyFat) : null,
    bodyLogHistory: logs.map((l) => Number(l.weightKg)),
    workoutCount: ws.length,
    streakDays: calcStreak(ws.map((w) => w.finishedAt)),
    maxes,
    volumeSeries: ws.slice(0, 10).reverse().map((w) => ({
      x: new Date(w.finishedAt).toLocaleDateString('zh', { month: '2-digit', day: '2-digit' }),
      y: Number(w.totalVolume),
    })),
    recent: ws.slice(0, 8).map((w) => ({
      id: w.id, dayKey: w.dayKey, finishedAt: w.finishedAt.toISOString(),
      setCount: w.doneCount, volume: Number(w.totalVolume), pr: w.prCount,
    })),
  };

  return <Dashboard data={data} />;
}

function calcStreak(dates: Date[]): number {
  if (!dates.length) return 0;
  const days = new Set(dates.map((d) => new Date(d).toDateString()));
  let n = 0;
  const cursor = new Date();
  while (days.has(cursor.toDateString())) { n++; cursor.setDate(cursor.getDate() - 1); }
  return n;
}
