import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import SandboxPaymentModal from '../components/SandboxPaymentModal';
import { getImageUrl } from '../utils/imageUrl';
import {
  ShoppingBag,
  ShoppingCart,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  Store,
  CreditCard,
} from 'lucide-react';

export default function Cart() {
  const { items, removeFromCart, updateQty, clearCart, cartCount, cartSubtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'cash_advance'
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activePaymentOrder, setActivePaymentOrder] = useState(null);

  useEffect(() => {
    if (user?.customer?.default_address) {
      setAddress(user.customer.default_address);
    }
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user]);

  const advanceDue = Math.ceil(cartSubtotal * 0.20);
  const cashBalance = cartSubtotal - advanceDue;

  async function handleCheckout(e) {
    e?.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!user) {
      setErrorMsg('Please log in first to complete your purchase.');
      return;
    }

    if (!user.roles?.includes('customer')) {
      setErrorMsg('Please activate the Customer role in your profile before placing orders.');
      return;
    }

    if (!address.trim()) {
      setErrorMsg('Please provide a valid delivery address.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }

    setBusy(true);
    try {
      const orderPayload = {
        items: items.map((i) => ({ product_id: i.product_id, qty: i.qty })),
        delivery_address: address.trim(),
        delivery_phone: phone.trim() || undefined,
        payment_method: paymentMethod,
      };

      const { data: res } = await api.post('/orders', orderPayload);
      const createdOrder = res.order || res;

      // Clear cart once order is created in database
      clearCart();

      // Open sandbox payment modal
      setActivePaymentOrder(createdOrder);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error || 'Order placement failed. Please verify item stock and try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-neutral-600">
        <Link to="/" className="hover:text-neutral-900 transition">
          Home
        </Link>
        <span>/</span>
        <Link to="/marketplace" className="hover:text-neutral-900 transition">
          Marketplace
        </Link>
        <span>/</span>
        <span className="text-neutral-900 font-bold">Shopping Cart</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-3">
            <span>Your Shopping Cart</span>
            <span className="text-sm sm:text-base font-bold px-3 py-1 rounded-full bg-neutral-100 text-neutral-700">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-500">
            Review your selected football gear and confirm shipping details.
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs font-bold text-neutral-400 hover:text-rose-600 transition cursor-pointer self-start sm:self-auto flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Cart</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-20 bg-neutral-50 border border-neutral-200 rounded-3xl p-8 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-4 text-neutral-400">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-extrabold text-neutral-900">Your cart is currently empty</h2>
          <p className="mt-1.5 text-xs text-neutral-500 max-w-sm mx-auto">
            Explore authentic boots, kits, and training gear from verified football merchants across Bangladesh.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Marketplace</span>
            </Link>
            {user && (
              <Link
                to="/my-orders"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 text-xs sm:text-sm font-bold transition"
              >
                <span>View My Orders</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Cart Items (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-neutral-200 rounded-3xl p-5 sm:p-6 shadow-xs divide-y divide-neutral-100">
              {items.map((item) => {
                const itemTotal = item.price * item.qty;
                return (
                  <div
                    key={item.product_id}
                    className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4"
                  >
                    {/* Thumbnail */}
                    <Link
                      to={`/marketplace/${item.product_id}`}
                      className="w-24 h-24 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 flex-shrink-0"
                    >
                      <img
                        src={getImageUrl(item.cover_image)}
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-105 transition"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/marketplace/${item.product_id}`}
                            className="font-extrabold text-sm text-neutral-900 hover:text-[#16a34a] transition line-clamp-1"
                          >
                            {item.title}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product_id)}
                            className="text-neutral-400 hover:text-rose-600 transition p-1 cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                          <Store className="w-3 h-3 text-neutral-400" />
                          <span>{item.shop_name}</span>
                          <span>·</span>
                          <span className="capitalize">{item.category}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2">
                        {/* Stepper */}
                        <div className="flex items-center gap-2 border border-neutral-200 rounded-full px-2 py-1 bg-neutral-50/60">
                          <button
                            type="button"
                            onClick={() => updateQty(item.product_id, item.qty - 1)}
                            className="w-6 h-6 rounded-full bg-white border border-neutral-300 flex items-center justify-center text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-extrabold text-neutral-900">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            disabled={item.stock && item.qty >= item.stock}
                            onClick={() => updateQty(item.product_id, item.qty + 1)}
                            className="w-6 h-6 rounded-full bg-white border border-neutral-300 flex items-center justify-center text-xs font-bold text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price Breakdown */}
                        <div className="text-right">
                          <p className="text-xs text-neutral-400">
                            ৳{item.price.toLocaleString()} × {item.qty}
                          </p>
                          <p className="text-sm font-black text-neutral-900">
                            ৳{itemTotal.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between px-2">
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16a34a] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Checkout & Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-xl space-y-5 sticky top-28">
              <h2 className="text-base font-extrabold text-neutral-900">Order Summary</h2>

              {/* Delivery Details Form */}
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                  Shipping Information
                </label>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Delivery Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                    <textarea
                      required
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Road, House, Area (e.g. Dhanmondi, Dhaka)"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Recipient Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2 pt-3 border-t border-neutral-100 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal ({cartCount} items)</span>
                  <span className="font-semibold text-neutral-900">
                    ৳{cartSubtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Standard Delivery (Dhaka)</span>
                  <span className="font-semibold text-[#16a34a]">Free</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>VAT (5% included)</span>
                  <span className="font-semibold text-neutral-700">৳{Math.round(cartSubtotal * 5 / 105).toLocaleString()}</span>
                </div>

                {/* Payment Option Selector */}
                <div className="pt-2 border-t border-neutral-100 space-y-2">
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('online')}
                      className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        paymentMethod === 'online'
                          ? 'border-[#16a34a] bg-green-50/70 ring-1 ring-[#16a34a]'
                          : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/50'
                      }`}
                    >
                      <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                        💳 Pay Full Online
                      </span>
                      <span className="text-[10px] text-neutral-500 mt-1">100% instant payment</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash_advance')}
                      className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        paymentMethod === 'cash_advance'
                          ? 'border-[#16a34a] bg-green-50/70 ring-1 ring-[#16a34a]'
                          : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/50'
                      }`}
                    >
                      <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                        💵 Cash on Delivery
                      </span>
                      <span className="text-[10px] text-[#16a34a] font-bold mt-1">20% advance online</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between text-neutral-900 font-black text-base pt-3 border-t border-neutral-100">
                  <span>Total Amount</span>
                  <span className="text-[#16a34a]">৳{cartSubtotal.toLocaleString()}</span>
                </div>

                {paymentMethod === 'cash_advance' && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span>Online Advance (20%)</span>
                      <span className="text-[#16a34a]">৳{advanceDue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-amber-800">
                      <span>Cash Balance on Delivery (80%)</span>
                      <span className="font-bold">৳{cashBalance.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-amber-700 pt-1 border-t border-amber-200/60">
                      Pay ৳{advanceDue.toLocaleString()} online now to dispatch. Pay remainder in cash to delivery agent.
                    </p>
                  </div>
                )}
              </div>

              {/* User State Checks */}
              {!user ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                  <p className="font-bold">You need an account to place this order.</p>
                  <Link
                    to="/login"
                    className="inline-block w-full text-center py-2.5 rounded-xl bg-amber-700 text-white font-bold text-xs hover:bg-amber-800 transition"
                  >
                    Log In to Continue
                  </Link>
                </div>
              ) : !user.roles?.includes('customer') ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                  <p className="font-bold">Customer role required.</p>
                  <p className="text-[11px]">
                    Please activate the customer role in your Profile before purchasing.
                  </p>
                  <Link
                    to="/profile"
                    className="inline-block w-full text-center py-2 rounded-xl bg-neutral-900 text-white font-bold text-xs"
                  >
                    Go to Profile
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={busy || items.length === 0}
                  onClick={handleCheckout}
                  className="w-full py-3.5 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] disabled:bg-neutral-300 text-white font-extrabold text-sm shadow-md transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {busy
                      ? 'Placing Order…'
                      : paymentMethod === 'cash_advance'
                      ? `Pay ৳${advanceDue.toLocaleString()} Advance`
                      : 'Proceed to Checkout'}
                  </span>
                </button>
              )}

              {/* Trust Badges */}
              <div className="pt-2 border-t border-neutral-100 grid grid-cols-2 gap-2 text-[11px] text-neutral-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#16a34a] flex-shrink-0" />
                  <span>Secure Checkout</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#16a34a] flex-shrink-0" />
                  <span>Fast Dispatch</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {activePaymentOrder && (
        <SandboxPaymentModal
          orderId={activePaymentOrder.order_id}
          amount={
            activePaymentOrder.payment_method === 'cash_advance'
              ? Math.ceil(Number(activePaymentOrder.total_amount) * 0.20)
              : Number(activePaymentOrder.total_amount)
          }
          purpose={activePaymentOrder.payment_method === 'cash_advance' ? 'advance' : 'full'}
          balanceAmount={
            activePaymentOrder.payment_method === 'cash_advance'
              ? Number(activePaymentOrder.total_amount) - Math.ceil(Number(activePaymentOrder.total_amount) * 0.20)
              : 0
          }
          title={`Order #${String(activePaymentOrder.order_id).padStart(6, '0')} · MatchFix Marketplace`}
          onSuccess={() => {
            setActivePaymentOrder(null);
            setSuccessMsg(
              activePaymentOrder.payment_method === 'cash_advance'
                ? '🎉 20% advance received! Your order is placed. The remaining 80% balance is cash on delivery.'
                : '🎉 Payment completed successfully! Your order has been placed and confirmed.'
            );
            navigate('/my-orders');
          }}
          onClose={() => {
            setActivePaymentOrder(null);
            setSuccessMsg('Order placed! You can settle payment at any time from My Orders.');
          }}
        />
      )}
    </div>
  );
}
