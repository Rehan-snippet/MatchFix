import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import SandboxPaymentModal from '../components/SandboxPaymentModal';
import Pagination from '../components/Pagination';
import ReviewModal from '../components/ReviewModal';
import { useToast } from '../context/ToastContext';
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
} from 'lucide-react';

export default function MyBookings() {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [tab, setTab] = useState('all');
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Review modal state
  const [reviewModal, setReviewModal] = useState({ open: false, bookingId: null, turfName: '' });

  function load(pageNum = page) {
    setLoading(true);
    api
      .get('/bookings/mine', { params: { page: pageNum } })
      .then((res) => {
        if (Array.isArray(res.data)) {
          setBookings(res.data);
          setPagination(null);
        } else {
          setBookings(res.data.data || []);
          setPagination(res.data.pagination || null);
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(page);
  }, [page]);

  async function handleCancel(id) {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setBusyId(id);
    try {
      await api.patch(`/bookings/${id}/cancel`, { cancel_reason: 'Cancelled by customer' });
      toast.success('Booking cancelled successfully.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not cancel booking.');
    } finally {
      setBusyId(null);
    }
  }

  function handlePay(booking) {
    setPaymentBooking(booking);
  }

  async function handleReviewSubmit({ rating, comment }) {
    await api.post(`/bookings/${reviewModal.bookingId}/review`, {
      rating,
      comment,
    });
    toast.success('Thank you! Your turf review has been published.');
    load();
  }

  const filtered = bookings.filter((b) => {
    if (tab === 'all') return true;
    if (tab === 'confirmed') return b.status === 'confirmed';
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
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-neutral-500">
                    #{String(b.booking_id).padStart(6, '0')}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      b.status === 'confirmed'
                        ? 'bg-green-50 text-[#16a34a] border border-green-200'
                        : b.status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                {/* Slots */}
                <div className="space-y-2">
                  {b.slots?.map((s, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                      <span className="font-extrabold text-neutral-900 text-base">
                        {s.turf_name}
                      </span>
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

                <div className="flex items-center gap-4 text-xs text-neutral-500">
                  <span>
                    Total: <strong className="text-neutral-900 text-sm">৳{Number(b.total_amount).toLocaleString()}</strong>
                  </span>
                  <span>·</span>
                  <span>Payment: {b.payments?.length ? 'Paid' : 'Unpaid'}</span>
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
                    <span>{busyId === b.booking_id ? 'Processing…' : 'Pay Now'}</span>
                  </button>
                )}

                {b.status === 'confirmed' && (
                  <button
                    type="button"
                    onClick={() =>
                      setReviewModal({
                        open: true,
                        bookingId: b.booking_id,
                        turfName: b.slots?.[0]?.turf_name || 'Turf Venue',
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

      {/* Pagination Controls */}
      <Pagination
        pagination={pagination}
        onPageChange={(p) => {
          setPage(p);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Shared Review Modal */}
      <ReviewModal
        isOpen={reviewModal.open}
        title={reviewModal.turfName ? `Rate ${reviewModal.turfName}` : 'Rate this Turf'}
        subtitle="Share your feedback regarding the pitch surface, lighting, and locker facilities."
        commentPlaceholder="How was the turf pitch and facility experience? (Optional)"
        onSubmit={handleReviewSubmit}
        onClose={() => setReviewModal({ open: false, bookingId: null, turfName: '' })}
      />

      {/* Sandbox Payment Modal */}
      {paymentBooking && (
        <SandboxPaymentModal
          bookingId={paymentBooking.booking_id}
          amount={Number(paymentBooking.total_amount)}
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