import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, validateUsername, validatePassword } from '@/lib/auth';
import { getSession } from '@/lib/session';
import { credentialsSchema } from '@/lib/validation';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: '格式錯誤' }, { status: 400 });

  const username = parsed.data.username.toLowerCase();
  const u = validateUsername(username); if (u) return NextResponse.json({ error: u }, { status: 400 });
  const p = validatePassword(parsed.data.password); if (p) return NextResponse.json({ error: p }, { status: 400 });

  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing.length) return NextResponse.json({ error: '帳號已存在' }, { status: 409 });

  const passwordHash = await hashPassword(parsed.data.password);
  const [row] = await db.insert(users).values({ username, passwordHash }).returning({ id: users.id });

  const session = await getSession();
  session.userId = row.id;
  await session.save();

  return NextResponse.json({ userId: row.id });
}
