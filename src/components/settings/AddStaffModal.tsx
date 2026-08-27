import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function AddStaffModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    staffId: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add staff');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2A26]/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[32px] border border-border shadow-2xl overflow-hidden flex flex-col">
        <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-surface/30">
          <h2 className="text-2xl font-serif italic text-primary">Add Staff Member</h2>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-primary rounded-full hover:bg-surface transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-xl flex gap-3 text-accent text-sm font-bold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form id="add-staff-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Full Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Email Address</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Phone</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Staff ID</label>
                <input type="text" value={formData.staffId} onChange={e => setFormData({...formData, staffId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Username (Optional)</label>
              <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Temporary Password</label>
              <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} minLength={8} placeholder="Minimum 8 characters" className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none" />
            </div>
          </form>
        </div>

        <div className="px-8 py-6 border-t border-border bg-surface/30 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-full text-sm font-bold text-text-muted hover:text-text transition-colors">
            Cancel
          </button>
          <button type="submit" form="add-staff-form" disabled={loading} className="bg-primary text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Staff'}
          </button>
        </div>
      </div>
    </div>
  );
}
