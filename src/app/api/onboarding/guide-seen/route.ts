import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { getSession } from '@/lib/session';

export async function POST() {
  const s = await getSession();
  if (!s.userId) return NextResponse.json({ error: 'unauth' }, { status: 401 });
  await db.update(users).set({ onboardingGuideSeenAt: new Date() }).where(eq(users.id, s.userId));
  return NextResponse.json({ ok: true });
}
