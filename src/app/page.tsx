import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function Root() {
  const s = await getSession();
  redirect(s.userId ? '/today' : '/auth');
}
