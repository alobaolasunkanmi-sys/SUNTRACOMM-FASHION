import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Building2, Search, Plus, ShieldCheck, ToggleLeft, ToggleRight, Loader2, Edit3, Trash2 } from 'lucide-react';
import OnboardBusinessModal from '../../components/OnboardBusinessModal';
import EditBusinessModal from '../../components/EditBusinessModal';

export default function SuperAdminBusinesses() {
  const { token } = useAuth();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchBusinesses = useCallback(() => {
    if (!token) return;
    setIsLoading(true);
    fetch('/api/businesses', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBusinesses(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/businesses/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Status update failed');
      fetchBusinesses();
    } catch (err) {
      alert('Failed to update business status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEditClick = (b: any) => {
    setSelectedBusiness(b);
    setIsEditOpen(true);
  };

  const filtered = businesses.filter(b => {
    const matchesSearch = (b.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.ownerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && b.type === filterType;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-1">
            <Building2 className="w-4 h-4" /> Tenant Directory
          </div>
          <h1 className="text-4xl font-serif italic text-primary">Platform Businesses</h1>
        </div>
        <OnboardBusinessModal onSuccess={fetchBusinesses} />
      </div>

      <div className="bg-white border border-border rounded-[32px] p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, owner, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-xs bg-background focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-text-muted font-medium">Filter Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-border bg-background text-xs rounded-xl focus:outline-none focus:border-primary"
            >
              <option value="all">All Types</option>
              <option value="tailoring">Tailoring</option>
              <option value="laundry">Laundry</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-text-muted flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading tenant businesses...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Business & Owner</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Type</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">RC Number</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Contact Info</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Status</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-primary">{b.name}</div>
                      <div className="text-xs text-text-muted">{b.ownerName || 'Owner unspecified'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-surface text-primary capitalize">
                        {b.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs font-mono text-text-muted">
                      {b.registrationNumber || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-xs text-text-muted">
                      <div>{b.phone || 'No phone'}</div>
                      <div className="text-[11px] opacity-75">{b.email || 'No email'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        b.status === 'active'
                          ? 'bg-[#E2E8E0] text-[#2D3B2D] border border-[#BDC8BB]'
                          : 'bg-accent/10 text-accent border border-accent/20'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditClick(b)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-border hover:bg-surface transition-colors inline-flex items-center gap-1 text-primary"
                          title="Edit business details or delete"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          disabled={updatingId === b.id}
                          onClick={() => handleToggleStatus(b.id, b.status)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-border hover:bg-surface transition-colors inline-flex items-center gap-1.5"
                        >
                          {b.status === 'active' ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-[#4A5D4E]" /> Suspend
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-text-muted" /> Activate
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-text-muted italic">
                      No businesses found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EditBusinessModal
        business={selectedBusiness}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedBusiness(null);
        }}
        onSuccess={fetchBusinesses}
      />
    </div>
  );
}

