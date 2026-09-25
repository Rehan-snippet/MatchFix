import { useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Calendar, CheckCircle2 } from 'lucide-react';

export default function OrganizerBookings({ bookings = [], onRefresh }) {
  const toast = useToast();
  const [busyConfirm, setBusyConfirm] = useState(null);

  async function confirmBooking(id) {
    setBusyConfirm(id);
    try {
      await api.patch(`/bookings/${id}/confirm`);
      toast.success('Match reservation confirmed!');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not confirm match reservation.');
    } finally {
      setBusyConfirm(null);
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16 bg-neutral-50 border border-neutral-200 rounded-3xl p-8">
        <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
        <p className="text-sm font-bold text-neutral-700">No match bookings yet</p>
        <p className="text-xs text-neutral-500 mt-1">
          When players book your pitches, reservations will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((b) => (
        <div
          key={b.booking_id}
          className="bg-white border border-neutral-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-neutral-900">
                Booking #{String(b.booking_id).slice(0, 8)}
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
                className="px-5 py-2.5 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {busyConfirm === b.booking_id ? 'Confirming…' : 'Confirm Match'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
