import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { profiles } from '@/lib/db/schema';
import { getSession } from '@/lib/session';
import { profilePatchSchema } from '@/lib/validation';

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s.userId) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  const userId = s.userId;

  const parsed = profilePatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: '格式錯誤' }, { status: 400 });
  const d = parsed.data;

  const values = {
    userId,
    name: d.name ?? null,
    heightCm: d.heightCm != null ? d.heightCm.toString() : null,
    age: d.age ?? null,
    goal: d.goal ?? null,
  };

  await db.insert(profiles).values(values).onConflictDoUpdate({
    target: profiles.userId,
    set: {
      name: values.name,
      heightCm: values.heightCm,
      age: values.age,
      goal: values.goal,
    },
  });

  return NextResponse.json({ ok: true });
}
