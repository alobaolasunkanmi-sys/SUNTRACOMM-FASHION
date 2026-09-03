import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Building2, Users, DollarSign, Package, Search, ShieldCheck, ToggleLeft, ToggleRight, Edit3
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import OnboardBusinessModal from '../../components/OnboardBusinessModal';
import EditBusinessModal from '../../components/EditBusinessModal';

export default function SuperAdminDashboard() {
  const { token } = useAuth();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [platformStats, setPlatformStats] = useState({
    totalBusinesses: 0,
    activeBusinesses: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);


  const fetchBusinesses = useCallback(() => {
    if (!token) return;

    // Fetch businesses
    fetch('/api/businesses', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBusinesses(Array.isArray(data) ? data : []))
      .catch(console.error);

    // Fetch platform stats
    fetch('/api/businesses/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setPlatformStats(data);
        }
      })
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const handleToggleStatus = async (businessId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setIsUpdatingStatus(businessId);

    try {
      const res = await fetch(`/api/businesses/${businessId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update status');
      fetchBusinesses();
    } catch (err) {
      console.error(err);
      alert('Error updating business status');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const filteredBusinesses = businesses.filter(b => 
    b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formattedRevenue = `₦${platformStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const stats = [
    { name: 'Total Businesses', value: (platformStats.totalBusinesses || businesses.length).toString(), icon: Building2, trend: `${platformStats.activeBusinesses} Active` },
    { name: 'Platform Users', value: platformStats.totalUsers.toString(), icon: Users, trend: 'Registered' },
    { name: 'Total Orders', value: platformStats.totalOrders.toString(), icon: Package, trend: 'Across Platform' },
    { name: 'Platform Volume', value: formattedRevenue, icon: DollarSign, trend: 'Gross Receipts' },
  ];

  const chartData = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 650 },
    { name: 'Mar', value: 900 },
    { name: 'Apr', value: 1200 },
    { name: 'May', value: 1800 },
    { name: 'Jun', value: 2400 },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-1">
            <ShieldCheck className="w-4 h-4 text-accent" /> Super Admin Portal
          </div>
          <h1 className="text-4xl font-serif italic text-primary">Platform Overview</h1>
        </div>
        <OnboardBusinessModal onSuccess={fetchBusinesses} />
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white border border-border rounded-[32px] p-6 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-surface rounded-2xl">
                <stat.icon className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <span className="text-xs font-bold text-[#4A5D4E] bg-[#E2E8E0] px-2.5 py-1 rounded-full border border-[#BDC8BB]">
                {stat.trend}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mb-1">{stat.name}</p>
              <p className="text-3xl font-serif text-primary truncate">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Growth Chart */}
        <div className="lg:col-span-1 bg-white border border-border rounded-[32px] p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-primary mb-2">Platform Activity Trend</h2>
          <p className="text-xs text-text-muted mb-6">Monthly platform activity growth curve.</p>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A5D4E" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4A5D4E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E1D8" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8A8479', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#8A8479', fontSize: 11}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: '1px solid #E5E1D8', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#4A5D4E" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Registered Businesses Table */}
        <div className="lg:col-span-2 bg-white border border-border rounded-[32px] p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-primary">Registered Businesses</h2>
              <p className="text-xs text-text-muted">Manage active tenant accounts and subscription status.</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search business..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-xs bg-background focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Business</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Type</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Contact</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Status</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBusinesses.map((business) => (
                  <tr key={business.id} className="hover:bg-surface/40 transition-colors">
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-primary">{business.name}</div>
                      <div className="text-xs text-text-muted">{business.ownerName || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 inline-flex text-[11px] font-semibold rounded-md bg-surface text-primary capitalize">
                        {business.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-text-muted">
                      <div>{business.email || business.phone || 'No contact'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full ${
                        business.status === 'active' 
                          ? 'bg-[#E2E8E0] text-[#2D3B2D] border border-[#BDC8BB]' 
                          : 'bg-accent/10 text-accent border border-accent/20'
                      }`}>
                        {business.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBusiness(business);
                            setIsEditOpen(true);
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-surface transition-colors inline-flex items-center gap-1 text-primary"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingStatus === business.id}
                          onClick={() => handleToggleStatus(business.id, business.status)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-surface transition-colors inline-flex items-center gap-1.5"
                        >
                          {business.status === 'active' ? (
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
                {filteredBusinesses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-text-muted italic">
                      No businesses match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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

