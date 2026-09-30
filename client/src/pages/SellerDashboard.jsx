import { useEffect, useState, useRef, useCallback } from 'react';
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
  ImageIcon,
  Upload,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

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
  const [imageFile, setImageFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data: product } = await api.post('/products', form);
      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        fd.append('is_cover', 'true');
        await api.post(`/products/${product.product_id}/images`, fd);
      } else if (imageUrl && imageUrl.trim()) {
        await api.post(`/products/${product.product_id}/images`, { url: imageUrl.trim(), is_cover: true });
      }
      setForm({ title: '', category: 'Footwear', description: '', price: '', condition: 'new', stock: 10 });
      setImageUrl('');
      setImageFile(null);
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
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Product Photo <span className="text-neutral-400 font-normal">(upload file or paste image URL)</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImageUrl('');
                    }
                  }}
                  className="w-full sm:w-1/2 text-xs text-neutral-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 cursor-pointer"
                />
                <span className="text-xs text-neutral-400 font-bold">OR</span>
                <input
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImageFile(null);
                  }}
                  className="flex-1 w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
                />
              </div>
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

function ProductImageManagerModal({ product, onClose, onChanged }) {
  const fileRef = useRef();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/products/${product.product_id}`);
      setImages(data.images || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [product.product_id]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('is_cover', images.length === 0 ? 'true' : 'false');
      await api.post(`/products/${product.product_id}/images`, fd);
      await fetchImages();
      onChanged();
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.response?.data?.error || 'Upload failed. Ensure file is an image under 15MB.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleAddUrlImage() {
    const url = window.prompt('Enter product image URL (e.g. Unsplash link):');
    if (!url || !url.trim()) return;
    setUploadError('');
    setUploading(true);
    try {
      await api.post(`/products/${product.product_id}/images`, {
        url: url.trim(),
        is_cover: images.length === 0,
      });
      await fetchImages();
      onChanged();
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Failed to add image URL.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSetCover(imageId) {
    try {
      await api.patch(`/products/${product.product_id}/images/${imageId}/cover`);
      await fetchImages();
      onChanged();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not set cover.');
    }
  }

  async function handleDelete(imageId) {
    if (!window.confirm('Delete this product photo?')) return;
    try {
      await api.delete(`/products/${product.product_id}/images/${imageId}`);
      await fetchImages();
      onChanged();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete image.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-neutral-200 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-neutral-900">Manage Product Photos</h3>
            <p className="text-xs text-neutral-500 truncate max-w-xs">{product.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {uploadError && <p className="text-xs text-rose-600">{uploadError}</p>}

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-600">
            {images.length} {images.length === 1 ? 'photo' : 'photos'} uploaded
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddUrlImage}
              disabled={uploading}
              className="px-2.5 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              + Add URL
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Uploading…' : 'Upload Photo'}</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-400">Loading photos…</div>
        ) : images.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 rounded-2xl">
            No photos yet. Upload a photo or add an image URL to showcase this gear.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1">
            {images.map((img) => (
              <div
                key={img.image_id}
                className="relative group rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 aspect-square shadow-2xs"
              >
                <img src={getImageUrl(img.url)} alt="" className="w-full h-full object-cover" />
                {img.is_cover && (
                  <span className="absolute top-1.5 left-1.5 bg-[#16a34a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                    Cover
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  {!img.is_cover && (
                    <button
                      type="button"
                      onClick={() => handleSetCover(img.image_id)}
                      title="Set as cover photo"
                      className="p-1.5 rounded-lg bg-[#16a34a] text-white hover:bg-[#15803d] cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(img.image_id)}
                    title="Delete photo"
                    className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('products');
  const [managingPhotosProduct, setManagingPhotosProduct] = useState(null);

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

  async function handleCollectCash(orderId) {
    if (!window.confirm('Confirm that you have delivered the items and collected the remaining cash balance from the customer?')) return;
    try {
      await api.patch(`/orders/${orderId}/collect-cash`);
      const { data } = await api.get('/orders/for-my-products');
      setOrders(data || []);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not record cash collection.');
    }
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
                        src={getImageUrl(
                          p.cover_image || p.images?.[0]?.url,
                          'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=600&q=80'
                        )}
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
                    <button
                      type="button"
                      onClick={() => setManagingPhotosProduct(p)}
                      className="px-2.5 py-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-[#16a34a]" />
                      <span>Photos</span>
                    </button>
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-neutral-900">{o.product_title || o.title}</span>
                    <span className="text-xs text-neutral-500">× {o.qty}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      o.order_status === 'delivered'
                        ? 'bg-green-50 text-[#16a34a] border border-green-200'
                        : o.order_status === 'shipped'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : o.order_status === 'advance_paid'
                        ? 'bg-amber-50 text-amber-800 border border-amber-300'
                        : o.order_status === 'cancelled'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-neutral-50 text-neutral-700 border border-neutral-200'
                    }`}>
                      {o.order_status === 'advance_paid' ? 'Advance Paid (COD)' : o.order_status}
                    </span>
                    {o.payment_method === 'cash_advance' && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                        Cash on Delivery
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-600">
                    Customer: <strong className="text-neutral-900">{o.customer_name}</strong>
                    {o.customer_phone && ` (${o.customer_phone})`} · Total: ৳
                    {(Number(o.unit_price) * o.qty).toLocaleString()}
                  </p>
                  {o.delivery_address && (
                    <p className="text-xs text-neutral-500">
                      Deliver to: <span className="text-neutral-700">{o.delivery_address}</span>
                    </p>
                  )}
                  {o.payment_method === 'cash_advance' && (
                    <p className="text-xs text-amber-700 font-medium">
                      Advance: ৳{Number(o.advance_amount || 0).toLocaleString()} · Balance to Collect on Delivery: <strong className="text-amber-900">৳{Number(o.cash_balance || 0).toLocaleString()}</strong>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {o.payment_method === 'cash_advance' && Number(o.cash_balance) > 0 && o.order_status !== 'delivered' && o.order_status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => handleCollectCash(o.order_id)}
                      className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      Collect COD Cash (৳{Number(o.cash_balance).toLocaleString()})
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-500">Item:</span>
                    <select
                      value={o.item_status || o.status}
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
              </div>
            ))
          )}
        </div>
      )}

      {managingPhotosProduct && (
        <ProductImageManagerModal
          product={managingPhotosProduct}
          onClose={() => setManagingPhotosProduct(null)}
          onChanged={loadProducts}
        />
      )}
    </div>
  );
}
