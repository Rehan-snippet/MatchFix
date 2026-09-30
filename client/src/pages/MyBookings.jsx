import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import SandboxPaymentModal from '../components/SandboxPaymentModal';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Star,
  CreditCard,
  ArrowRight,
  Shield,
  X,
  ExternalLink,
} from 'lucide-react';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [tab, setTab] = useState('all');
  const [paymentBooking, setPaymentBooking] = useState(null);

  // Review modal state
  const [reviewModal, setReviewModal] = useState({ open: false, bookingId: null, rating: 5, comment: '' });
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState('');

  function load() {
    setLoading(true);
    api
      .get('/bookings/mine')
      .then((res) => setBookings(res.data || []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCancel(id) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setBusyId(id);
    try {
      await api.patch(`/bookings/${id}/cancel`, { cancel_reason: 'Cancelled by customer' });
      load();
    } finally {
      setBusyId(null);
    }
  }

  function handlePay(booking) {
    setPaymentBooking(booking);
  }

  async function submitReview(e) {
    e.preventDefault();
    setReviewBusy(true);
    setReviewError('');
    try {
      await api.post(`/bookings/${reviewModal.bookingId}/review`, {
        rating: reviewModal.rating,
        comment: reviewModal.comment,
      });
      setReviewModal({ open: false, bookingId: null, rating: 5, comment: '' });
      load();
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Could not submit review.');
    } finally {
      setReviewBusy(false);
    }
  }

  const filtered = bookings.filter((b) => {
    if (tab === 'all') return true;
    if (tab === 'confirmed') return b.status === 'confirmed';
    if (tab === 'advance_paid') return b.status === 'advance_paid';
    if (tab === 'pending') return b.status === 'pending';
    if (tab === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-[#16a34a] uppercase tracking-wider mb-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>MatchFix Trips & Reservations</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
          My Bookings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-neutral-500">
          Review upcoming match dates, slot allocations, and payment receipts.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 mb-8 overflow-x-auto">
        {[
          { id: 'all', label: 'All Bookings' },
          { id: 'confirmed', label: 'Confirmed Matches' },
          { id: 'advance_paid', label: 'Advance Paid' },
          { id: 'pending', label: 'Pending Payment' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              tab === t.id
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse h-36 bg-neutral-100 rounded-3xl border border-neutral-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-neutral-50 border border-neutral-200 rounded-3xl p-8 max-w-md mx-auto">
          <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-800">No bookings found</h3>
          <p className="mt-1 text-xs text-neutral-500">
            You don't have any reservations under this category.
          </p>
          <Link
            to="/turfs"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#16a34a] text-white text-xs font-bold shadow-xs hover:bg-[#15803d] transition"
          >
            <span>Explore Turfs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((b) => (
            <div
              key={b.booking_id}
              className="bg-white border border-neutral-200/90 rounded-3xl p-5 sm:p-7 shadow-xs hover:shadow-md transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Left Details */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-bold text-neutral-500">
                    #{String(b.booking_id).padStart(6, '0')}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      b.status === 'confirmed'
                        ? 'bg-green-50 text-[#16a34a] border border-green-200'
                        : b.status === 'advance_paid'
                        ? 'bg-amber-50 text-amber-800 border border-amber-300'
                        : b.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                    }`}
                  >
                    {b.status === 'advance_paid' ? 'Advance Paid' : b.status}
                  </span>
                  {b.payment_method === 'cash_advance' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                      Cash at Venue
                    </span>
                  )}
                </div>

                {/* Slots */}
                <div className="space-y-2">
                  {b.slots?.map((s, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                      <Link
                        to={`/turfs/${s.turf_id}`}
                        className="font-extrabold text-neutral-900 text-base hover:text-[#16a34a] hover:underline transition inline-flex items-center gap-1.5 group/turf cursor-pointer"
                        title={`View ${s.turf_name} listing`}
                      >
                        <span>{s.turf_name}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover/turf:text-[#16a34a] opacity-0 group-hover/turf:opacity-100 transition" />
                      </Link>
                      <span className="px-2.5 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-semibold text-xs">
                        {s.field_name}
                      </span>
                      <div className="flex items-center gap-1.5 text-neutral-600">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{s.slot_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-600">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{s.start_time?.slice(0, 5)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                  <span>
                    Total: <strong className="text-neutral-900 text-sm">৳{Number(b.total_amount).toLocaleString()}</strong>
                  </span>
                  {b.payment_method === 'cash_advance' ? (
                    <>
                      <span>·</span>
                      <span className="text-emerald-700 font-semibold">
                        Advance Paid: ৳{Number(b.advance_amount || 0).toLocaleString()}
                      </span>
                      <span>·</span>
                      <span className="text-amber-800 font-bold">
                        Cash Due at Venue: ৳{Number(b.cash_balance || 0).toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>·</span>
                      <span>Payment: {b.payments?.length ? 'Paid' : 'Unpaid'}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {b.status === 'pending' && (
                  <button
                    type="button"
                    disabled={busyId === b.booking_id}
                    onClick={() => handlePay(b)}
                    className="px-5 py-2.5 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>
                      {busyId === b.booking_id
                        ? 'Processing…'
                        : b.payment_method === 'cash_advance'
                        ? `Pay Advance (৳${Number(b.advance_amount || Math.ceil(b.total_amount * 0.20)).toLocaleString()})`
                        : 'Pay Now'}
                    </span>
                  </button>
                )}

                {b.status === 'confirmed' && (
                  <button
                    type="button"
                    onClick={() =>
                      setReviewModal({
                        open: true,
                        bookingId: b.booking_id,
                        rating: 5,
                        comment: '',
                      })
                    }
                    className="px-4 py-2.5 rounded-2xl border border-neutral-300 hover:border-neutral-800 text-neutral-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Rate Venue</span>
                  </button>
                )}

                {b.status !== 'cancelled' && b.status !== 'completed' && (
                  <button
                    type="button"
                    disabled={busyId === b.booking_id}
                    onClick={() => handleCancel(b.booking_id)}
                    className="px-4 py-2.5 rounded-2xl border border-neutral-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600 text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal (Airbnb Modal Style) */}
      {reviewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900">Rate this Turf</h3>
              <button
                type="button"
                onClick={() => setReviewModal({ ...reviewModal, open: false })}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              Share your feedback regarding the pitch surface, lighting, and locker facilities.
            </p>

            {reviewError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {reviewError}
              </div>
            )}

            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewModal({ ...reviewModal, rating: star })}
                      className="p-1 cursor-pointer transition hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewModal.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-neutral-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-bold text-neutral-800">
                    {reviewModal.rating} of 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Comments & Details
                </label>
                <textarea
                  rows={3}
                  value={reviewModal.comment}
                  onChange={(e) =>
                    setReviewModal({ ...reviewModal, comment: e.target.value })
                  }
                  placeholder="How was the turf experience? (Optional)"
                  className="w-full p-3 rounded-2xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModal({ ...reviewModal, open: false })}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewBusy}
                  className="px-5 py-2.5 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  {reviewBusy ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sandbox Payment Modal */}
      {paymentBooking && (
        <SandboxPaymentModal
          bookingId={paymentBooking.booking_id}
          amount={
            paymentBooking.payment_method === 'cash_advance'
              ? Number(paymentBooking.advance_amount || Math.ceil(paymentBooking.total_amount * 0.20))
              : Number(paymentBooking.total_amount)
          }
          purpose={paymentBooking.payment_method === 'cash_advance' ? 'advance' : 'full'}
          balanceAmount={
            paymentBooking.payment_method === 'cash_advance'
              ? Number(paymentBooking.cash_balance || (paymentBooking.total_amount - Math.ceil(paymentBooking.total_amount * 0.20)))
              : 0
          }
          title={`Booking #${String(paymentBooking.booking_id).padStart(6, '0')} · ${
            paymentBooking.slots?.[0]?.turf_name || 'Match Booking'
          }`}
          onSuccess={() => {
            setPaymentBooking(null);
            load();
          }}
          onClose={() => setPaymentBooking(null)}
        />
      )}
    </div>
  );
}