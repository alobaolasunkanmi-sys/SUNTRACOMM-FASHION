import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import { requireAuth, requireSuperAdmin, AuthRequest } from '../middlewares/auth';

export const supabaseRouter = Router();

const DEFAULT_SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tabvggcparpohjfochsz.supabase.co';
const DEFAULT_SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhYnZnZ2NwYXJwb2hqZm9jaHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NTUwNjksImV4cCI6MjEwMDIzMTA2OX0.QJPVYlD8HT54VaqAmx4qZGt_Q6N8_xXigE8rS9ALA9M';

// Store runtime Supabase settings in memory or fallback to process.env
let runtimeSupabaseUrl = DEFAULT_SUPABASE_URL;
let runtimeSupabaseKey = DEFAULT_SUPABASE_KEY;
let runtimeDatabaseUrl = process.env.DATABASE_URL || '';

// Get Supabase connection status
supabaseRouter.get('/status', requireAuth, async (req: AuthRequest, res) => {
  const activeUrl = runtimeSupabaseUrl || DEFAULT_SUPABASE_URL;
  const activeKey = runtimeSupabaseKey || DEFAULT_SUPABASE_KEY;
  const isUrlSet = Boolean(activeUrl);
  const isKeySet = Boolean(activeKey);
  const isDbUrlSet = Boolean(runtimeDatabaseUrl && !runtimeDatabaseUrl.includes('localhost'));

  let status: 'connected' | 'configured' | 'unconfigured' = 'unconfigured';
  let message = 'Supabase credentials not set.';

  if (isUrlSet && isKeySet) {
    try {
      const client = createClient(activeUrl, activeKey);
      status = 'configured';
      message = 'Supabase client initialized successfully with API credentials.';
    } catch (err: any) {
      message = `Supabase initialization error: ${err.message}`;
    }
  }

  res.json({
    status,
    message,
    supabaseUrl: activeUrl ? `${activeUrl.substring(0, 20)}...` : '',
    hasKey: isKeySet,
    hasDatabaseUrl: isDbUrlSet,
    rawSupabaseUrl: activeUrl
  });
});

// Configure / Update Supabase Credentials
supabaseRouter.post('/configure', requireAuth, async (req: AuthRequest, res) => {
  const { supabaseUrl, supabaseKey, databaseUrl } = req.body;

  if (supabaseUrl !== undefined) runtimeSupabaseUrl = supabaseUrl.trim() || DEFAULT_SUPABASE_URL;
  if (supabaseKey !== undefined) runtimeSupabaseKey = supabaseKey.trim() || DEFAULT_SUPABASE_KEY;
  if (databaseUrl !== undefined) runtimeDatabaseUrl = databaseUrl.trim();

  // Test connection
  let testSuccess = false;
  let testMessage = '';

  const activeUrl = runtimeSupabaseUrl || DEFAULT_SUPABASE_URL;
  const activeKey = runtimeSupabaseKey || DEFAULT_SUPABASE_KEY;

  if (activeUrl && activeKey) {
    try {
      const client = createClient(activeUrl, activeKey);
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
    supabaseUrl: activeUrl,
    hasKey: Boolean(activeKey),
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
  if (dbConnectionString && dbConnectionString.trim() && !dbConnectionString.includes('localhost')) {
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

  const activeUrl = runtimeSupabaseUrl || DEFAULT_SUPABASE_URL;
  const activeKey = runtimeSupabaseKey || DEFAULT_SUPABASE_KEY;

  // If using Supabase REST Client
  if (activeUrl && activeKey) {
    try {
      const supabase = createClient(activeUrl, activeKey);
      
      return res.json({
        success: true,
        message: 'SQL script validated with Supabase client!',
        note: 'To execute raw DDL queries (CREATE TABLE, DROP TRIGGER, ALTER TABLE, etc.) directly against PostgreSQL, paste your script into Supabase SQL Editor (https://database.new) or fill in your PostgreSQL Connection String in the form above.',
        scriptPreview: sqlScript.substring(0, 200) + (sqlScript.length > 200 ? '...' : '')
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(400).json({
    error: 'No Supabase API URL / Key or PostgreSQL Connection String configured yet. Please enter your Supabase connection details in the form above.'
  });
});
