import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

function NewTurfForm({ areas, onCreated }) {
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
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create turf');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form form-inline">
      <h4>New turf</h4>
      <label>
        Area
        <select required value={form.area_id} onChange={(e) => setForm({ ...form, area_id: e.target.value })}>
          <option value="">Select an area</option>
          {areas.map((a) => (
            <option key={a.area_id} value={a.area_id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Name
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </label>
      <label>
        Address
        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </label>
      <label>
        Description
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary" disabled={busy} type="submit">
        {busy ? 'Creating…' : 'Create turf'}
      </button>
    </form>
  );
}

function FieldManager({ turf, onChanged }) {
  const [fieldForm, setFieldForm] = useState({ name: '', side_type: '5v5', surface: '' });
  const [ruleForm, setRuleForm] = useState({});
  const [genForm, setGenForm] = useState({});

  async function addField(e) {
    e.preventDefault();
    await api.post('/fields', { turf_id: turf.turf_id, ...fieldForm });
    setFieldForm({ name: '', side_type: '5v5', surface: '' });
    onChanged();
  }

  async function addRule(fieldId, e) {
    e.preventDefault();
    const f = ruleForm[fieldId] || {};
    await api.post(`/fields/${fieldId}/pricing-rules`, {
      day_of_week: Number(f.day_of_week ?? 6),
      start_time: f.start_time || '16:00',
      end_time: f.end_time || '22:00',
      hourly_rate: Number(f.hourly_rate || 0),
    });
    setRuleForm({ ...ruleForm, [fieldId]: {} });
    onChanged();
  }

  async function generate(fieldId, e) {
    e.preventDefault();
    const g = genForm[fieldId] || {};
    await api.post('/slots/generate', {
      field_id: fieldId,
      start_date: g.start_date,
      end_date: g.end_date,
    });
    alert('Slots generated');
  }

  return (
    <div className="card">
      <h4>{turf.name}</h4>

      {turf.fields?.map((f) => (
        <div key={f.field_id} className="sub-card">
          <p>
            <strong>{f.name}</strong> — {f.side_type}, {f.surface}
          </p>
          <ul className="muted">
            {f.pricing_rules?.map((r) => (
              <li key={r.rule_id}>
                Day {r.day_of_week}: {r.start_time}–{r.end_time} @ ৳{r.hourly_rate}/hr
              </li>
            ))}
          </ul>

          <form className="form-inline" onSubmit={(e) => addRule(f.field_id, e)}>
            <select
              value={ruleForm[f.field_id]?.day_of_week ?? 6}
              onChange={(e) =>
                setRuleForm({ ...ruleForm, [f.field_id]: { ...ruleForm[f.field_id], day_of_week: e.target.value } })
              }
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
                setRuleForm({ ...ruleForm, [f.field_id]: { ...ruleForm[f.field_id], start_time: e.target.value } })
              }
            />
            <input
              type="time"
              value={ruleForm[f.field_id]?.end_time ?? '22:00'}
              onChange={(e) =>
                setRuleForm({ ...ruleForm, [f.field_id]: { ...ruleForm[f.field_id], end_time: e.target.value } })
              }
            />
            <input
              type="number"
              placeholder="Rate/hr"
              value={ruleForm[f.field_id]?.hourly_rate ?? ''}
              onChange={(e) =>
                setRuleForm({ ...ruleForm, [f.field_id]: { ...ruleForm[f.field_id], hourly_rate: e.target.value } })
              }
            />
            <button className="btn btn-sm" type="submit">
              Add pricing rule
            </button>
          </form>

          <form className="form-inline" onSubmit={(e) => generate(f.field_id, e)}>
            <input
              type="date"
              required
              onChange={(e) =>
                setGenForm({ ...genForm, [f.field_id]: { ...genForm[f.field_id], start_date: e.target.value } })
              }
            />
            <input
              type="date"
              required
              onChange={(e) =>
                setGenForm({ ...genForm, [f.field_id]: { ...genForm[f.field_id], end_date: e.target.value } })
              }
            />
            <button className="btn btn-sm btn-outline" type="submit">
              Generate slots
            </button>
          </form>
        </div>
      ))}

      <form className="form-inline" onSubmit={addField}>
        <input
          placeholder="Field name"
          required
          value={fieldForm.name}
          onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
        />
        <select
          value={fieldForm.side_type}
          onChange={(e) => setFieldForm({ ...fieldForm, side_type: e.target.value })}
        >
          <option value="5v5">5v5</option>
          <option value="7v7">7v7</option>
          <option value="11v11">11v11</option>
        </select>
        <input
          placeholder="Surface"
          value={fieldForm.surface}
          onChange={(e) => setFieldForm({ ...fieldForm, surface: e.target.value })}
        />
        <button className="btn btn-sm" type="submit">
          Add field
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

  async function loadTurfs() {
    // GET /turfs is public and lists everyone's turfs, so filter down to
    // the ones this organizer owns, then fetch full detail (fields +
    // pricing) for each.
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
      api.get('/bookings/for-my-turfs').then((res) => setBookings(res.data));
    }
  }, [tab]);

  async function confirmBooking(id) {
    await api.patch(`/bookings/${id}/confirm`);
    const { data } = await api.get('/bookings/for-my-turfs');
    setBookings(data);
  }

  return (
    <div>
      <h2>Organizer Dashboard</h2>
      <div className="tabs">
        <button className={tab === 'turfs' ? 'tab active' : 'tab'} onClick={() => setTab('turfs')}>
          My Turfs
        </button>
        <button className={tab === 'bookings' ? 'tab active' : 'tab'} onClick={() => setTab('bookings')}>
          Bookings
        </button>
      </div>

      {tab === 'turfs' && (
        <>
          <NewTurfForm areas={areas} onCreated={loadTurfs} />
          {turfs.map((t) => (
            <FieldManager key={t.turf_id} turf={t} onChanged={loadTurfs} />
          ))}
        </>
      )}

      {tab === 'bookings' && (
        <div className="list">
          {bookings.length === 0 ? (
            <p className="muted">No bookings on your turfs yet.</p>
          ) : (
            bookings.map((b) => (
              <div key={b.booking_id} className="card card-row">
                <span>
                  Booking #{b.booking_id} — {b.customer_name} — ৳{b.total_amount}
                </span>
                <span className={`badge badge-${b.status}`}>{b.status}</span>
                {b.status === 'pending' && (
                  <button className="btn btn-sm" onClick={() => confirmBooking(b.booking_id)}>
                    Confirm
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
