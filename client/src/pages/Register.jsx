import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Lock, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full min-h-[calc(100vh-100px)] flex items-center justify-center px-4 py-12 bg-neutral-50/50">
      <div className="w-full max-w-lg bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-9 shadow-xl shadow-neutral-900/5">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-[#16a34a] text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Join MatchFix
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Create your account
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
            Book football turfs, purchase sports gear, or host your own arena in Dhaka.
          </p>
        </div>

        {/* Feature Highlights Banner */}
        <div className="mb-6 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 grid grid-cols-3 gap-2 text-center">
          <div className="space-y-0.5">
            <CheckCircle2 className="w-4 h-4 text-[#16a34a] mx-auto" />
            <p className="text-[11px] font-bold text-neutral-800">Turf Booking</p>
            <p className="text-[10px] text-neutral-500">Hourly slots</p>
          </div>
          <div className="space-y-0.5">
            <CheckCircle2 className="w-4 h-4 text-[#16a34a] mx-auto" />
            <p className="text-[11px] font-bold text-neutral-800">Gear Market</p>
            <p className="text-[10px] text-neutral-500">Boots & kits</p>
          </div>
          <div className="space-y-0.5">
            <CheckCircle2 className="w-4 h-4 text-[#16a34a] mx-auto" />
            <p className="text-[11px] font-bold text-neutral-800">Multi-Role</p>
            <p className="text-[10px] text-neutral-500">Organizer/Seller</p>
          </div>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
              Full name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                required
                placeholder="Cristiano Ronaldo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-neutral-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] transition bg-neutral-50/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-neutral-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] transition bg-neutral-50/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
              Phone number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                placeholder="017XXXXXXXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-neutral-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] transition bg-neutral-50/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-neutral-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] transition bg-neutral-50/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] disabled:bg-neutral-300 text-white text-sm font-bold shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{busy ? 'Creating account…' : 'Sign up'}</span>
            {!busy && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
          <p className="text-xs sm:text-sm text-neutral-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#16a34a] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
