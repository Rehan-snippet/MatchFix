import { useEffect, useState } from 'react';
import api from '../api/client';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  function load() {
    setLoading(true);
    api
      .get('/bookings/mine')
      .then((res) => setBookings(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCancel(id) {
    setBusyId(id);
    try {
      await api.patch(`/bookings/${id}/cancel`, { cancel_reason: 'Changed my mind' });
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function handlePay(booking) {
    setBusyId(booking.booking_id);
    try {
      await api.post('/payments', {
        booking_id: booking.booking_id,
        amount: booking.total_amount,
        purpose: 'full',
        method: 'card',
      });
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleReview(id) {
    const rating = Number(prompt('Rate this turf 1-5'));
    if (!rating) return;
    const comment = prompt('Leave a comment (optional)') || '';
    setBusyId(id);
    try {
      await api.post(`/bookings/${id}/review`, { rating, comment });
      alert('Thanks for the review!');
    } catch (err) {
      alert(err.response?.data?.error || 'Could not submit review');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      <h2>My Bookings</h2>
      {bookings.length === 0 ? (
        <p className="muted">No bookings yet — go book a turf!</p>
      ) : (
        <div className="list">
          {bookings.map((b) => (
            <div key={b.booking_id} className="card">
              <div className="card-row">
                <strong>Booking #{b.booking_id}</strong>
                <span className={`badge badge-${b.status}`}>{b.status}</span>
              </div>
              <ul className="muted">
                {b.slots.map((s, i) => (
                  <li key={i}>
                    {s.turf_name} — {s.field_name} — {s.slot_date} @ {s.start_time.slice(0, 5)}
                  </li>
                ))}
              </ul>
              <p>Total: ৳{b.total_amount}</p>
              <div className="card-actions">
                {b.status === 'pending' && (
                  <button className="btn btn-primary" disabled={busyId === b.booking_id} onClick={() => handlePay(b)}>
                    Pay
                  </button>
                )}
                {b.status !== 'cancelled' && b.status !== 'completed' && (
                  <button
                    className="btn btn-outline"
                    disabled={busyId === b.booking_id}
                    onClick={() => handleCancel(b.booking_id)}
                  >
                    Cancel
                  </button>
                )}
                {b.status === 'confirmed' && (
                  <button
                    className="btn btn-outline"
                    disabled={busyId === b.booking_id}
                    onClick={() => handleReview(b.booking_id)}
                  >
                    Rate turf
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
