import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Search, User, MoreVertical, FileText } from 'lucide-react';
import NewOrderModal from '../../components/NewOrderModal';
import OrderDetailsModal from '../../components/OrderDetailsModal';

export default function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchOrders = useCallback(() => {
    fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setIsLoading(false);
      })
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <h1 className="text-5xl font-serif italic text-primary">Orders</h1>
        <NewOrderModal onSuccess={fetchOrders} />
      </div>

      <div className="bg-white border border-border rounded-[48px] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-text-muted" />
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              className="block w-full pl-12 pr-4 py-3 bg-background border border-border rounded-full focus:outline-none focus:border-primary sm:text-sm text-text placeholder-text-muted font-medium transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <select className="bg-background border border-border rounded-full px-6 py-3 text-sm text-text font-medium focus:outline-none focus:border-primary transition-colors appearance-none">
              <option>All Statuses</option>
              <option>New</option>
              <option>In Progress</option>
              <option>Ready</option>
              <option>Delivered</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-text-muted font-medium">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-24 h-24 bg-background rounded-full mx-auto mb-6 flex items-center justify-center border border-border">
              <FileText className="h-10 w-10 text-primary opacity-40" />
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">No orders yet</h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto mb-8 leading-relaxed">You haven't recorded any orders yet. Create an order to get started.</p>
            <NewOrderModal onSuccess={fetchOrders} />
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Order ID</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Customer</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Category</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Total</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Balance</th>
                  <th className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-surface/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-text group-hover:text-primary transition-colors">{order.orderNumber}</div>
                      <div className="text-xs text-text-muted">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.customer ? (
                        <>
                          <div className="text-sm font-medium text-text">{order.customer.fullName}</div>
                          <div className="text-xs text-text-muted">{order.customer.phone}</div>
                        </>
                      ) : (
                        <div className="text-sm text-text-muted italic">Unknown</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text capitalize">{order.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-[10px] font-bold uppercase tracking-wider rounded-full bg-primary/10 text-primary">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-text text-right">
                      {Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right">
                      <span className={Number(order.balance) > 0 ? 'text-accent' : 'text-text'}>
                        {Number(order.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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

      <OrderDetailsModal 
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
