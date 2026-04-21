import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { buildPlan } from '@/lib/db/queries';
import WorkoutScreen from '@/components/WorkoutScreen';
import type { DayKey } from '@/lib/workout-data';

const DAYS: DayKey[] = ['push', 'pull', 'legs'];

export default async function Page({ params }: { params: { day: string } }) {
  if (!DAYS.includes(params.day as DayKey)) notFound();
  const s = await getSession();
  if (!s.userId) redirect('/auth');
  const plan = await buildPlan(s.userId, params.day as DayKey);
  return <WorkoutScreen day={params.day} plan={plan} />;
}
