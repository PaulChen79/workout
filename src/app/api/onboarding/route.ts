import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { profiles, exerciseMaxes, bodyLogs } from '@/lib/db/schema';
import { getSession } from '@/lib/session';
import { onboardingSchema } from '@/lib/validation';

export async function POST(req: Request) {
  const s = await getSession();
  if (!s.userId) return NextResponse.json({ error: 'unauth' }, { status: 401 });

  const parsed = onboardingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: '格式錯誤' }, { status: 400 });
  const d = parsed.data;

  await db.insert(profiles).values({
    userId: s.userId,
    name: d.name ?? null,
    heightCm: d.heightCm?.toString() ?? null,
    age: d.age ?? null,
    goal: d.goal ?? null,
  }).onConflictDoUpdate({
    target: profiles.userId,
    set: {
      name: d.name ?? null,
      heightCm: d.heightCm?.toString() ?? null,
      age: d.age ?? null,
      goal: d.goal ?? null,
    },
  });

  for (const m of d.maxes) {
    await db.insert(exerciseMaxes).values({
      userId: s.userId, exerciseId: m.exerciseId, valueKg: m.valueKg.toString(),
    }).onConflictDoUpdate({
      target: [exerciseMaxes.userId, exerciseMaxes.exerciseId],
      set: { valueKg: m.valueKg.toString(), updatedAt: new Date() },
    });
  }

  await db.insert(bodyLogs).values({ userId: s.userId, weightKg: d.weightKg.toString() });

  return NextResponse.json({ ok: true });
}
