import { useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Plus } from 'lucide-react';

export default function NewTurfModal({ areas, onCreated }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ area_id: '', name: '', address: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/turfs', form);
      toast.success(`Turf "${form.name}" registered successfully!`);
      setForm({ area_id: '', name: '', address: '', description: '' });
      setOpen(false);
      onCreated();
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not create turf venue';
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
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white text-xs sm:text-sm font-bold shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Turf Arena</span>
        </button>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-md animate-in fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-neutral-900">List a New Turf Arena</h3>
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

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Select Area / Zone</label>
              <select
                required
                value={form.area_id}
                onChange={(e) => setForm({ ...form, area_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
              >
                <option value="">Select an area</option>
                {areas.map((a) => (
                  <option key={a.area_id} value={a.area_id}>
                    {a.name} ({a.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Turf Arena Name</label>
              <input
                required
                placeholder="e.g. Apex Football Arena"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-neutral-700 mb-1">Physical Address</label>
              <input
                required
                placeholder="Plot/Road number, Area name, Dhaka"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-neutral-700 mb-1">Facility Description</label>
              <textarea
                rows={3}
                placeholder="Describe surface quality, parking, lighting, dressing rooms..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
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
                {busy ? 'Creating…' : 'Create Arena'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
