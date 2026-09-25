import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import SandboxPaymentModal from '../components/SandboxPaymentModal';
import Pagination from '../components/Pagination';
import ReviewModal from '../components/ReviewModal';
import { useToast } from '../context/ToastContext';
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
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Review modal state
  const [reviewModal, setReviewModal] = useState({
    open: false,
    orderId: null,
    productId: null,
    itemTitle: '',
  });

  function load(pageNum = page) {
    setLoading(true);
    api
      .get('/orders/mine', { params: { page: pageNum } })
      .then((res) => {
        if (Array.isArray(res.data)) {
          setOrders(res.data);
          setPagination(null);
        } else {
          setOrders(res.data.data || []);
          setPagination(res.data.pagination || null);
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(page);
  }, [page]);

  async function handleReviewSubmit({ rating, comment }) {
    await api.post(
      `/orders/${reviewModal.orderId}/items/${reviewModal.productId}/review`,
      {
        rating,
        comment,
      }
    );
    toast.success('Thank you! Your product review has been submitted.');
    load();
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
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-neutral-500">
                    Order #{String(o.order_id).padStart(6, '0')}
                  </span>
                  <span className="text-xs text-neutral-400">·</span>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{o.delivery_address}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Total</span>
                    <span className="text-base font-black text-neutral-900">
                      ৳{Number(o.total_amount || o.total || 0).toLocaleString()}
                    </span>
                  </div>

                  {o.payments?.length ? (
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
                      <span>Pay Now</span>
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
        title={reviewModal.itemTitle ? `Review: ${reviewModal.itemTitle}` : 'Review Gear'}
        subtitle="Share your honest feedback on product quality, fit, and performance."
        commentPlaceholder="How was the product quality and fit? (Optional)"
        onSubmit={handleReviewSubmit}
        onClose={() =>
          setReviewModal({
            open: false,
            orderId: null,
            productId: null,
            itemTitle: '',
          })
        }
      />

      {/* Sandbox Payment Modal */}
      {paymentOrder && (
        <SandboxPaymentModal
          orderId={paymentOrder.order_id}
          amount={Number(paymentOrder.total_amount || paymentOrder.total || 0)}
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