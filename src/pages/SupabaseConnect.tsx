import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Database, Play, CheckCircle2, AlertCircle, RefreshCw, 
  Terminal, Code2, Server, Key, FileCode, Copy, Check
} from 'lucide-react';

export default function SupabaseConnect() {
  const { token } = useAuth();
  
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [databaseUrl, setDatabaseUrl] = useState('');
  
  const [status, setStatus] = useState<'connected' | 'configured' | 'unconfigured'>('unconfigured');
  const [statusMessage, setStatusMessage] = useState('');
  
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const [sqlScript, setSqlScript] = useState(`-- TailorSync Complete Supabase Database Schema
-- Drop existing tables to ensure clean UUID type compatibility across all foreign keys
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS communications CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;

-- 1. BUSINESSES TABLE
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'tailoring',
  registration_number VARCHAR(100),
  owner_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  logo_url TEXT,
  description TEXT,
  whatsapp_number VARCHAR(50),
  whatsapp_settings JSONB,
  status VARCHAR(50) DEFAULT 'active',
  currency VARCHAR(10) DEFAULT 'NGN',
  tax_rate DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. USERS TABLE (UUID primary key matching audit_logs.user_id)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  username VARCHAR(100),
  staff_id VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. CUSTOMERS TABLE
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  whatsapp_number VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  gender VARCHAR(20),
  measurements JSONB,
  total_spending DECIMAL(12,2) DEFAULT 0.00,
  outstanding_balance DECIMAL(12,2) DEFAULT 0.00,
  last_order_date TIMESTAMP WITH TIME ZONE,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. SERVICES TABLE
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. ORDERS TABLE
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(100) NOT NULL,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'new',
  total_amount DECIMAL(12,2) NOT NULL,
  total_paid DECIMAL(12,2) DEFAULT 0.00,
  balance DECIMAL(12,2) DEFAULT 0.00,
  pickup_date TIMESTAMP WITH TIME ZONE,
  expected_delivery_date TIMESTAMP WITH TIME ZONE,
  actual_delivery_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. ORDER ITEMS TABLE
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  description TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  measurements JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. PAYMENTS TABLE
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  reference VARCHAR(255),
  status VARCHAR(50) DEFAULT 'completed',
  recorded_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 8. COMMUNICATIONS TABLE
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 9. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);`);

  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch current Supabase configuration status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/supabase/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStatus(data.status);
      setStatusMessage(data.message);
      if (data.rawSupabaseUrl) setSupabaseUrl(data.rawSupabaseUrl);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) fetchStatus();
  }, [token]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfiguring(true);
    setSqlError(null);

    try {
      const res = await fetch('/api/supabase/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          supabaseUrl,
          supabaseKey,
          databaseUrl
        })
      });

      const data = await res.json();
      if (data.success) {
        setStatus('connected');
        setStatusMessage(data.message || 'Supabase configured successfully!');
      } else {
        setStatusMessage(data.message || 'Config saved.');
      }
    } catch (err: any) {
      setStatusMessage(`Configuration error: ${err.message}`);
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleExecuteSql = async () => {
    if (!sqlScript.trim()) return;
    setIsExecuting(true);
    setSqlResult(null);
    setSqlError(null);

    try {
      const res = await fetch('/api/supabase/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sqlScript,
          connectionString: databaseUrl
        })
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        setSqlError(data.error || 'Execution failed');
        if (data.detail) setSqlError(prev => `${prev}\nDetail: ${data.detail}`);
        if (data.note) setSqlError(prev => `${prev}\nNote: ${data.note}`);
      } else {
        setSqlResult(data);
      }
    } catch (err: any) {
      setSqlError(err.message || 'Failed to execute SQL');
    } finally {
      setIsExecuting(false);
    }
  };

  const sampleTemplates = [
    {
      name: '📦 Core Schema (All Tables & Fixed Types)',
      sql: `-- Fixed TailorSync Supabase Schema Script
-- Drop older incompatible tables if re-initialization is needed
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS communications CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;

-- 1. BUSINESSES
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'tailoring',
  registration_number VARCHAR(100),
  owner_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  logo_url TEXT,
  description TEXT,
  whatsapp_number VARCHAR(50),
  whatsapp_settings JSONB,
  status VARCHAR(50) DEFAULT 'active',
  currency VARCHAR(10) DEFAULT 'NGN',
  tax_rate DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. USERS (UUID id to match foreign keys)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  username VARCHAR(100),
  staff_id VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. CUSTOMERS
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  whatsapp_number VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  gender VARCHAR(20),
  measurements JSONB,
  total_spending DECIMAL(12,2) DEFAULT 0.00,
  outstanding_balance DECIMAL(12,2) DEFAULT 0.00,
  last_order_date TIMESTAMP WITH TIME ZONE,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. SERVICES
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. ORDERS
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(100) NOT NULL,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'new',
  total_amount DECIMAL(12,2) NOT NULL,
  total_paid DECIMAL(12,2) DEFAULT 0.00,
  balance DECIMAL(12,2) DEFAULT 0.00,
  pickup_date TIMESTAMP WITH TIME ZONE,
  expected_delivery_date TIMESTAMP WITH TIME ZONE,
  actual_delivery_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. ORDER ITEMS
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  description TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  measurements JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. PAYMENTS
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  reference VARCHAR(255),
  status VARCHAR(50) DEFAULT 'completed',
  recorded_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 8. COMMUNICATIONS
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 9. AUDIT LOGS (Matches UUID user_id)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);`
    },
    {
      name: '🔧 Reconcile audit_logs user_id FK (Migration)',
      sql: `-- Migration: Reconcile user_id foreign key type mismatch in audit_logs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing foreign key constraints
ALTER TABLE IF EXISTS audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE IF EXISTS payments DROP CONSTRAINT IF EXISTS payments_recorded_by_id_fkey;

-- Drop sequence defaults on integer columns if present
ALTER TABLE IF EXISTS users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS audit_logs ALTER COLUMN user_id DROP DEFAULT;

-- Drop legacy incompatible tables
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Recreate users with UUID primary key
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  username VARCHAR(100),
  staff_id VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Recreate audit_logs with matching UUID user_id
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);`
    },
    {
      name: '🔒 Supabase Row Level Security (RLS)',
      sql: `-- Enable Row Level Security (RLS) on Tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their business data
CREATE POLICY "Allow public read access" ON businesses 
  FOR SELECT USING (true);
  
CREATE POLICY "Allow full access to business customers" ON customers 
  FOR ALL USING (auth.uid() IS NOT NULL);`
    },
    {
      name: '⚡ Sample Data Insertion',
      sql: `-- Insert Sample Business & Customer Data
INSERT INTO businesses (name, type, owner_name, status)
VALUES ('Royal Threads Atelier', 'tailoring', 'Chief Samuel', 'active');

INSERT INTO customers (full_name, phone, outstanding_balance)
VALUES ('Oluwaseun Adebayo', '+2348012345678', 15000.00),
       ('Chidimma Eze', '+2348098765432', 0.00);

SELECT * FROM customers;`
    }
  ];

  const copySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-1">
            <Database className="w-4 h-4 text-accent" /> External Integration
          </div>
          <h1 className="text-4xl font-serif italic text-primary">Supabase Database Connector</h1>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
            status === 'connected'
              ? 'bg-[#E2E8E0] text-[#2D3B2D] border-[#BDC8BB]'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-[#4A5D4E]' : 'bg-amber-500'}`} />
            {status === 'connected' ? 'Supabase Connected' : 'Configuration Pending'}
          </span>
          <button
            onClick={fetchStatus}
            className="p-2 border border-border rounded-xl hover:bg-surface text-text-muted transition-colors"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Layout: Config + SQL Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Connection Credentials Form */}
        <div className="lg:col-span-1 bg-white border border-border rounded-[32px] p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Server className="w-5 h-5 text-primary" />
            <span>Connection Credentials</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Connect your Supabase project URL and keys, or direct PostgreSQL connection string to run migrations and queries.
          </p>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}https://tabvggcparpohjfochsz.supabase.co/rest/v1/
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                Supabase Anon / Service Role Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs focus:border-primary focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                PostgreSQL Connection String (Optional for direct SQL)
              </label>
              <input
                type="password"
                placeholder="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
                value={databaseUrl}
                onChange={(e) => setDatabaseUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs focus:border-primary focus:outline-none font-mono"
              />
              <p className="text-[10px] text-text-muted mt-1">
                Found in Supabase Project Settings &gt; Database &gt; Connection string (URI).
              </p>
            </div>

            <button
              type="submit"
              disabled={isConfiguring}
              className="w-full py-2.5 px-4 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              {isConfiguring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Save & Verify Supabase
            </button>
          </form>

          {statusMessage && (
            <div className="p-3 bg-surface rounded-xl border border-border text-xs text-text flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* SQL Script Console */}
        <div className="lg:col-span-2 bg-white border border-border rounded-[32px] p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Code2 className="w-5 h-5 text-primary" />
              <span>Supabase SQL Script Console</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  const selected = sampleTemplates.find(t => t.name === e.target.value);
                  if (selected) setSqlScript(selected.sql);
                }}
                className="px-3 py-1.5 border border-border rounded-xl text-xs bg-surface font-medium focus:outline-none focus:border-primary"
              >
                <option value="">Load Sample SQL Template...</option>
                {sampleTemplates.map(t => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={copySql}
                className="p-1.5 border border-border rounded-lg text-xs hover:bg-surface text-text-muted flex items-center gap-1"
                title="Copy SQL Script"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <p className="text-xs text-text-muted">
            Provide your SQL script below to execute table creation, data migrations, or queries directly against your Supabase database.
          </p>

          {/* SQL Editor Area */}
          <div className="relative border border-border rounded-2xl bg-[#1E1E1E] text-emerald-400 p-4 font-mono text-xs overflow-hidden shadow-inner">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-[11px] text-gray-400 font-sans">
              <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-accent" /> SQL Editor</span>
              <span>PostgreSQL Compatible</span>
            </div>
            <textarea
              rows={12}
              value={sqlScript}
              onChange={(e) => setSqlScript(e.target.value)}
              placeholder="Paste your SQL script here..."
              className="w-full bg-transparent text-gray-100 font-mono text-xs focus:outline-none resize-y leading-relaxed"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">
              {sqlScript.split('\n').length} lines | {sqlScript.length} chars
            </span>
            <button
              type="button"
              onClick={handleExecuteSql}
              disabled={isExecuting || !sqlScript.trim()}
              className="px-6 py-2.5 bg-accent text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-accent/90 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Executing SQL...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Run SQL Script
                </>
              )}
            </button>
          </div>

          {/* Error display */}
          {sqlError && (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs space-y-1 font-mono whitespace-pre-wrap">
              <div className="font-bold font-sans flex items-center gap-1.5 text-red-800">
                <AlertCircle className="w-4 h-4 shrink-0" /> Execution Error
              </div>
              <div>{sqlError}</div>
            </div>
          )}

          {/* Execution Result Display */}
          {sqlResult && (
            <div className="p-4 bg-[#E2E8E0]/40 border border-[#BDC8BB] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span>{sqlResult.message || 'SQL Executed Successfully'}</span>
                </div>
                {sqlResult.durationMs && (
                  <span className="text-[10px] font-mono text-text-muted">
                    Time: {sqlResult.durationMs}ms
                  </span>
                )}
              </div>

              {sqlResult.command && (
                <div className="text-xs text-text-muted font-mono">
                  Command: <span className="font-bold text-primary">{sqlResult.command}</span>
                  {sqlResult.rowCount !== undefined && ` | Affected Rows: ${sqlResult.rowCount}`}
                </div>
              )}

              {/* Data table output if SELECT returned rows */}
              {Array.isArray(sqlResult.rows) && sqlResult.rows.length > 0 && (
                <div className="overflow-x-auto max-h-60 border border-border rounded-xl bg-white mt-2">
                  <table className="min-w-full text-xs font-mono">
                    <thead className="bg-surface border-b border-border">
                      <tr>
                        {sqlResult.fields?.map((field: string) => (
                          <th key={field} className="px-3 py-2 text-left text-[10px] uppercase font-bold text-text-muted">
                            {field}
                          </th>
                        )) || Object.keys(sqlResult.rows[0]).map(key => (
                          <th key={key} className="px-3 py-2 text-left text-[10px] uppercase font-bold text-text-muted">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sqlResult.rows.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-surface/50">
                          {Object.values(row).map((val: any, valIdx: number) => (
                            <td key={valIdx} className="px-3 py-1.5 whitespace-nowrap text-text">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val ?? 'NULL')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {sqlResult.note && (
                <p className="text-[11px] text-text-muted italic pt-1 border-t border-border">
                  ℹ️ {sqlResult.note}
                </p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
