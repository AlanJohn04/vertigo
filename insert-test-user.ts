import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users } from './db/schema';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  try {
    await db.insert(users).values({
      uid: 'dev-test-uid-123',
      email: 'devtest@vertease.com',
      displayName: 'Dev Practitioner',
      role: 'practitioner'
    });
    console.log("Test user inserted!");
  } catch (e) {
    console.log("Error inserting test user:", e);
  }
}
main();
