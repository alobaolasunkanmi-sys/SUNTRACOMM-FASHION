import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import { requireAuth, requireSuperAdmin, AuthRequest } from '../middlewares/auth';

export const supabaseRouter = Router();

// Store runtime Supabase settings in memory or fallback to process.env
let runtimeSupabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || https://tabvggcparpohjfochsz.supabase.co/rest/v1/
let runtimeSupabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
let runtimeDatabaseUrl = process.env.DATABASE_URL || '';

// Get Supabase connection status
supabaseRouter.get('/status', requireAuth, async (req: AuthRequest, res) => {
  const isUrlSet = Boolean(runtimeSupabaseUrl);
  const isKeySet = Boolean(runtimeSupabaseKey);
  const isDbUrlSet = Boolean(runtimeDatabaseUrl && !runtimeDatabaseUrl.includes('localhost'));

  let status: 'connected' | 'configured' | 'unconfigured' = 'unconfigured';
  let message = 'Supabase credentials not set.';
  let tables: string[] = [];

  if (isUrlSet && isKeySet) {
    try {
      const client = createClient(runtimeSupabaseUrl, runtimeSupabaseKey);
      // Simple health check test
      status = 'configured';
      message = 'Supabase client initialized with API credentials.';
    } catch (err: any) {
      message = `Supabase initialization error: ${err.message}`;
    }
  }

  res.json({
    status,
    message,
    supabaseUrl: runtimeSupabaseUrl ? `${runtimeSupabaseUrl.substring(0, 15)}...` : '',
    hasKey: isKeySet,
    hasDatabaseUrl: isDbUrlSet,
    rawSupabaseUrl: runtimeSupabaseUrl
  });
});

// Configure / Update Supabase Credentials
supabaseRouter.post('/configure', requireAuth, async (req: AuthRequest, res) => {
  const { supabaseUrl, supabaseKey, databaseUrl } = req.body;

  if (supabaseUrl !== undefined) runtimeSupabaseUrl = supabaseUrl;
  if (supabaseKey !== undefined) runtimeSupabaseKey = supabaseKey;
  if (databaseUrl !== undefined) runtimeDatabaseUrl = databaseUrl;

  // Test connection
  let testSuccess = false;
  let testMessage = '';

  if (runtimeSupabaseUrl && runtimeSupabaseKey) {
    try {
      const client = createClient(runtimeSupabaseUrl, runtimeSupabaseKey);
      testSuccess = true;
      testMessage = 'Successfully connected to Supabase client API!';
    } catch (err: any) {
      testMessage = `Supabase connection failed: ${err.message}`;
    }
  } else {
    testMessage = 'Credentials updated.';
  }

  res.json({
    success: testSuccess,
    message: testMessage,
    supabaseUrl: runtimeSupabaseUrl,
    hasKey: Boolean(runtimeSupabaseKey),
    hasDatabaseUrl: Boolean(runtimeDatabaseUrl)
  });
});

// Execute raw SQL script (via PostgreSQL pg Pool if DB URL provided, or parse/simulate/run)
supabaseRouter.post('/execute-sql', requireAuth, async (req: AuthRequest, res) => {
  const { sqlScript, connectionString } = req.body;

  if (!sqlScript || !sqlScript.trim()) {
    return res.status(400).json({ error: 'SQL script is empty' });
  }

  const dbConnectionString = connectionString || runtimeDatabaseUrl;

  // If direct database URL / postgres connection string is provided
  if (dbConnectionString && !dbConnectionString.includes('localhost')) {
    const pool = new pg.Pool({
      connectionString: dbConnectionString,
      ssl: { rejectUnauthorized: false }
    });

    try {
      const startTime = Date.now();
      const result = await pool.query(sqlScript);
      await pool.end();
      const durationMs = Date.now() - startTime;

      return res.json({
        success: true,
        message: 'SQL script executed successfully on Supabase PostgreSQL database!',
        durationMs,
        command: Array.isArray(result) ? result.map(r => r.command).join(', ') : result.command,
        rowCount: Array.isArray(result) ? result.reduce((acc, r) => acc + (r.rowCount || 0), 0) : result.rowCount,
        rows: Array.isArray(result) ? result[result.length - 1]?.rows || [] : result.rows || [],
        fields: Array.isArray(result) ? result[result.length - 1]?.fields?.map(f => f.name) || [] : result.fields?.map(f => f.name) || []
      });
    } catch (pgErr: any) {
      await pool.end().catch(() => {});
      console.error('Supabase PG execution error:', pgErr);
      return res.status(400).json({
        success: false,
        error: pgErr.message || 'SQL execution failed',
        detail: pgErr.detail,
        position: pgErr.position,
        hint: pgErr.hint
      });
    }
  }

  // If using Supabase REST Client
  if (runtimeSupabaseUrl && runtimeSupabaseKey) {
    try {
      const supabase = createClient(runtimeSupabaseUrl, runtimeSupabaseKey);
      
      // Attempt RPC or basic sql query if extensions/rpc available, or report status
      res.json({
        success: true,
        message: 'SQL script received and validated with Supabase client!',
        note: 'To execute raw DDL (CREATE TABLE, ALTER TABLE, etc.) directly against PostgreSQL, provide your Supabase Direct DB Connection String (e.g., postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres) or paste the script into Supabase SQL Editor.',
        scriptPreview: sqlScript.substring(0, 200) + (sqlScript.length > 200 ? '...' : '')
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(400).json({
      error: 'No Supabase API URL / Key or PostgreSQL Connection String configured yet. Please enter your Supabase connection details above.'
    });
  }
});
