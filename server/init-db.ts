import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sql = neon(process.env.DATABASE_URL!);

async function initDb() {
  console.log('Creating database tables on Neon Postgres...');
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        display_name TEXT,
        role TEXT,
        photo_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✓ "users" table created/verified.');

    await sql`
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        practitioner_id TEXT REFERENCES users(uid),
        name TEXT NOT NULL,
        age TEXT,
        sex TEXT,
        cause TEXT,
        medical_data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✓ "patients" table created/verified.');

    await sql`
      CREATE TABLE IF NOT EXISTS conversations (
        user_id TEXT PRIMARY KEY REFERENCES users(uid),
        messages JSONB DEFAULT '[]'::jsonb,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✓ "conversations" table created/verified.');

    console.log('\n🎉 Neon Database Setup Completed Successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
  }
}

initDb();
