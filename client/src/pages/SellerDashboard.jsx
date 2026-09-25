import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import MyProductsList from '../components/seller/MyProductsList';
import SellerOrdersList from '../components/seller/SellerOrdersList';
import { Store, CheckCircle2 } from 'lucide-react';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('products');
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      const res = await api.get('/products', {
        params: { seller_id: user.user_id, all: 'true' },
      });
      setProducts(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {
      console.error('Failed to load seller products:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  const loadOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders/for-my-products');
      setOrders(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {
      console.error('Failed to load seller orders:', err);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (tab === 'orders') {
      loadOrders();
    }
  }, [tab, loadOrders]);

  return (
    <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-[#16a34a] uppercase tracking-wider mb-1.5">
          <Store className="w-3.5 h-3.5" />
          <span>Seller Portal & Inventory</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
          Merchant Dashboard
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-neutral-500">
          Manage {user?.seller?.shop_name || 'your sports gear catalog'}, fulfill orders, and track deliveries.
        </p>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Catalog Items</span>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-1">{products.length}</p>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Store Orders</span>
          <p className="text-2xl sm:text-3xl font-black text-[#16a34a] mt-1">{orders.length}</p>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Store Name</span>
          <p className="text-sm font-bold text-neutral-800 mt-2 truncate">
            {user?.seller?.shop_name || 'Official Shop'}
          </p>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</span>
          <p className="text-sm font-bold text-[#16a34a] mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Trusted Seller
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 mb-8">
        <button
          type="button"
          onClick={() => setTab('products')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition cursor-pointer ${
            tab === 'products'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          My Listed Gear ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('orders')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition cursor-pointer ${
            tab === 'orders'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          Customer Orders ({orders.length})
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'products' ? (
        <MyProductsList products={products} onRefresh={loadProducts} />
      ) : (
        <SellerOrdersList orders={orders} onRefresh={loadOrders} />
      )}
    </div>
  );
}
