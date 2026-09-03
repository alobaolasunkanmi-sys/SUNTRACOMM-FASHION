import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { X, Check, Edit3, Trash2, AlertTriangle, Building2 } from 'lucide-react';

interface EditBusinessModalProps {
  business: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditBusinessModal({ business, isOpen, onClose, onSuccess }: EditBusinessModalProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'tailoring',
    registrationNumber: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    status: 'active',
    currency: 'NGN',
    description: ''
  });

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || '',
        type: business.type || 'tailoring',
        registrationNumber: business.registrationNumber || '',
        ownerName: business.ownerName || '',
        phone: business.phone || '',
        email: business.email || '',
        address: business.address || '',
        status: business.status || 'active',
        currency: business.currency || 'NGN',
        description: business.description || ''
      });
      setShowDeleteConfirm(false);
      setError('');
    }
  }, [business]);

  if (!isOpen || !business) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/businesses/${business.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update business');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      const res = await fetch(`/api/businesses/${business.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete business');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  };

  const inputClassName = "w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-xs text-text placeholder-text-muted transition-colors";
  const labelClassName = "block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2A26]/40 backdrop-blur-sm">
      <div className="bg-white w-full max-h-[90vh] rounded-[36px] border border-border shadow-2xl max-w-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-border flex justify-between items-center bg-surface/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-serif italic text-primary">Edit Business Profile</h2>
              <p className="text-xs text-text-muted">Update tenant account information and status</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-text-muted hover:text-primary rounded-full hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto space-y-6">
          {error && (
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl text-accent text-xs font-medium">
              {error}
            </div>
          )}

          {showDeleteConfirm ? (
            <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-primary">Delete "{business.name}"?</h3>
                <p className="text-xs text-text-muted mt-1 max-w-md mx-auto">
                  This action is permanent and will delete all associated user profiles, customers, orders, and payment records for this business.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-5 py-2 bg-surface text-primary rounded-xl text-xs font-bold border border-border hover:bg-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="px-5 py-2 bg-accent text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? 'Deleting...' : 'Confirm Permanent Delete'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClassName}>Business Name</label>
                  <input 
                    required 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    className={inputClassName} 
                  />
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
                  <label className={labelClassName}>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className={inputClassName}>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className={labelClassName}>Owner Name</label>
                  <input 
                    required 
                    name="ownerName" 
                    value={formData.ownerName} 
                    onChange={handleChange} 
                    className={inputClassName} 
                  />
                </div>

                <div>
                  <label className={labelClassName}>RC / Registration Number</label>
                  <input 
                    name="registrationNumber" 
                    value={formData.registrationNumber} 
                    onChange={handleChange} 
                    className={inputClassName} 
                    placeholder="e.g. RC-123456" 
                  />
                </div>

                <div>
                  <label className={labelClassName}>Phone Number</label>
                  <input 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    className={inputClassName} 
                  />
                </div>

                <div>
                  <label className={labelClassName}>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className={inputClassName} 
                  />
                </div>

                <div>
                  <label className={labelClassName}>Currency</label>
                  <select name="currency" value={formData.currency} onChange={handleChange} className={inputClassName}>
                    <option value="NGN">NGN (₦)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClassName}>Address</label>
                  <textarea 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange} 
                    rows={2} 
                    className={inputClassName} 
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-accent/10 text-accent rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-accent/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Business
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-surface text-primary rounded-xl text-xs font-bold border border-border hover:bg-border transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
