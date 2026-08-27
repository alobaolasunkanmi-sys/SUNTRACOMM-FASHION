import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Search, Plus, User, MoreVertical } from 'lucide-react';
import AddCustomerModal from '../../components/AddCustomerModal';
import CustomerDetailsModal from '../../components/CustomerDetailsModal';

export default function Customers() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const fetchCustomers = useCallback(() => {
    fetch('/api/customers', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setCustomers(data);
        setIsLoading(false);
      })
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <h1 className="text-5xl font-serif italic text-primary">Customers</h1>
        <AddCustomerModal onSuccess={fetchCustomers} />
      </div>

      <div className="bg-white border border-border rounded-[48px] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-text-muted" />
            </div>
            <input
              type="text"
              placeholder="Search customers..."
              className="block w-full pl-12 pr-4 py-3 bg-background border border-border rounded-full focus:outline-none focus:border-primary sm:text-sm text-text placeholder-text-muted font-medium transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <select className="bg-background border border-border rounded-full px-6 py-3 text-sm text-text font-medium focus:outline-none focus:border-primary transition-colors appearance-none">
              <option>All Segments</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Outstanding Balance</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-text-muted font-medium">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-24 h-24 bg-background rounded-full mx-auto mb-6 flex items-center justify-center border border-border">
              <User className="h-10 w-10 text-primary opacity-40" />
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">No customers yet</h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto mb-8 leading-relaxed">Your customer directory is empty. Add your first customer to start tracking orders and payments.</p>
            <AddCustomerModal onSuccess={fetchCustomers} variant="empty-state" />
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Customer</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Contact</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Spent</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Balance</th>
                  <th className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    onClick={() => setSelectedCustomer(customer)}
                    className="hover:bg-surface/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold font-serif italic text-lg">
                          {customer.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-text group-hover:text-primary transition-colors">{customer.fullName}</div>
                          <div className="text-xs text-text-muted">ID: {customer.id.substring(0,8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text">{customer.phone}</div>
                      <div className="text-xs text-text-muted">{customer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-[10px] font-bold uppercase tracking-wider rounded-full bg-primary/10 text-primary">
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-text text-right">
                      {customer.currency} {customer.totalSpending}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right">
                      <span className={customer.outstandingBalance > 0 ? 'text-accent' : 'text-text'}>
                        {customer.currency} {customer.outstandingBalance}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button className="text-text-muted hover:text-primary p-2 rounded-full hover:bg-surface transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CustomerDetailsModal 
        customer={selectedCustomer}
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onSuccess={() => {
          setSelectedCustomer(null);
          fetchCustomers();
        }}
      />
    </div>
  );
}
