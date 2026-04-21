import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import OnboardingForm from '@/components/OnboardingForm';

export default async function Page() {
  const s = await getSession();
  if (!s.userId) redirect('/auth');
  const [u] = await db.select({ seenAt: users.onboardingGuideSeenAt })
    .from(users).where(eq(users.id, s.userId)).limit(1);
  const showGuide = !u?.seenAt;
  return <OnboardingForm showGuide={showGuide} />;
}
