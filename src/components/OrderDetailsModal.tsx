import { X } from 'lucide-react';

interface OrderDetailsModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-[#2D2A26]/40 backdrop-blur-sm">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[48px] sm:border border-border shadow-2xl sm:max-w-2xl flex flex-col overflow-hidden">
        
        <div className="px-6 py-4 sm:px-10 sm:py-6 border-b border-border flex justify-between items-center bg-surface/30 shrink-0">
          <div>
            <h2 className="text-3xl font-serif italic text-primary">Order Details</h2>
            <p className="text-sm text-text-muted mt-1 font-bold">{order.orderNumber}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-text-muted hover:text-primary rounded-full hover:bg-surface transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 sm:p-10 flex-1 overflow-y-auto space-y-8">
          
          {/* Status & Basic Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-surface/50 rounded-[24px] border border-border">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Status</p>
              <span className="px-3 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-full bg-primary text-white">
                {order.status}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Category</p>
              <p className="text-sm font-bold text-text capitalize">{order.category}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Created On</p>
              <p className="text-sm font-bold text-text">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            {order.expectedDeliveryDate && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Collection Date</p>
                <p className="text-sm font-bold text-accent">{new Date(order.expectedDeliveryDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {/* Customer Details */}
          {order.customer && (
            <div>
              <h3 className="text-lg font-serif italic text-primary mb-4 border-b border-border pb-2">Customer Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Full Name</p>
                  <p className="text-sm font-medium text-text">{order.customer.fullName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Phone Number</p>
                  <p className="text-sm font-medium text-text">{order.customer.phone || 'N/A'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Email</p>
                  <p className="text-sm font-medium text-text">{order.customer.email || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Financials */}
          <div>
            <h3 className="text-lg font-serif italic text-primary mb-4 border-b border-border pb-2">Financials</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Total Amount</p>
                <p className="text-lg font-bold text-text">{Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Amount Paid</p>
                <p className="text-lg font-bold text-primary">{Number(order.totalPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Balance</p>
                <p className={`text-lg font-bold ${Number(order.balance) > 0 ? 'text-accent' : 'text-text'}`}>
                  {Number(order.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <h3 className="text-lg font-serif italic text-primary mb-4 border-b border-border pb-2">Order Notes</h3>
              <p className="text-sm text-text bg-background border border-border p-4 rounded-2xl whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
