import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { pool, syncDatabaseSchema, db } from '../../db';
import { appSettings, backendStore, services, orderItems } from '../../db/schema';
import { requireAuth, requireSuperAdmin, AuthRequest } from '../middlewares/auth';
import { eq, desc } from 'drizzle-orm';

export const supabaseRouter = Router();

// Server-side backend credentials (never exposed to frontend)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://qhyymzphduvmljergefc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// 1. GET /api/supabase/status
// Reports live backend database health and confirms credentials are safe server-side
supabaseRouter.get('/status', requireAuth, async (req: AuthRequest, res) => {
  let dbConnected = false;
  let tableCount = 0;
  let totalRows = 0;
  let tablesList: string[] = [];
  let dbError = null;

  try {
    const testResult = await pool.query('SELECT 1');
    if (testResult) dbConnected = true;

    // Get table names
    const tablesQuery = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name ASC
    `);

    tablesList = tablesQuery.rows.map(r => r.table_name);
    tableCount = tablesList.length;

    // Calculate total rows
    for (const table of tablesList) {
      try {
        const countRes = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
        totalRows += parseInt(countRes.rows[0].count, 10) || 0;
      } catch (e) {
        // Ignore single table count error
      }
    }
  } catch (err: any) {
    dbError = err.message;
  }

  // Supabase client check
  let supabaseApiReady = false;
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const client = createClient(SUPABASE_URL, SUPABASE_KEY);
      if (client) supabaseApiReady = true;
    } catch {
      supabaseApiReady = false;
    }
  }

  res.json({
    status: dbConnected ? 'connected' : 'error',
    message: dbConnected 
      ? 'Backend PostgreSQL & Supabase database are fully connected and healthy.' 
      : `Database connection error: ${dbError}`,
    credentialsStoredOnBackend: true,
    tableCount,
    totalRows,
    tables: tablesList,
    supabaseApiReady,
    databaseEngine: 'PostgreSQL / Supabase Server',
    lastChecked: new Date().toISOString()
  });
});

// 2. GET /api/supabase/tables
// Lists all tables with column counts and row counts directly from backend
supabaseRouter.get('/tables', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tablesQuery = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name ASC
    `);

    const tables = [];

    for (const r of tablesQuery.rows) {
      const tableName = r.table_name;
      let rowCount = 0;
      let columnCount = 0;

      try {
        const countRes = await pool.query(`SELECT COUNT(*) FROM "${tableName}"`);
        rowCount = parseInt(countRes.rows[0].count, 10) || 0;
      } catch {}

      try {
        const colRes = await pool.query(`
          SELECT COUNT(*) 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
        `, [tableName]);
        columnCount = parseInt(colRes.rows[0].count, 10) || 0;
      } catch {}

      tables.push({
        name: tableName,
        rowCount,
        columnCount,
        isEmpty: rowCount === 0
      });
    }

    res.json({ tables });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/supabase/execute-sql
// Executes raw SQL directly on the backend database without needing frontend credentials
supabaseRouter.post('/execute-sql', requireAuth, async (req: AuthRequest, res) => {
  const { sqlScript } = req.body;

  if (!sqlScript || !sqlScript.trim()) {
    return res.status(400).json({ error: 'SQL script is empty.' });
  }

  try {
    const startTime = Date.now();
    const result = await pool.query(sqlScript);
    const durationMs = Date.now() - startTime;

    return res.json({
      success: true,
      message: 'SQL script executed successfully on the backend database!',
      durationMs,
      command: Array.isArray(result) ? result.map(r => r.command).join(', ') : result.command,
      rowCount: Array.isArray(result) ? result.reduce((acc, r) => acc + (r.rowCount || 0), 0) : result.rowCount,
      rows: Array.isArray(result) ? result[result.length - 1]?.rows || [] : result.rows || [],
      fields: Array.isArray(result) ? result[result.length - 1]?.fields?.map(f => f.name) || [] : result.fields?.map(f => f.name) || []
    });
  } catch (pgErr: any) {
    console.error('Backend SQL execution error:', pgErr);
    return res.status(400).json({
      success: false,
      error: pgErr.message || 'SQL execution failed',
      detail: pgErr.detail,
      position: pgErr.position,
      hint: pgErr.hint
    });
  }
});

// 4. GET /api/supabase/store
// Read data entries stored directly in the backend_store table
supabaseRouter.get('/store', requireAuth, async (req: AuthRequest, res) => {
  const { collection } = req.query;
  try {
    let query = `SELECT * FROM backend_store`;
    const params: any[] = [];

    if (collection) {
      query += ` WHERE collection = $1`;
      params.push(collection);
    }
    query += ` ORDER BY created_at DESC LIMIT 50`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/supabase/store
// Insert or update an entry in the backend_store table
supabaseRouter.post('/store', requireAuth, async (req: AuthRequest, res) => {
  const { collection, key, data } = req.body;
  if (!collection || !key || !data) {
    return res.status(400).json({ error: 'collection, key, and data are required' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO backend_store (collection, key, data, updated_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `, [collection, key, JSON.stringify(data)]);

    res.json({
      success: true,
      message: 'Entry stored successfully at backend table!',
      entry: result.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. POST /api/supabase/sync-schema
// Automatically runs the schema migration / sync function
supabaseRouter.post('/sync-schema', requireAuth, async (req: AuthRequest, res) => {
  try {
    await syncDatabaseSchema();
    res.json({
      success: true,
      message: 'Backend database schema synchronized successfully! Tables verified and up to date.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. POST /api/supabase/seed-demo
// Populates empty tables with initial catalog and business data
supabaseRouter.post('/seed-demo', requireAuth, async (req: AuthRequest, res) => {
  try {
    // 1. Get first active business
    const bRes = await pool.query('SELECT id FROM businesses LIMIT 1');
    if (bRes.rows.length === 0) {
      return res.status(400).json({ error: 'No business found to associate seed data with.' });
    }
    const businessId = bRes.rows[0].id;

    // 2. Check and seed services if empty
    const sCount = await pool.query('SELECT COUNT(*) FROM services');
    let servicesAdded = 0;
    if (parseInt(sCount.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO services (id, business_id, name, category, price, description)
        VALUES 
          (gen_random_uuid(), $1, 'Agbada 3-Piece Bespoke', 'tailoring', 45000.00, 'Exquisite three-piece traditional Agbada with fine embroidery'),
          (gen_random_uuid(), $1, 'Senator Suit (Bespoke Cut)', 'tailoring', 35000.00, 'Tailored 2-piece modern Senator attire with custom buttons'),
          (gen_random_uuid(), $1, 'Two-Piece Corporate Suit', 'tailoring', 55000.00, 'Structured wool-blend corporate suit with custom lining'),
          (gen_random_uuid(), $1, 'Dry Cleaning: Formal Suit', 'laundry', 5000.00, 'Steam-pressed, eco-solvent dry clean for blazers and trousers'),
          (gen_random_uuid(), $1, 'Dry Cleaning: Traditional Agbada', 'laundry', 6500.00, 'Delicate hand-finish cleaning for heavily embroidered native wear'),
          (gen_random_uuid(), $1, 'Wash & Fold Laundry (5kg)', 'laundry', 7500.00, 'Everyday wear wash, machine dried and crisp folded')
      `, [businessId]);
      servicesAdded = 6;
    }

    // 3. Seed initial app_settings if empty
    const setRes = await pool.query('SELECT COUNT(*) FROM app_settings');
    let settingsAdded = 0;
    if (parseInt(setRes.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO app_settings (id, key, value, category, description)
        VALUES 
          (gen_random_uuid(), 'backend_storage_mode', 'postgresql_direct', 'database', 'Database connection mode managed securely server-side'),
          (gen_random_uuid(), 'default_currency', 'NGN', 'general', 'Default currency for order billing'),
          (gen_random_uuid(), 'whatsapp_notifications', 'enabled', 'integration', 'Automated customer dispatch and ready alerts via WhatsApp')
      `);
      settingsAdded = 3;
    }

    // 4. Seed initial backend_store entry
    await pool.query(`
      INSERT INTO backend_store (id, collection, key, data)
      VALUES (
        gen_random_uuid(), 
        'system_metadata', 
        'initial_setup', 
        $1
      )
    `, [JSON.stringify({ initializedAt: new Date().toISOString(), status: 'active', platform: 'TailorSync Cloud Backend' })]);

    res.json({
      success: true,
      message: `Database populated! Added ${servicesAdded} service catalogue items and ${settingsAdded} server configuration entries. Tables are now populated.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
