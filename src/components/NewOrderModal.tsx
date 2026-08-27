import React from "react";
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { X, Check, Plus } from 'lucide-react';

interface NewOrderModalProps {
  onSuccess: () => void;
}

export default function NewOrderModal({ onSuccess }: NewOrderModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { token, business } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    customerId: '',
    category: business?.type === 'laundry' ? 'laundry' : 'tailoring',
    totalAmount: '',
    notes: '',
    expectedDeliveryDate: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetch('/api/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setCustomers(data))
      .catch(console.error);
    }
  }, [isOpen, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');

      setIsOpen(false);
      setFormData({
        customerId: '',
        category: business?.type === 'laundry' ? 'laundry' : 'tailoring',
        totalAmount: '',
        notes: '',
        expectedDeliveryDate: ''
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
        className="px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-colors"
      >
        New Order
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-[#2D2A26]/40 backdrop-blur-sm">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[48px] sm:border border-border shadow-2xl sm:max-w-lg flex flex-col overflow-hidden">
            
            <div className="px-6 py-4 sm:px-10 sm:py-6 border-b border-border flex justify-between items-center bg-surface/30 shrink-0">
              <div>
                <h2 className="text-3xl font-serif italic text-primary">New Order</h2>
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

              <div className="space-y-6">
                <div>
                  <label className={labelClassName}>Customer</label>
                  <select required name="customerId" value={formData.customerId} onChange={handleChange} className={inputClassName}>
                    <option value="">Select a customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.fullName} ({c.phone})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={labelClassName}>Service Category</label>
                  <select required name="category" value={formData.category} onChange={handleChange} className={inputClassName}>
                    <option value="tailoring">Tailoring</option>
                    <option value="laundry">Laundry / Dry Cleaning</option>
                  </select>
                </div>

                <div>
                  <label className={labelClassName}>Total Amount</label>
                  <input required type="number" min="0" step="0.01" name="totalAmount" value={formData.totalAmount} onChange={handleChange} className={inputClassName} placeholder="0.00" />
                </div>

                <div>
                  <label className={labelClassName}>Collection / Delivery Date</label>
                  <input type="date" name="expectedDeliveryDate" value={formData.expectedDeliveryDate} onChange={handleChange} className={inputClassName} />
                </div>

                <div>
                  <label className={labelClassName}>Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} className={inputClassName} placeholder="Additional instructions..." />
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-border flex justify-end">
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-primary text-white rounded-full text-sm font-bold shadow-lg shadow-primary/20 flex items-center hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Order'} <Check className="w-4 h-4 ml-2" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
