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
  MessageSquare,
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

  // Review state
  const [eligibility, setEligibility] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');
  const [reviewErr, setReviewErr] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  function load() {
    api.get(`/products/${id}`).then((res) => {
      setProduct(res.data);
    });
  }

  function checkEligibility() {
    if (!user) {
      setEligibility(null);
      return;
    }
    api
      .get(`/products/${id}/review-eligibility`)
      .then((res) => {
        setEligibility(res.data);
        if (res.data?.existing_review) {
          setReviewRating(res.data.existing_review.rating || 5);
          setReviewComment(res.data.existing_review.comment || '');
        }
      })
      .catch(() => setEligibility({ can_review: false }));
  }

  useEffect(() => {
    load();
    checkEligibility();
  }, [id, user]);

  async function handleSubmitReview(e) {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewMsg('');
    setReviewErr('');
    try {
      await api.post(`/products/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
        order_id: eligibility?.order_id,
      });
      setReviewMsg('Thank you! Your verified review has been posted.');
      setShowReviewForm(false);
      load();
      checkEligibility();
    } catch (err) {
      setReviewErr(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  }

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
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-neutral-600 flex-wrap min-w-0">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1 hover:text-neutral-900 transition shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Marketplace</span>
        </Link>
        <span className="shrink-0">/</span>
        <span className="text-neutral-400 truncate max-w-[120px] sm:max-w-[180px]">{product.category || 'Gear'}</span>
        <span className="shrink-0">/</span>
        <span className="text-neutral-900 truncate font-bold max-w-[180px] sm:max-w-md" title={product.title}>
          {product.title}
        </span>
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
            <a href="#reviews" className="text-neutral-500 font-normal hover:text-neutral-900 hover:underline cursor-pointer">
              ({product.reviews?.length || product.review_count || 0} reviews)
            </a>
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
        const rawList = [];
        if (product.cover_image) rawList.push(product.cover_image);
        if (Array.isArray(product.images)) {
          product.images.forEach((img) => {
            const url = typeof img === 'string' ? img : img.url;
            if (url && !rawList.includes(url)) rawList.push(url);
          });
        }
        if (rawList.length === 0) {
          rawList.push('https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=1200&q=80');
        }
        const images = rawList.map((u) => getImageUrl(u));
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

          {/* Product Specifications & Quick Details */}
          <div className="p-6 rounded-3xl bg-neutral-50/80 border border-neutral-200/90 space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Product Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-neutral-400 block text-[11px] font-medium">Condition</span>
                <span className="font-bold text-neutral-800 capitalize">{product.condition || 'Brand New'}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px] font-medium">Category</span>
                <span className="font-bold text-neutral-800">{product.category || 'Gear'}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px] font-medium">Stock Status</span>
                <span className={`font-bold ${product.stock > 0 ? 'text-[#16a34a]' : 'text-rose-600'}`}>
                  {product.stock > 0 ? `${product.stock} In Stock` : 'Out of Stock'}
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-neutral-400 block text-[11px] font-medium">Merchant / Seller</span>
                <span className="font-bold text-neutral-800 truncate block" title={product.shop_name}>
                  {product.shop_name}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px] font-medium">Dispatch Hub</span>
                <span className="font-bold text-neutral-800">Dhaka, Bangladesh</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px] font-medium">Customer Rating</span>
                <a href="#reviews" className="font-bold text-[#16a34a] hover:underline flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400 shrink-0" />
                  <span>
                    {Number(product.avg_rating || product.average_rating) > 0
                      ? Number(product.avg_rating || product.average_rating).toFixed(1)
                      : 'New'} ({product.reviews?.length || 0})
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Airbnb Buy Box (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 bg-white border border-neutral-200 rounded-3xl p-6 shadow-xl space-y-5">
            {/* Price Header */}
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <div className="flex items-baseline gap-1.5 shrink-0">
                <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
                  ৳{Number(product.price).toLocaleString()}
                </span>
                <span className="text-xs text-neutral-500 font-medium">/ unit</span>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${
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
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House, Road, Area (e.g. Dhanmondi, Dhaka)"
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#16a34a] bg-neutral-50/50"
                  />
                </div>
              </div>

              {/* Delivery Phone */}
              <div className="p-3.5 bg-white">
                <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#16a34a] bg-neutral-50/50"
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

      {/* Customer Reviews Section */}
      <div id="reviews" className="mt-16 pt-10 border-t border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-2xl font-black text-neutral-900 shrink-0">
                <Star className="w-6 h-6 fill-amber-400 stroke-amber-400" />
                <span>
                  {Number(product.avg_rating || product.average_rating) > 0
                    ? Number(product.avg_rating || product.average_rating).toFixed(1)
                    : 'New'}
                </span>
              </div>
              <span className="text-xl font-bold text-neutral-300 hidden sm:inline">·</span>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900">
                {product.reviews?.length || 0}{' '}
                {product.reviews?.length === 1 ? 'Customer Review' : 'Customer Reviews'}
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Verified gear ratings and feedback from players across Dhaka.
            </p>
          </div>

          {/* Action Button: Write or Edit Review */}
          {eligibility?.can_review && (
            <button
              type="button"
              onClick={() => setShowReviewForm((prev) => !prev)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <MessageSquare className="w-4 h-4" />
              <span>
                {eligibility.existing_review
                  ? showReviewForm
                    ? 'Close Form'
                    : 'Edit Your Review'
                  : showReviewForm
                  ? 'Cancel Review'
                  : 'Write a Review'}
              </span>
            </button>
          )}
        </div>

        {/* Review Submission Form */}
        {showReviewForm && eligibility?.can_review && (
          <div className="mb-10 p-6 sm:p-8 rounded-3xl bg-neutral-50/80 border border-neutral-200/90 shadow-xs animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-extrabold text-neutral-900 mb-1">
              {eligibility.existing_review ? 'Update Your Review' : 'Write a Product Review'}
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Share details about product quality, fit, and on-pitch performance with fellow players.
            </p>

            {reviewMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                <span>{reviewMsg}</span>
              </div>
            )}
            {reviewErr && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {reviewErr}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Picker */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                  Overall Rating <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-110 cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            star <= (hoverRating || reviewRating)
                              ? 'fill-amber-400 stroke-amber-400'
                              : 'text-neutral-300 stroke-[1.5]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-neutral-700 ml-2">
                    {
                      {
                        1: '1 - Poor',
                        2: '2 - Fair',
                        3: '3 - Good',
                        4: '4 - Very Good',
                        5: '5 - Excellent',
                      }[hoverRating || reviewRating]
                    }
                  </span>
                </div>
              </div>

              {/* Comment text area */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                  Review Details <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How does the product feel on the pitch? Was sizing accurate?"
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-white transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-5 py-2.5 rounded-full border border-neutral-200 text-neutral-700 text-xs font-bold hover:bg-neutral-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-6 py-2.5 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {reviewSubmitting
                    ? 'Submitting…'
                    : eligibility.existing_review
                    ? 'Save Changes'
                    : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Info notices for non-eligible users */}
        {!user && (
          <div className="mb-8 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Have you purchased this item? Sign in to submit your verified review.</span>
            <Link to="/login" className="font-bold text-[#16a34a] hover:underline whitespace-nowrap self-start sm:self-auto">
              Log in &rarr;
            </Link>
          </div>
        )}

        {user && eligibility && !eligibility.can_review && (
          <div className="mb-8 p-4 rounded-2xl bg-neutral-50/70 border border-neutral-200/80 text-xs text-neutral-500">
            ℹ️ {eligibility.reason || 'Only verified buyers who have ordered this gear can submit a review.'}
          </div>
        )}

        {/* Reviews List */}
        {product.reviews && product.reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.reviews.map((r) => (
              <div
                key={r.review_id}
                className="p-5 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 space-y-3 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#16a34a] flex items-center justify-center font-black text-sm shrink-0">
                      {r.customer_name ? r.customer_name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-sm font-bold text-neutral-900 leading-tight truncate">
                          {r.customer_name || 'Verified Buyer'}
                        </p>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-50 text-[#16a34a] text-[10px] font-bold shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Verified</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
                        {r.created_at
                          ? new Date(r.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Recent review'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-800 shadow-2xs shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                    <span>{r.rating}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-normal">
                  {r.comment || 'Verified purchase. Product matched description and arrived in excellent condition.'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 rounded-3xl bg-neutral-50 border border-dashed border-neutral-200 text-center max-w-md mx-auto">
            <Star className="w-8 h-8 text-neutral-300 mx-auto mb-2.5" />
            <h4 className="text-sm font-bold text-neutral-800">No customer reviews yet</h4>
            <p className="text-xs text-neutral-500 mt-1">
              Be the first verified customer to purchase this gear and leave a rating!
            </p>
          </div>
        )}
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

