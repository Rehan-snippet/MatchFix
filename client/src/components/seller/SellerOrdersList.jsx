import { useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { ShoppingBag } from 'lucide-react';

export default function SellerOrdersList({ orders = [], onRefresh }) {
  const toast = useToast();
  const [busyItem, setBusyItem] = useState(null);

  async function updateStatus(orderId, productId, status) {
    const key = `${orderId}-${productId}`;
    setBusyItem(key);
    try {
      await api.patch(`/orders/${orderId}/items/${productId}/status`, { status });
      toast.success(`Order item status updated to "${status}"`);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update order item status.');
    } finally {
      setBusyItem(null);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 bg-neutral-50 border border-neutral-200 rounded-3xl p-8">
        <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
        <p className="text-sm font-bold text-neutral-700">No incoming customer orders yet</p>
        <p className="text-xs text-neutral-500 mt-1">
          When customers purchase your listed gear, orders will arrive here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => {
        const itemKey = `${o.order_id}-${o.product_id}`;
        return (
          <div
            key={itemKey}
            className="bg-white border border-neutral-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-neutral-900">{o.title}</span>
                <span className="text-xs text-neutral-500">× {o.qty}</span>
              </div>
              <p className="text-xs text-neutral-600">
                Customer: <strong className="text-neutral-900">{o.customer_name}</strong> · Total: ৳
                {(Number(o.unit_price) * o.qty).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-neutral-500">Status:</span>
              <select
                disabled={busyItem === itemKey}
                value={o.status}
                onChange={(e) => updateStatus(o.order_id, o.product_id, e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-neutral-300 text-xs font-bold uppercase tracking-wider bg-neutral-50 cursor-pointer disabled:opacity-50"
              >
                <option value="placed">placed</option>
                <option value="confirmed">confirmed</option>
                <option value="shipped">shipped</option>
                <option value="delivered">delivered</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}
