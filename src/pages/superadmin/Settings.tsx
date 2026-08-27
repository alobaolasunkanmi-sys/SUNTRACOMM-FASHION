import React, { useState } from 'react';
import { Settings as SettingsIcon, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SuperAdminSettings() {
  const [platformName, setPlatformName] = useState('TailorSync');
  const [supportEmail, setSupportEmail] = useState('support@tailorsync.com');
  const [defaultCurrency, setDefaultCurrency] = useState('NGN');
  const [enableRegistration, setEnableRegistration] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-border">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-1">
          <ShieldCheck className="w-4 h-4" /> Global Platform Settings
        </div>
        <h1 className="text-4xl font-serif italic text-primary">System Configuration</h1>
      </div>

      <div className="max-w-2xl bg-white border border-border rounded-[32px] p-8 shadow-sm space-y-6">
        {savedSuccess && (
          <div className="p-4 bg-[#E2E8E0] text-[#2D3B2D] rounded-xl flex items-center gap-2 text-sm border border-[#BDC8BB]">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Platform settings updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
              Platform Name
            </label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
              Support Email
            </label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
              Default System Currency
            </label>
            <select
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
            >
              <option value="NGN">NGN (₦ - Nigerian Naira)</option>
              <option value="USD">USD ($ - US Dollar)</option>
              <option value="GBP">GBP (£ - British Pound)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-surface/50 border border-border rounded-xl">
            <div>
              <p className="text-sm font-bold text-primary">New Business Self-Onboarding</p>
              <p className="text-xs text-text-muted">Allow new businesses to onboard via self-registration portal.</p>
            </div>
            <input
              type="checkbox"
              checked={enableRegistration}
              onChange={(e) => setEnableRegistration(e.target.checked)}
              className="w-5 h-5 rounded text-primary focus:ring-primary"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
