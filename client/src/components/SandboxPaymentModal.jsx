import { useState } from 'react';
import api from '../api/client';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Sparkles,
} from 'lucide-react';

const SANDBOX_CARDS = [
  {
    number: '4242 4242 4242 4242',
    raw: '4242424242424242',
    label: 'Visa (Success)',
    desc: 'Simulates successful charge',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  {
    number: '4000 0000 0000 0002',
    raw: '4000000000000002',
    label: 'Visa (Declined)',
    desc: 'Simulates bank card decline',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
  },
  {
    number: '4000 0000 0000 9995',
    raw: '4000000000009995',
    label: 'Visa (Insufficient Funds)',
    desc: 'Simulates insufficient balance',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
];

export default function SandboxPaymentModal({
  bookingId,
  orderId,
  amount,
  title,
  onSuccess,
  onClose,
}) {
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [name, setName] = useState('Sandbox Customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const numAmount = Number(amount || 0);

  function selectCard(card) {
    setCardNumber(card.number);
    setError('');
  }

  function handleCardNumberChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  }

  function handleExpiryChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setExpiry(`${raw.slice(0, 2)}/${raw.slice(2, 4)}`);
    } else {
      setExpiry(raw);
    }
  }

  async function handlePay(e) {
    e?.preventDefault();
    if (!cardNumber.replace(/\s+/g, '')) {
      setError('Please enter or select a test card number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Initiate Payment Intent
      const intentRes = await api.post('/payments/initiate', {
        booking_id: bookingId || undefined,
        order_id: orderId || undefined,
        amount: numAmount,
        method: 'sandbox_card',
      });

      const { intent_id } = intentRes.data;

      // Step 2: Confirm Sandbox Transaction
      const confirmRes = await api.post('/payments/confirm', {
        intent_id,
        card_number: cardNumber.replace(/\s+/g, ''),
      });

      setSuccessData(confirmRes.data);
      setTimeout(() => {
        onSuccess?.(confirmRes.data);
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Payment settlement failed. Please try a different test card.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-neutral-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-green-50 text-[#16a34a] border border-green-200 flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-neutral-900 text-base sm:text-lg">
                  Payment Checkout
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                  Sandbox
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-medium">
                {title || (orderId ? `Order #${orderId}` : `Booking #${bookingId}`)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {successData ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 text-[#16a34a] flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-neutral-900">Payment Successful!</h4>
                <p className="text-xs text-neutral-600 mt-1">
                  Settled ৳{numAmount.toLocaleString()} via MatchFix Sandbox Gateway.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs font-mono text-neutral-700 max-w-xs mx-auto">
                Status: Completed · Ready for Dispatch
              </div>
            </div>
          ) : (
            <>
              {/* Amount Display */}
              <div className="p-4 rounded-2xl bg-neutral-900 text-white flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Total Payable Amount
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    ৳{numAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-emerald-400 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Secure 256-bit</span>
                </div>
              </div>

              {/* Sandbox Quick Test Cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quick Test Cards (Click to fill)</span>
                  </span>
                  <span className="text-[10px] text-neutral-500 font-semibold">
                    Simulated Sandbox
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SANDBOX_CARDS.map((c) => {
                    const isSelected = cardNumber.replace(/\s+/g, '') === c.raw;
                    return (
                      <button
                        key={c.raw}
                        type="button"
                        onClick={() => selectCard(c)}
                        className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#16a34a] bg-green-50/70 shadow-xs ring-1 ring-[#16a34a]'
                            : 'border-neutral-200 bg-white hover:border-neutral-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${c.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${c.dotClass}`} />
                            <span>{c.label.split(' ')[1]?.replace(/[()]/g, '') || 'Test'}</span>
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-neutral-800">
                          •••• {c.raw.slice(-4)}
                        </span>
                        <span className="text-[10px] text-neutral-500 truncate mt-0.5">
                          {c.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card Inputs Form */}
              <form onSubmit={handlePay} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name on Card"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 font-mono text-xs font-semibold tracking-wider focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
                    />
                    <CreditCard className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 font-mono text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                      CVC / CVV
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        placeholder="123"
                        maxLength={3}
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-neutral-200 font-mono text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
                      />
                      <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 py-3 rounded-2xl border border-neutral-200 hover:bg-neutral-100 text-neutral-700 font-bold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] disabled:bg-neutral-300 text-white font-extrabold text-xs shadow-md transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Sandbox…</span>
                      </>
                    ) : (
                      <span>Pay ৳{numAmount.toLocaleString()}</span>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-neutral-50 border-t border-neutral-100 text-center">
          <p className="text-[10px] text-neutral-500 font-medium">
            🔒 Sandbox gateway simulator. No real money will be charged from your account.
          </p>
        </div>
      </div>
    </div>
  );
}
