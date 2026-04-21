import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db/client';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function Root() {
  const s = await getSession();
  if (!s.userId) redirect('/auth');
  const [p] = await db.select().from(profiles).where(eq(profiles.userId, s.userId)).limit(1);
  redirect(p ? '/today' : '/onboarding');
}
