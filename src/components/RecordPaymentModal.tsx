import React from "react";
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { X, Check } from 'lucide-react';

interface RecordPaymentModalProps {
  onSuccess: () => void;
}

export default function RecordPaymentModal({ onSuccess }: RecordPaymentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [orders, setOrders] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    orderId: '',
    amount: '',
    method: 'transfer',
    reference: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        // Filter out fully paid orders
        setOrders(data.filter((o: any) => Number(o.balance) > 0));
      })
      .catch(console.error);
    }
  }, [isOpen, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      setIsOpen(false);
      setFormData({
        orderId: '',
        amount: '',
        method: 'transfer',
        reference: ''
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
        className="px-6 py-2 bg-accent text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-accent/20 hover:opacity-90 transition-opacity"
      >
        Record Payment
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-[#2D2A26]/40 backdrop-blur-sm">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[48px] sm:border border-border shadow-2xl sm:max-w-lg flex flex-col overflow-hidden">
            
            <div className="px-6 py-4 sm:px-10 sm:py-6 border-b border-border flex justify-between items-center bg-surface/30 shrink-0">
              <div>
                <h2 className="text-3xl font-serif italic text-primary">Record Payment</h2>
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
                  <label className={labelClassName}>Select Order</label>
                  <select required name="orderId" value={formData.orderId} onChange={handleChange} className={inputClassName}>
                    <option value="">Select unpaid order</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} - Balance: {Number(o.balance).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={labelClassName}>Amount Paid</label>
                  <input required type="number" min="0" step="0.01" name="amount" value={formData.amount} onChange={handleChange} className={inputClassName} placeholder="0.00" />
                </div>

                <div>
                  <label className={labelClassName}>Payment Method</label>
                  <select required name="method" value={formData.method} onChange={handleChange} className={inputClassName}>
                    <option value="transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="pos">POS / Card</option>
                  </select>
                </div>

                <div>
                  <label className={labelClassName}>Reference (Optional)</label>
                  <input type="text" name="reference" value={formData.reference} onChange={handleChange} className={inputClassName} placeholder="e.g. TXN-12345" />
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-border flex justify-end">
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-primary text-white rounded-full text-sm font-bold shadow-lg shadow-primary/20 flex items-center hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Recording...' : 'Record Payment'} <Check className="w-4 h-4 ml-2" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
