import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { profiles } from '@/lib/db/schema';
import { lastWorkoutPerDay, suggestedDay } from '@/lib/db/queries';
import DaySelector from '@/components/DaySelector';

export default async function TodayPage() {
  const s = await getSession();
  if (!s.userId) redirect('/auth');
  const [profile] = await db.select({ userId: profiles.userId }).from(profiles).where(eq(profiles.userId, s.userId)).limit(1);
  if (!profile) redirect('/onboarding');
  const last = await lastWorkoutPerDay(s.userId);
  const suggested = suggestedDay(last);
  const now = new Date();
  const dateLabel = `TODAY · ${now.getMonth() + 1}/${now.getDate()} · ${['日','一','二','三','四','五','六'][now.getDay()]}`;
  return <DaySelector suggested={suggested} dateLabel={dateLabel} />;
}
