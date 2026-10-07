import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const isConnectionString = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'));

export const pool = new Pool(
  isConnectionString
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
      }
    : {
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        ssl: false,
      }
);

// Auto-heal / sync missing database columns if running on PostgreSQL
export async function syncDatabaseSchema() {
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS businesses (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          type text NOT NULL DEFAULT 'tailoring',
          owner_name text NOT NULL DEFAULT 'Owner'
        );

        ALTER TABLE businesses ADD COLUMN IF NOT EXISTS registration_number text;
        ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone text;
        ALTER TABLE businesses ADD COLUMN IF NOT EXISTS email text;
        ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address text;
        ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url text;
        ALTER TABLE businesses ADD COLUMN IF NOT EXISTS description text;
        ALTER TABLE businesses ADD COLUMN IF NOT EXISTS whatsapp_number text;
        ALTER TABLE businesses ADD COLUMN IF NOT EXISTS whatsapp_settings json;
        ALTER TABLE businesses ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
        ALTER TABLE businesses ADD COLUMN IF NOT EXISTS currency text DEFAULT 'NGN';
        ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tax_rate decimal DEFAULT '0';
        ALTER TABLE businesses ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT NOW();
        ALTER TABLE businesses ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT NOW();

        ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp_number text;
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_spending decimal DEFAULT '0';
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS outstanding_balance decimal DEFAULT '0';
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

        -- App Settings Table (Server-side credentials & settings stored directly in DB table)
        CREATE TABLE IF NOT EXISTS app_settings (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          key text UNIQUE NOT NULL,
          value text NOT NULL,
          category text DEFAULT 'general',
          description text,
          created_at timestamp DEFAULT NOW(),
          updated_at timestamp DEFAULT NOW()
        );

        -- Backend Store Table (Backend storage for arbitrary data entries)
        CREATE TABLE IF NOT EXISTS backend_store (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          collection text NOT NULL,
          key text NOT NULL,
          data jsonb NOT NULL,
          created_at timestamp DEFAULT NOW(),
          updated_at timestamp DEFAULT NOW()
        );
      `);
      console.log('Database schema synchronized successfully (including app_settings and backend_store).');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Schema auto-sync warning:', err);
  }
}

syncDatabaseSchema();

export const db = drizzle(pool, { schema });

