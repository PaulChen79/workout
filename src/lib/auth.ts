import bcrypt from 'bcryptjs';

const COST = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const USERNAME_REGEX = /^[a-z0-9_.-]+$/;

export function validateUsername(u: string): string | null {
  if (u.length < 3) return '帳號至少 3 字元';
  if (!USERNAME_REGEX.test(u)) return '帳號只能用 a-z / 0-9 / _ . -';
  return null;
}

export function validatePassword(p: string): string | null {
  if (p.length < 4) return '密碼至少 4 字元';
  return null;
}
