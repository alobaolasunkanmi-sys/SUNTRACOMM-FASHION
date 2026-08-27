import React from "react";
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { X, Check, Plus } from 'lucide-react';

interface AddCustomerModalProps {
  onSuccess: () => void;
  variant?: 'default' | 'empty-state';
}

export default function AddCustomerModal({ onSuccess, variant = 'default' }: AddCustomerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { token, business } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    address: '',
    gender: 'other',
    notes: '',
    measurements: {
      chest: '',
      waist: '',
      hips: '',
      shoulder: '',
      length: ''
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMeasurementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      measurements: {
        ...formData.measurements,
        [e.target.name]: e.target.value
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create customer');

      setIsOpen(false);
      setFormData({
        fullName: '', phone: '', whatsappNumber: '', email: '',
        address: '', gender: 'other', notes: '',
        measurements: { chest: '', waist: '', hips: '', shoulder: '', length: '' }
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isTailoring = business?.type === 'tailoring' || business?.type === 'both';
  const inputClassName = "w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-sm text-text placeholder-text-muted transition-colors";
  const labelClassName = "block text-xs font-bold uppercase tracking-wider text-text-muted mb-2";

  return (
    <>
      {variant === 'empty-state' ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="px-8 py-3 bg-accent text-white rounded-full text-sm font-bold shadow-lg shadow-accent/20 inline-flex items-center hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          New Customer
        </button>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="px-8 py-3 bg-accent text-white rounded-full text-sm font-bold shadow-lg shadow-accent/20 flex items-center hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-[#2D2A26]/40 backdrop-blur-sm">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[48px] sm:border border-border shadow-2xl sm:max-w-2xl flex flex-col overflow-hidden">
            
            <div className="px-6 py-4 sm:px-10 sm:py-6 border-b border-border flex justify-between items-center bg-surface/30 shrink-0">
              <div>
                <h2 className="text-3xl font-serif italic text-primary">Add Customer</h2>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className={labelClassName}>Full Name</label>
                  <input required name="fullName" value={formData.fullName} onChange={handleChange} className={inputClassName} placeholder="e.g. Jane Doe" />
                </div>
                
                <div>
                  <label className={labelClassName}>Phone Number</label>
                  <input required name="phone" value={formData.phone} onChange={handleChange} className={inputClassName} />
                </div>
                
                <div>
                  <label className={labelClassName}>WhatsApp Number</label>
                  <input name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} className={inputClassName} placeholder="Optional" />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClassName}>Email Address (Optional)</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClassName} />
                </div>

                <div>
                  <label className={labelClassName}>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className={inputClassName}>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClassName}>Address</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className={inputClassName} placeholder="Optional" />
                </div>
                
                <div className="sm:col-span-2">
                  <label className={labelClassName}>Internal Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} className={inputClassName} placeholder="Measurement notes, preferences..." />
                </div>
              </div>

              {isTailoring && (
                <div className="mt-8 pt-8 border-t border-border">
                  <h3 className="text-lg font-serif italic text-primary mb-6">Measuring Details</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    <div>
                      <label className={labelClassName}>Chest (in)</label>
                      <input name="chest" value={formData.measurements.chest} onChange={handleMeasurementChange} className={inputClassName} placeholder="e.g. 38" />
                    </div>
                    <div>
                      <label className={labelClassName}>Waist (in)</label>
                      <input name="waist" value={formData.measurements.waist} onChange={handleMeasurementChange} className={inputClassName} placeholder="e.g. 32" />
                    </div>
                    <div>
                      <label className={labelClassName}>Hips (in)</label>
                      <input name="hips" value={formData.measurements.hips} onChange={handleMeasurementChange} className={inputClassName} placeholder="e.g. 40" />
                    </div>
                    <div>
                      <label className={labelClassName}>Shoulder (in)</label>
                      <input name="shoulder" value={formData.measurements.shoulder} onChange={handleMeasurementChange} className={inputClassName} placeholder="e.g. 18" />
                    </div>
                    <div>
                      <label className={labelClassName}>Length (in)</label>
                      <input name="length" value={formData.measurements.length} onChange={handleMeasurementChange} className={inputClassName} placeholder="e.g. 42" />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-10 pt-6 border-t border-border flex justify-end">
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-primary text-white rounded-full text-sm font-bold shadow-lg shadow-primary/20 flex items-center hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Add Customer'} <Check className="w-4 h-4 ml-2" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
