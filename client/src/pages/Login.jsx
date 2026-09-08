import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Store, Trophy } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check credentials.');
    } finally {
      setBusy(false);
    }
  }

  function handleQuickFill(email) {
    setForm({ email, password: 'Passw0rd!' });
    setError('');
  }

  return (
    <div className="w-full min-h-[calc(100vh-100px)] flex items-center justify-center px-4 py-12 bg-neutral-50/50">
      <div className="w-full max-w-md bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-9 shadow-xl shadow-neutral-900/5">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-green-50 text-[#16a34a] mb-3">
            <Lock className="w-6 h-6 text-[#16a34a]" />
          </div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
            Log in to Match<span className="text-[#16a34a]">Fix</span>!
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-neutral-500">
            Welcome back! Enter your details to access your account.
          </p>
        </div>

        {/* Quick Demo Credentials Bar */}
        <div className="mb-6 p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16a34a]" />
              Quick Demo Fill (Pass: Passw0rd!)
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickFill('rafi@matchfix.dev')}
              className="px-2 py-1.5 rounded-xl text-[11px] font-semibold bg-white border border-neutral-200 hover:border-[#16a34a] hover:text-[#16a34a] transition text-neutral-700 shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <UserCheck className="w-3 h-3 text-[#16a34a]" />
              Player
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('turfrunners@matchfix.dev')}
              className="px-2 py-1.5 rounded-xl text-[11px] font-semibold bg-white border border-neutral-200 hover:border-[#16a34a] hover:text-[#16a34a] transition text-neutral-700 shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <Trophy className="w-3 h-3 text-[#16a34a]" />
              Organizer
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('gearbazaar@matchfix.dev')}
              className="px-2 py-1.5 rounded-xl text-[11px] font-semibold bg-white border border-neutral-200 hover:border-[#16a34a] hover:text-[#16a34a] transition text-neutral-700 shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <Store className="w-3 h-3 text-[#16a34a]" />
              Seller
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
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
            <span>{busy ? 'Logging in…' : 'Log in'}</span>
            {!busy && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
          <p className="text-xs sm:text-sm text-neutral-600">
            Don’t have an account?{' '}
            <Link to="/register" className="font-bold text-[#16a34a] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
