import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

const client = postgres(url, { max: 1 });
const db = drizzle(client);

async function main() {
  await migrate(db, { migrationsFolder: './migrations' });
  await client.end();
  console.log('migrations applied');
}
main().catch((e) => { console.error(e); process.exit(1); });
