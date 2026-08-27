import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Users, Scissors, CreditCard, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import NewOrderModal from '../../components/NewOrderModal';
import RecordPaymentModal from '../../components/RecordPaymentModal';

export default function BusinessDashboard() {
  const { token, business } = useAuth();
  
  const [dashboardStats, setDashboardStats] = useState({
    todaySales: 0,
    activeOrders: 0,
    pendingPayments: 0,
    newCustomers: 0,
    inactiveCustomersCount: 0,
    readyOrdersCount: 0,
    outstandingAmount: 0,
    outstandingCustomerCount: 0
  });

  const fetchStats = () => {
    if (!token) return;

    Promise.all([
      fetch('/api/payments', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('/api/customers', { headers: { 'Authorization': `Bearer ${token}` } })
    ])
    .then(responses => Promise.all(responses.map(res => res.json())))
    .then(([payments, orders, customers]) => {
      const safePayments = Array.isArray(payments) ? payments : [];
      const safeOrders = Array.isArray(orders) ? orders : [];
      const safeCustomers = Array.isArray(customers) ? customers : [];

      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Calculate today's sales
      const todaySales = safePayments.reduce((sum: number, p: any) => {
        const paymentDate = new Date(p.createdAt);
        return paymentDate >= today ? sum + Number(p.amount || 0) : sum;
      }, 0);
      
      // Calculate active orders (not delivered or cancelled)
      const activeOrdersCount = safeOrders.filter((o: any) => 
        o.status !== 'delivered' && o.status !== 'cancelled'
      ).length;
      
      // Calculate pending payments (sum of all order balances)
      const pendingTotal = safeOrders.reduce((sum: number, o: any) => 
        sum + Number(o.balance || 0), 0
      );
      
      // Calculate new customers (created this month)
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const newCustomersCount = safeCustomers.filter((c: any) => 
        new Date(c.createdAt) >= startOfMonth
      ).length;

      // Calculate inactive customers (>60 days since last order date or creation)
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const inactiveCustomersCount = safeCustomers.filter((c: any) => {
        const lastActive = c.lastOrderDate ? new Date(c.lastOrderDate) : new Date(c.createdAt);
        return lastActive < sixtyDaysAgo;
      }).length;

      // Calculate ready orders
      const readyOrdersCount = safeOrders.filter((o: any) => o.status === 'ready').length;

      // Calculate orders with balance
      const ordersWithBalance = safeOrders.filter((o: any) => Number(o.balance || 0) > 0 && o.status !== 'cancelled');
      const outstandingAmount = ordersWithBalance.reduce((sum: number, o: any) => sum + Number(o.balance || 0), 0);
      const outstandingCustomerCount = new Set(ordersWithBalance.map((o: any) => o.customerId)).size;

      setDashboardStats({
        todaySales,
        activeOrders: activeOrdersCount,
        pendingPayments: pendingTotal,
        newCustomers: newCustomersCount,
        inactiveCustomersCount,
        readyOrdersCount,
        outstandingAmount,
        outstandingCustomerCount
      });
    })
    .catch(console.error);
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  const formatCurrency = (val: number) => {
    return `${business?.currency || 'NGN'} ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const stats = [
    { name: 'Today\'s Sales', value: formatCurrency(dashboardStats.todaySales), icon: CreditCard, trend: '', type: 'increase' },
    { name: 'Active Orders', value: dashboardStats.activeOrders.toString(), icon: Scissors, trend: '', type: 'increase' },
    { name: 'Pending Payments', value: formatCurrency(dashboardStats.pendingPayments), icon: Clock, trend: '', type: 'decrease' },
    { name: 'New Customers (This Month)', value: dashboardStats.newCustomers.toString(), icon: Users, trend: '', type: 'increase' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between mb-8">
        <h1 className="text-5xl font-serif italic text-primary">Dashboard</h1>
      </div>

      <div className="bg-primary rounded-[48px] p-10 text-white relative overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col justify-center h-full">
          <h2 className="text-4xl font-serif mb-4 leading-tight">Welcome back to {business?.name}</h2>
          <p className="text-sm opacity-80 max-w-md mb-8 leading-relaxed">Here is what is happening with your business today.</p>
          
          <div className="flex flex-wrap gap-4">
            <NewOrderModal onSuccess={fetchStats} />
            <RecordPaymentModal onSuccess={fetchStats} />
          </div>
        </div>
        <div className="absolute top-[-40px] right-[-40px] w-80 h-80 bg-[#5A6A54] rounded-full blur-[80px] opacity-60 pointer-events-none"></div>
        <div className="absolute bottom-[-60px] right-[60px] w-64 h-64 bg-accent rounded-full blur-[60px] opacity-30 pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white border border-border rounded-[32px] p-8 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-surface rounded-full">
                <stat.icon className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mb-1">{stat.name}</p>
              <p className="text-4xl font-serif text-primary">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actionable Insights */}
      <div className="bg-accent/5 border border-accent/20 rounded-[48px] p-8 flex flex-col shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-6">Actionable Insights</p>
        <div className="divide-y divide-accent/10">
          <div className="py-4 flex items-center justify-between">
            <div>
              <p className="text-base italic font-serif leading-relaxed text-primary">
                {dashboardStats.inactiveCustomersCount > 0 
                  ? `${dashboardStats.inactiveCustomersCount} customer${dashboardStats.inactiveCustomersCount === 1 ? '' : 's'} inactive for over 60 days`
                  : 'All active customers are engaged'}
              </p>
              <p className="text-sm text-text-muted">
                {dashboardStats.inactiveCustomersCount > 0 
                  ? 'Reach out to them with a promotional offer to re-engage.'
                  : 'No dormant customer accounts found.'}
              </p>
            </div>
            <Link to="/business/customers" className="text-xs font-bold text-accent flex items-center gap-2 hover:opacity-80">
              View Customers <span className="text-lg leading-none">→</span>
            </Link>
          </div>

          <div className="py-4 flex items-center justify-between">
            <div>
              <p className="text-base italic font-serif leading-relaxed text-primary">
                {dashboardStats.readyOrdersCount > 0 
                  ? `${dashboardStats.readyOrdersCount} order${dashboardStats.readyOrdersCount === 1 ? ' is' : 's are'} ready for pickup`
                  : 'No orders pending pickup'}
              </p>
              <p className="text-sm text-text-muted">
                {dashboardStats.readyOrdersCount > 0 
                  ? 'Notify customers that their items are ready.'
                  : 'All ready items have been collected or delivered.'}
              </p>
            </div>
            <Link to="/business/orders" className="text-xs font-bold text-accent flex items-center gap-2 hover:opacity-80">
              {dashboardStats.readyOrdersCount > 0 ? 'Send Reminders' : 'View Orders'} <span className="text-lg leading-none">→</span>
            </Link>
          </div>

          <div className="py-4 flex items-center justify-between">
            <div>
              <p className="text-base italic font-serif leading-relaxed text-primary">
                {dashboardStats.outstandingAmount > 0 
                  ? `${formatCurrency(dashboardStats.outstandingAmount)} in outstanding customer payments`
                  : 'No outstanding customer balances'}
              </p>
              <p className="text-sm text-text-muted">
                {dashboardStats.outstandingAmount > 0 
                  ? `Across ${dashboardStats.outstandingCustomerCount} customer${dashboardStats.outstandingCustomerCount === 1 ? '' : 's'} with pending balances.`
                  : 'All customer accounts are fully settled.'}
              </p>
            </div>
            <Link to="/business/payments" className="text-xs font-bold text-accent flex items-center gap-2 hover:opacity-80">
              View Pending <span className="text-lg leading-none">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
