import React from "react";
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { X, ChevronRight, ChevronLeft, Check, Plus } from 'lucide-react';

interface OnboardBusinessModalProps {
  onSuccess: () => void;
}

export default function OnboardBusinessModal({ onSuccess }: OnboardBusinessModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '', type: 'tailoring', registrationNumber: '', ownerName: '',
    phone: '', email: '', address: '', description: '',
    adminName: '', adminEmail: '', adminPhone: '', adminPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to onboard business');

      setIsOpen(false);
      setStep(1);
      setFormData({
        name: '', type: 'tailoring', registrationNumber: '', ownerName: '',
        phone: '', email: '', address: '', description: '',
        adminName: '', adminEmail: '', adminPhone: '', adminPassword: ''
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = "w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-sm text-text placeholder-text-muted transition-colors";
  const labelClassName = "block text-xs font-bold uppercase tracking-wider text-text-muted mb-2";

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-8 py-3 bg-accent text-white rounded-full text-sm font-bold shadow-lg shadow-accent/20 flex items-center hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4 mr-2" />
        Onboard Business
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-[#2D2A26]/40 backdrop-blur-sm">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[48px] sm:border border-border shadow-2xl sm:max-w-2xl flex flex-col overflow-hidden">
            
            <div className="px-6 py-4 sm:px-10 sm:py-6 border-b border-border flex justify-between items-center bg-surface/30 shrink-0">
              <div>
                <h2 className="text-3xl font-serif italic text-primary">
                  {step === 1 ? 'Business Details' : 'Administrator Setup'}
                </h2>
                <p className="text-xs text-text-muted font-medium mt-1">
                  Step {step} of 2
                </p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-text-muted hover:text-primary rounded-full hover:bg-surface transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-10 flex-1 overflow-y-auto">
              {error && (
                <div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-2xl text-accent text-sm font-medium">
                  {error}
                </div>
              )}

              {step === 1 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className={labelClassName}>Business Name</label>
                    <input required name="name" value={formData.name} onChange={handleChange} className={inputClassName} placeholder="e.g. Elegant Stitches" />
                  </div>
                  
                  <div>
                    <label className={labelClassName}>Business Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} className={inputClassName}>
                      <option value="tailoring">Tailoring</option>
                      <option value="laundry">Laundry / Dry Cleaning</option>
                      <option value="both">Tailoring & Laundry</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={labelClassName}>Registration Number</label>
                    <input name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className={inputClassName} placeholder="Optional" />
                  </div>

                  <div>
                    <label className={labelClassName}>Owner Name</label>
                    <input required name="ownerName" value={formData.ownerName} onChange={handleChange} className={inputClassName} />
                  </div>

                  <div>
                    <label className={labelClassName}>Phone Number</label>
                    <input required name="phone" value={formData.phone} onChange={handleChange} className={inputClassName} />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClassName}>Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClassName} />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClassName}>Address</label>
                    <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className={inputClassName} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2 bg-surface/50 p-6 rounded-[24px] mb-2 border border-border">
                    <p className="text-sm text-primary italic font-serif mb-1">Create the first administrative account for this business.</p>
                    <p className="text-xs text-text-muted">They will use these credentials to log into their dashboard.</p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClassName}>Admin Full Name</label>
                    <input required name="adminName" value={formData.adminName} onChange={handleChange} className={inputClassName} />
                  </div>

                  <div>
                    <label className={labelClassName}>Admin Email</label>
                    <input required type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} className={inputClassName} />
                  </div>

                  <div>
                    <label className={labelClassName}>Admin Phone</label>
                    <input required name="adminPhone" value={formData.adminPhone} onChange={handleChange} className={inputClassName} />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClassName}>Temporary Password</label>
                    <input required type="password" name="adminPassword" value={formData.adminPassword} onChange={handleChange} className={inputClassName} />
                  </div>
                </div>
              )}

              <div className="mt-10 flex justify-between pt-6 border-t border-border">
                {step === 2 ? (
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="px-6 py-3 bg-surface text-primary rounded-full text-sm font-bold flex items-center hover:bg-border transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </button>
                ) : <div></div>}
                
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-primary text-white rounded-full text-sm font-bold shadow-lg shadow-primary/20 flex items-center hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {step === 1 ? (
                    <>Next Step <ChevronRight className="w-4 h-4 ml-1" /></>
                  ) : (
                    <>{loading ? 'Creating...' : 'Complete Onboarding'} <Check className="w-4 h-4 ml-2" /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
