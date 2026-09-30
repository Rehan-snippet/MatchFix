import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  Search,
  ArrowUpDown,
  Phone,
  Mail,
  ExternalLink,
  AlertTriangle,
  XCircle,
  Banknote,
  Wallet,
  Check,
  CheckCheck,
  Copy,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import LocationPickerMap from '../components/LocationPickerMap';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function SlotBookingModal({ slotData, onClose, onCashCollected }) {
  if (!slotData) return null;
  const { field, slot } = slotData;
  const b = slot.booking;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#16a34a] uppercase tracking-wider">
                Pitch Reservation
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-neutral-100 text-neutral-800">
                #{String(b.booking_id).slice(0, 8)}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-neutral-900 mt-1">
              {field.field_name}
            </h3>
            <p className="text-xs text-neutral-500">
              {field.side_type} · {field.surface}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Schedule & Time */}
        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <span className="font-bold text-neutral-800">{slot.slot_date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#16a34a]" />
            <span className="font-extrabold text-[#16a34a]">
              {formatTime12h(slot.start_time)} - {formatTime12h(slot.end_time)}
            </span>
          </div>
        </div>

        {/* Customer Information */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Player Contact
          </h4>
          <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs space-y-2">
            <p className="font-extrabold text-sm text-neutral-900">{b.customer_name || 'Anonymous Player'}</p>
            <div className="flex items-center gap-4 flex-wrap text-xs">
              {b.customer_phone && (
                <a
                  href={`tel:${b.customer_phone}`}
                  className="flex items-center gap-1.5 text-[#16a34a] font-bold hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{b.customer_phone}</span>
                </a>
              )}
              {b.customer_email && (
                <a
                  href={`mailto:${b.customer_email}`}
                  className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900 hover:underline"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{b.customer_email}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Payment & Settlement
          </h4>
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-500">Total Booking Value:</span>
              <span className="font-extrabold text-neutral-900">৳{Number(b.total_amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Advance Paid Online:</span>
              <span className="font-bold text-neutral-700">৳{Number(b.advance_amount).toLocaleString()}</span>
            </div>
            {b.payment_method === 'cash_advance' && Number(b.cash_balance) > 0 && (
              <div className="flex justify-between pt-1 border-t border-neutral-200">
                <span className="font-bold text-amber-800">Cash Due at Venue:</span>
                <span className="font-black text-amber-800 text-sm">৳{Number(b.cash_balance).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {b.payment_method === 'cash_advance' && Number(b.cash_balance) > 0 && (
            <button
              type="button"
              onClick={() => {
                onCashCollected(b.booking_id);
                onClose();
              }}
              className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Collect Cash (৳{Number(b.cash_balance).toLocaleString()})</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function GenerateSlotsModal({ turfs, currentTurfId, onClose, onGenerated }) {
  const [selectedTurf, setSelectedTurf] = useState(currentTurfId || turfs[0]?.turf_id || '');
  const [selectedField, setSelectedField] = useState('all');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  
  const defaultEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }, []);
  const [endDate, setEndDate] = useState(defaultEnd);

  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(22);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const currentTurfObj = turfs.find((t) => Number(t.turf_id) === Number(selectedTurf));
  const availableFields = currentTurfObj?.fields || [];

  function setPresetDays(days) {
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + days);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedTurf) {
      setError('Please select a turf venue.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start date and end date are required.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await api.post('/slots/generate', {
        turf_id: selectedField === 'all' ? selectedTurf : undefined,
        field_id: selectedField !== 'all' ? selectedField : undefined,
        start_date: startDate,
        end_date: endDate,
        start_hour: Number(startHour),
        end_hour: Number(endHour),
      });
      onGenerated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate slots.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#16a34a] uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>Rapid Slot Generator</span>
            </div>
            <h3 className="text-xl font-extrabold text-neutral-900 mt-1">Generate Pitch Slots</h3>
            <p className="text-xs text-neutral-500">
              Bulk-create hourly booking slots for your football pitches. Existing bookings are never overwritten.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Turf Venue */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Select Venue
            </label>
            <select
              value={selectedTurf}
              onChange={(e) => {
                setSelectedTurf(e.target.value);
                setSelectedField('all');
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 bg-neutral-50 font-semibold text-neutral-900 cursor-pointer"
            >
              {turfs.map((t) => (
                <option key={t.turf_id} value={t.turf_id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pitch */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Pitch / Field
            </label>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 bg-neutral-50 font-semibold text-neutral-900 cursor-pointer"
            >
              <option value="all">All Pitches in this Venue ({availableFields.length} pitches)</option>
              {availableFields.map((f) => (
                <option key={f.field_id} value={f.field_id}>
                  {f.name} ({f.side_type})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                Date Horizon
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPresetDays(7)}
                  className="px-2 py-0.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-bold cursor-pointer"
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDays(14)}
                  className="px-2 py-0.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-bold cursor-pointer"
                >
                  14 Days
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDays(30)}
                  className="px-2 py-0.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-bold cursor-pointer"
                >
                  30 Days
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-neutral-400 font-semibold block mb-0.5">Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border border-neutral-200 bg-neutral-50 font-semibold text-neutral-900"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 font-semibold block mb-0.5">End Date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border border-neutral-200 bg-neutral-50 font-semibold text-neutral-900"
                />
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                First Slot Hour
              </label>
              <select
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-neutral-200 bg-neutral-50 font-semibold text-neutral-900 cursor-pointer"
              >
                {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((h) => (
                  <option key={h} value={h}>
                    {h % 12 || 12}:00 {h >= 12 ? 'PM' : 'AM'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Last Slot Hour
              </label>
              <select
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-neutral-200 bg-neutral-50 font-semibold text-neutral-900 cursor-pointer"
              >
                {[18, 19, 20, 21, 22, 23].map((h) => (
                  <option key={h} value={h}>
                    {h % 12 || 12}:00 {h >= 12 ? 'PM' : 'AM'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-6 py-2 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white font-bold transition shadow-xs cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
            >
              {busy ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Slots…</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Generate Slots</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                GPS Location <span className="text-neutral-400 font-normal">(pin on map or enter coordinates)</span>
              </label>
              <div className="flex gap-2">
                <input type="number" step="any" placeholder="Latitude" value={form.latitude}
                  onChange={(e) => set('latitude', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50" />
                <input type="number" step="any" placeholder="Longitude" value={form.longitude}
                  onChange={(e) => set('longitude', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50" />
                <button type="button" onClick={fillLocation} title="Use my current location"
                  className="flex-shrink-0 px-3 py-2 rounded-2xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition text-xs cursor-pointer flex items-center gap-1 font-semibold">
                  <span>📍</span>
                  <span className="hidden sm:inline">Detect</span>
                </button>
              </div>

              {/* Interactive Map */}
              <LocationPickerMap
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={({ latitude, longitude }) => {
                  set('latitude', latitude);
                  set('longitude', longitude);
                }}
                height="220px"
              />
            </div>

            {/* Cover Photo */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Arena Cover Photo <span className="text-neutral-400 font-normal">(optional — upload file or paste URL)</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
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
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              GPS Location <span className="text-neutral-400 font-normal">(pin on map or edit coordinates)</span>
            </label>
            <div className="flex gap-2">
              <input type="number" step="any" placeholder="Lat" value={form.latitude} onChange={(e) => set('latitude', e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50" />
              <input type="number" step="any" placeholder="Lng" value={form.longitude} onChange={(e) => set('longitude', e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50" />
            </div>
            <LocationPickerMap
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={({ latitude, longitude }) => {
                set('latitude', latitude);
                set('longitude', longitude);
              }}
              height="200px"
            />
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
function FieldManager({ turf, areas, onChanged, onDelete, onEdit, bookings }) {
  const [expanded, setExpanded] = useState(true);
  const [fieldForm, setFieldForm] = useState({ name: '', side_type: '5v5', surface: 'Artificial Turf' });
  const [ruleForm, setRuleForm] = useState({});
  const [genForm, setGenForm] = useState({});
  const [busyField, setBusyField] = useState(false);
  const [busyRule, setBusyRule] = useState(false);
  const [busyGen, setBusyGen] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const turfBookings = useMemo(
    () => bookings?.filter((b) => Number(b.turf_id) === Number(turf.turf_id) && b.status !== 'cancelled') || [],
    [bookings, turf.turf_id]
  );
  const turfRevenue = useMemo(
    () => turfBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0),
    [turfBookings]
  );

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
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
          {turfRevenue > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#16a34a] border border-emerald-200 text-xs font-bold" title="Gross booking revenue for this venue">
              ৳{turfRevenue.toLocaleString()} ({turfBookings.length} {turfBookings.length === 1 ? 'match' : 'matches'})
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold">
            {turf.fields?.length || 0} {turf.fields?.length === 1 ? 'Pitch' : 'Pitches'}
          </span>
          <Link
            to={`/turfs/${turf.turf_id}`}
            target="_blank"
            rel="noreferrer"
            title="View live public arena page"
            className="p-2 rounded-xl border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
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
  const [busyCancel, setBusyCancel] = useState(null);
  const [editingTurf, setEditingTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Search & filter state for reservations
  const [bookingSearch, setBookingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'advance_paid' | 'confirmed' | 'pending' | 'completed' | 'cancelled'
  const [selectedTurfFilter, setSelectedTurfFilter] = useState('all'); // 'all' | turf_id
  const [bookingSort, setBookingSort] = useState('match_desc'); // 'match_desc' | 'match_asc' | 'created_desc' | 'amount_desc' | 'amount_asc'
  const [copiedId, setCopiedId] = useState(null);

  // Timetable & Schedule State
  const [scheduleTurfId, setScheduleTurfId] = useState('');
  const [scheduleDate, setScheduleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [scheduleData, setScheduleData] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [slotModalData, setSlotModalData] = useState(null);
  const [togglingSlotKey, setTogglingSlotKey] = useState(null);

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
      if (detailed.length > 0 && !scheduleTurfId) {
        setScheduleTurfId(String(detailed[0].turf_id));
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  async function loadBookings() {
    setLoadingBookings(true);
    try {
      const { data } = await api.get('/bookings/for-my-turfs');
      setBookings(data || []);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setLoadingBookings(false);
    }
  }

  const loadSchedule = useCallback(async (turfId, date) => {
    if (!turfId || !date) return;
    setLoadingSchedule(true);
    try {
      const res = await api.get('/slots/schedule', { params: { turf_id: turfId, date } });
      setScheduleData(res.data);
    } catch (err) {
      console.error('Failed to load pitch schedule', err);
    } finally {
      setLoadingSchedule(false);
    }
  }, []);

  useEffect(() => {
    api.get('/areas').then((res) => setAreas(res.data));
    loadTurfs();
    loadBookings();
  }, []);

  useEffect(() => {
    if (scheduleTurfId && scheduleDate) {
      loadSchedule(scheduleTurfId, scheduleDate);
    }
  }, [scheduleTurfId, scheduleDate, loadSchedule]);

  function changeScheduleDate(delta) {
    const parts = scheduleDate.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    d.setDate(d.getDate() + delta);
    setScheduleDate(d.toISOString().slice(0, 10));
  }

  function setScheduleOffsetDays(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    setScheduleDate(d.toISOString().slice(0, 10));
  }

  async function handleToggleSlot(fieldId, slotDate, startTime, action) {
    const key = `${fieldId}-${startTime}`;
    setTogglingSlotKey(key);
    try {
      await api.post('/slots/toggle', {
        field_id: fieldId,
        slot_date: slotDate,
        start_time: startTime,
        action,
      });
      await loadSchedule(scheduleTurfId, scheduleDate);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update slot status.');
    } finally {
      setTogglingSlotKey(null);
    }
  }

  async function handleQuickGenerateField(fieldId) {
    try {
      await api.post('/slots/generate', {
        field_id: fieldId,
        start_date: scheduleDate,
        end_date: scheduleDate,
        start_hour: 8,
        end_hour: 22,
      });
      await loadSchedule(scheduleTurfId, scheduleDate);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate day slots');
    }
  }

  async function confirmBooking(id) {
    setBusyConfirm(id);
    try {
      await api.patch(`/bookings/${id}/confirm`);
      await loadBookings();
    } finally {
      setBusyConfirm(null);
    }
  }

  async function handleCollectCash(id) {
    if (!window.confirm('Confirm that you have collected the remaining cash balance from the player at the venue?')) return;
    setBusyConfirm(id);
    try {
      await api.patch(`/bookings/${id}/collect-cash`);
      await loadBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not record cash collection.');
    } finally {
      setBusyConfirm(null);
    }
  }

  async function handleCancelBooking(bookingId) {
    const reason = window.prompt(
      'Enter a cancellation or decline reason for the customer:',
      'Schedule conflict / Maintenance at arena'
    );
    if (reason === null) return;
    setBusyCancel(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/cancel`, { cancel_reason: reason.trim() || 'Declined by organizer' });
      await loadBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not decline booking.');
    } finally {
      setBusyCancel(null);
    }
  }

  async function handleDeleteTurf(turfId, turfName) {
    if (!window.confirm(`Permanently delete "${turfName}" and all its pitches, bookings, and images?`)) return;
    try {
      await api.delete(`/turfs/${turfId}`);
      loadTurfs();
      loadBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete turf.');
    }
  }

  function copyBookingDetails(b) {
    const text = `MatchFix Booking #${String(b.booking_id).slice(0, 8)}
Venue: ${b.turf_name} (${b.field_name})
Date: ${b.slot_date} ${b.start_time ? `at ${b.start_time}` : ''}
Customer: ${b.customer_name} (${b.customer_phone || 'No phone'})
Total Amount: ৳${Number(b.total_amount).toLocaleString()}
Status: ${b.status} ${b.status === 'advance_paid' ? `(Balance Due: ৳${Number(b.cash_balance).toLocaleString()})` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(b.booking_id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const totalFields = turfs.reduce((acc, t) => acc + (t.fields?.length || 0), 0);
  const approvedTurfs = turfs.filter((t) => t.approval_status === 'approved').length;
  const pendingTurfs = turfs.filter((t) => t.approval_status === 'pending').length;

  // Financial Metrics
  const activeBookings = useMemo(() => bookings.filter((b) => b.status !== 'cancelled'), [bookings]);
  const grossRevenue = useMemo(
    () => activeBookings.reduce((acc, b) => acc + Number(b.total_amount || 0), 0),
    [activeBookings]
  );
  const advanceCollected = useMemo(
    () =>
      activeBookings.reduce(
        (acc, b) =>
          acc +
          (b.payment_method === 'online'
            ? Number(b.total_amount || 0)
            : Number(b.advance_amount || 0)),
        0
      ),
    [activeBookings]
  );
  const pendingCashVenue = useMemo(
    () =>
      bookings
        .filter((b) => b.status === 'advance_paid')
        .reduce((acc, b) => acc + Number(b.cash_balance || 0), 0),
    [bookings]
  );
  const pendingCashCount = useMemo(
    () => bookings.filter((b) => b.status === 'advance_paid').length,
    [bookings]
  );
  const pendingApprovalCount = useMemo(
    () => bookings.filter((b) => b.status === 'pending').length,
    [bookings]
  );
  const confirmedCount = useMemo(
    () => bookings.filter((b) => b.status === 'confirmed').length,
    [bookings]
  );
  const completedCount = useMemo(
    () => bookings.filter((b) => b.status === 'completed').length,
    [bookings]
  );
  const cancelledCount = useMemo(
    () => bookings.filter((b) => b.status === 'cancelled').length,
    [bookings]
  );

  // Timetable Occupancy & Financial Summary
  const timetableMetrics = useMemo(() => {
    if (!scheduleData?.fields) {
      return { totalSlots: 0, bookedSlots: 0, openSlots: 0, occupancyPct: 0, projectedEarnings: 0, cashDue: 0 };
    }
    let totalSlots = 0;
    let bookedSlots = 0;
    let projectedEarnings = 0;
    let cashDue = 0;

    for (const f of scheduleData.fields) {
      for (const s of f.slots || []) {
        totalSlots++;
        if (s.is_reserved && s.booking) {
          bookedSlots++;
          projectedEarnings += Number(s.booking.total_amount || 0);
          if (s.booking.payment_method === 'cash_advance') {
            cashDue += Number(s.booking.cash_balance || 0);
          }
        }
      }
    }

    const openSlots = totalSlots - bookedSlots;
    const occupancyPct = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

    return { totalSlots, bookedSlots, openSlots, occupancyPct, projectedEarnings, cashDue };
  }, [scheduleData]);

  // Filtered & sorted reservations
  const filteredBookings = useMemo(() => {
    let list = [...bookings];

    if (bookingSearch.trim()) {
      const q = bookingSearch.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.customer_name?.toLowerCase().includes(q) ||
          b.customer_phone?.toLowerCase().includes(q) ||
          b.customer_email?.toLowerCase().includes(q) ||
          b.turf_name?.toLowerCase().includes(q) ||
          b.field_name?.toLowerCase().includes(q) ||
          String(b.booking_id).includes(q)
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter((b) => b.status === statusFilter);
    }

    if (selectedTurfFilter !== 'all') {
      list = list.filter((b) => Number(b.turf_id) === Number(selectedTurfFilter));
    }

    list.sort((a, b) => {
      if (bookingSort === 'match_asc') {
        const dateA = new Date(`${a.slot_date || ''}T${a.start_time || '00:00'}`);
        const dateB = new Date(`${b.slot_date || ''}T${b.start_time || '00:00'}`);
        return dateA - dateB;
      }
      if (bookingSort === 'match_desc') {
        const dateA = new Date(`${a.slot_date || ''}T${a.start_time || '00:00'}`);
        const dateB = new Date(`${b.slot_date || ''}T${b.start_time || '00:00'}`);
        return dateB - dateA;
      }
      if (bookingSort === 'amount_desc') return Number(b.total_amount) - Number(a.total_amount);
      if (bookingSort === 'amount_asc') return Number(a.total_amount) - Number(b.total_amount);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return list;
  }, [bookings, bookingSearch, statusFilter, selectedTurfFilter, bookingSort]);

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
          Manage your football arena properties, track real-time booking earnings, and verify reservations.
        </p>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Arena Venues</span>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-1">
            {turfs.length} <span className="text-sm font-semibold text-neutral-400">({totalFields} Pitches)</span>
          </p>
          <span className="text-[11px] text-[#16a34a] font-semibold">
            {approvedTurfs} live {pendingTurfs > 0 ? `· ${pendingTurfs} pending review` : '· fully active'}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Gross Booking Value</span>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-1">
            ৳{grossRevenue.toLocaleString()}
          </p>
          <span className="text-[11px] text-neutral-500 font-medium">
            Across {activeBookings.length} confirmed match{activeBookings.length === 1 ? '' : 'es'}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Advance Collected</span>
          <p className="text-2xl sm:text-3xl font-black text-[#16a34a] mt-1">
            ৳{advanceCollected.toLocaleString()}
          </p>
          <span className="text-[11px] text-neutral-500 font-medium">
            Secured online advance payments
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Cash Due at Venue</span>
          <p
            className={`text-2xl sm:text-3xl font-black mt-1 ${
              pendingCashVenue > 0 ? 'text-amber-600' : 'text-[#16a34a]'
            }`}
          >
            ৳{pendingCashVenue.toLocaleString()}
          </p>
          <span className="text-[11px] font-medium text-neutral-500">
            {pendingCashCount > 0
              ? `${pendingCashCount} match${pendingCashCount === 1 ? '' : 'es'} awaiting cash`
              : 'All venue balances settled'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 mb-8 overflow-x-auto">
        <button
          type="button"
          onClick={() => setTab('turfs')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            tab === 'turfs'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          My Venues & Pitches ({turfs.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('bookings')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            tab === 'bookings'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          <span>Incoming Reservations ({bookings.length})</span>
          {pendingCashCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
              {pendingCashCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('timetable')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            tab === 'timetable'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Pitch Timetable & Schedule</span>
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
                bookings={bookings}
              />
            ))
          )}
        </div>
      )}

      {/* Tab: Bookings */}
      {tab === 'bookings' && (
        <div className="space-y-6">
          {bookings.length === 0 ? (
            <div className="text-center py-16 bg-neutral-50 border border-neutral-200 rounded-3xl p-8">
              <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-neutral-700">No match bookings yet</p>
              <p className="text-xs text-neutral-500 mt-1">When players book your pitches, reservations will appear here.</p>
            </div>
          ) : (
            <>
              {/* Reservation Search & Filter Controls */}
              <div className="bg-white border border-neutral-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search reservations by player name, phone, booking ID, turf, pitch..."
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      className="w-full pl-11 pr-8 py-2 rounded-2xl bg-neutral-50/70 border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] placeholder-neutral-400"
                    />
                    {bookingSearch && (
                      <button
                        type="button"
                        onClick={() => setBookingSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Venue Filter & Sort Dropdowns */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {/* Turf dropdown */}
                    <select
                      value={selectedTurfFilter}
                      onChange={(e) => setSelectedTurfFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-800 bg-neutral-50/80 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#16a34a]"
                    >
                      <option value="all">All Arenas ({turfs.length})</option>
                      {turfs.map((t) => (
                        <option key={t.turf_id} value={t.turf_id}>
                          {t.name}
                        </option>
                      ))}
                    </select>

                    {/* Sort dropdown */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                        <ArrowUpDown className="w-3 h-3" />
                      </span>
                      <select
                        value={bookingSort}
                        onChange={(e) => setBookingSort(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-800 bg-neutral-50/80 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#16a34a]"
                      >
                        <option value="match_desc">Match Date: Latest First</option>
                        <option value="match_asc">Match Date: Earliest First</option>
                        <option value="created_desc">Booked: Most Recent</option>
                        <option value="amount_desc">Amount: High to Low</option>
                        <option value="amount_asc">Amount: Low to High</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    All Bookings ({bookings.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('advance_paid')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      statusFilter === 'advance_paid'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
                    }`}
                  >
                    Cash Due at Venue ({pendingCashCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('confirmed')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      statusFilter === 'confirmed'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Confirmed ({confirmedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('pending')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      statusFilter === 'pending'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    Pending Verification ({pendingApprovalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('completed')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      statusFilter === 'completed'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-800'
                    }`}
                  >
                    Completed ({completedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('cancelled')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      statusFilter === 'cancelled'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-800'
                    }`}
                  >
                    Cancelled ({cancelledCount})
                  </button>
                </div>
              </div>

              {filteredBookings.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 border border-neutral-200 rounded-3xl p-8">
                  <Calendar className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-bold text-neutral-700">No reservations match your filters</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Try clearing your search query or switching the status filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingSearch('');
                      setStatusFilter('all');
                      setSelectedTurfFilter('all');
                    }}
                    className="mt-3 px-4 py-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-bold transition cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((b) => (
                    <div
                      key={b.booking_id}
                      className="bg-white border border-neutral-200/90 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-sm transition flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                    >
                      <div className="space-y-2.5 flex-1">
                        {/* Top line: Booking ID, Status, Payment Type, Arena link */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-lg">
                            #{String(b.booking_id).slice(0, 8)}
                          </span>

                          {/* Status badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              b.status === 'confirmed'
                                ? 'bg-green-50 text-[#16a34a] border border-green-200'
                                : b.status === 'completed'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : b.status === 'advance_paid'
                                ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                : b.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                            }`}
                          >
                            {b.status === 'advance_paid'
                              ? 'Advance Paid · Balance Due'
                              : b.status === 'pending'
                              ? 'Awaiting Confirmation'
                              : b.status}
                          </span>

                          {/* Payment Method Badge */}
                          {b.payment_method === 'cash_advance' ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200 flex items-center gap-1">
                              <Banknote className="w-3 h-3 text-amber-600" /> Cash at Venue
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <Wallet className="w-3 h-3 text-emerald-600" /> 100% Online Paid
                            </span>
                          )}

                          {/* Arena & Pitch Link */}
                          <Link
                            to={`/turfs/${b.turf_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-neutral-800 hover:text-[#16a34a] flex items-center gap-1 transition"
                          >
                            <MapPin className="w-3 h-3 text-[#16a34a]" />
                            <span>{b.turf_name}</span>
                            <span className="text-neutral-400 font-normal">({b.field_name})</span>
                            <ExternalLink className="w-3 h-3 text-neutral-400" />
                          </Link>
                        </div>

                        {/* Match Slot Schedule & Player Contact */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {/* Schedule info */}
                          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-neutral-800 font-semibold">
                            <Calendar className="w-4 h-4 text-[#16a34a] shrink-0" />
                            <div>
                              <span>
                                {b.slot_date
                                  ? new Date(b.slot_date).toLocaleDateString('en-GB', {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : 'Date scheduled'}
                              </span>
                              {b.start_time && (
                                <span className="text-neutral-500 font-normal ml-1.5">
                                  · 🕒 {b.start_time}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Customer info */}
                          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-neutral-800 min-w-0">
                            <div className="font-bold text-neutral-900 truncate min-w-0" title={b.customer_name}>
                              {b.customer_name}
                            </div>
                            {b.customer_phone && (
                              <a
                                href={`tel:${b.customer_phone}`}
                                className="text-[#16a34a] font-bold hover:underline flex items-center gap-0.5 ml-auto shrink-0"
                                title="Call customer"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{b.customer_phone}</span>
                              </a>
                            )}
                            {b.customer_email && !b.customer_phone && (
                              <a
                                href={`mailto:${b.customer_email}`}
                                className="text-neutral-500 text-[11px] truncate hover:underline ml-auto shrink-0 max-w-[160px]"
                                title={b.customer_email}
                              >
                                {b.customer_email}
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Financial summary line */}
                        <div className="flex items-center gap-3 text-xs flex-wrap pt-0.5">
                          <span className="text-neutral-600">
                            Total: <strong className="text-neutral-900 text-sm font-black">৳{Number(b.total_amount).toLocaleString()}</strong>
                          </span>

                          {b.payment_method === 'cash_advance' && (
                            <>
                              <span className="text-neutral-300">·</span>
                              <span className="text-neutral-600">
                                Advance: <strong className="text-emerald-700 font-bold">৳{Number(b.advance_amount || 0).toLocaleString()}</strong>
                              </span>
                              <span className="text-neutral-300">·</span>
                              {Number(b.cash_balance) > 0 ? (
                                <span className="text-amber-700 font-medium">
                                  Cash Due at Venue: <strong className="text-amber-900 font-extrabold text-sm">৳{Number(b.cash_balance).toLocaleString()}</strong>
                                </span>
                              ) : (
                                <span className="text-[#16a34a] font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Cash Balance Settled
                                </span>
                              )}
                            </>
                          )}

                          {b.created_at && (
                            <>
                              <span className="text-neutral-300">·</span>
                              <span className="text-[11px] text-neutral-400">
                                Booked: {new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Cancel reason note */}
                        {b.status === 'cancelled' && b.cancel_reason && (
                          <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                            <strong>Reason:</strong> {b.cancel_reason}
                          </div>
                        )}
                      </div>

                      {/* Actions Column */}
                      <div className="flex items-center gap-2 flex-wrap lg:flex-col lg:items-end shrink-0">
                        {b.status === 'advance_paid' && (
                          <button
                            type="button"
                            disabled={busyConfirm === b.booking_id}
                            onClick={() => handleCollectCash(b.booking_id)}
                            className="px-5 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                          >
                            <Banknote className="w-4 h-4" />
                            <span>{busyConfirm === b.booking_id ? 'Collecting…' : `Collect Cash (৳${Number(b.cash_balance || 0).toLocaleString()})`}</span>
                          </button>
                        )}

                        {b.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={busyConfirm === b.booking_id || busyCancel === b.booking_id}
                              onClick={() => confirmBooking(b.booking_id)}
                              className="px-4 py-2 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-60 flex items-center gap-1"
                            >
                              <Check className="w-4 h-4" />
                              <span>{busyConfirm === b.booking_id ? 'Confirming…' : 'Confirm'}</span>
                            </button>
                            <button
                              type="button"
                              disabled={busyConfirm === b.booking_id || busyCancel === b.booking_id}
                              onClick={() => handleCancelBooking(b.booking_id)}
                              className="px-3 py-2 rounded-2xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold transition cursor-pointer disabled:opacity-60"
                              title="Decline / Cancel this reservation"
                            >
                              {busyCancel === b.booking_id ? 'Declining…' : 'Decline'}
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          {b.customer_phone && (
                            <a
                              href={`tel:${b.customer_phone}`}
                              className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition"
                              title="Call customer"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => copyBookingDetails(b)}
                            className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition cursor-pointer"
                            title="Copy booking details"
                          >
                            {copiedId === b.booking_id ? (
                              <CheckCheck className="w-3.5 h-3.5 text-[#16a34a]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
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

      {/* Tab: Timetable & Schedule */}
      {tab === 'timetable' && (
        <div className="space-y-6">
          {/* Top Control Bar: Venue, Date Navigator, Quick Chips, Actions */}
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Venue Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                  Venue:
                </span>
                <select
                  value={scheduleTurfId}
                  onChange={(e) => setScheduleTurfId(e.target.value)}
                  className="px-3.5 py-2 rounded-2xl border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-900 cursor-pointer focus:outline-none focus:border-neutral-900"
                >
                  {turfs.map((t) => (
                    <option key={t.turf_id} value={t.turf_id}>
                      {t.name} ({t.fields?.length || 0} pitches)
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Navigation */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => changeScheduleDate(-1)}
                  className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-900 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => changeScheduleDate(1)}
                  className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition cursor-pointer"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Date Quick Presets */}
                <div className="flex items-center gap-1 ml-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setScheduleOffsetDays(0)}
                    className="px-2.5 py-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleOffsetDays(1)}
                    className="px-2.5 py-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition cursor-pointer"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleOffsetDays(2)}
                    className="px-2.5 py-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition cursor-pointer"
                  >
                    +2 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleOffsetDays(3)}
                    className="px-2.5 py-1 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition cursor-pointer"
                  >
                    +3 Days
                  </button>
                </div>
              </div>

              {/* Action Buttons: Generate & Refresh */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGenerateModalOpen(true)}
                  className="px-4 py-2 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Generate Slots</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadSchedule(scheduleTurfId, scheduleDate)}
                  disabled={loadingSchedule}
                  className="p-2 rounded-2xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition cursor-pointer disabled:opacity-50"
                  title="Refresh schedule"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingSchedule ? 'animate-spin text-[#16a34a]' : ''}`} />
                </button>
              </div>
            </div>

            {/* Selected Date Header */}
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between flex-wrap gap-2 text-xs text-neutral-500">
              <span className="font-semibold text-neutral-700">
                Viewing pitch schedule for:{' '}
                <strong className="text-neutral-900 font-extrabold">
                  {new Date(scheduleDate + 'T00:00:00').toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>
              </span>
              <span>
                {scheduleData?.turf_name ? `Venue: ${scheduleData.turf_name}` : ''}
              </span>
            </div>
          </div>

          {/* Daily Schedule Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Pitch Occupancy
              </span>
              <p className="text-2xl font-black text-neutral-900 mt-0.5">
                {timetableMetrics.occupancyPct}%
              </p>
              <span className="text-[11px] text-neutral-500 font-medium">
                {timetableMetrics.bookedSlots} of {timetableMetrics.totalSlots} slots reserved
              </span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Projected Day Gross
              </span>
              <p className="text-2xl font-black text-[#16a34a] mt-0.5">
                ৳{timetableMetrics.projectedEarnings.toLocaleString()}
              </p>
              <span className="text-[11px] text-neutral-500 font-medium">
                Total bookings for this date
              </span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Open Pitch Slots
              </span>
              <p className="text-2xl font-black text-neutral-900 mt-0.5">
                {timetableMetrics.openSlots}
              </p>
              <span className="text-[11px] text-[#16a34a] font-medium">
                Available for player bookings
              </span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                Cash Due at Venue
              </span>
              <p className="text-2xl font-black text-amber-700 mt-0.5">
                ৳{timetableMetrics.cashDue.toLocaleString()}
              </p>
              <span className="text-[11px] text-neutral-500 font-medium">
                COD balance due upon arrival
              </span>
            </div>
          </div>

          {/* Timetable Pitch Columns */}
          {loadingSchedule ? (
            <div className="text-center py-20 bg-white border border-neutral-200 rounded-3xl p-8">
              <RefreshCw className="w-8 h-8 text-[#16a34a] animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-neutral-700">Loading pitch schedule…</p>
            </div>
          ) : !scheduleData || !scheduleData.fields || scheduleData.fields.length === 0 ? (
            <div className="text-center py-16 bg-neutral-50 border border-neutral-200 rounded-3xl p-8">
              <Layers className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-neutral-700">No pitches found for this venue</p>
              <p className="text-xs text-neutral-500 mt-1">
                Add fields to this venue in the "My Venues & Pitches" tab to view their schedule.
              </p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${scheduleData.fields.length > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-6`}>
              {scheduleData.fields.map((field) => {
                const slots = field.slots || [];
                const reservedCount = slots.filter((s) => s.is_reserved).length;

                return (
                  <div
                    key={field.field_id}
                    className="bg-white border border-neutral-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      {/* Field Title & Header */}
                      <div className="pb-3 border-b border-neutral-100 flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-base text-neutral-900">
                              {field.field_name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-neutral-100 text-neutral-700">
                              {field.side_type}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            {field.surface || 'Artificial Turf'}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-[#16a34a] bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                          {reservedCount}/{slots.length} Booked
                        </span>
                      </div>

                      {/* Slots List */}
                      <div className="mt-4 space-y-2.5">
                        {slots.length === 0 ? (
                          <div className="text-center py-10 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 p-4 space-y-2">
                            <Clock className="w-7 h-7 text-neutral-300 mx-auto" />
                            <p className="text-xs font-bold text-neutral-600">
                              No slots for this date yet
                            </p>
                            <button
                              type="button"
                              onClick={() => handleQuickGenerateField(field.field_id)}
                              className="px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-[11px] font-bold transition cursor-pointer shadow-xs"
                            >
                              + Generate Day Slots (8 AM - 11 PM)
                            </button>
                          </div>
                        ) : (
                          slots.map((slot) => {
                            const isReserved = slot.is_reserved && slot.booking;
                            const slotKey = `${field.field_id}-${slot.start_time}`;
                            const isToggling = togglingSlotKey === slotKey;

                            if (isReserved) {
                              const b = slot.booking;
                              const isAdvancePaid = b.payment_method === 'cash_advance';

                              return (
                                <div
                                  key={slot.start_time}
                                  className={`p-3.5 rounded-2xl border transition shadow-2xs ${
                                    isAdvancePaid
                                      ? 'bg-amber-50/60 border-amber-200 border-l-4 border-l-amber-500'
                                      : 'bg-emerald-50/60 border-emerald-200 border-l-4 border-l-[#16a34a]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-neutral-700" />
                                      <span className="text-xs font-black text-neutral-900">
                                        {formatTime12h(slot.start_time)} – {formatTime12h(slot.end_time)}
                                      </span>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                        b.status === 'confirmed'
                                          ? 'bg-green-100 text-[#16a34a]'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {b.status}
                                    </span>
                                  </div>

                                  <div className="mt-2 flex items-center justify-between text-xs">
                                    <span className="font-extrabold text-neutral-900 truncate max-w-[150px]">
                                      {b.customer_name || 'Guest Player'}
                                    </span>
                                    <span className="font-bold text-neutral-700">
                                      ৳{Number(b.total_amount).toLocaleString()}
                                    </span>
                                  </div>

                                  {isAdvancePaid && Number(b.cash_balance) > 0 && (
                                    <div className="mt-1 flex items-center justify-between text-[11px] text-amber-800 font-semibold bg-amber-100/60 px-2 py-0.5 rounded-lg">
                                      <span>Cash to collect at venue:</span>
                                      <strong className="font-black">৳{Number(b.cash_balance).toLocaleString()}</strong>
                                    </div>
                                  )}

                                  <div className="mt-2.5 pt-2 border-t border-neutral-200/50 flex items-center justify-between text-[11px]">
                                    {b.customer_phone ? (
                                      <a
                                        href={`tel:${b.customer_phone}`}
                                        className="text-[#16a34a] font-bold hover:underline flex items-center gap-1"
                                      >
                                        <Phone className="w-3 h-3" />
                                        <span>{b.customer_phone}</span>
                                      </a>
                                    ) : (
                                      <span className="text-neutral-400">No phone</span>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => setSlotModalData({ field, slot })}
                                      className="text-neutral-600 hover:text-neutral-900 font-bold hover:underline cursor-pointer"
                                    >
                                      Details →
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            // Available Slot
                            return (
                              <div
                                key={slot.start_time}
                                className="p-3 rounded-2xl bg-neutral-50/70 border border-neutral-200/80 hover:border-neutral-300 transition flex items-center justify-between gap-2 group"
                              >
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                                  <span className="text-xs font-extrabold text-neutral-800">
                                    {formatTime12h(slot.start_time)} – {formatTime12h(slot.end_time)}
                                  </span>
                                  <span className="text-[11px] font-semibold text-neutral-500">
                                    ৳{Number(slot.hourly_rate).toLocaleString()}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-[#16a34a] bg-green-50 px-2 py-0.5 rounded-full border border-green-200/60">
                                    Available
                                  </span>
                                  <button
                                    type="button"
                                    disabled={isToggling}
                                    onClick={() => handleToggleSlot(field.field_id, scheduleDate, slot.start_time, 'block')}
                                    className="opacity-0 group-hover:opacity-100 transition text-[10px] font-bold text-neutral-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded-lg cursor-pointer disabled:opacity-50"
                                    title="Block slot for maintenance"
                                  >
                                    {isToggling ? '…' : 'Block'}
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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

      {/* Slot Booking Details Modal */}
      {slotModalData && (
        <SlotBookingModal
          slotData={slotModalData}
          onClose={() => setSlotModalData(null)}
          onCashCollected={async (bookingId) => {
            await handleCollectCash(bookingId);
            await loadSchedule(scheduleTurfId, scheduleDate);
          }}
        />
      )}

      {/* Bulk Slot Generator Modal */}
      {generateModalOpen && (
        <GenerateSlotsModal
          turfs={turfs}
          currentTurfId={scheduleTurfId}
          onClose={() => setGenerateModalOpen(false)}
          onGenerated={() => {
            loadSchedule(scheduleTurfId, scheduleDate);
            loadTurfs();
          }}
        />
      )}
    </div>
  );
}
