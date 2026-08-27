import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Eye, Edit2, Lock, Plus, AlertCircle, Ban, CheckCircle } from 'lucide-react';
import AddStaffModal from './AddStaffModal';
import ResetStaffPasswordModal from './ResetStaffPasswordModal';

export default function StaffManagement() {
  const { token, user } = useAuth();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [resetModalStaff, setResetModalStaff] = useState<any>(null);

  const fetchStaff = () => {
    fetch('/api/staff', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) setStaffList(data);
      setIsLoading(false);
    })
    .catch(err => {
      console.error(err);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchStaff();
  }, [token]);

  const handleToggleStatus = async (staffId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const res = await fetch(`/api/staff/${staffId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchStaff();
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return <div className="p-8 text-center text-red-500">Access Denied</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-serif italic text-primary">Staff Management</h2>
          <p className="text-sm text-text-muted mt-1">Manage accounts and access for your employees.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full">
          <thead className="bg-surface">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Staff Member</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Role</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Status</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {isLoading ? (
              <tr><td colSpan={4} className="p-8 text-center text-text-muted text-sm">Loading staff...</td></tr>
            ) : staffList.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-text-muted text-sm">No staff accounts found.</td></tr>
            ) : (
              staffList.map(staff => (
                <tr key={staff.id} className="hover:bg-surface/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-text">{staff.name}</div>
                    <div className="text-xs text-text-muted">{staff.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 inline-flex text-[10px] font-bold uppercase tracking-wider rounded-full bg-surface text-text">
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {staff.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A5D4E]">
                        <CheckCircle className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent">
                        <Ban className="w-3.5 h-3.5" /> {staff.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <button 
                      onClick={() => setResetModalStaff(staff)}
                      className="text-text-muted hover:text-primary p-2 rounded-full hover:bg-surface transition-colors"
                      title="Reset Password"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(staff.id, staff.status)}
                      className={`p-2 rounded-full hover:bg-surface transition-colors ${staff.status === 'active' ? 'text-accent' : 'text-[#4A5D4E]'}`}
                      title={staff.status === 'active' ? 'Disable' : 'Enable'}
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddStaffModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchStaff();
        }} 
      />

      {resetModalStaff && (
        <ResetStaffPasswordModal
          staff={resetModalStaff}
          onClose={() => setResetModalStaff(null)}
        />
      )}
    </div>
  );
}
