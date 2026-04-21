import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db/client';
import { profiles, exerciseMaxes } from '@/lib/db/schema';
import ProfileEditForm, { type ProfileEditInitial } from '@/components/ProfileEditForm';

const TRACKABLE = ['bench_press', 'back_squat', 'deadlift', 'ohp', 'barbell_row'];

export default async function ProfilePage() {
  const s = await getSession();
  if (!s.userId) redirect('/auth');

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, s.userId)).limit(1);
  if (!profile) redirect('/onboarding');

  const maxRows = await db.select().from(exerciseMaxes).where(eq(exerciseMaxes.userId, s.userId));
  const maxes: Record<string, number> = {};
  for (const id of TRACKABLE) maxes[id] = 0;
  for (const row of maxRows) maxes[row.exerciseId] = Number(row.valueKg);

  const initial: ProfileEditInitial = {
    name: profile.name ?? '',
    heightCm: profile.heightCm ? Number(profile.heightCm) : 170,
    age: profile.age ?? 28,
    goal: (profile.goal as ProfileEditInitial['goal']) ?? 'powerbuilding',
    maxes,
  };

  return <ProfileEditForm initial={initial} />;
}
