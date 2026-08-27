import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Shield, Key, AlertCircle } from 'lucide-react';

export default function SecuritySettings() {
  const { token, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      setStatus('error');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }
      
      setStatus('success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Logout user after brief delay
      setTimeout(() => {
        logout();
      }, 3000);
      
    } catch (err: any) {
      setErrorMessage(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-serif italic text-primary">Account & Security</h2>
        <p className="text-sm text-text-muted mt-1">Manage your password and security preferences.</p>
      </div>

      <div className="bg-surface/30 rounded-[24px] border border-border p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-full">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-primary">Change Password</h3>
        </div>

        {status === 'success' && (
          <div className="mb-6 p-4 bg-[#4A5D4E]/10 border border-[#4A5D4E]/20 rounded-xl flex gap-3 text-[#4A5D4E]">
            <Shield className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">Your password has been changed successfully.</p>
              <p className="text-xs mt-1">You will be logged out momentarily. Please log in with your new password.</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-xl flex gap-3 text-accent">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Current Password</label>
            <input 
              type="password" 
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none transition-colors" 
              placeholder="Enter current password"
            />
          </div>
          
          <div className="pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">New Password</label>
            <input 
              type="password" 
              required
              minLength={8}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none transition-colors" 
              placeholder="Minimum 8 characters"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Confirm New Password</label>
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary focus:outline-none transition-colors" 
              placeholder="Re-enter new password"
            />
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
