import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  MessageSquare, Send, Users, Sparkles, CheckCircle2, AlertCircle, 
  Loader2, ExternalLink, RefreshCw, Smartphone, History, Copy, Check
} from 'lucide-react';

export default function WhatsAppSettings() {
  const { token, business, updateBusiness } = useAuth();

  // WhatsApp Configuration State
  const [whatsappNumber, setWhatsappNumber] = useState(business?.whatsappNumber || business?.phone || '');
  const [greetingTemplate, setGreetingTemplate] = useState(
    business?.whatsappSettings?.greetingTemplate || 
    "Hello {{customer_name}}, thank you for choosing {{business_name}}! How can we assist you today?"
  );
  const [reminderTemplate, setReminderTemplate] = useState(
    business?.whatsappSettings?.reminderTemplate || 
    "Hello {{customer_name}}, your order with {{business_name}} is ready for pickup! Please reach out if you need assistance."
  );
  const [paymentTemplate, setPaymentTemplate] = useState(
    business?.whatsappSettings?.paymentTemplate || 
    "Dear {{customer_name}}, this is a friendly reminder from {{business_name}} regarding an outstanding balance of {{outstanding_balance}}. Thank you!"
  );

  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState('');
  const [configError, setConfigError] = useState('');

  // Broadcast Messaging State
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'active' | 'inactive' | 'pending_payment' | 'new_customers' | 'ready_orders'>('inactive');
  const [targetData, setTargetData] = useState<{ totalCount: number; customers: any[] }>({ totalCount: 0, customers: [] });
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("Hello {{customer_name}}, we miss you at {{business_name}}! Come in this week for a 10% discount on your next tailoring or laundry order.");
  
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Communications History Log
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    fetchTargets(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchTargets = (category: string) => {
    if (!token) return;
    setIsLoadingTargets(true);
    fetch(`/api/communications/broadcast-targets?category=${category}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setTargetData(data || { totalCount: 0, customers: [] });
      })
      .catch(console.error)
      .finally(() => setIsLoadingTargets(false));
  };

  const fetchHistory = () => {
    if (!token) return;
    setIsLoadingHistory(true);
    fetch('/api/communications/history', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setHistoryLogs(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setIsLoadingHistory(false));
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigSuccess('');
    setConfigError('');

    const whatsappSettings = {
      greetingTemplate,
      reminderTemplate,
      paymentTemplate,
    };

    try {
      const res = await fetch('/api/businesses/current', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          whatsappNumber,
          whatsappSettings
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update WhatsApp settings');

      updateBusiness(data);
      setConfigSuccess('WhatsApp configuration saved successfully!');
      setTimeout(() => setConfigSuccess(''), 4000);
    } catch (err: any) {
      setConfigError(err.message || 'Error saving settings.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleInsertVariable = (variable: string) => {
    setBroadcastMessage(prev => prev + ' ' + variable);
  };

  const handleApplyPreset = (presetType: string) => {
    if (presetType === 'inactive') {
      setSelectedCategory('inactive');
      setBroadcastMessage("Hello {{customer_name}}, we miss seeing you at {{business_name}}! Visit us today or reply to this message to book your next order.");
    } else if (presetType === 'pending_payment') {
      setSelectedCategory('pending_payment');
      setBroadcastMessage("Dear {{customer_name}}, a gentle reminder regarding your outstanding balance of {{outstanding_balance}} with {{business_name}}. Please let us know when payment is completed. Thank you!");
    } else if (presetType === 'ready') {
      setSelectedCategory('ready_orders');
      setBroadcastMessage("Great news {{customer_name}}! Your order with {{business_name}} is completed and ready for pickup. We look forward to seeing you soon!");
    } else if (presetType === 'all') {
      setSelectedCategory('all');
      setBroadcastMessage("Greetings {{customer_name}} from all of us at {{business_name}}! Thank you for being a valued customer. Contact us anytime for new orders or inquiries.");
    }
  };

  const handleSendBroadcast = async () => {
    if (!targetData.customers || targetData.customers.length === 0) {
      alert('No recipient customers found in this category.');
      return;
    }
    if (!broadcastMessage.trim()) {
      alert('Please enter a message to broadcast.');
      return;
    }

    setIsBroadcasting(true);
    setBroadcastResult(null);

    const targetCustomerIds = targetData.customers.map(c => c.id);

    try {
      const res = await fetch('/api/communications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category: selectedCategory,
          templateMessage: broadcastMessage,
          targetCustomerIds,
          type: 'whatsapp'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send broadcast');

      setBroadcastResult(data);
      fetchHistory(); // Refresh history
    } catch (err: any) {
      alert(err.message || 'Error broadcasting messages');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const categories = [
    { id: 'inactive', label: '💤 Inactive Customers', desc: '> 60 days since last order' },
    { id: 'pending_payment', label: '💳 Pending Payments', desc: 'Outstanding balance > 0' },
    { id: 'ready_orders', label: '📦 Orders Ready', desc: 'Ready for pickup' },
    { id: 'active', label: '⚡ Active Customers', desc: 'Ordered within 60 days' },
    { id: 'new_customers', label: '🌟 New Customers', desc: 'Added this month' },
    { id: 'all', label: '👥 All Customers', desc: 'Entire customer database' },
  ];

  const getSamplePreview = () => {
    const sampleName = targetData.customers[0]?.fullName || "Adebayo Johnson";
    const sampleBalance = targetData.customers[0]?.outstandingBalance 
      ? `${business?.currency || 'NGN'} ${Number(targetData.customers[0].outstandingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      : `${business?.currency || 'NGN'} 15,000.00`;

    return broadcastMessage
      .replace(/\{\{customer_name\}\}/g, sampleName)
      .replace(/\{\{business_name\}\}/g, business?.name || "Royal Tailors")
      .replace(/\{\{outstanding_balance\}\}/g, sampleBalance)
      .replace(/\{\{phone\}\}/g, "+234 801 234 5678");
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-serif italic text-primary mb-2 flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-primary" />
          WhatsApp Settings & Broadcast Center
        </h2>
        <p className="text-sm text-text-muted">
          Configure your business WhatsApp line and send targeted broadcast messages to customer segments.
        </p>
      </div>

      {/* SECTION 1: WhatsApp Configuration */}
      <div className="bg-surface/30 border border-border rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E2E8E0] text-[#3C4E3D] flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-primary">Business WhatsApp Line</h3>
              <p className="text-xs text-text-muted">Set the primary WhatsApp phone number customers see and contact.</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-[#E2E8E0] text-[#2D3B2D] border border-[#BDC8BB] text-xs font-semibold rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4A5D4E]"></span> Ready
          </span>
        </div>

        {configSuccess && (
          <div className="p-4 bg-[#E2E8E0] text-[#2D3B2D] rounded-xl flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{configSuccess}</span>
          </div>
        )}

        {configError && (
          <div className="p-4 bg-accent/10 text-accent rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{configError}</span>
          </div>
        )}

        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
              WhatsApp Phone Number
            </label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full max-w-md px-4 py-3 rounded-xl border border-border bg-white focus:border-primary focus:outline-none text-sm"
              placeholder="+234 801 234 5678"
            />
            <p className="text-[11px] text-text-muted mt-1">Include country code (e.g. +234 for Nigeria, +1 for USA).</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSavingConfig}
              className="px-6 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSavingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save WhatsApp Number'}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: Broadcast Composer & Audience Selector */}
      <div className="border border-border rounded-2xl p-6 space-y-6 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" /> Broadcast Message Center
            </h3>
            <p className="text-xs text-text-muted">Select a customer category, compose a personalized message, and broadcast instantly.</p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-muted font-medium">Quick Presets:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset('inactive')}
              className="px-2.5 py-1 bg-surface hover:bg-primary hover:text-white text-text text-xs rounded-lg transition-colors border border-border"
            >
              Re-engage Inactive
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('pending_payment')}
              className="px-2.5 py-1 bg-surface hover:bg-primary hover:text-white text-text text-xs rounded-lg transition-colors border border-border"
            >
              Payment Reminders
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('ready')}
              className="px-2.5 py-1 bg-surface hover:bg-primary hover:text-white text-text text-xs rounded-lg transition-colors border border-border"
            >
              Ready Pickups
            </button>
          </div>
        </div>

        {/* Audience Category Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
            1. Select Target Category
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`p-3 text-left rounded-xl border transition-all ${
                    isSelected 
                      ? 'border-primary bg-surface font-bold shadow-sm' 
                      : 'border-border bg-white hover:border-primary/50 text-text-muted'
                  }`}
                >
                  <p className="text-xs font-semibold text-primary">{cat.label}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{cat.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Audience Count Summary */}
        <div className="p-4 bg-background border border-border rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-xs font-bold text-primary">
                {isLoadingTargets ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Counting target customers...</span>
                ) : (
                  `${targetData.totalCount} recipient customer${targetData.totalCount === 1 ? '' : 's'} found in this category`
                )}
              </p>
              <p className="text-[11px] text-text-muted">
                Messages will be generated and personalized for each recipient.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchTargets(selectedCategory)}
            className="p-2 text-text-muted hover:text-primary transition-colors"
            title="Refresh audience list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Message Composer & Variable Tags */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
                2. Compose Message Template
              </label>
              <span className="text-[10px] text-text-muted">{broadcastMessage.length} characters</span>
            </div>

            {/* Variable Insertion Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-text-muted">Insert Tag:</span>
              <button
                type="button"
                onClick={() => handleInsertVariable('{{customer_name}}')}
                className="px-2 py-0.5 bg-surface text-primary border border-border rounded-md text-[11px] font-mono hover:bg-primary hover:text-white transition-colors"
              >
                + Customer Name
              </button>
              <button
                type="button"
                onClick={() => handleInsertVariable('{{business_name}}')}
                className="px-2 py-0.5 bg-surface text-primary border border-border rounded-md text-[11px] font-mono hover:bg-primary hover:text-white transition-colors"
              >
                + Business Name
              </button>
              <button
                type="button"
                onClick={() => handleInsertVariable('{{outstanding_balance}}')}
                className="px-2 py-0.5 bg-surface text-primary border border-border rounded-md text-[11px] font-mono hover:bg-primary hover:text-white transition-colors"
              >
                + Balance
              </button>
            </div>

            <textarea
              rows={5}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full p-4 rounded-xl border border-border bg-white focus:border-primary focus:outline-none text-sm font-sans"
              placeholder="Type your message here..."
            />
          </div>

          {/* Live WhatsApp Bubble Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
              Live WhatsApp Preview
            </label>

            <div className="bg-[#E5DDD5] p-4 rounded-2xl border border-border h-[180px] flex flex-col justify-end shadow-inner relative overflow-hidden">
              <div className="bg-[#DCF8C6] p-3 rounded-xl rounded-br-none shadow-sm text-xs text-slate-800 leading-relaxed font-sans max-w-[90%] self-end border border-[#BDE0A8]">
                <p className="whitespace-pre-wrap">{getSamplePreview()}</p>
                <div className="text-[9px] text-slate-500 text-right mt-1 font-mono">10:42 AM ✓✓</div>
              </div>
            </div>
            <p className="text-[10px] text-text-muted italic text-center">Sample preview with mock customer values</p>
          </div>
        </div>

        {/* Broadcast Action Button */}
        <div className="flex justify-end pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleSendBroadcast}
            disabled={isBroadcasting || targetData.totalCount === 0 || !broadcastMessage.trim()}
            className="px-8 py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {isBroadcasting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Preparing Broadcast...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Broadcast to {targetData.totalCount} Customer{targetData.totalCount === 1 ? '' : 's'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* MODAL / DRAWER: Broadcast Dispatch Links */}
      {broadcastResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] border border-border max-w-2xl w-full p-8 space-y-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-xl font-serif italic text-primary flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-[#4A5D4E]" />
                  Broadcast Dispatched Successfully!
                </h3>
                <p className="text-xs text-text-muted">
                  Saved {broadcastResult.count} personalized message record{broadcastResult.count === 1 ? '' : 's'}. Click below to dispatch via WhatsApp Web/App.
                </p>
              </div>
              <button
                onClick={() => setBroadcastResult(null)}
                className="text-text-muted hover:text-primary text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {broadcastResult.dispatchedMessages?.map((item: any, idx: number) => (
                <div key={item.id || idx} className="p-4 border border-border rounded-2xl bg-surface/30 flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-bold text-primary">{item.customerName} <span className="text-text-muted font-normal">({item.phone || 'No phone'})</span></p>
                    <p className="text-xs text-text-muted line-clamp-2 bg-white p-2 rounded-lg border border-border font-mono">{item.content}</p>
                  </div>

                  {item.waUrl ? (
                    <a
                      href={item.waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#E2E8E0] hover:bg-[#D2DBD0] text-[#2D3B2D] text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 border border-[#BDC8BB]"
                    >
                      Send <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-accent font-semibold shrink-0">Invalid Phone</span>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setBroadcastResult(null)}
                className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl text-xs uppercase tracking-wider"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Communication Logs History */}
      <div className="border border-border rounded-2xl p-6 bg-white space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-primary flex items-center gap-2">
            <History className="w-5 h-5 text-primary" /> Communication Logs History
          </h3>
          <button
            onClick={fetchHistory}
            className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
          </button>
        </div>

        {isLoadingHistory ? (
          <div className="py-8 text-center text-text-muted text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading message history...
          </div>
        ) : historyLogs.length === 0 ? (
          <p className="text-xs text-text-muted py-6 text-center italic">No broadcast or direct communications logged yet.</p>
        ) : (
          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {historyLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-primary">{log.customerName || 'Customer'}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-surface text-primary rounded-md">
                      {log.type}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-text-muted line-clamp-1">{log.content}</p>
                </div>

                <span className="text-[10px] uppercase font-bold text-[#3C4E3D] bg-[#E2E8E0] px-2.5 py-1 rounded-full self-start sm:self-center shrink-0 border border-[#BDC8BB]">
                  {log.status || 'sent'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
