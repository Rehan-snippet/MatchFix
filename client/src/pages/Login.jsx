import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Store,
  Trophy,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import {
  validateLoginForm,
  isValidEmailOrPhone,
} from '../utils/validators';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ identifier: '', password: '' });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function validateField(field, value) {
    let error = '';
    const trimmed = (value || '').trim();

    if (field === 'identifier') {
      if (!trimmed) {
        error = 'Email address or phone number is required.';
      } else if (!isValidEmailOrPhone(trimmed)) {
        error = 'Please enter a valid email address or Bangladeshi phone number.';
      }
    } else if (field === 'password') {
      if (!value) {
        error = 'Password is required.';
      } else if (value.length < 6) {
        error = 'Password must be at least 6 characters.';
      }
    }

    return error;
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (touched[field]) {
      const err = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, form[field]);
    setErrors((prev) => ({ ...prev, [field]: err }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');

    setTouched({ identifier: true, password: true });
    const { errors: validationErrors, isValid } = validateLoginForm(
      form.identifier,
      form.password
    );
    setErrors(validationErrors);

    if (!isValid) return;

    setBusy(true);
    try {
      await login(form.identifier.trim(), form.password);
      navigate('/');
    } catch (err) {
      setServerError(
        err.response?.data?.error || 'Login failed. Please check credentials.'
      );
    } finally {
      setBusy(false);
    }
  }

  function handleQuickFill(email) {
    setForm({ identifier: email, password: 'Passw0rd!' });
    setTouched({ identifier: true, password: true });
    setErrors({});
    setServerError('');
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

        {/* Server Error Notification */}
        {serverError && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
              Email address or Phone number
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoComplete="username"
                placeholder="you@example.com or 017XXXXXXXX"
                value={form.identifier}
                onChange={(e) => handleChange('identifier', e.target.value)}
                onBlur={() => handleBlur('identifier')}
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium focus:outline-none transition bg-neutral-50/30 ${
                  errors.identifier && touched.identifier
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                    : 'border-neutral-200 focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a]'
                }`}
              />
            </div>
            {errors.identifier && touched.identifier && (
              <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.identifier}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-bold text-[#16a34a] hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                className={`w-full pl-10 pr-11 py-3 rounded-2xl border text-sm font-medium focus:outline-none transition bg-neutral-50/30 ${
                  errors.password && touched.password
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                    : 'border-neutral-200 focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && touched.password && (
              <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.password}
              </p>
            )}
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

