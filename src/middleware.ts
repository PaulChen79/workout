import { NextResponse, type NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import type { SessionData } from '@/lib/session';

const PROTECTED = ['/today', '/progress', '/onboarding', '/profile'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (!PROTECTED.some((p) => path === p || path.startsWith(p + '/'))) return NextResponse.next();

  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, {
    password: process.env.SESSION_SECRET ?? 'dev-only-secret-min-32-bytes-long-placeholder',
    cookieName: 'forge_session',
  });
  if (!session.userId) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = { matcher: ['/today/:path*', '/progress/:path*', '/onboarding', '/profile'] };
