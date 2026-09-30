import { useEffect, useRef, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Trophy,
  Plus,
  Calendar,
  MapPin,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Sparkles,
  Edit2,
  Trash2,
  Upload,
  Star,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ImageIcon,
  RefreshCw,
} from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

// ─── Helper ──────────────────────────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── NewTurfForm ─────────────────────────────────────────────────────────────
function NewTurfForm({ areas, onCreated }) {
  const [open, setOpen] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [form, setForm] = useState({
    area_id: '',
    name: '',
    address: '',
    hourly_rate: '1200',
    latitude: '',
    longitude: '',
    description: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.area_id) { setError('Please select an area/zone.'); return; }
    if (!form.name.trim()) { setError('Turf name is required.'); return; }
    if (!form.address.trim()) { setError('Physical address is required.'); return; }
    if (!form.hourly_rate || Number(form.hourly_rate) <= 0) { setError('Hourly rate must be greater than 0.'); return; }

    setBusy(true);
    setError('');
    try {
      const { data: newTurf } = await api.post('/turfs', {
        area_id: form.area_id,
        name: form.name.trim(),
        address: form.address.trim(),
        hourly_rate: Number(form.hourly_rate),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        description: form.description.trim() || null,
      });

      // Upload cover image if provided
      if (coverFile) {
        const fd = new FormData();
        fd.append('image', coverFile);
        fd.append('is_cover', 'true');
        await api.post(`/turfs/${newTurf.turf_id}/images`, fd);
      } else if (coverUrl && coverUrl.trim()) {
        await api.post(`/turfs/${newTurf.turf_id}/images`, { url: coverUrl.trim(), is_cover: true });
      }

      setForm({ area_id: '', name: '', address: '', hourly_rate: '1200', latitude: '', longitude: '', description: '' });
      setCoverFile(null);
      setCoverUrl('');
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create turf venue.');
    } finally {
      setBusy(false);
    }
  }

  function fillLocation() {
    if (!navigator.geolocation) { setError('Geolocation not supported.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('latitude', pos.coords.latitude.toFixed(6));
        set('longitude', pos.coords.longitude.toFixed(6));
      },
      () => setError('Could not retrieve your location.')
    );
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
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-extrabold text-neutral-900">List a New Turf Arena</h3>
              <p className="text-xs text-neutral-500 mt-0.5">It will be submitted for admin approval before going live.</p>
            </div>
            <button type="button" onClick={() => { setOpen(false); setError(''); }}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 cursor-pointer">
              Cancel
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Area */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Area / Zone <span className="text-rose-500">*</span></label>
              <select required value={form.area_id} onChange={(e) => set('area_id', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50">
                <option value="">Select an area</option>
                {areas.map((a) => (
                  <option key={a.area_id} value={a.area_id}>{a.name} ({a.city})</option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Arena Name <span className="text-rose-500">*</span></label>
              <input required placeholder="e.g. Apex Football Arena" value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50" />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-neutral-700 mb-1">Physical Address <span className="text-rose-500">*</span></label>
              <input required placeholder="Plot / Road / Sector, Dhaka" value={form.address}
                onChange={(e) => set('address', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50" />
            </div>

            {/* Hourly Rate */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Base Hourly Rate (৳) <span className="text-rose-500">*</span></label>
              <input required type="number" min="1" step="50" placeholder="1200" value={form.hourly_rate}
                onChange={(e) => set('hourly_rate', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50" />
              <p className="text-[10px] text-neutral-400 mt-0.5">Default rate when no special pricing rule applies.</p>
            </div>

            {/* GPS */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">GPS Coordinates <span className="text-neutral-400 font-normal">(optional)</span></label>
              <div className="flex gap-2">
                <input type="number" step="any" placeholder="Latitude" value={form.latitude}
                  onChange={(e) => set('latitude', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50" />
                <input type="number" step="any" placeholder="Longitude" value={form.longitude}
                  onChange={(e) => set('longitude', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50" />
                <button type="button" onClick={fillLocation} title="Use my current location"
                  className="flex-shrink-0 px-3 py-2 rounded-2xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition text-xs cursor-pointer">
                  📍
                </button>
              </div>
            </div>

            {/* Cover Photo */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Arena Cover Photo <span className="text-neutral-400 font-normal">(optional — upload file or paste URL)</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCoverFile(file);
                      setCoverUrl('');
                    }
                  }}
                  className="w-full sm:w-1/2 text-xs text-neutral-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 cursor-pointer"
                />
                <span className="text-xs text-neutral-400 font-bold">OR</span>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={coverUrl}
                  onChange={(e) => {
                    setCoverUrl(e.target.value);
                    setCoverFile(null);
                  }}
                  className="flex-1 w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
                />
              </div>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-neutral-700 mb-1">Description & Amenities</label>
              <textarea rows={2} placeholder="Floodlights, parking, locker rooms, artificial grass type…"
                value={form.description} onChange={(e) => set('description', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50" />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setOpen(false); setError(''); }}
                className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={busy}
                className="px-6 py-2.5 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-60">
                {busy ? 'Submitting…' : 'Submit for Approval'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── EditTurfModal ────────────────────────────────────────────────────────────
function EditTurfModal({ turf, areas, onSaved, onClose }) {
  const [form, setForm] = useState({
    area_id: turf.area_id || '',
    name: turf.name || '',
    address: turf.address || '',
    hourly_rate: turf.hourly_rate || '',
    latitude: turf.latitude || '',
    longitude: turf.longitude || '',
    description: turf.description || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.patch(`/turfs/${turf.turf_id}`, {
        ...form,
        hourly_rate: Number(form.hourly_rate),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update turf.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-neutral-200">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-extrabold text-neutral-900">Edit Turf Arena</h3>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-700 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        {error && <div className="mb-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">{error}</div>}
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Area</label>
            <select value={form.area_id} onChange={(e) => set('area_id', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50">
              {areas.map((a) => <option key={a.area_id} value={a.area_id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Arena Name</label>
            <input required value={form.name} onChange={(e) => set('name', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-neutral-700 mb-1">Address</label>
            <input required value={form.address} onChange={(e) => set('address', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50" />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Hourly Rate (৳)</label>
            <input required type="number" min="1" value={form.hourly_rate} onChange={(e) => set('hourly_rate', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50" />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">GPS (lat, lng)</label>
            <div className="flex gap-2">
              <input type="number" step="any" placeholder="Lat" value={form.latitude} onChange={(e) => set('latitude', e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50" />
              <input type="number" step="any" placeholder="Lng" value={form.longitude} onChange={(e) => set('longitude', e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-neutral-700 mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50" />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition cursor-pointer">Cancel</button>
            <button type="submit" disabled={busy}
              className="px-6 py-2.5 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-60">
              {busy ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── ImageManager ─────────────────────────────────────────────────────────────
function ImageManager({ turf, onChanged }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const images = turf.images || [];

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('is_cover', images.length === 0 ? 'true' : 'false');
      // Do NOT specify Content-Type header so the browser automatically sets multipart/form-data with boundary
      await api.post(`/turfs/${turf.turf_id}/images`, fd);
      onChanged();
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.response?.data?.error || 'Upload failed. Please ensure the file is an image under 15MB.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleAddUrlImage() {
    const url = window.prompt('Enter image URL (e.g. Unsplash link):');
    if (!url || !url.trim()) return;
    setUploadError('');
    setUploading(true);
    try {
      await api.post(`/turfs/${turf.turf_id}/images`, {
        url: url.trim(),
        is_cover: images.length === 0,
      });
      onChanged();
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Failed to add image URL.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSetCover(imageId) {
    try {
      await api.patch(`/turfs/${turf.turf_id}/images/${imageId}/cover`);
      onChanged();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not set cover.');
    }
  }

  async function handleDelete(imageId) {
    if (!window.confirm('Delete this image?')) return;
    try {
      await api.delete(`/turfs/${turf.turf_id}/images/${imageId}`);
      onChanged();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete image.');
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-neutral-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" /> Photos
        </span>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={handleAddUrlImage} disabled={uploading}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-[11px] font-bold transition cursor-pointer disabled:opacity-60">
            <span>+ Add URL</span>
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-[11px] font-bold transition cursor-pointer disabled:opacity-60">
            <Upload className="w-3 h-3" />
            {uploading ? 'Uploading…' : 'Upload Photo'}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>
      {uploadError && <p className="text-xs text-rose-600 mb-2">{uploadError}</p>}
      {images.length === 0 ? (
        <p className="text-xs text-neutral-400 italic">No photos yet. Upload a cover image to attract more bookings.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {images.map((img) => (
            <div key={img.image_id} className="relative group rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 aspect-square">
              <img src={getImageUrl(img.url)} alt="" className="w-full h-full object-cover" />
              {img.is_cover && (
                <span className="absolute top-1 left-1 bg-[#16a34a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Cover</span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                {!img.is_cover && (
                  <button type="button" onClick={() => handleSetCover(img.image_id)} title="Set as cover"
                    className="p-1.5 rounded-lg bg-[#16a34a] text-white text-[10px] cursor-pointer">
                    <Star className="w-3 h-3" />
                  </button>
                )}
                <button type="button" onClick={() => handleDelete(img.image_id)} title="Delete"
                  className="p-1.5 rounded-lg bg-rose-600 text-white cursor-pointer">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── FieldManager ─────────────────────────────────────────────────────────────
function FieldManager({ turf, areas, onChanged, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(true);
  const [fieldForm, setFieldForm] = useState({ name: '', side_type: '5v5', surface: 'Artificial Turf' });
  const [ruleForm, setRuleForm] = useState({});
  const [genForm, setGenForm] = useState({});
  const [busyField, setBusyField] = useState(false);
  const [busyRule, setBusyRule] = useState(false);
  const [busyGen, setBusyGen] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const approvalColor = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  }[turf.approval_status] || 'bg-neutral-100 text-neutral-600 border-neutral-200';

  async function addField(e) {
    e.preventDefault();
    setFieldError('');
    setBusyField(true);
    try {
      await api.post('/fields', { turf_id: turf.turf_id, ...fieldForm });
      setFieldForm({ name: '', side_type: '5v5', surface: 'Artificial Turf' });
      onChanged();
    } catch (err) {
      setFieldError(err.response?.data?.error || 'Could not add pitch.');
    } finally {
      setBusyField(false);
    }
  }

  async function deleteField(fieldId) {
    if (!window.confirm('Delete this pitch and all its pricing rules?')) return;
    try {
      await api.delete(`/fields/${fieldId}`);
      onChanged();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete pitch.');
    }
  }

  async function deleteRule(fieldId, ruleId) {
    if (!window.confirm('Delete this pricing rule?')) return;
    try {
      await api.delete(`/fields/${fieldId}/pricing-rules/${ruleId}`);
      onChanged();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete pricing rule.');
    }
  }

  async function addRule(fieldId, e) {
    e.preventDefault();
    setBusyRule(true);
    try {
      const f = ruleForm[fieldId] || {};
      await api.post(`/fields/${fieldId}/pricing-rules`, {
        day_of_week: Number(f.day_of_week ?? 6),
        start_time: f.start_time || '16:00',
        end_time: f.end_time || '22:00',
        hourly_rate: Number(f.hourly_rate || 1800),
      });
      setRuleForm({ ...ruleForm, [fieldId]: {} });
      onChanged();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not add pricing rule.');
    } finally {
      setBusyRule(false);
    }
  }

  async function generate(fieldId, e) {
    e.preventDefault();
    setBusyGen(true);
    try {
      const g = genForm[fieldId] || {};
      if (!g.start_date || !g.end_date) { alert('Please set start and end dates.'); return; }
      await api.post('/slots/generate', { field_id: fieldId, start_date: g.start_date, end_date: g.end_date });
      alert('✓ Hourly slots generated successfully!');
      onChanged();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not generate slots.');
    } finally {
      setBusyGen(false);
    }
  }

  return (
    <div className="bg-white border border-neutral-200/90 rounded-3xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={() => setExpanded(!expanded)}
            className="text-neutral-400 hover:text-neutral-700 transition cursor-pointer flex-shrink-0">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {turf.images?.length > 0 && (
            <img
              src={getImageUrl(turf.images.find((i) => i.is_cover)?.url || turf.images[0]?.url)}
              alt={turf.name}
              className="w-12 h-12 rounded-2xl object-cover border border-neutral-200 flex-shrink-0 shadow-2xs"
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-neutral-900 truncate">{turf.name}</h3>
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${approvalColor}`}>
                {turf.approval_status}
              </span>
            </div>
            <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
              <span>{turf.address}</span>
            </p>
            <p className="text-xs text-[#16a34a] font-bold mt-0.5">
              ৳{Number(turf.hourly_rate).toLocaleString()}/hr base rate
              {turf.average_rating ? ` · ⭐ ${Number(turf.average_rating).toFixed(1)}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold">
            {turf.fields?.length || 0} {turf.fields?.length === 1 ? 'Pitch' : 'Pitches'}
          </span>
          <button type="button" onClick={() => onEdit(turf)} title="Edit turf"
            className="p-2 rounded-xl border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => onDelete(turf.turf_id, turf.name)} title="Delete turf"
            className="p-2 rounded-xl border border-neutral-200 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {turf.approval_status === 'rejected' && turf.rejection_reason && (
        <div className="mx-5 mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span><strong>Rejection reason:</strong> {turf.rejection_reason}</span>
        </div>
      )}

      {turf.approval_status === 'pending' && (
        <div className="mx-5 mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 flex-shrink-0 animate-spin" />
          <span>Under admin review. You can still set up pitches and pricing now.</span>
        </div>
      )}

      {expanded && (
        <div className="px-5 sm:px-6 pb-6 space-y-6 border-t border-neutral-100 pt-5">
          {/* Image Manager */}
          <ImageManager turf={turf} onChanged={onChanged} />

          {/* Fields List */}
          {(turf.fields?.length > 0) && (
            <div className="space-y-4">
              <p className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">Pitches & Pricing</p>
              {turf.fields.map((f) => (
                <div key={f.field_id} className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-neutral-900">{f.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-green-50 text-[#16a34a] border border-green-200 text-[11px] font-bold">{f.side_type}</span>
                      <span className="text-xs text-neutral-500">· {f.surface}</span>
                    </div>
                    <button type="button" onClick={() => deleteField(f.field_id)} title="Delete pitch"
                      className="p-1.5 rounded-xl border border-neutral-200 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Pricing Rules */}
                  <div>
                    <p className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-2">Pricing Rules</p>
                    {f.pricing_rules?.length ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {f.pricing_rules.map((r) => (
                          <div key={r.rule_id}
                            className="p-2.5 rounded-xl bg-white border border-neutral-200 text-xs flex items-center justify-between gap-2">
                            <span className="font-medium text-neutral-700 truncate">
                              {DAYS[r.day_of_week]}: {String(r.start_time).slice(0, 5)}–{String(r.end_time).slice(0, 5)}
                            </span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="font-bold text-[#16a34a]">৳{Number(r.hourly_rate).toLocaleString()}/hr</span>
                              <button type="button" onClick={() => deleteRule(f.field_id, r.rule_id)} title="Delete rule"
                                className="text-neutral-400 hover:text-rose-600 cursor-pointer transition">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-400 italic">No pricing rules. Using base rate ৳{Number(turf.hourly_rate).toLocaleString()}/hr.</p>
                    )}
                  </div>

                  {/* Add Pricing Rule */}
                  <form onSubmit={(e) => addRule(f.field_id, e)}
                    className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-2">
                    <span className="text-[11px] font-bold text-neutral-800">Add Pricing Rule</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <select value={ruleForm[f.field_id]?.day_of_week ?? 6}
                        onChange={(e) => setRuleForm({ ...ruleForm, [f.field_id]: { ...ruleForm[f.field_id], day_of_week: e.target.value } })}
                        className="px-2 py-1.5 rounded-xl border border-neutral-200 text-xs bg-neutral-50/50">
                        {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                      </select>
                      <input type="time" value={ruleForm[f.field_id]?.start_time ?? '16:00'}
                        onChange={(e) => setRuleForm({ ...ruleForm, [f.field_id]: { ...ruleForm[f.field_id], start_time: e.target.value } })}
                        className="px-2 py-1.5 rounded-xl border border-neutral-200 text-xs bg-neutral-50/50" />
                      <input type="time" value={ruleForm[f.field_id]?.end_time ?? '22:00'}
                        onChange={(e) => setRuleForm({ ...ruleForm, [f.field_id]: { ...ruleForm[f.field_id], end_time: e.target.value } })}
                        className="px-2 py-1.5 rounded-xl border border-neutral-200 text-xs bg-neutral-50/50" />
                      <input type="number" placeholder="Rate (৳)" value={ruleForm[f.field_id]?.hourly_rate ?? ''}
                        onChange={(e) => setRuleForm({ ...ruleForm, [f.field_id]: { ...ruleForm[f.field_id], hourly_rate: e.target.value } })}
                        className="px-2 py-1.5 rounded-xl border border-neutral-200 text-xs bg-neutral-50/50" />
                      <button type="submit" disabled={busyRule}
                        className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer disabled:opacity-60">
                        {busyRule ? '…' : 'Add'}
                      </button>
                    </div>
                  </form>

                  {/* Generate Slots */}
                  <form onSubmit={(e) => generate(f.field_id, e)}
                    className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-2">
                    <span className="text-[11px] font-bold text-neutral-800">Generate Bookable Slots</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input type="date" required
                        onChange={(e) => setGenForm({ ...genForm, [f.field_id]: { ...genForm[f.field_id], start_date: e.target.value } })}
                        className="px-2.5 py-1.5 rounded-xl border border-neutral-200 text-xs bg-neutral-50/50" />
                      <input type="date" required
                        onChange={(e) => setGenForm({ ...genForm, [f.field_id]: { ...genForm[f.field_id], end_date: e.target.value } })}
                        className="px-2.5 py-1.5 rounded-xl border border-neutral-200 text-xs bg-neutral-50/50" />
                      <button type="submit" disabled={busyGen}
                        className="px-4 py-1.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold transition cursor-pointer disabled:opacity-60">
                        {busyGen ? 'Generating…' : 'Generate Slots'}
                      </button>
                    </div>
                  </form>
                </div>
              ))}
            </div>
          )}

          {/* Add Field */}
          {fieldError && (
            <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{fieldError}</p>
          )}
          <form onSubmit={addField}
            className="p-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 flex flex-col sm:flex-row items-center gap-3">
            <input placeholder="New Pitch Name (e.g. Pitch 1)" required value={fieldForm.name}
              onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
              className="flex-1 w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white" />
            <select value={fieldForm.side_type} onChange={(e) => setFieldForm({ ...fieldForm, side_type: e.target.value })}
              className="w-full sm:w-28 px-3 py-2 rounded-xl border border-neutral-200 text-xs bg-white font-semibold">
              <option value="5v5">5v5</option>
              <option value="7v7">7v7</option>
              <option value="11v11">11v11</option>
            </select>
            <input placeholder="Surface (e.g. 3G Artificial)" value={fieldForm.surface}
              onChange={(e) => setFieldForm({ ...fieldForm, surface: e.target.value })}
              className="w-full sm:w-40 px-3 py-2 rounded-xl border border-neutral-200 text-xs bg-white" />
            <button type="submit" disabled={busyField}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition whitespace-nowrap cursor-pointer disabled:opacity-60">
              {busyField ? '…' : '+ Add Pitch'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [turfs, setTurfs] = useState([]);
  const [areas, setAreas] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState('turfs');
  const [busyConfirm, setBusyConfirm] = useState(null);
  const [editingTurf, setEditingTurf] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadTurfs() {
    setLoading(true);
    try {
      // Use server-side organizer_id filter — includes pending/rejected turfs for the owner
      const { data } = await api.get('/turfs', { params: { organizer_id: user.user_id } });
      // Fetch full details (with fields + pricing_rules + images) for each
      const detailed = await Promise.all(
        data.map((t) => api.get(`/turfs/${t.turf_id}`).then((r) => r.data))
      );
      setTurfs(detailed);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get('/areas').then((res) => setAreas(res.data));
    loadTurfs();
  }, []);

  useEffect(() => {
    if (tab === 'bookings') {
      api.get('/bookings/for-my-turfs').then((res) => setBookings(res.data || []));
    }
  }, [tab]);

  async function confirmBooking(id) {
    setBusyConfirm(id);
    try {
      await api.patch(`/bookings/${id}/confirm`);
      const { data } = await api.get('/bookings/for-my-turfs');
      setBookings(data || []);
    } finally {
      setBusyConfirm(null);
    }
  }

  async function handleCollectCash(id) {
    if (!window.confirm('Confirm that you have collected the remaining cash balance from the player at the venue?')) return;
    setBusyConfirm(id);
    try {
      await api.patch(`/bookings/${id}/collect-cash`);
      const { data } = await api.get('/bookings/for-my-turfs');
      setBookings(data || []);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not record cash collection.');
    } finally {
      setBusyConfirm(null);
    }
  }

  async function handleDeleteTurf(turfId, turfName) {
    if (!window.confirm(`Permanently delete "${turfName}" and all its pitches, bookings, and images?`)) return;
    try {
      await api.delete(`/turfs/${turfId}`);
      loadTurfs();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete turf.');
    }
  }

  const totalFields = turfs.reduce((acc, t) => acc + (t.fields?.length || 0), 0);
  const approvedTurfs = turfs.filter((t) => t.approval_status === 'approved').length;
  const pendingTurfs = turfs.filter((t) => t.approval_status === 'pending').length;

  return (
    <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-[#16a34a] uppercase tracking-wider mb-1.5">
          <Trophy className="w-3.5 h-3.5" />
          <span>Organizer Management Hub</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
          Host Studio
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-neutral-500">
          Manage your football arena properties, set pricing schedules, and verify match bookings.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Arenas</span>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-1">{turfs.length}</p>
          {pendingTurfs > 0 && (
            <span className="text-[10px] text-amber-600 font-bold">{pendingTurfs} pending approval</span>
          )}
        </div>
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Live Arenas</span>
          <p className="text-2xl sm:text-3xl font-black text-[#16a34a] mt-1">{approvedTurfs}</p>
          <span className="text-[10px] text-neutral-400">Publicly visible</span>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Pitches</span>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-1">{totalFields}</p>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Reservations</span>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-1">{bookings.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 mb-8">
        <button type="button" onClick={() => setTab('turfs')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition cursor-pointer ${
            tab === 'turfs' ? 'bg-neutral-900 text-white shadow-xs' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}>
          My Venues & Pitches
        </button>
        <button type="button" onClick={() => setTab('bookings')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition cursor-pointer ${
            tab === 'bookings' ? 'bg-neutral-900 text-white shadow-xs' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}>
          Incoming Reservations
        </button>
      </div>

      {/* Tab: Turfs */}
      {tab === 'turfs' && (
        <div className="space-y-6">
          <NewTurfForm areas={areas} onCreated={loadTurfs} />
          {loading ? (
            <div className="text-center py-16">
              <RefreshCw className="w-6 h-6 text-neutral-300 animate-spin mx-auto mb-2" />
              <p className="text-sm text-neutral-400">Loading your venues…</p>
            </div>
          ) : turfs.length === 0 ? (
            <div className="text-center py-16 bg-neutral-50 border border-neutral-200 rounded-3xl p-8">
              <Trophy className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-neutral-700">No turf arenas registered yet</p>
              <p className="text-xs text-neutral-500 mt-1">Click "Add New Turf Arena" above to list your first venue.</p>
            </div>
          ) : (
            turfs.map((t) => (
              <FieldManager
                key={t.turf_id}
                turf={t}
                areas={areas}
                onChanged={loadTurfs}
                onDelete={handleDeleteTurf}
                onEdit={(turf) => setEditingTurf(turf)}
              />
            ))
          )}
        </div>
      )}

      {/* Tab: Bookings */}
      {tab === 'bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-16 bg-neutral-50 border border-neutral-200 rounded-3xl p-8">
              <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-neutral-700">No match bookings yet</p>
              <p className="text-xs text-neutral-500 mt-1">When players book your pitches, reservations will appear here.</p>
            </div>
          ) : (
            bookings.map((b) => (
              <div key={b.booking_id}
                className="bg-white border border-neutral-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-neutral-900">
                      Booking #{String(b.booking_id).slice(0, 8)}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      b.status === 'confirmed'
                        ? 'bg-green-50 text-[#16a34a] border border-green-200'
                        : b.status === 'completed'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : b.status === 'advance_paid'
                        ? 'bg-amber-50 text-amber-800 border border-amber-300'
                        : 'bg-neutral-50 text-neutral-700 border border-neutral-200'
                    }`}>
                      {b.status === 'advance_paid' ? 'Advance Paid (Balance Due)' : b.status}
                    </span>
                    {b.payment_method === 'cash_advance' && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                        Cash at Venue
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-600">
                    Customer: <strong className="text-neutral-900">{b.customer_name}</strong> · Total: ৳{Number(b.total_amount).toLocaleString()}
                  </p>
                  {b.payment_method === 'cash_advance' && (
                    <p className="text-xs text-amber-700 font-medium">
                      Advance: ৳{Number(b.advance_amount || 0).toLocaleString()} · Balance to Collect: <strong className="text-amber-900">৳{Number(b.cash_balance || 0).toLocaleString()}</strong>
                    </p>
                  )}
                  {b.created_at && (
                    <p className="text-[11px] text-neutral-400">
                      Booked: {new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {b.status === 'advance_paid' && (
                    <button type="button" disabled={busyConfirm === b.booking_id}
                      onClick={() => handleCollectCash(b.booking_id)}
                      className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-60">
                      {busyConfirm === b.booking_id ? 'Collecting…' : `Collect Cash (৳${Number(b.cash_balance || 0).toLocaleString()})`}
                    </button>
                  )}
                  {b.status === 'pending' && (
                    <button type="button" disabled={busyConfirm === b.booking_id}
                      onClick={() => confirmBooking(b.booking_id)}
                      className="px-5 py-2.5 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-60">
                      {busyConfirm === b.booking_id ? 'Confirming…' : 'Confirm Match'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Turf Modal */}
      {editingTurf && (
        <EditTurfModal
          turf={editingTurf}
          areas={areas}
          onSaved={loadTurfs}
          onClose={() => setEditingTurf(null)}
        />
      )}
    </div>
  );
}
