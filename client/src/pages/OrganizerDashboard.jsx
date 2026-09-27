import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Trophy,
  Plus,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  DollarSign,
  Layers,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

function NewTurfForm({ areas, onCreated }) {
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
      setForm({ area_id: '', name: '', address: '', description: '' });
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create turf venue');
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
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-md">
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
                placeholder="Plot / Road / Sector address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-neutral-700 mb-1">Description & Amenities</label>
              <textarea
                rows={2}
                placeholder="Details regarding turf grass, floodlights, parking, locker rooms…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
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
                {busy ? 'Creating…' : 'Create Arena'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function FieldManager({ turf, onChanged }) {
  const [fieldForm, setFieldForm] = useState({ name: '', side_type: '5v5', surface: 'Artificial Turf' });
  const [ruleForm, setRuleForm] = useState({});
  const [genForm, setGenForm] = useState({});
  const [busyRule, setBusyRule] = useState(false);
  const [busyGen, setBusyGen] = useState(false);

  async function addField(e) {
    e.preventDefault();
    await api.post('/fields', { turf_id: turf.turf_id, ...fieldForm });
    setFieldForm({ name: '', side_type: '5v5', surface: 'Artificial Turf' });
    onChanged();
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
    } finally {
      setBusyRule(false);
    }
  }

  async function generate(fieldId, e) {
    e.preventDefault();
    setBusyGen(true);
    try {
      const g = genForm[fieldId] || {};
      await api.post('/slots/generate', {
        field_id: fieldId,
        start_date: g.start_date,
        end_date: g.end_date,
      });
      alert('✓ Hourly slots generated successfully!');
      onChanged();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not generate slots');
    } finally {
      setBusyGen(false);
    }
  }

  return (
    <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-100">
        <div>
          <h3 className="text-xl font-black text-neutral-900">{turf.name}</h3>
          <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
            <span>{turf.address}</span>
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold self-start sm:self-auto">
          {turf.fields?.length || 0} {turf.fields?.length === 1 ? 'Pitch' : 'Pitches'}
        </span>
      </div>

      {/* Fields List */}
      <div className="space-y-5">
        {turf.fields?.map((f) => (
          <div
            key={f.field_id}
            className="p-5 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-neutral-900">{f.name}</span>
                <span className="px-2 py-0.5 rounded-md bg-green-50 text-[#16a34a] border border-green-200 text-[11px] font-bold">
                  {f.side_type}
                </span>
                <span className="text-xs text-neutral-500">· {f.surface}</span>
              </div>
            </div>

            {/* Pricing Rules List */}
            <div>
              <p className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-2">
                Current Pricing Rules
              </p>
              {f.pricing_rules?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {f.pricing_rules.map((r) => (
                    <div
                      key={r.rule_id}
                      className="p-2.5 rounded-xl bg-white border border-neutral-200 text-xs flex items-center justify-between"
                    >
                      <span className="font-medium text-neutral-700">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][r.day_of_week]}: {r.start_time?.slice(0, 5)}–{r.end_time?.slice(0, 5)}
                      </span>
                      <span className="font-bold text-[#16a34a]">৳{r.hourly_rate}/hr</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 italic">No pricing rules set yet.</p>
              )}
            </div>

            {/* Add Pricing Rule Form */}
            <form
              onSubmit={(e) => addRule(f.field_id, e)}
              className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-2"
            >
              <span className="text-[11px] font-bold text-neutral-800">Add Hourly Pricing Rule</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <select
                  value={ruleForm[f.field_id]?.day_of_week ?? 6}
                  onChange={(e) =>
                    setRuleForm({
                      ...ruleForm,
                      [f.field_id]: { ...ruleForm[f.field_id], day_of_week: e.target.value },
                    })
                  }
                  className="px-2 py-1.5 rounded-xl border border-neutral-200 text-xs bg-neutral-50/50"
                >
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                    <option key={i} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={ruleForm[f.field_id]?.start_time ?? '16:00'}
                  onChange={(e) =>
                    setRuleForm({
                      ...ruleForm,
                      [f.field_id]: { ...ruleForm[f.field_id], start_time: e.target.value },
                    })
                  }
                  className="px-2 py-1.5 rounded-xl border border-neutral-200 text-xs bg-neutral-50/50"
                />
                <input
                  type="time"
                  value={ruleForm[f.field_id]?.end_time ?? '22:00'}
                  onChange={(e) =>
                    setRuleForm({
                      ...ruleForm,
                      [f.field_id]: { ...ruleForm[f.field_id], end_time: e.target.value },
                    })
                  }
                  className="px-2 py-1.5 rounded-xl border border-neutral-200 text-xs bg-neutral-50/50"
                />
                <input
                  type="number"
                  placeholder="Rate (৳)"
                  value={ruleForm[f.field_id]?.hourly_rate ?? ''}
                  onChange={(e) =>
                    setRuleForm({
                      ...ruleForm,
                      [f.field_id]: { ...ruleForm[f.field_id], hourly_rate: e.target.value },
                    })
                  }
                  className="px-2 py-1.5 rounded-xl border border-neutral-200 text-xs bg-neutral-50/50"
                />
                <button
                  type="submit"
                  disabled={busyRule}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer"
                >
                  Save Rate
                </button>
              </div>
            </form>

            {/* Generate Slots Form */}
            <form
              onSubmit={(e) => generate(f.field_id, e)}
              className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-2"
            >
              <span className="text-[11px] font-bold text-neutral-800">Generate Bookable Slots</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="date"
                  required
                  placeholder="Start Date"
                  onChange={(e) =>
                    setGenForm({
                      ...genForm,
                      [f.field_id]: { ...genForm[f.field_id], start_date: e.target.value },
                    })
                  }
                  className="px-2.5 py-1.5 rounded-xl border border-neutral-200 text-xs bg-neutral-50/50"
                />
                <input
                  type="date"
                  required
                  placeholder="End Date"
                  onChange={(e) =>
                    setGenForm({
                      ...genForm,
                      [f.field_id]: { ...genForm[f.field_id], end_date: e.target.value },
                    })
                  }
                  className="px-2.5 py-1.5 rounded-xl border border-neutral-200 text-xs bg-neutral-50/50"
                />
                <button
                  type="submit"
                  disabled={busyGen}
                  className="px-4 py-1.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold transition cursor-pointer"
                >
                  {busyGen ? 'Generating…' : 'Generate Slots'}
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>

      {/* Add Field Form */}
      <form
        onSubmit={addField}
        className="p-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 flex flex-col sm:flex-row items-center gap-3"
      >
        <input
          placeholder="New Pitch Name (e.g. Pitch 1)"
          required
          value={fieldForm.name}
          onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
          className="flex-1 w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs bg-white"
        />
        <select
          value={fieldForm.side_type}
          onChange={(e) => setFieldForm({ ...fieldForm, side_type: e.target.value })}
          className="w-full sm:w-28 px-3 py-2 rounded-xl border border-neutral-200 text-xs bg-white font-semibold"
        >
          <option value="5v5">5v5</option>
          <option value="7v7">7v7</option>
          <option value="11v11">11v11</option>
        </select>
        <input
          placeholder="Surface (e.g. 3G Artificial)"
          value={fieldForm.surface}
          onChange={(e) => setFieldForm({ ...fieldForm, surface: e.target.value })}
          className="w-full sm:w-40 px-3 py-2 rounded-xl border border-neutral-200 text-xs bg-white"
        />
        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition whitespace-nowrap cursor-pointer"
        >
          + Add Pitch
        </button>
      </form>
    </div>
  );
}

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [turfs, setTurfs] = useState([]);
  const [areas, setAreas] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState('turfs');
  const [busyConfirm, setBusyConfirm] = useState(null);

  async function loadTurfs() {
    const { data: all } = await api.get('/turfs');
    const mine = all.filter((t) => t.organizer_id === user.user_id);
    const detailed = await Promise.all(mine.map((t) => api.get(`/turfs/${t.turf_id}`).then((r) => r.data)));
    setTurfs(detailed);
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

  const totalFields = turfs.reduce((acc, t) => acc + (t.fields?.length || 0), 0);

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

      {/* KPI Stats Bar (Airbnb Host Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">My Arenas</span>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-1">{turfs.length}</p>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Active Pitches</span>
          <p className="text-2xl sm:text-3xl font-black text-[#16a34a] mt-1">{totalFields}</p>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Incoming Matches</span>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-1">{bookings.length}</p>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</span>
          <p className="text-sm font-bold text-[#16a34a] mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Verified Host
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 mb-8">
        <button
          type="button"
          onClick={() => setTab('turfs')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition cursor-pointer ${
            tab === 'turfs'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          My Venues & Pitches
        </button>
        <button
          type="button"
          onClick={() => setTab('bookings')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition cursor-pointer ${
            tab === 'bookings'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          Incoming Reservations
        </button>
      </div>

      {/* Tab: Turfs */}
      {tab === 'turfs' && (
        <div className="space-y-6">
          <NewTurfForm areas={areas} onCreated={loadTurfs} />
          {turfs.length === 0 ? (
            <div className="text-center py-16 bg-neutral-50 border border-neutral-200 rounded-3xl p-8">
              <Trophy className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-neutral-700">No turf arenas registered yet</p>
              <p className="text-xs text-neutral-500 mt-1">
                Click "Add New Turf Arena" above to list your first venue.
              </p>
            </div>
          ) : (
            turfs.map((t) => <FieldManager key={t.turf_id} turf={t} onChanged={loadTurfs} />)
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
              <p className="text-xs text-neutral-500 mt-1">
                When players book your pitches, reservations will appear here.
              </p>
            </div>
          ) : (
            bookings.map((b) => (
              <div
                key={b.booking_id}
                className="bg-white border border-neutral-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-neutral-900">
                      Booking #{b.booking_id.slice(0, 8)}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        b.status === 'confirmed'
                          ? 'bg-green-50 text-[#16a34a] border border-green-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600">
                    Customer: <strong className="text-neutral-900">{b.customer_name}</strong> · Total: ৳{Number(b.total_amount).toLocaleString()}
                  </p>
                </div>

                <div>
                  {b.status === 'pending' && (
                    <button
                      type="button"
                      disabled={busyConfirm === b.booking_id}
                      onClick={() => confirmBooking(b.booking_id)}
                      className="px-5 py-2.5 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      {busyConfirm === b.booking_id ? 'Confirming…' : 'Confirm Match'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
