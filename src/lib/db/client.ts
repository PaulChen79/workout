import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

type QueryClient = ReturnType<typeof postgres>;
type Drizzle = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  __pgClient?: QueryClient;
  __drizzle?: Drizzle;
};

function getClient(): QueryClient {
  if (globalForDb.__pgClient) return globalForDb.__pgClient;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const client = postgres(url);
  globalForDb.__pgClient = client;
  return client;
}

function getDb(): Drizzle {
  if (globalForDb.__drizzle) return globalForDb.__drizzle;
  const d = drizzle(getClient(), { schema });
  globalForDb.__drizzle = d;
  return d;
}

// Proxy defers connection until a drizzle method is actually called,
// so `next build` can collect route metadata without DATABASE_URL set.
export const db = new Proxy({} as Drizzle, {
  get(_target, prop, receiver) {
    const target = getDb();
    const value = Reflect.get(target as object, prop, receiver);
    return typeof value === 'function' ? value.bind(target) : value;
  },
});

export type DB = Drizzle;
