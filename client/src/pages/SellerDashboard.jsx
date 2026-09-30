import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  Edit2,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Clock,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Phone,
  Mail,
  Copy,
  CheckCheck,
  Banknote,
  Wallet,
} from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

function NewProductForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Football Boots',
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
      setForm({ title: '', category: 'Football Boots', description: '', price: '', condition: 'new', stock: 10 });
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
                <option value="Football Boots">Football Boots</option>
                <option value="Match Balls">Match Balls</option>
                <option value="Jerseys & Kits">Jerseys & Kits</option>
                <option value="Goalkeeper Gloves">Goalkeeper Gloves</option>
                <option value="Training Gear">Training Gear</option>
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
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
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

function EditProductModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: product.title || '',
    category: product.category || 'Football Boots',
    description: product.description || '',
    price: product.price || '',
    condition: product.condition || 'new',
    stock: product.stock !== undefined ? product.stock : 0,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Product title is required.');
      return;
    }
    if (Number(form.price) <= 0) {
      setError('Price must be greater than 0.');
      return;
    }
    if (Number(form.stock) < 0) {
      setError('Stock units cannot be negative.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await api.patch(`/products/${product.product_id}`, {
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        price: Number(form.price),
        condition: form.condition,
        stock: Number(form.stock),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update product');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-[#16a34a]/10 text-[#16a34a]">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-neutral-900">Edit Product Listing</h3>
              <p className="text-xs text-neutral-500">Update pricing, stock levels, or specifications</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Product Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
              >
                <option value="Football Boots">Football Boots</option>
                <option value="Match Balls">Match Balls</option>
                <option value="Jerseys & Kits">Jerseys & Kits</option>
                <option value="Goalkeeper Gloves">Goalkeeper Gloves</option>
                <option value="Training Gear">Training Gear</option>
                <option value="Accessories">Accessories</option>
              </select>
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Price (৳ BDT)</label>
              <input
                required
                type="number"
                min="1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Stock Units</label>
              <input
                required
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Product Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-5 py-2.5 rounded-2xl border border-neutral-200 hover:bg-neutral-100 text-neutral-600 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-6 py-2.5 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-60"
            >
              {busy ? 'Saving Changes…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('products');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [managingPhotosProduct, setManagingPhotosProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'stock_asc' | 'stock_desc' | 'price_asc' | 'price_desc'
  const [restockingId, setRestockingId] = useState(null);

  // Orders Tab filters & state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all'); // 'all' | 'to_fulfill' | 'needs_cod' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  const [orderSort, setOrderSort] = useState('newest'); // 'newest' | 'oldest' | 'amount_desc' | 'amount_asc'
  const [copiedSlipId, setCopiedSlipId] = useState(null);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const loadProducts = useCallback(() => {
    if (!user?.user_id) return;
    setLoadingProducts(true);
    api
      .get('/products', { params: { seller_id: user.user_id } })
      .then((res) => setProducts(res.data || []))
      .catch((err) => console.error('Failed to load products', err))
      .finally(() => setLoadingProducts(false));
  }, [user?.user_id]);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get('/orders/for-my-products');
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load seller orders', err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadOrders();
  }, [loadProducts, loadOrders]);

  async function updateStatus(orderId, productId, status) {
    const itemKey = `${orderId}-${productId}`;
    setUpdatingItemId(itemKey);
    try {
      await api.patch(`/orders/${orderId}/items/${productId}/status`, { status });
      await loadOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not update item status');
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function handleCollectCash(orderId) {
    if (
      !window.confirm(
        'Confirm that you have delivered the items and collected the remaining cash balance from the customer?'
      )
    )
      return;
    try {
      await api.patch(`/orders/${orderId}/collect-cash`);
      await loadOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not record cash collection.');
    }
  }

  async function handleQuickRestock(productId, currentStock, delta) {
    setRestockingId(productId);
    const newStock = Math.max(0, Number(currentStock || 0) + delta);
    try {
      await api.patch(`/products/${productId}`, { stock: newStock });
      setProducts((prev) =>
        prev.map((p) => (p.product_id === productId ? { ...p, stock: newStock } : p))
      );
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update stock');
    } finally {
      setRestockingId(null);
    }
  }

  async function handleDeleteProduct(productId, title) {
    if (
      !window.confirm(
        `Permanently remove "${title}" and all its photos from your store catalog? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/products/${productId}`);
      setProducts((prev) => prev.filter((p) => p.product_id !== productId));
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete product listing.');
    }
  }

  function copyDeliverySlip(o) {
    const phone = o.delivery_phone || o.customer_phone || 'N/A';
    const cash =
      o.payment_method === 'cash_advance' && Number(o.cash_balance) > 0
        ? `৳${Number(o.cash_balance).toLocaleString()}`
        : '৳0 (Fully Prepaid)';
    const text = [
      `--- MATCHFIX COURIER SLIP ---`,
      `Recipient: ${o.customer_name || 'Valued Customer'}`,
      `Phone: ${phone}`,
      `Delivery Address: ${o.delivery_address || 'Not specified'}`,
      `COD Amount to Collect: ${cash}`,
      `Item: ${o.product_title || o.title} (Qty: ${o.qty})`,
      `Order Ref: #ORD-${o.order_id}`,
      `Store: ${user?.seller?.shop_name || 'MatchFix Merchant'}`,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedSlipId(o.order_id);
    setTimeout(() => {
      setCopiedSlipId(null);
    }, 2500);
  }

  // Summary statistics
  const outOfStockCount = useMemo(
    () => products.filter((p) => Number(p.stock) === 0).length,
    [products]
  );
  const lowStockCount = useMemo(
    () => products.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 3).length,
    [products]
  );
  const inStockCount = useMemo(
    () => products.filter((p) => Number(p.stock) > 0).length,
    [products]
  );

  const storeRating = useMemo(() => {
    const rated = products.filter(
      (p) => Number(p.review_count) > 0 && (p.avg_rating || p.average_rating)
    );
    if (!rated.length) return null;
    const totalScore = rated.reduce(
      (acc, p) => acc + Number(p.avg_rating || p.average_rating),
      0
    );
    const totalReviews = rated.reduce((acc, p) => acc + Number(p.review_count), 0);
    return {
      avg: (totalScore / rated.length).toFixed(1),
      count: totalReviews,
    };
  }, [products]);

  // Merchant Financial Analytics
  const grossSales = useMemo(() => {
    return orders
      .filter((o) => (o.item_status || o.order_status) !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.unit_price || 0) * (Number(o.qty) || 1), 0);
  }, [orders]);

  const totalUnitsSold = useMemo(() => {
    return orders
      .filter((o) => (o.item_status || o.order_status) !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.qty) || 1), 0);
  }, [orders]);

  const pendingCODOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.payment_method === 'cash_advance' &&
        Number(o.cash_balance) > 0 &&
        (o.item_status || o.order_status) !== 'delivered' &&
        (o.item_status || o.order_status) !== 'cancelled'
    );
  }, [orders]);

  const pendingCODAmount = useMemo(() => {
    return pendingCODOrders.reduce((sum, o) => sum + Number(o.cash_balance || 0), 0);
  }, [pendingCODOrders]);

  const pendingFulfillCount = useMemo(() => {
    return orders.filter((o) => {
      const st = o.item_status || o.order_status;
      return st === 'placed' || st === 'confirmed' || st === 'advance_paid';
    }).length;
  }, [orders]);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    if (stockFilter === 'in_stock') {
      list = list.filter((p) => Number(p.stock) > 0);
    } else if (stockFilter === 'low_stock') {
      list = list.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 3);
    } else if (stockFilter === 'out_of_stock') {
      list = list.filter((p) => Number(p.stock) === 0);
    }

    list.sort((a, b) => {
      if (sortBy === 'stock_asc') return Number(a.stock) - Number(b.stock);
      if (sortBy === 'stock_desc') return Number(b.stock) - Number(a.stock);
      if (sortBy === 'price_asc') return Number(a.price) - Number(b.price);
      if (sortBy === 'price_desc') return Number(b.price) - Number(a.price);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return list;
  }, [products, searchQuery, stockFilter, sortBy]);

  // Filtered & sorted orders
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase().trim();
      list = list.filter((o) => {
        const title = (o.product_title || o.title || '').toLowerCase();
        const customer = (o.customer_name || '').toLowerCase();
        const phone = (o.delivery_phone || o.customer_phone || '').toLowerCase();
        const email = (o.customer_email || '').toLowerCase();
        const addr = (o.delivery_address || '').toLowerCase();
        const orderIdStr = String(o.order_id || '').toLowerCase();
        return (
          title.includes(q) ||
          customer.includes(q) ||
          phone.includes(q) ||
          email.includes(q) ||
          addr.includes(q) ||
          orderIdStr.includes(q)
        );
      });
    }

    if (orderStatusFilter === 'to_fulfill') {
      list = list.filter((o) => {
        const st = o.item_status || o.order_status;
        return st === 'placed' || st === 'confirmed' || st === 'advance_paid';
      });
    } else if (orderStatusFilter === 'needs_cod') {
      list = list.filter(
        (o) =>
          o.payment_method === 'cash_advance' &&
          Number(o.cash_balance) > 0 &&
          (o.item_status || o.order_status) !== 'delivered' &&
          (o.item_status || o.order_status) !== 'cancelled'
      );
    } else if (orderStatusFilter !== 'all') {
      list = list.filter((o) => (o.item_status || o.order_status) === orderStatusFilter);
    }

    list.sort((a, b) => {
      const aVal = Number(a.unit_price || 0) * (Number(a.qty) || 1);
      const bVal = Number(b.unit_price || 0) * (Number(b.qty) || 1);
      if (orderSort === 'amount_desc') return bVal - aVal;
      if (orderSort === 'amount_asc') return aVal - bVal;
      if (orderSort === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return list;
  }, [orders, orderSearch, orderStatusFilter, orderSort]);

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
          Manage {user?.seller?.shop_name || 'your sports gear catalog'}, restock inventory, fulfill orders, and track deliveries.
        </p>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Catalog Items</span>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-1">{products.length}</p>
          <span className="text-[11px] text-[#16a34a] font-semibold">{inStockCount} active in stock</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Gross Gear Sales</span>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-1">
            ৳{grossSales.toLocaleString()}
          </p>
          <span className="text-[11px] text-neutral-500 font-medium">
            {totalUnitsSold} items sold to date
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">COD Cash to Collect</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">
            ৳{pendingCODAmount.toLocaleString()}
          </p>
          <span className="text-[11px] text-neutral-500 font-medium">
            {pendingCODOrders.length} pending delivery collection
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Stock Alerts</span>
          <p
            className={`text-2xl sm:text-3xl font-black mt-1 ${
              outOfStockCount > 0 ? 'text-rose-600' : lowStockCount > 0 ? 'text-amber-600' : 'text-[#16a34a]'
            }`}
          >
            {outOfStockCount + lowStockCount === 0
              ? 'Healthy'
              : `${outOfStockCount + lowStockCount} Alert${outOfStockCount + lowStockCount > 1 ? 's' : ''}`}
          </p>
          <span className="text-[11px] text-neutral-500 font-medium">
            {outOfStockCount > 0
              ? `${outOfStockCount} out of stock`
              : lowStockCount > 0
              ? `${lowStockCount} low stock`
              : 'All listings fully stocked'}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Store Reputation</span>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-1 flex items-center gap-1.5">
            {storeRating ? (
              <>
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span>{storeRating.avg}</span>
              </>
            ) : (
              <span className="text-lg text-neutral-400 font-bold">New Shop</span>
            )}
          </p>
          <span className="text-[11px] text-neutral-500 font-medium">
            {orders.length} orders · {storeRating ? `${storeRating.count} reviews` : 'Awaiting reviews'}
          </span>
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
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            tab === 'orders'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          <span>Customer Orders ({orders.length})</span>
          {pendingFulfillCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center">
              {pendingFulfillCount}
            </span>
          )}
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
            <>
              {/* Inventory Search & Filter Controls */}
              <div className="bg-white border border-neutral-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search catalog by gear name, category, specs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-8 py-2 rounded-2xl bg-neutral-50/70 border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] placeholder-neutral-400"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Sort By Dropdown */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                      <ArrowUpDown className="w-3 h-3" /> Sort:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-800 bg-neutral-50/80 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#16a34a]"
                    >
                      <option value="newest">Newest Added</option>
                      <option value="stock_asc">Lowest Stock (Restock Priority)</option>
                      <option value="stock_desc">Highest Stock First</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                    </select>
                  </div>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setStockFilter('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      stockFilter === 'all'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    All Gear ({products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockFilter('in_stock')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      stockFilter === 'in_stock'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    In Stock ({inStockCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockFilter('low_stock')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      stockFilter === 'low_stock'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                    }`}
                  >
                    Low Stock (≤ 3) ({lowStockCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockFilter('out_of_stock')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      stockFilter === 'out_of_stock'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                    }`}
                  >
                    Out of Stock ({outOfStockCount})
                  </button>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 border border-neutral-200 rounded-3xl p-8">
                  <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-bold text-neutral-700">No gear matches your current filters</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Try clearing your search query or switching the stock filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStockFilter('all');
                    }}
                    className="mt-3 px-4 py-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-bold transition cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.product_id}
                      className="bg-white border border-neutral-200/90 rounded-3xl p-5 shadow-2xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Cover image & badges */}
                        <div className="relative aspect-[16/10] rounded-2xl bg-neutral-100 overflow-hidden border border-neutral-100">
                          <img
                            src={getImageUrl(
                              p.cover_image || p.images?.[0]?.url,
                              'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=600&q=80'
                            )}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />

                          {/* Approval Status Overlay Badge */}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            {p.approval_status === 'pending' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/95 text-white flex items-center gap-1 shadow-sm backdrop-blur-xs">
                                <Clock className="w-3 h-3" /> Pending Review
                              </span>
                            )}
                            {p.approval_status === 'rejected' && (
                              <span
                                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-600/95 text-white flex items-center gap-1 shadow-sm backdrop-blur-xs"
                                title={p.rejection_reason || 'Rejected by administrator'}
                              >
                                <AlertTriangle className="w-3 h-3" /> Rejected
                              </span>
                            )}
                            {p.approval_status === 'approved' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#16a34a]/95 text-white flex items-center gap-1 shadow-sm backdrop-blur-xs">
                                <CheckCircle2 className="w-3 h-3" /> Live
                              </span>
                            )}
                          </div>

                          {/* View on Marketplace link */}
                          <Link
                            to={`/marketplace/${p.product_id}`}
                            target="_blank"
                            rel="noreferrer"
                            title="View live product listing"
                            className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 hover:bg-white text-neutral-700 hover:text-black shadow-xs transition cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>

                        {/* Rejection reason banner if rejected */}
                        {p.approval_status === 'rejected' && p.rejection_reason && (
                          <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium leading-relaxed">
                            <strong>Rejection Note:</strong> {p.rejection_reason}
                          </div>
                        )}

                        {/* Metadata */}
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#16a34a] uppercase tracking-wider">
                              {p.category || 'Gear'}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                Number(p.stock) === 0
                                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                  : Number(p.stock) <= 3
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-green-50 text-[#16a34a] border border-green-200'
                              }`}
                            >
                              {Number(p.stock) === 0
                                ? 'Out of stock'
                                : Number(p.stock) <= 3
                                ? `Low stock (${p.stock} left)`
                                : `${p.stock} in stock`}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm text-neutral-900 mt-1 line-clamp-1" title={p.title}>
                            {p.title}
                          </h4>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-base font-black text-neutral-900">
                              ৳{Number(p.price).toLocaleString()}
                            </p>
                            {Number(p.review_count) > 0 ? (
                              <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{Number(p.avg_rating || p.average_rating || 5).toFixed(1)}</span>
                                <span className="text-[10px] text-neutral-400 font-normal">({p.review_count})</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-neutral-400 font-medium">No reviews</span>
                            )}
                          </div>
                        </div>

                        {/* Quick Restock Stepper */}
                        <div className="flex items-center justify-between p-2 rounded-2xl bg-neutral-50/80 border border-neutral-100 text-xs">
                          <span className="text-[11px] font-semibold text-neutral-500">Quick Restock:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={restockingId === p.product_id}
                              onClick={() => handleQuickRestock(p.product_id, p.stock, 1)}
                              className="px-2 py-0.5 rounded-lg bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-700 text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
                              title="Add 1 unit to stock"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              disabled={restockingId === p.product_id}
                              onClick={() => handleQuickRestock(p.product_id, p.stock, 5)}
                              className="px-2 py-0.5 rounded-lg bg-white border border-neutral-200 hover:border-neutral-300 text-[#16a34a] text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
                              title="Add 5 units to stock"
                            >
                              +5
                            </button>
                            <button
                              type="button"
                              disabled={restockingId === p.product_id}
                              onClick={() => handleQuickRestock(p.product_id, p.stock, 10)}
                              className="px-2 py-0.5 rounded-lg bg-white border border-neutral-200 hover:border-neutral-300 text-[#16a34a] text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
                              title="Add 10 units to stock"
                            >
                              +10
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                        <span className="capitalize text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-lg">
                          {p.condition === 'used' ? 'Used / Practice' : 'Brand New'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingProduct(p)}
                            className="px-2.5 py-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                            title="Edit details"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-neutral-600" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setManagingPhotosProduct(p)}
                            className="px-2.5 py-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                            title="Manage photos"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-[#16a34a]" />
                            <span>Photos</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.product_id, p.title)}
                            className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Orders */}
      {tab === 'orders' && (
        <div className="space-y-6">
          {/* Order Search & Filter Controls */}
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search customer name, phone, address, product, or #ORD..."
                  className="w-full pl-11 pr-8 py-2 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:border-neutral-900 bg-neutral-50/50"
                />
                {orderSearch && (
                  <button
                    onClick={() => setOrderSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-neutral-400" />
                  <select
                    value={orderSort}
                    onChange={(e) => setOrderSort(e.target.value)}
                    className="px-3 py-2 rounded-2xl border border-neutral-200 text-xs font-semibold text-neutral-700 bg-white cursor-pointer focus:outline-none focus:border-neutral-900"
                  >
                    <option value="newest">Newest Orders First</option>
                    <option value="oldest">Oldest Orders First</option>
                    <option value="amount_desc">Order Value: High to Low</option>
                    <option value="amount_asc">Order Value: Low to High</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={loadOrders}
                  disabled={loadingOrders}
                  className="p-2 rounded-2xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition cursor-pointer disabled:opacity-50"
                  title="Refresh orders"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin text-[#16a34a]' : ''}`} />
                </button>
              </div>
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 text-xs">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mr-1">
                Status:
              </span>
              <button
                type="button"
                onClick={() => setOrderStatusFilter('all')}
                className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                  orderStatusFilter === 'all'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                }`}
              >
                All Orders ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setOrderStatusFilter('to_fulfill')}
                className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                  orderStatusFilter === 'to_fulfill'
                    ? 'bg-amber-600 text-white'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                }`}
              >
                To Ship / Fulfill ({pendingFulfillCount})
              </button>
              <button
                type="button"
                onClick={() => setOrderStatusFilter('needs_cod')}
                className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                  orderStatusFilter === 'needs_cod'
                    ? 'bg-amber-700 text-white'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                }`}
              >
                Needs COD Cash ({pendingCODOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setOrderStatusFilter('confirmed')}
                className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                  orderStatusFilter === 'confirmed'
                    ? 'bg-teal-700 text-white'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                }`}
              >
                Confirmed ({orders.filter((o) => (o.item_status || o.order_status) === 'confirmed').length})
              </button>
              <button
                type="button"
                onClick={() => setOrderStatusFilter('shipped')}
                className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                  orderStatusFilter === 'shipped'
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                }`}
              >
                Shipped ({orders.filter((o) => (o.item_status || o.order_status) === 'shipped').length})
              </button>
              <button
                type="button"
                onClick={() => setOrderStatusFilter('delivered')}
                className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                  orderStatusFilter === 'delivered'
                    ? 'bg-[#16a34a] text-white'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                }`}
              >
                Delivered ({orders.filter((o) => (o.item_status || o.order_status) === 'delivered').length})
              </button>
              <button
                type="button"
                onClick={() => setOrderStatusFilter('cancelled')}
                className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                  orderStatusFilter === 'cancelled'
                    ? 'bg-rose-600 text-white'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                }`}
              >
                Cancelled ({orders.filter((o) => (o.item_status || o.order_status) === 'cancelled').length})
              </button>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 bg-neutral-50 border border-neutral-200 rounded-3xl p-8">
              <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-neutral-700">No incoming customer orders yet</p>
              <p className="text-xs text-neutral-500 mt-1">
                When customers purchase your listed gear, orders will arrive here.
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white border border-neutral-200 rounded-3xl p-6">
              <AlertCircle className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-neutral-700">No orders match your filter criteria</p>
              <button
                onClick={() => {
                  setOrderSearch('');
                  setOrderStatusFilter('all');
                }}
                className="mt-3 px-4 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((o) => {
                const currentStatus = o.item_status || o.order_status;
                const totalItemVal = Number(o.unit_price || 0) * (Number(o.qty) || 1);
                const contactPhone = o.delivery_phone || o.customer_phone;
                const isItemUpdating = updatingItemId === `${o.order_id}-${o.product_id}`;

                return (
                  <div
                    key={`${o.order_id}-${o.product_id}`}
                    className="bg-white border border-neutral-200/90 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition space-y-4"
                  >
                    {/* Top Row: Order ID, Date & Status Pills */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-100 gap-2">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-extrabold text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-xl">
                          #ORD-{o.order_id}
                        </span>
                        <div className="flex items-center gap-1 text-neutral-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {new Date(o.created_at || Date.now()).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {o.payment_method === 'cash_advance' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Banknote className="w-3 h-3" />
                            <span>Cash on Delivery</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-[#16a34a] border border-green-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Prepaid Online</span>
                          </span>
                        )}

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            currentStatus === 'delivered'
                              ? 'bg-green-100 text-[#16a34a]'
                              : currentStatus === 'shipped'
                              ? 'bg-blue-100 text-blue-700'
                              : currentStatus === 'confirmed'
                              ? 'bg-teal-100 text-teal-800'
                              : currentStatus === 'cancelled'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {currentStatus === 'advance_paid' ? 'Advance Paid' : currentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Middle Grid: Product Details & Customer / Delivery Address */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                      {/* Product Thumbnail & Details */}
                      <div className="md:col-span-6 flex items-start gap-4">
                        <Link
                          to={`/marketplace/${o.product_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-100 border border-neutral-100 overflow-hidden shrink-0 flex items-center justify-center hover:opacity-90 transition"
                          title="View live product listing"
                        >
                          {o.cover_image ? (
                            <img
                              src={getImageUrl(o.cover_image)}
                              alt={o.product_title || o.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-7 h-7 text-neutral-300" />
                          )}
                        </Link>

                        <div className="space-y-1 min-w-0">
                          <Link
                            to={`/marketplace/${o.product_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-extrabold text-sm sm:text-base text-neutral-900 hover:text-[#16a34a] transition line-clamp-1 flex items-center gap-1"
                            title={o.product_title || o.title}
                          >
                            <span>{o.product_title || o.title}</span>
                            <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0" />
                          </Link>

                          <div className="text-xs text-neutral-500 flex items-center gap-2">
                            <span>
                              Qty: <strong className="text-neutral-800">{o.qty}</strong>
                            </span>
                            <span>·</span>
                            <span>৳{Number(o.unit_price).toLocaleString()} each</span>
                          </div>

                          <div className="pt-1">
                            <span className="text-sm font-black text-neutral-900">
                              Item Value: ৳{totalItemVal.toLocaleString()}
                            </span>
                            {o.payment_method === 'cash_advance' && (
                              <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
                                Advance: ৳{Number(o.advance_amount || 0).toLocaleString()} · Collect COD:{' '}
                                <strong className="text-amber-900 font-black">
                                  ৳{Number(o.cash_balance || 0).toLocaleString()}
                                </strong>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Customer Details & Delivery Address */}
                      <div className="md:col-span-6 space-y-2 bg-neutral-50/70 p-3.5 rounded-2xl border border-neutral-100">
                        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                          <span className="font-extrabold text-neutral-900">
                            Customer: {o.customer_name || 'Guest User'}
                          </span>
                          <div className="flex items-center gap-3">
                            {contactPhone && (
                              <a
                                href={`tel:${contactPhone}`}
                                className="flex items-center gap-1 text-[#16a34a] font-bold hover:underline"
                                title="Call customer"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{contactPhone}</span>
                              </a>
                            )}
                            {o.customer_email && (
                              <a
                                href={`mailto:${o.customer_email}`}
                                className="flex items-center gap-1 text-neutral-500 hover:text-neutral-800 transition truncate max-w-[140px]"
                                title={o.customer_email}
                              >
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{o.customer_email}</span>
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-1.5 text-xs text-neutral-600">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            {o.delivery_address || 'No specific physical delivery address provided'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Copy Courier Slip */}
                      <button
                        type="button"
                        onClick={() => copyDeliverySlip(o)}
                        className="px-3.5 py-1.5 rounded-xl border border-neutral-200 hover:border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 w-fit"
                        title="Copy formatted recipient information for Pathao / RedX / Steadfast"
                      >
                        {copiedSlipId === o.order_id ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-[#16a34a]" />
                            <span className="text-[#16a34a]">Courier Slip Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Copy Courier Slip</span>
                          </>
                        )}
                      </button>

                      {/* Right: Cash collection & Status Changer */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {o.payment_method === 'cash_advance' &&
                          Number(o.cash_balance) > 0 &&
                          currentStatus !== 'delivered' &&
                          currentStatus !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleCollectCash(o.order_id)}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              <span>Collect COD Cash (৳{Number(o.cash_balance).toLocaleString()})</span>
                            </button>
                          )}

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-neutral-500">Item Status:</span>
                          <select
                            value={currentStatus}
                            disabled={isItemUpdating}
                            onChange={(e) => updateStatus(o.order_id, o.product_id, e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-neutral-300 text-xs font-bold uppercase tracking-wider bg-white cursor-pointer disabled:opacity-50 focus:outline-none focus:border-neutral-900"
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={loadProducts}
        />
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
