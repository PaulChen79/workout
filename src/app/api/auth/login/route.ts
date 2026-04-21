import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '@/lib/auth';
import { getSession } from '@/lib/session';
import { credentialsSchema } from '@/lib/validation';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: '格式錯誤' }, { status: 400 });

  const username = parsed.data.username.toLowerCase();
  const [row] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!row) return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });

  const ok = await verifyPassword(parsed.data.password, row.passwordHash);
  if (!ok) return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });

  const session = await getSession();
  session.userId = row.id;
  await session.save();

  return NextResponse.json({ userId: row.id });
}
