import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { exerciseMaxes } from '@/lib/db/schema';
import { getSession } from '@/lib/session';
import { maxesPatchSchema } from '@/lib/validation';

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s.userId) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  const parsed = maxesPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: '格式錯誤' }, { status: 400 });
  for (const m of parsed.data.maxes) {
    await db.insert(exerciseMaxes).values({ userId: s.userId, exerciseId: m.exerciseId, valueKg: m.valueKg.toString() })
      .onConflictDoUpdate({
        target: [exerciseMaxes.userId, exerciseMaxes.exerciseId],
        set: { valueKg: m.valueKg.toString(), updatedAt: new Date() },
      });
  }
  return NextResponse.json({ ok: true });
}
