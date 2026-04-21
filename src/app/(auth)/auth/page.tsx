import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { count } from 'drizzle-orm';
import AuthForm from '@/components/AuthForm';

export const dynamic = 'force-dynamic';

export default async function AuthPage() {
  const [{ value }] = await db.select({ value: count() }).from(users);
  return <AuthForm userCount={Number(value)} />;
}
