import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Building2, Upload, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function BusinessProfileSettings() {
  const { token, business, updateBusiness } = useAuth();

  const [formData, setFormData] = useState({
    name: business?.name || '',
    type: business?.type || 'both',
    registrationNumber: business?.registrationNumber || '',
    ownerName: business?.ownerName || '',
    phone: business?.phone || '',
    whatsappNumber: business?.whatsappNumber || '',
    email: business?.email || '',
    address: business?.address || '',
    currency: business?.currency || 'NGN',
    description: business?.description || '',
    logoUrl: business?.logoUrl || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // If business details load from API or context
    if (business) {
      setFormData({
        name: business.name || '',
        type: business.type || 'both',
        registrationNumber: business.registrationNumber || '',
        ownerName: business.ownerName || '',
        phone: business.phone || '',
        whatsappNumber: business.whatsappNumber || '',
        email: business.email || '',
        address: business.address || '',
        currency: business.currency || 'NGN',
        description: business.description || '',
        logoUrl: business.logoUrl || ''
      });
    }
  }, [business]);

  const handleImageFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP, SVG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormData(prev => ({ ...prev, logoUrl: result }));
      setErrorMsg('');
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.ownerName) {
      setErrorMsg('Business name and owner name are required.');
      return;
    }

    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/businesses/current', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update business profile');
      }

      updateBusiness(data);
      setSuccessMsg('Business profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif italic text-primary mb-2">Business Profile</h2>
        <p className="text-sm text-text-muted">Manage your business details, branding, contact details and currency preferences.</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-[#E2E8E0] text-[#2D3B2D] rounded-2xl flex items-center gap-3 border border-[#BDC8BB] text-sm">
          <CheckCircle2 className="w-5 h-5 text-[#3C4E3D] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-accent/10 text-accent rounded-2xl flex items-center gap-3 border border-accent/20 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Company Logo Section */}
      <div className="p-6 bg-surface/50 border border-border rounded-2xl space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-primary mb-1">Company Logo</label>
          <p className="text-xs text-text-muted">Upload your brand logo. It will appear on invoices, receipts, and navigation headers.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {formData.logoUrl ? (
            <div className="relative group w-32 h-32 rounded-2xl border-2 border-primary/20 bg-white p-2 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
              <img src={formData.logoUrl} alt="Company Logo" className="max-w-full max-h-full object-contain rounded-xl" />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2 text-xs font-semibold"
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-border bg-background flex flex-col items-center justify-center text-text-muted shrink-0">
              <Building2 className="w-8 h-8 opacity-40 mb-1" />
              <span className="text-[10px] uppercase font-bold tracking-wider">No Logo</span>
            </div>
          )}

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex-1 w-full border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${
              isDragging ? 'border-primary bg-surface' : 'border-border bg-white hover:border-primary/50'
            }`}
          >
            <input
              type="file"
              id="logo-upload"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-primary hover:underline">Click to upload</span> or drag and drop logo
              </div>
              <p className="text-[10px] text-text-muted">PNG, JPG, WEBP, SVG up to 2MB</p>
            </label>
          </div>
        </div>
      </div>

      {/* Business Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            Business Name <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
            placeholder="e.g. Royal Tailors & Laundry"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            Business Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
          >
            <option value="tailoring">Tailoring Only</option>
            <option value="laundry">Laundry & Dry Cleaning Only</option>
            <option value="both">Both Tailoring & Laundry</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            Registration / RC Number
          </label>
          <input
            type="text"
            value={formData.registrationNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
            placeholder="e.g. RC-1234567"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            Owner / Principal Name <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.ownerName}
            onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
            placeholder="e.g. Chief Samuel"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            Business Phone
          </label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
            placeholder="e.g. +234 801 234 5678"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            WhatsApp Number
          </label>
          <input
            type="text"
            value={formData.whatsappNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
            placeholder="e.g. +234 801 234 5678"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            Business Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
            placeholder="info@royaltailors.com"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            Primary Currency
          </label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
          >
            <option value="NGN">NGN (₦ - Nigerian Naira)</option>
            <option value="USD">USD ($ - US Dollar)</option>
            <option value="GBP">GBP (£ - British Pound)</option>
            <option value="EUR">EUR (€ - Euro)</option>
            <option value="GHS">GHS (₵ - Ghanaian Cedi)</option>
            <option value="KES">KES (KSh - Kenyan Shilling)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
          Business Address
        </label>
        <textarea
          rows={2}
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
          placeholder="123 Commerce Way, Victoria Island, Lagos"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
          Tagline / Description
        </label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none text-sm"
          placeholder="Bespoke tailoring, custom garments, and premium dry cleaning services."
        />
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <button
          type="submit"
          disabled={isSaving}
          className="px-8 py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving Profile...
            </>
          ) : (
            'Save Profile Changes'
          )}
        </button>
      </div>
    </form>
  );
}
