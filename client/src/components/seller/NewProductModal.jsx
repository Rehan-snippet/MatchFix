import { useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Plus } from 'lucide-react';

export default function NewProductModal({ onCreated }) {
  const toast = useToast();
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
      toast.success(`Product "${form.title}" published to marketplace!`);
      setForm({ title: '', category: 'Footwear', description: '', price: '', condition: 'new', stock: 10 });
      setImageUrl('');
      setOpen(false);
      onCreated();
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not create product';
      setError(msg);
      toast.error(msg);
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
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-md animate-in fade-in">
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
                <option value="Equipment">Footballs & Gear</option>
                <option value="Protection">Shin Guards & Gloves</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Price (৳ BDT)</label>
              <input
                required
                type="number"
                min="1"
                placeholder="e.g. 2400"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
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
                <option value="new">Brand New (Original)</option>
                <option value="like_new">Like New (Mint)</option>
                <option value="used">Pre-owned</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Available Units</label>
              <input
                type="number"
                min="1"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-neutral-700 mb-1">Cover Image URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-neutral-700 mb-1">Item Description</label>
              <textarea
                rows={3}
                placeholder="Specify size, colorway, brand authenticity, and condition details..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-6 py-2.5 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {busy ? 'Publishing…' : 'Publish Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
