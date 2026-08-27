import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function ResetStaffPasswordModal({ staff, onClose }: { staff: any, onClose: () => void }) {
  const { token } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!staff) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/staff/${staff.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2A26]/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[32px] border border-border shadow-2xl overflow-hidden flex flex-col">
        <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-surface/30">
          <h2 className="text-xl font-serif italic text-primary">Reset Password</h2>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-primary rounded-full hover:bg-surface transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          <p className="text-sm text-text-muted mb-6">Enter a new temporary password for <strong>{staff.name}</strong>.</p>
          
          {error && (
            <div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-xl flex gap-3 text-accent text-sm font-bold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success ? (
            <div className="mb-6 p-6 bg-[#4A5D4E]/10 border border-[#4A5D4E]/20 rounded-2xl flex flex-col items-center justify-center text-center text-[#4A5D4E]">
              <CheckCircle className="w-10 h-10 mb-3" />
              <p className="text-sm font-bold">Password Reset Successful</p>
              <p className="text-xs mt-2 opacity-80">Please securely share the new password with the staff member.</p>
              <button onClick={onClose} className="mt-6 bg-[#4A5D4E] text-white px-8 py-2.5 rounded-full text-sm font-bold hover:bg-opacity-90 transition-colors">
                Done
              </button>
            </div>
          ) : (
            <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">New Password</label>
                <input required type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} placeholder="Minimum 8 characters" className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none" />
              </div>
            </form>
          )}
        </div>

        {!success && (
          <div className="px-8 py-6 border-t border-border bg-surface/30 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-full text-sm font-bold text-text-muted hover:text-text transition-colors">
              Cancel
            </button>
            <button type="submit" form="reset-password-form" disabled={loading} className="bg-primary text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
