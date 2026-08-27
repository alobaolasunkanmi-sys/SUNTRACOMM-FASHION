import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Search, CreditCard, Download } from 'lucide-react';
import RecordPaymentModal from '../../components/RecordPaymentModal';

export default function Payments() {
  const { token, business } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = useCallback(() => {
    fetch('/api/payments', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setPayments(data);
        setIsLoading(false);
      })
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <h1 className="text-5xl font-serif italic text-primary">Payments</h1>
        <RecordPaymentModal onSuccess={fetchPayments} />
      </div>

      <div className="bg-white border border-border rounded-[48px] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-text-muted" />
            </div>
            <input
              type="text"
              placeholder="Search payments by reference, customer..."
              className="block w-full pl-12 pr-4 py-3 bg-background border border-border rounded-full focus:outline-none focus:border-primary sm:text-sm text-text placeholder-text-muted font-medium transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <select className="bg-background border border-border rounded-full px-6 py-3 text-sm text-text font-medium focus:outline-none focus:border-primary transition-colors appearance-none">
              <option>All Methods</option>
              <option>Cash</option>
              <option>Transfer</option>
              <option>POS</option>
              <option>Card</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-text-muted font-medium">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-24 h-24 bg-background rounded-full mx-auto mb-6 flex items-center justify-center border border-border">
              <CreditCard className="h-10 w-10 text-primary opacity-40" />
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">No payments yet</h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto mb-8 leading-relaxed">You haven't recorded any payments yet. Record a payment to see it here.</p>
            <RecordPaymentModal onSuccess={fetchPayments} />
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Date</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Customer</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Order Ref</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Method</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Amount</th>
                  <th className="relative px-6 py-4"><span className="sr-only">Receipt</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-surface/50 transition-colors cursor-default group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-text">{new Date(payment.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-text-muted">{new Date(payment.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.customer ? (
                        <>
                          <div className="text-sm font-medium text-text">{payment.customer.fullName}</div>
                          <div className="text-xs text-text-muted">{payment.customer.phone}</div>
                        </>
                      ) : (
                        <div className="text-sm text-text-muted italic">Unknown</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.order ? (
                        <div className="text-sm text-text">{payment.order.orderNumber}</div>
                      ) : (
                        <div className="text-sm text-text-muted italic">N/A</div>
                      )}
                      {payment.reference && (
                        <div className="text-xs text-text-muted">Ref: {payment.reference}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-[10px] font-bold uppercase tracking-wider rounded-full bg-primary/10 text-primary">
                        {payment.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-accent text-right">
                      {business?.currency || 'NGN'} {Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button className="text-text-muted hover:text-primary p-2 rounded-full hover:bg-surface transition-colors" title="Download Receipt">
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
