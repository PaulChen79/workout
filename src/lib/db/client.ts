import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set');

const globalForDb = globalThis as unknown as { __pgClient?: ReturnType<typeof postgres> };
const queryClient = globalForDb.__pgClient ?? postgres(url);
if (process.env.NODE_ENV !== 'production') globalForDb.__pgClient = queryClient;

export const db = drizzle(queryClient, { schema });
export type DB = typeof db;
