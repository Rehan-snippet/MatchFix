import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function TurfDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [turf, setTurf] = useState(null);
  const [fieldId, setFieldId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState([]); // array of slot objects
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/turfs/${id}`).then((res) => {
      setTurf(res.data);
      if (res.data.fields?.length) setFieldId(res.data.fields[0].field_id);
    });
  }, [id]);

  useEffect(() => {
    if (!fieldId || !date) return;
    api.get('/slots', { params: { field_id: fieldId, date } }).then((res) => setSlots(res.data));
    setSelected([]);
  }, [fieldId, date]);

  function toggleSlot(slot) {
    setSelected((prev) => {
      const exists = prev.find((s) => s.start_time === slot.start_time);
      if (exists) return prev.filter((s) => s.start_time !== slot.start_time);
      return [...prev, slot];
    });
  }

  async function handleBook() {
    setMessage('');
    if (!user) return setMessage('Please log in first.');
    if (!user.roles?.includes('customer')) return setMessage('Add the Customer role from your profile first.');
    if (!selected.length) return setMessage('Select at least one slot.');

    setBusy(true);
    try {
      await api.post('/bookings', {
        slots: selected.map((s) => ({
          field_id: fieldId,
          slot_date: date,
          start_time: s.start_time,
          end_time: s.end_time,
        })),
      });
      setMessage('Booking created! Check "My Bookings" to pay and confirm.');
      setSelected([]);
      const res = await api.get('/slots', { params: { field_id: fieldId, date } });
      setSlots(res.data);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Booking failed');
    } finally {
      setBusy(false);
    }
  }

  if (!turf) return <p>Loading…</p>;

  return (
    <div>
      {turf.images?.[0] && <img src={turf.images[0].url} alt={turf.name} className="detail-image" />}
      <h2>{turf.name}</h2>
      <p className="muted">
        {turf.address} — {turf.area_name}, {turf.city}
      </p>
      <p>{turf.description}</p>
      <p className="muted">Organized by {turf.organizer_name}</p>

      <h3>Book a field</h3>
      <div className="booking-controls">
        <label>
          Field
          <select value={fieldId} onChange={(e) => setFieldId(e.target.value)}>
            {turf.fields.map((f) => (
              <option key={f.field_id} value={f.field_id}>
                {f.name} ({f.side_type}, {f.surface})
              </option>
            ))}
          </select>
        </label>
        <label>
          Date
          <input type="date" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>

      {slots.length === 0 ? (
        <p className="muted">No slots published for this date yet.</p>
      ) : (
        <div className="slot-grid">
          {slots.map((s) => {
            const isSelected = selected.some((sel) => sel.start_time === s.start_time);
            return (
              <button
                key={s.start_time}
                disabled={s.is_reserved}
                className={`slot ${s.is_reserved ? 'slot-taken' : ''} ${isSelected ? 'slot-selected' : ''}`}
                onClick={() => toggleSlot(s)}
              >
                {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
              </button>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className="booking-summary">
          <p>{selected.length} slot(s) selected</p>
          <button className="btn btn-primary" onClick={handleBook} disabled={busy}>
            {busy ? 'Booking…' : 'Book now'}
          </button>
        </div>
      )}
      {message && <p className="form-note">{message}</p>}
    </div>
  );
}
