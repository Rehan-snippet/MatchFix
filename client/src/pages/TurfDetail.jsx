import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import SandboxPaymentModal from '../components/SandboxPaymentModal';
import L from 'leaflet';
import {
  Star,
  Heart,
  Share2,
  MapPin,
  Shield,
  Clock,
  Sparkles,
  Users,
  CheckCircle2,
  Calendar,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

function todayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function TurfDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [turf, setTurf] = useState(null);
  const [fieldId, setFieldId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'cash_advance'

  const miniMapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    api.get(`/turfs/${id}`).then((res) => {
      setTurf(res.data);
      if (res.data.fields?.length) setFieldId(res.data.fields[0].field_id);
    });

    try {
      const favs = JSON.parse(localStorage.getItem('matchfix_favorites') || '[]');
      setIsFavorite(favs.includes(Number(id)));
    } catch {}
  }, [id]);

  useEffect(() => {
    if (!fieldId || !date) return;
    api
      .get('/slots', { params: { field_id: fieldId, date } })
      .then((res) => setSlots(res.data))
      .catch(() => setSlots([]));
    setSelected([]);
  }, [fieldId, date]);

  // Mini location map on detail page
  useEffect(() => {
    if (!turf || !miniMapRef.current || mapInstanceRef.current) return;

    const lat = parseFloat(turf.latitude) || 23.7937;
    const lng = parseFloat(turf.longitude) || 90.4043;

    const map = L.map(miniMapRef.current, {
      center: [lat, lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const customIcon = L.divIcon({
      className: 'custom-airbnb-marker',
      html: `<div class="airbnb-price-pin active">📍 ${turf.name}</div>`,
      iconSize: [120, 28],
      iconAnchor: [60, 14],
    });

    L.marker([lat, lng], { icon: customIcon }).addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [turf]);

  function toggleFavorite() {
    setIsFavorite(!isFavorite);
    try {
      let favs = JSON.parse(localStorage.getItem('matchfix_favorites') || '[]');
      const numId = Number(id);
      favs = favs.includes(numId) ? favs.filter((x) => x !== numId) : [...favs, numId];
      localStorage.setItem('matchfix_favorites', JSON.stringify(favs));
    } catch {}
  }

  function handleShare() {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  }

  function toggleSlot(slot) {
    setSelected((prev) => {
      const exists = prev.find((s) => s.start_time === slot.start_time);
      if (exists) return prev.filter((s) => s.start_time !== slot.start_time);
      return [...prev, slot];
    });
  }

  async function handleBook() {
    setMessage('');
    setIsSuccess(false);

    if (!user) {
      return setMessage('Please log in or sign up first to book.');
    }
    if (!user.roles?.includes('customer')) {
      return setMessage('Add the Customer role in your account profile first.');
    }
    if (!selected.length) {
      return setMessage('Please select at least one available time slot.');
    }

    setBusy(true);
    try {
      const { data: bookingRes } = await api.post('/bookings', {
        slots: selected.map((s) => ({
          field_id: fieldId,
          slot_date: date,
          start_time: s.start_time,
          end_time: s.end_time,
        })),
        payment_method: paymentMethod,
      });
      setIsSuccess(true);
      setMessage(
        paymentMethod === 'cash_advance'
          ? 'Match reservation created with Cash at Venue! Opening 20% advance payment checkout...'
          : 'Match booking created! Opening sandbox checkout...'
      );
      setSelected([]);
      const res = await api.get('/slots', { params: { field_id: fieldId, date } });
      setSlots(res.data);
      if (bookingRes?.booking_id) {
        setPaymentBooking(bookingRes);
      }
    } catch (err) {
      setIsSuccess(false);
      setMessage(err.response?.data?.error || 'Booking failed. Please try another slot.');
    } finally {
      setBusy(false);
    }
  }

  if (!turf) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center animate-pulse space-y-4">
        <div className="h-8 bg-neutral-200 rounded-xl w-1/3 mx-auto" />
        <div className="h-96 bg-neutral-200 rounded-3xl w-full" />
      </div>
    );
  }

  // Collect photos
  const rawImages = turf.images?.length
    ? turf.images.map((img) => getImageUrl(typeof img === 'string' ? img : img?.url))
    : [
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1529900248461-90567a644dd8?auto=format&fit=crop&w=800&q=80',
      ];
  const images = rawImages.length >= 5 ? rawImages : [...rawImages, ...rawImages, ...rawImages].slice(0, 5);

  const activeField = turf.fields?.find((f) => String(f.field_id) === String(fieldId)) || turf.fields?.[0];
  const hourlyRate = activeField?.hourly_rate || turf.hourly_rate || 1400;

  // Calculation breakdown
  const slotsCount = selected.length;
  const subtotal = slotsCount * hourlyRate;
  const includedVat = slotsCount > 0 ? Math.round(subtotal * 5 / 105) : 0;
  const grandTotal = subtotal;

  const numAverageRating = Number(turf.average_rating || 0);
  const reviewsCount = turf.reviews?.length || 0;
  const isGuestFavorite = numAverageRating >= 4.7 && reviewsCount >= 3;

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. Detail Header (Title, Rating, Area, Share & Save) */}
      <div className="space-y-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
          {turf.name}
        </h1>
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm text-neutral-700">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            <span className="flex items-center gap-1 font-bold text-neutral-900 shrink-0">
              <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
              <span>{numAverageRating > 0 ? numAverageRating.toFixed(2) : 'New'}</span>
            </span>
            <span className="text-neutral-300">·</span>
            <a href="#reviews" className="underline font-semibold cursor-pointer text-neutral-800 hover:text-black shrink-0">
              {reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'}
            </a>
            {isGuestFavorite && (
              <>
                <span className="text-neutral-300">·</span>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-bold text-xs shrink-0">
                  Guest favorite
                </span>
              </>
            )}
            <span className="text-neutral-300">·</span>
            <span className="underline font-medium truncate max-w-[200px] sm:max-w-none">
              {turf.area_name}, Dhaka, Bangladesh
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 underline font-medium hover:text-neutral-950 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedShare ? 'Link copied!' : 'Share'}</span>
            </button>
            <button
              onClick={toggleFavorite}
              className="flex items-center gap-1.5 underline font-medium hover:text-neutral-950 transition cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite ? 'fill-[#16a34a] stroke-[#16a34a]' : ''
                }`}
              />
              <span>{isFavorite ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 5-Photo Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 rounded-3xl overflow-hidden aspect-[16/9] md:aspect-[2.3/1] bg-neutral-100">
        <div className="md:col-span-2 h-full relative group cursor-pointer overflow-hidden">
          <img
            src={images[0]}
            alt={turf.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="hidden md:grid md:col-span-1 grid-rows-2 gap-2.5 h-full">
          <div className="relative group cursor-pointer overflow-hidden">
            <img
              src={images[1]}
              alt={turf.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="relative group cursor-pointer overflow-hidden">
            <img
              src={images[2]}
              alt={turf.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>
        <div className="hidden md:grid md:col-span-1 grid-rows-2 gap-2.5 h-full">
          <div className="relative group cursor-pointer overflow-hidden">
            <img
              src={images[3]}
              alt={turf.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="relative group cursor-pointer overflow-hidden">
            <img
              src={images[4]}
              alt={turf.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>
      </div>

      {/* 3. Main Split Section: Details & Booking Widget */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Venue Info, Host, Pitch Specs, Amenities, Mini Map (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Host & Venue Summary */}
          <div className="pb-6 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">
                  Entire football pitch hosted by {turf.organizer_name}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                  {turf.fields?.length || 1} field(s) available · Artificial turf · Night floodlit · Changing rooms
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-neutral-900 text-white font-bold text-lg flex items-center justify-center uppercase shadow-sm">
                {turf.organizer_name?.slice(0, 1) || 'O'}
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="space-y-4 pb-6 border-b border-neutral-200">
            <div className="flex items-start gap-3.5">
              <Sparkles className="w-5 h-5 text-neutral-900 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-neutral-900">FIFA-certified artificial turf</h4>
                <p className="text-xs text-neutral-500">
                  High-resilience infill grass designed to minimize knee friction and support rapid ball control.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3.5">
              <Clock className="w-5 h-5 text-neutral-900 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-neutral-900">Dedicated night floodlights</h4>
                <p className="text-xs text-neutral-500">
                  Equipped with 500W anti-glare LED sports lighting for late-night tournaments.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3.5">
              <Shield className="w-5 h-5 text-neutral-900 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-neutral-900">Free cancellation up to 4h before kick-off</h4>
                <p className="text-xs text-neutral-500">
                  Plans changed due to rain? Reschedule or cancel with zero penalty fees.
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="pb-6 border-b border-neutral-200 space-y-3">
            <h3 className="text-base font-bold text-neutral-900">About this venue</h3>
            <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
              {turf.description ||
                'Welcome to one of Dhaka’s most popular football arenas. Ideal for competitive 5-a-side or 7-a-side matches, corporate tourneys, and friendly scrimmages with friends.'}
            </p>
            <p className="text-xs text-neutral-500">
              Address: <span className="text-neutral-800 font-semibold">{turf.address}</span> ({turf.area_name}, {turf.city})
            </p>
          </div>

          {/* Amenities Grid */}
          <div className="pb-6 border-b border-neutral-200 space-y-4">
            <h3 className="text-base font-bold text-neutral-900">What this venue offers</h3>
            <div className="grid grid-cols-2 gap-3.5 text-xs sm:text-sm text-neutral-800">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                <span>Floodlit Night Stadium</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                <span>Locker & Changing Rooms</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                <span>Dedicated Free Parking</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                <span>Match Balls & Training Bibs</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                <span>Chilled Drinking Water</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                <span>Player Shower Facilities</span>
              </div>
            </div>
          </div>

          {/* Mini Interactive Map (Location Section) */}
          <div className="space-y-3 pb-6">
            <h3 className="text-base font-bold text-neutral-900">Where you’ll be playing</h3>
            <p className="text-xs text-neutral-500">
              {turf.address} · {turf.area_name}, Dhaka
            </p>
            <div className="w-full h-72 rounded-2xl overflow-hidden border border-neutral-200 shadow-sm relative z-0 isolate">
              <div ref={miniMapRef} className="w-full h-full z-0" />
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking Widget Card (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 bg-white border border-neutral-200 rounded-3xl p-6 shadow-xl space-y-5">
            {/* Price Header */}
            <div className="flex items-baseline justify-between gap-2 flex-wrap pb-4 border-b border-neutral-100">
              <div className="flex items-baseline gap-1 shrink-0">
                <span className="text-2xl font-extrabold text-neutral-900">
                  ৳{parseFloat(hourlyRate).toLocaleString()}
                </span>
                <span className="text-sm text-neutral-500 font-medium">/ hour</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-neutral-800 shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400 text-amber-500" />
                <span>{numAverageRating > 0 ? numAverageRating.toFixed(2) : 'New'}</span>
                {reviewsCount > 0 && <span className="text-neutral-400 font-normal">({reviewsCount})</span>}
              </div>
            </div>

            {/* Field Selector */}
            {turf.fields?.length > 1 && (
              <div>
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                  Select Pitch / Field
                </label>
                <select
                  value={fieldId}
                  onChange={(e) => setFieldId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-white"
                >
                  {turf.fields.map((f) => (
                    <option key={f.field_id} value={f.field_id}>
                      {f.name} — {f.side_type} ({f.surface})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Picker */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                Match Date
              </label>
              <div className="flex items-center gap-2 border border-neutral-300 rounded-xl px-3 py-2">
                <Calendar className="w-4 h-4 text-neutral-500" />
                <input
                  type="date"
                  value={date}
                  min={todayISO()}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs font-medium focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Slot Selection Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  Available Slots
                </label>
                <span className="text-[11px] text-neutral-500">
                  {selected.length} selected
                </span>
              </div>

              {slots.length === 0 ? (
                <div className="py-6 px-4 rounded-xl bg-neutral-50 text-center border border-dashed border-neutral-200">
                  <p className="text-xs text-neutral-500 font-medium">
                    No open match slots for this date.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {slots.map((s) => {
                    const isSelected = selected.some((sel) => sel.start_time === s.start_time);
                    return (
                      <button
                        key={s.start_time}
                        type="button"
                        disabled={s.is_reserved}
                        onClick={() => toggleSlot(s)}
                        className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${
                          s.is_reserved
                            ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-[#16a34a] text-white border-[#16a34a] shadow-sm'
                            : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Calculation Breakdown */}
            {selected.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-neutral-100 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>
                    ৳{parseFloat(hourlyRate).toLocaleString()} × {slotsCount}{' '}
                    {slotsCount === 1 ? 'hour' : 'hours'}
                  </span>
                  <span>৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>VAT & venue charges (5% included)</span>
                  <span>৳{includedVat.toLocaleString()}</span>
                </div>

                {/* Payment Option Selector */}
                <div className="pt-2 border-t border-neutral-100 space-y-2">
                  <label className="block text-[10px] font-bold text-neutral-700 uppercase tracking-wider">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('online')}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        paymentMethod === 'online'
                          ? 'border-[#16a34a] bg-green-50/70 ring-1 ring-[#16a34a]'
                          : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/50'
                      }`}
                    >
                      <span className="text-[11px] font-bold text-neutral-900 flex items-center gap-1">
                        💳 Pay Full Online
                      </span>
                      <span className="text-[9px] text-neutral-500 mt-0.5">100% instant payment</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash_advance')}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        paymentMethod === 'cash_advance'
                          ? 'border-[#16a34a] bg-green-50/70 ring-1 ring-[#16a34a]'
                          : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/50'
                      }`}
                    >
                      <span className="text-[11px] font-bold text-neutral-900 flex items-center gap-1">
                        💵 Cash at Venue
                      </span>
                      <span className="text-[9px] text-[#16a34a] font-bold mt-0.5">20% advance online</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between text-sm font-extrabold text-neutral-900 pt-2 border-t border-neutral-200">
                  <span>Total Amount</span>
                  <span className="text-[#16a34a]">৳{grandTotal.toLocaleString()}</span>
                </div>

                {paymentMethod === 'cash_advance' && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-[11px]">
                      <span>Online Advance (20%)</span>
                      <span className="text-[#16a34a]">৳{Math.ceil(grandTotal * 0.20).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-amber-800">
                      <span>Cash at Venue (80%)</span>
                      <span className="font-bold">৳{(grandTotal - Math.ceil(grandTotal * 0.20)).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleBook}
              disabled={busy || selected.length === 0}
              className="w-full py-3.5 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] disabled:bg-neutral-300 text-white font-bold text-sm shadow-md transition active:scale-[0.98] cursor-pointer"
            >
              {busy
                ? 'Creating reservation…'
                : selected.length === 0
                ? 'Select Time Slot'
                : paymentMethod === 'cash_advance'
                ? `Pay ৳${Math.ceil(grandTotal * 0.20).toLocaleString()} Advance & Book`
                : 'Pay & Reserve Pitch'}
            </button>

            <p className="text-[11px] text-center text-neutral-500">
              You won’t be charged yet. Payment is confirmed in your bookings panel.
            </p>

            {/* Messages */}
            {message && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-start gap-2 ${
                  isSuccess
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                )}
                <div>
                  <p className="font-semibold">{message}</p>
                  {isSuccess && (
                    <Link
                      to="/my-bookings"
                      className="mt-1 inline-block font-bold underline text-emerald-900"
                    >
                      View My Bookings & Pay →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Verified Match Reviews Section */}
      <div id="reviews" className="mt-12 pt-8 border-t border-neutral-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-1.5 text-xl sm:text-2xl font-black text-neutral-900">
            <Star className="w-6 h-6 fill-amber-400 stroke-amber-400" />
            <span>{numAverageRating > 0 ? numAverageRating.toFixed(2) : 'New'}</span>
          </div>
          <span className="text-xl sm:text-2xl font-black text-neutral-300">·</span>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900">
            {turf.reviews?.length || 0} {turf.reviews?.length === 1 ? 'Verified Review' : 'Verified Reviews'}
          </h2>
        </div>

        {turf.reviews && turf.reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {turf.reviews.map((r) => (
              <div
                key={r.review_id}
                className="p-5 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#16a34a]/10 text-[#16a34a] flex items-center justify-center font-black text-sm">
                      {r.customer_name ? r.customer_name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900 leading-tight">
                        {r.customer_name || 'Verified Player'}
                      </p>
                      <p className="text-[11px] text-neutral-500 font-medium">
                        {new Date(r.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-neutral-200 text-xs font-bold text-neutral-800">
                    <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                    <span>{r.rating}</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-normal">
                  {r.comment || 'Great experience playing at this pitch! Excellent lighting and surface.'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-neutral-50 border border-dashed border-neutral-200 text-center">
            <p className="text-sm font-bold text-neutral-800">No verified reviews yet</p>
            <p className="text-xs text-neutral-500 mt-1">
              Be the first player to book a match at this venue and leave a review!
            </p>
          </div>
        )}
      </div>

      {/* Sandbox Payment Modal */}
      {paymentBooking && (
        <SandboxPaymentModal
          bookingId={paymentBooking.booking_id}
          amount={
            paymentBooking.payment_method === 'cash_advance'
              ? Math.ceil(Number(paymentBooking.total_amount) * 0.20)
              : Number(paymentBooking.total_amount)
          }
          purpose={paymentBooking.payment_method === 'cash_advance' ? 'advance' : 'full'}
          balanceAmount={
            paymentBooking.payment_method === 'cash_advance'
              ? Number(paymentBooking.total_amount) - Math.ceil(Number(paymentBooking.total_amount) * 0.20)
              : 0
          }
          title={`Booking #${String(paymentBooking.booking_id).padStart(6, '0')} · ${turf.name}`}
          onSuccess={() => {
            setPaymentBooking(null);
            setMessage(
              paymentBooking.payment_method === 'cash_advance'
                ? '🎉 20% advance received! Your match slot is reserved. Pay the remaining 80% balance in cash at the venue.'
                : '🎉 Booking confirmed and paid successfully! View details in My Bookings.'
            );
          }}
          onClose={() => {
            setPaymentBooking(null);
            setMessage('Booking created! You can complete payment anytime from My Bookings.');
          }}
        />
      )}
    </div>
  );
}
