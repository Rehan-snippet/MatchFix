import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Store,
  Plus,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  TrendingUp,
  ShoppingBag,
} from 'lucide-react';

function NewProductForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Footwear',
    description: '',
    price: '',
    condition: 'new',
    stock: 10,
  });
  const [imageUrl, setImageUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data: product } = await api.post('/products', form);
      if (imageUrl) {
        await api.post(`/products/${product.product_id}/images`, { url: imageUrl, is_cover: true });
      }
      setForm({ title: '', category: 'Footwear', description: '', price: '', condition: 'new', stock: 10 });
      setImageUrl('');
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create product');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-8">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>List New Football Gear</span>
        </button>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-neutral-900">List New Football Gear</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-neutral-700 mb-1">Product Title</label>
              <input
                required
                placeholder="e.g. Nike Mercurial Vapor 15 Turf Shoes"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
              >
                <option value="Footwear">Footwear (Boots)</option>
                <option value="Apparel">Apparel & Jerseys</option>
                <option value="Balls">Match Balls</option>
                <option value="Goalkeeper">Goalkeeper Gloves</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Price (৳ BDT)</label>
              <input
                required
                type="number"
                placeholder="e.g. 4500"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Initial Stock</label>
              <input
                required
                type="number"
                min={0}
                placeholder="e.g. 10"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Condition</label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
              >
                <option value="new">Brand New</option>
                <option value="used">Used / Practice</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-neutral-700 mb-1">Image URL</label>
              <input
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-neutral-700 mb-1">Product Description</label>
              <textarea
                rows={2}
                placeholder="Specifications, fit, grip details, size guidelines…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-6 py-2.5 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                {busy ? 'Creating…' : 'Publish Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('products');

  function loadProducts() {
    api.get('/products', { params: { seller_id: user.user_id } }).then((res) => setProducts(res.data || []));
  }

  useEffect(loadProducts, [user.user_id]);

  useEffect(() => {
    if (tab === 'orders') {
      api.get('/orders/for-my-products').then((res) => setOrders(res.data || []));
    }
  }, [tab]);

  async function updateStatus(orderId, productId, status) {
    await api.patch(`/orders/${orderId}/items/${productId}/status`, { status });
    const { data } = await api.get('/orders/for-my-products');
    setOrders(data || []);
  }

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

      {/* Tab: Products */}
      {tab === 'products' && (
        <div className="space-y-6">
          <NewProductForm onCreated={loadProducts} />

          {products.length === 0 ? (
            <div className="text-center py-16 bg-neutral-50 border border-neutral-200 rounded-3xl p-8">
              <Package className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-neutral-700">No products in your catalog yet</p>
              <p className="text-xs text-neutral-500 mt-1">
                Click "List New Football Gear" above to publish your first product.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <div
                  key={p.product_id}
                  className="bg-white border border-neutral-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="aspect-[16/10] rounded-2xl bg-neutral-100 overflow-hidden border border-neutral-100">
                      <img
                        src={
                          p.cover_image ||
                          p.images?.[0]?.url ||
                          'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=600&q=80'
                        }
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#16a34a] uppercase tracking-wider">
                          {p.category || 'Gear'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.stock > 0
                              ? 'bg-green-50 text-[#16a34a] border border-green-200'
                              : 'bg-rose-50 text-rose-600 border border-rose-200'
                          }`}
                        >
                          {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-neutral-900 mt-1 line-clamp-1">
                        {p.title}
                      </h4>
                      <p className="text-base font-black text-neutral-900 mt-0.5">
                        ৳{Number(p.price).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                    <span className="capitalize">{p.condition || 'New'}</span>
                    <span className="font-mono text-[11px]">ID: {p.product_id.slice(0, 6)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Orders */}
      {tab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-neutral-50 border border-neutral-200 rounded-3xl p-8">
              <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-neutral-700">No incoming customer orders yet</p>
              <p className="text-xs text-neutral-500 mt-1">
                When customers purchase your listed gear, orders will arrive here.
              </p>
            </div>
          ) : (
            orders.map((o) => (
              <div
                key={`${o.order_id}-${o.product_id}`}
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
                    value={o.status}
                    onChange={(e) => updateStatus(o.order_id, o.product_id, e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-neutral-300 text-xs font-bold uppercase tracking-wider bg-neutral-50 cursor-pointer"
                  >
                    <option value="placed">placed</option>
                    <option value="confirmed">confirmed</option>
                    <option value="shipped">shipped</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
