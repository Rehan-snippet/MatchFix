import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import SandboxPaymentModal from '../components/SandboxPaymentModal';
import {
  Star,
  Store,
  Truck,
  ShieldCheck,
  RotateCcw,
  ArrowLeft,
  ShoppingBag,
  ShoppingCart,
  CheckCircle2,
  MapPin,
  Phone,
  Package,
} from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart, cartCount } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);

  function load() {
    api.get(`/products/${id}`).then((res) => {
      setProduct(res.data);
    });
  }

  useEffect(load, [id]);

  useEffect(() => {
    if (user?.customer?.default_address) setAddress(user.customer.default_address);
    if (user?.phone) setPhone(user.phone);
  }, [user]);

  function handleAddToCart() {
    if (!product || product.stock === 0) return;
    addToCart(product, qty);
    setMessage(`Added ${qty} × "${product.title}" to your cart.`);
    setTimeout(() => setMessage(''), 4000);
  }

  async function handleBuy() {
    setMessage('');
    setErrorMsg('');
    if (!user) {
      setErrorMsg('Please log in first to purchase gear.');
      return;
    }
    if (!user.roles?.includes('customer')) {
      setErrorMsg('Please activate the Customer role in your profile before ordering.');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('Delivery address is required.');
      return;
    }

    setBusy(true);
    try {
      const { data: res } = await api.post('/orders', {
        items: [{ product_id: product.product_id, qty }],
        delivery_address: address,
        delivery_phone: phone,
      });
      const createdOrder = res.order || res;
      setPaymentOrder(createdOrder);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Order placement failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-8 h-8 border-3 border-[#16a34a] border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs text-neutral-500 font-semibold">Loading product gear details…</p>
      </div>
    );
  }

  const totalPrice = Number(product.price) * qty;

  return (
    <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link & Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-neutral-600">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1 hover:text-neutral-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Marketplace</span>
        </Link>
        <span>/</span>
        <span className="text-neutral-400 truncate">{product.category || 'Gear'}</span>
        <span>/</span>
        <span className="text-neutral-900 truncate font-bold">{product.title}</span>
      </div>

      {/* Header Info */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
          {product.title}
        </h1>
        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-neutral-600">
          <div className="flex items-center gap-1 font-bold text-neutral-900">
            <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
            <span>
              {Number(product.avg_rating || product.average_rating) > 0
                ? Number(product.avg_rating || product.average_rating).toFixed(1)
                : 'New'}
            </span>
            <span className="text-neutral-500 font-normal">
              ({product.reviews?.length || product.review_count || 0} reviews)
            </span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1 font-semibold text-neutral-700">
            <Store className="w-3.5 h-3.5 text-[#16a34a]" />
            <span>Sold by {product.shop_name}</span>
          </div>
          <span>·</span>
          <span className="px-2.5 py-0.5 rounded-full bg-green-50 text-[#16a34a] border border-green-200 font-bold uppercase tracking-wider text-[10px]">
            {product.condition || 'New'}
          </span>
        </div>
      </div>

      {/* Hero Showcase Image & Gallery */}
      {(() => {
        const rawList = product.images?.length
          ? product.images.map((img) => (typeof img === 'string' ? img : img.url))
          : [product.cover_image || 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=1200&q=80'];
        const images = rawList.filter(Boolean).map((u) => getImageUrl(u));
        const activeImg = images[selectedImageIndex] || images[0];

        return (
          <div className="space-y-3 mb-10">
            <div className="rounded-3xl overflow-hidden aspect-[16/9] sm:aspect-[2.2/1] bg-neutral-100 border border-neutral-200/80 shadow-xs">
              <img
                src={activeImg}
                alt={product.title}
                className="w-full h-full object-cover transition-all duration-300"
              />
            </div>
            {images.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition cursor-pointer shadow-2xs ${
                      idx === selectedImageIndex ? 'border-[#16a34a] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* 2-Column Airbnb Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Product Details & Reviews (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Seller / Highlights Card */}
          <div className="pb-8 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Shipped directly by {product.shop_name}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Category: {product.category || 'Football Gear'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[#16a34a]">
                <Store className="w-6 h-6" />
              </div>
            </div>

            {/* Highlights Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
                <Truck className="w-4 h-4 text-[#16a34a] mb-1.5" />
                <p className="text-xs font-bold text-neutral-800">Fast Dhaka Delivery</p>
                <p className="text-[11px] text-neutral-500">Delivered within 24-48 hrs</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
                <ShieldCheck className="w-4 h-4 text-[#16a34a] mb-1.5" />
                <p className="text-xs font-bold text-neutral-800">100% Authentic</p>
                <p className="text-[11px] text-neutral-500">Verified seller quality</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
                <RotateCcw className="w-4 h-4 text-[#16a34a] mb-1.5" />
                <p className="text-xs font-bold text-neutral-800">Match Guarantee</p>
                <p className="text-[11px] text-neutral-500">Size swap support</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="pb-8 border-b border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-3">About this gear</h3>
            <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
              {product.description ||
                'Top grade football gear engineered for high performance on artificial turf and grass pitches. Made with durable, high-friction materials for precision control and agility.'}
            </p>
          </div>

          {/* Customer Reviews */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900">
                Verified Reviews ({product.reviews?.length || 0})
              </h3>
              <div className="flex items-center gap-1 text-xs font-bold text-neutral-800">
                <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                <span>
                  {Number(product.avg_rating || product.average_rating) > 0
                    ? `${Number(product.avg_rating || product.average_rating).toFixed(1)} rating`
                    : 'New product'}
                </span>
              </div>
            </div>

            {product.reviews?.length ? (
              <div className="space-y-3">
                {product.reviews.map((r) => (
                  <div
                    key={r.review_id}
                    className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-neutral-900">
                        {r.customer_name || r.reviewer_name || 'Verified Buyer'}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-semibold text-neutral-800">
                        <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                        <span>{r.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-600">{r.comment || 'Great quality gear!'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic">No reviews yet for this product.</p>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Airbnb Buy Box (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 bg-white border border-neutral-200 rounded-3xl p-6 shadow-xl space-y-5">
            {/* Price Header */}
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
                  ৳{Number(product.price).toLocaleString()}
                </span>
                <span className="text-xs text-neutral-500 font-medium">/ unit</span>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  product.stock > 0
                    ? 'bg-green-50 text-[#16a34a] border border-green-200'
                    : 'bg-rose-50 text-rose-600 border border-rose-200'
                }`}
              >
                {product.stock > 0 ? `${product.stock} available` : 'Out of Stock'}
              </span>
            </div>

            {/* Inputs Box (Airbnb border grouping) */}
            <div className="border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-200 bg-neutral-50/40">
              {/* Quantity Selector */}
              <div className="p-3.5 bg-white">
                <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Quantity
                </label>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-800">Select Units</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={qty <= 1}
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="w-7 h-7 rounded-full border border-neutral-300 flex items-center justify-center text-xs font-bold text-neutral-700 hover:border-neutral-900 disabled:opacity-30 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-neutral-900">
                      {qty}
                    </span>
                    <button
                      type="button"
                      disabled={qty >= product.stock}
                      onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                      className="w-7 h-7 rounded-full border border-neutral-300 flex items-center justify-center text-xs font-bold text-neutral-700 hover:border-neutral-900 disabled:opacity-30 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="p-3.5 bg-white">
                <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Delivery Address
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House, Road, Area (e.g. Dhanmondi, Dhaka)"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#16a34a] bg-neutral-50/50"
                  />
                </div>
              </div>

              {/* Delivery Phone */}
              <div className="p-3.5 bg-white">
                <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#16a34a] bg-neutral-50/50"
                  />
                </div>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 pt-2 border-t border-neutral-100 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>
                  ৳{Number(product.price).toLocaleString()} × {qty} {qty === 1 ? 'unit' : 'units'}
                </span>
                <span className="font-semibold text-neutral-900">
                  ৳{totalPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Standard Delivery (Dhaka)</span>
                <span className="font-semibold text-[#16a34a]">Free</span>
              </div>
              <div className="flex justify-between text-neutral-900 font-extrabold text-sm pt-2 border-t border-neutral-100">
                <span>Total Amount</span>
                <span>৳{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* Notifications */}
            {message && (
              <div className="p-3.5 rounded-2xl bg-green-50 border border-green-200 text-green-900 text-xs font-semibold flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16a34a] flex-shrink-0" />
                  <span>{message}</span>
                </div>
                <Link
                  to="/cart"
                  className="px-2.5 py-1 rounded-xl bg-[#16a34a] text-white text-[11px] font-bold hover:bg-[#15803d] transition whitespace-nowrap"
                >
                  View Cart
                </Link>
              </div>
            )}
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* CTAs: Add to Cart + Buy Now */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full py-3.5 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] disabled:bg-neutral-300 text-white font-extrabold text-sm shadow-md transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>

              <button
                type="button"
                onClick={handleBuy}
                disabled={busy || product.stock === 0}
                className="w-full py-3 rounded-2xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 font-bold text-xs transition cursor-pointer"
              >
                {busy ? 'Processing order…' : 'Instant Checkout (Buy Now)'}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
              <span>Safe & secure SSL payment</span>
              {cartCount > 0 && (
                <Link to="/cart" className="font-bold text-[#16a34a] hover:underline">
                  Cart ({cartCount}) &rarr;
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Sandbox Payment Modal */}
      {paymentOrder && (
        <SandboxPaymentModal
          orderId={paymentOrder.order_id}
          amount={Number(paymentOrder.total_amount || totalPrice)}
          title={`Order #${String(paymentOrder.order_id).padStart(6, '0')} · ${product.title}`}
          onSuccess={() => {
            setPaymentOrder(null);
            setMessage('🎉 Order placed and settled successfully! You can track it in My Orders.');
            load();
          }}
          onClose={() => {
            setPaymentOrder(null);
            setMessage('Order created! You can settle payment anytime from My Orders.');
          }}
        />
      )}
    </div>
  );
}
