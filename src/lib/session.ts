import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData { userId?: string; }

const options: SessionOptions = {
  password: process.env.SESSION_SECRET ?? 'dev-only-secret-min-32-bytes-long-placeholder',
  cookieName: 'forge_session',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  },
};

export async function getSession() {
  return getIronSession<SessionData>(cookies(), options);
}
