import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import SandboxPaymentModal from '../components/SandboxPaymentModal';
import {
  Package,
  MapPin,
  Clock,
  Star,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Truck,
  CreditCard,
  X,
} from 'lucide-react';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentOrder, setPaymentOrder] = useState(null);

  // Review modal state
  const [reviewModal, setReviewModal] = useState({
    open: false,
    orderId: null,
    productId: null,
    itemTitle: '',
    rating: 5,
    comment: '',
  });
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState('');

  function load() {
    setLoading(true);
    api
      .get('/orders/mine')
      .then((res) => setOrders(res.data || []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function submitReview(e) {
    e.preventDefault();
    setReviewBusy(true);
    setReviewError('');
    try {
      await api.post(
        `/orders/${reviewModal.orderId}/items/${reviewModal.productId}/review`,
        {
          rating: reviewModal.rating,
          comment: reviewModal.comment,
        }
      );
      setReviewModal({
        open: false,
        orderId: null,
        productId: null,
        itemTitle: '',
        rating: 5,
        comment: '',
      });
      load();
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Could not submit product review.');
    } finally {
      setReviewBusy(false);
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-[#16a34a] uppercase tracking-wider mb-1.5">
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>MatchFix Marketplace Purchases</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
          My Gear Orders
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-neutral-500">
          Track delivery dispatch, shipping addresses, and review your gear.
        </p>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse h-36 bg-neutral-100 rounded-3xl border border-neutral-200" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-neutral-50 border border-neutral-200 rounded-3xl p-8 max-w-md mx-auto">
          <Package className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-800">No orders found</h3>
          <p className="mt-1 text-xs text-neutral-500">
            You haven’t ordered any gear from the marketplace yet.
          </p>
          <Link
            to="/marketplace"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#16a34a] text-white text-xs font-bold shadow-xs hover:bg-[#15803d] transition"
          >
            <span>Explore Gear</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((o) => (
            <div
              key={o.order_id}
              className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition duration-200 space-y-5"
            >
              {/* Order Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs font-bold text-neutral-500">
                      Order #{String(o.order_id).padStart(6, '0')}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      o.status === 'delivered'
                        ? 'bg-green-50 text-[#16a34a] border border-green-200'
                        : o.status === 'shipped'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : o.status === 'advance_paid'
                        ? 'bg-amber-50 text-amber-800 border border-amber-300'
                        : o.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-neutral-50 text-neutral-700 border border-neutral-200'
                    }`}>
                      {o.status === 'advance_paid' ? 'Advance Paid (COD)' : o.status}
                    </span>
                    {o.payment_method === 'cash_advance' && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                        Cash on Delivery
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{o.delivery_address}</span>
                  </div>
                  {o.payment_method === 'cash_advance' && (
                    <div className="text-xs text-amber-800">
                      <span>Advance: ৳{Number(o.advance_amount || 0).toLocaleString()}</span>
                      <span className="mx-1.5">·</span>
                      <span className="font-bold">Due on delivery: ৳{Number(o.cash_balance || 0).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Total</span>
                    <span className="text-base font-black text-neutral-900">
                      ৳{Number(o.total_amount || o.total || 0).toLocaleString()}
                    </span>
                  </div>

                  {o.status === 'advance_paid' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                      Advance Paid
                    </span>
                  ) : o.payments?.length || o.status === 'delivered' || o.status === 'confirmed' || o.status === 'shipped' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-50 text-[#16a34a] border border-green-200">
                      Paid
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPaymentOrder(o)}
                      className="px-4 py-2 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{o.payment_method === 'cash_advance' ? 'Pay Advance' : 'Pay Now'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Items in this order */}
              <div className="divide-y divide-neutral-100">
                {o.items?.map((item) => (
                  <div
                    key={item.product_id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 flex-shrink-0">
                        <Package className="w-5 h-5 text-[#16a34a]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-neutral-900">{item.title}</h4>
                        <p className="text-xs text-neutral-500">
                          Qty: {item.qty} × ৳{Number(item.unit_price).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          item.status === 'delivered'
                            ? 'bg-green-50 text-[#16a34a] border border-green-200'
                            : item.status === 'shipped'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {item.status}
                      </span>

                      {item.status === 'delivered' && (
                        <button
                          type="button"
                          onClick={() =>
                            setReviewModal({
                              open: true,
                              orderId: o.order_id,
                              productId: item.product_id,
                              itemTitle: item.title,
                              rating: 5,
                              comment: '',
                            })
                          }
                          className="px-3 py-1.5 rounded-xl border border-neutral-300 hover:border-neutral-900 text-neutral-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>Review</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900">Review Gear</h3>
              <button
                type="button"
                onClick={() => setReviewModal({ ...reviewModal, open: false })}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              Reviewing: <strong className="text-neutral-900">{reviewModal.itemTitle}</strong>
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
                  Comments & Feedback
                </label>
                <textarea
                  rows={3}
                  value={reviewModal.comment}
                  onChange={(e) =>
                    setReviewModal({ ...reviewModal, comment: e.target.value })
                  }
                  placeholder="How was the product quality and fit?"
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
      {paymentOrder && (
        <SandboxPaymentModal
          orderId={paymentOrder.order_id}
          amount={
            paymentOrder.payment_method === 'cash_advance'
              ? Number(paymentOrder.advance_amount || Math.ceil((paymentOrder.total_amount || paymentOrder.total || 0) * 0.20))
              : Number(paymentOrder.total_amount || paymentOrder.total || 0)
          }
          purpose={paymentOrder.payment_method === 'cash_advance' ? 'advance' : 'full'}
          balanceAmount={
            paymentOrder.payment_method === 'cash_advance'
              ? Number(paymentOrder.cash_balance || ((paymentOrder.total_amount || paymentOrder.total || 0) - Math.ceil((paymentOrder.total_amount || paymentOrder.total || 0) * 0.20)))
              : 0
          }
          title={`Order #${String(paymentOrder.order_id).padStart(6, '0')} Checkout`}
          onSuccess={() => {
            setPaymentOrder(null);
            load();
          }}
          onClose={() => setPaymentOrder(null)}
        />
      )}
    </div>
  );
}