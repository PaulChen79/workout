import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { lastWorkoutPerDay, suggestedDay } from '@/lib/db/queries';
import DaySelector from '@/components/DaySelector';

export default async function TodayPage() {
  const s = await getSession();
  if (!s.userId) redirect('/auth');
  const last = await lastWorkoutPerDay(s.userId);
  const suggested = suggestedDay(last);
  const now = new Date();
  const dateLabel = `TODAY · ${now.getMonth() + 1}/${now.getDate()} · ${['日','一','二','三','四','五','六'][now.getDay()]}`;
  return <DaySelector suggested={suggested} dateLabel={dateLabel} />;
}
