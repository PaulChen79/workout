import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { bodyLogs } from '@/lib/db/schema';
import { getSession } from '@/lib/session';
import { bodyLogSchema } from '@/lib/validation';

export async function POST(req: Request) {
  const s = await getSession();
  if (!s.userId) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  const parsed = bodyLogSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: '格式錯誤' }, { status: 400 });
  await db.insert(bodyLogs).values({
    userId: s.userId,
    weightKg: parsed.data.weightKg.toString(),
    bodyFat: parsed.data.bodyFat != null ? parsed.data.bodyFat.toString() : null,
  });
  return NextResponse.json({ ok: true });
}
