import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Database, Play, CheckCircle2, AlertCircle, RefreshCw, 
  Terminal, Code2, Server, ShieldCheck, FileCode, Copy, Check,
  Layers, Table, Sparkles, PlusCircle, ArrowRight, HardDrive, CheckCircle
} from 'lucide-react';

interface TableStat {
  name: string;
  rowCount: number;
  columnCount: number;
  isEmpty: boolean;
}

export default function SupabaseConnect() {
  const { token } = useAuth();
  
  const [status, setStatus] = useState<'connected' | 'error' | 'loading'>('loading');
  const [statusMessage, setStatusMessage] = useState('');
  const [totalRows, setTotalRows] = useState(0);
  const [tableCount, setTableCount] = useState(0);
  const [tables, setTables] = useState<TableStat[]>([]);
  const [activeTab, setActiveTab] = useState<'tables' | 'store'>('tables');
  
  const [backendEntries, setBackendEntries] = useState<any[]>([]);
  const [newEntryKey, setNewEntryKey] = useState('');
  const [newEntryCollection, setNewEntryCollection] = useState('settings');
  const [newEntryValue, setNewEntryValue] = useState('');
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const [sqlScript, setSqlScript] = useState(`-- TailorSync PostgreSQL / Supabase Database Query
-- Check table record counts across the system
SELECT 
  'businesses' AS table_name, COUNT(*) AS total_records FROM businesses
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'app_settings', COUNT(*) FROM app_settings
UNION ALL
SELECT 'backend_store', COUNT(*) FROM backend_store;`);

  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch backend status and tables
  const fetchStatusAndTables = async () => {
    try {
      const res = await fetch('/api/supabase/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStatus(data.status);
      setStatusMessage(data.message);
      setTableCount(data.tableCount || 0);
      setTotalRows(data.totalRows || 0);

      // Fetch tables with row counts
      const tablesRes = await fetch('/api/supabase/tables', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tablesData = await tablesRes.json();
      if (tablesData.tables) {
        setTables(tablesData.tables);
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setStatusMessage(err.message || 'Failed to connect to backend database');
    }
  };

  // Fetch store entries
  const fetchStoreEntries = async () => {
    try {
      const res = await fetch('/api/supabase/store', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setBackendEntries(data);
      }
    } catch (err) {
      console.error('Failed to fetch backend entries', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStatusAndTables();
      fetchStoreEntries();
    }
  }, [token]);

  // Execute SQL script directly via backend server pool (no connection strings needed in frontend)
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
          sqlScript
        })
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        setSqlError(data.error || 'Execution failed');
        if (data.detail) setSqlError(prev => `${prev}\nDetail: ${data.detail}`);
      } else {
        setSqlResult(data);
        // Refresh tables count
        fetchStatusAndTables();
      }
    } catch (err: any) {
      setSqlError(err.message || 'Failed to execute SQL');
    } finally {
      setIsExecuting(false);
    }
  };

  // Sync schema
  const handleSyncSchema = async () => {
    setIsSyncing(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/supabase/sync-schema', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setActionFeedback(data.message || 'Schema synced successfully!');
      await fetchStatusAndTables();
    } catch (err: any) {
      setActionFeedback(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Seed demo data to ensure tables are not empty
  const handleSeedDemo = async () => {
    setIsSeeding(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/supabase/seed-demo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setActionFeedback(data.message || 'Demo data inserted!');
      await fetchStatusAndTables();
    } catch (err: any) {
      setActionFeedback(`Seeding error: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  // Add entry to backend store table
  const handleSaveStoreEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryKey.trim()) return;
    setIsSavingEntry(true);

    try {
      let parsedData: any = newEntryValue;
      try {
        parsedData = JSON.parse(newEntryValue);
      } catch {
        parsedData = { value: newEntryValue, enteredAt: new Date().toISOString() };
      }

      const res = await fetch('/api/supabase/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          collection: newEntryCollection,
          key: newEntryKey,
          data: parsedData
        })
      });

      const data = await res.json();
      if (data.success) {
        setNewEntryKey('');
        setNewEntryValue('');
        setActionFeedback('New entry recorded in backend database table!');
        fetchStoreEntries();
        fetchStatusAndTables();
      }
    } catch (err: any) {
      setActionFeedback(`Save error: ${err.message}`);
    } finally {
      setIsSavingEntry(false);
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleTemplates = [
    {
      name: 'Verify Record Counts in All Tables',
      sql: `SELECT 'businesses' AS table, COUNT(*) FROM businesses
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'services', COUNT(*) FROM services
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'app_settings', COUNT(*) FROM app_settings
UNION ALL SELECT 'backend_store', COUNT(*) FROM backend_store;`
    },
    {
      name: 'Select Latest Customers & Orders',
      sql: `SELECT 
  c.full_name AS customer_name,
  c.phone,
  o.order_number,
  o.category,
  o.total_amount,
  o.status
FROM orders o
JOIN customers c ON o.customer_id = c.id
ORDER BY o.created_at DESC
LIMIT 10;`
    },
    {
      name: 'Check Server Settings Table (app_settings)',
      sql: `SELECT id, key, value, category, created_at 
FROM app_settings 
ORDER BY created_at DESC;`
    },
    {
      name: 'Check Backend Store Entries (backend_store)',
      sql: `SELECT id, collection, key, data, created_at 
FROM backend_store 
ORDER BY created_at DESC 
LIMIT 20;`
    },
    {
      name: 'Create Custom Lookup Table at Backend',
      sql: `CREATE TABLE IF NOT EXISTS system_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  source TEXT DEFAULT 'backend_worker',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure Backend Database Architecture</span>
          </div>
          <h1 className="text-3xl font-serif italic text-primary">Database & Backend Tables</h1>
          <p className="text-xs text-text-muted mt-1">
            Credentials and database keys are safely isolated on the backend. Manage tables, inspect entries, and execute queries securely.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
            status === 'connected'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'}`} />
            {status === 'connected' ? 'Database Connected' : 'Connecting to Server...'}
          </span>
          <button
            onClick={() => { fetchStatusAndTables(); fetchStoreEntries(); }}
            className="p-2 border border-border rounded-xl hover:bg-surface text-text-muted transition-colors"
            title="Refresh Database Stats"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button 
            onClick={() => setActionFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid Layout: Backend Storage Panel + SQL Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Backend Storage & Tables (Zero client credentials) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Architecture Card */}
          <div className="bg-white border border-border rounded-[28px] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Server className="w-5 h-5 text-primary" />
                <span>Backend Database</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Protected
              </span>
            </div>

            <div className="bg-surface rounded-2xl p-4 border border-border space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Storage Engine</span>
                <span className="font-semibold text-text">PostgreSQL / Supabase</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Credential Isolation</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Server-Side
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Total Tables</span>
                <span className="font-mono font-bold text-primary">{tableCount} Active</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Total Stored Rows</span>
                <span className="font-mono font-bold text-accent">{totalRows} Records</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={handleSyncSchema}
                disabled={isSyncing}
                className="py-2 px-3 bg-surface hover:bg-border/60 text-primary border border-border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
                Sync Schema
              </button>
              <button
                onClick={handleSeedDemo}
                disabled={isSeeding}
                className="py-2 px-3 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isSeeding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Seed Data
              </button>
            </div>
          </div>

          {/* Tables & Store Tabs */}
          <div className="bg-white border border-border rounded-[28px] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('tables')}
                  className={`text-xs font-bold uppercase tracking-wider pb-1 px-2 border-b-2 transition-all ${
                    activeTab === 'tables' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-text-muted hover:text-text'
                  }`}
                >
                  Tables ({tables.length})
                </button>
                <button
                  onClick={() => setActiveTab('store')}
                  className={`text-xs font-bold uppercase tracking-wider pb-1 px-2 border-b-2 transition-all ${
                    activeTab === 'store' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-text-muted hover:text-text'
                  }`}
                >
                  Backend Store ({backendEntries.length})
                </button>
              </div>
            </div>

            {activeTab === 'tables' ? (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {tables.map(t => (
                  <div 
                    key={t.name}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-surface/50 hover:bg-surface text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Table className="w-3.5 h-3.5 text-primary" />
                      <span className="font-mono font-medium text-text">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        t.rowCount > 0 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.rowCount} {t.rowCount === 1 ? 'row' : 'rows'}
                      </span>
                    </div>
                  </div>
                ))}

                {tables.some(t => t.isEmpty) && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2 mt-3">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Some tables are currently empty. Click <strong>Seed Data</strong> above to populate initial catalog services and settings.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <form onSubmit={handleSaveStoreEntry} className="space-y-2.5 p-3 bg-surface rounded-xl border border-border">
                  <span className="text-[11px] font-bold text-primary block">Save Entry to Backend Table</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Collection (e.g. settings)"
                      value={newEntryCollection}
                      onChange={e => setNewEntryCollection(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-border bg-white text-xs"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Key (e.g. system_mode)"
                      value={newEntryKey}
                      onChange={e => setNewEntryKey(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-border bg-white text-xs"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Data or JSON value"
                    value={newEntryValue}
                    onChange={e => setNewEntryValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-white text-xs"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSavingEntry}
                    className="w-full py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isSavingEntry ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                    Store Entry at Backend
                  </button>
                </form>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {backendEntries.length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-4">No custom entries yet.</p>
                  ) : (
                    backendEntries.map(item => (
                      <div key={item.id} className="p-2.5 bg-surface border border-border rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-primary">{item.collection} / {item.key}</span>
                          <span className="text-[10px] text-text-muted">{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        <pre className="text-[10px] bg-white p-1.5 rounded border border-border font-mono overflow-x-auto">
                          {JSON.stringify(item.data, null, 2)}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: SQL Script Console (Executes securely on server) */}
        <div className="lg:col-span-2 bg-white border border-border rounded-[28px] p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Code2 className="w-5 h-5 text-primary" />
              <span>SQL Query & Management Console</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  const selected = sampleTemplates.find(t => t.name === e.target.value);
                  if (selected) setSqlScript(selected.sql);
                }}
                className="px-3 py-1.5 border border-border rounded-xl text-xs bg-surface font-medium focus:outline-none focus:border-primary"
              >
                <option value="">Choose SQL Query Template...</option>
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

          <p className="text-xs text-text-muted leading-relaxed">
            Execute SQL queries directly on the backend database. All queries run server-side through the authenticated PostgreSQL connection pool with zero credentials exposed to the browser.
          </p>

          {/* SQL Editor Area */}
          <div className="relative border border-border rounded-2xl bg-[#1E1E1E] text-emerald-400 p-4 font-mono text-xs overflow-hidden shadow-inner">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-[11px] text-gray-400 font-sans">
              <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-emerald-400" /> Server-Authoritative SQL Console</span>
              <span className="text-emerald-500 font-mono text-[10px]">PostgreSQL 15+</span>
            </div>
            <textarea
              rows={11}
              value={sqlScript}
              onChange={(e) => setSqlScript(e.target.value)}
              placeholder="Enter your SQL query..."
              className="w-full bg-transparent text-gray-100 font-mono text-xs focus:outline-none resize-y leading-relaxed"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">
              {sqlScript.split('\n').length} lines | {sqlScript.length} characters
            </span>
            <button
              type="button"
              onClick={handleExecuteSql}
              disabled={isExecuting || !sqlScript.trim()}
              className="px-6 py-2.5 bg-primary text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Executing on Backend...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Run Query
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
            <div className="p-4 bg-surface border border-border rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{sqlResult.message || 'Query Executed Successfully'}</span>
                </div>
                {sqlResult.durationMs !== undefined && (
                  <span className="text-[10px] font-mono text-text-muted">
                    Execution Time: {sqlResult.durationMs}ms
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
                <div className="overflow-x-auto max-h-64 border border-border rounded-xl bg-white mt-2">
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
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
