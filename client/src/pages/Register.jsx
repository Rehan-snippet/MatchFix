import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Store,
  ShoppingBag,
  ShieldCheck,
  FileText,
  CreditCard,
  MapPin,
  Clock,
} from 'lucide-react';
import {
  validateRegistrationForm,
  isValidEmail,
  isValidPhone,
} from '../utils/validators';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
    trade_licence: '',
    payout_account: '',
    shop_name: '',
    address: '',
  });

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pendingApprovalModal, setPendingApprovalModal] = useState(null);

  function validateField(name, value, allValues = form) {
    let error = '';
    const trimmed = (value || '').trim();

    switch (name) {
      case 'name':
        if (!trimmed) {
          error = 'Full name is required.';
        } else if (trimmed.length < 2) {
          error = 'Full name must be at least 2 characters.';
        }
        break;

      case 'email':
        if (!trimmed) {
          error = 'Email address is required.';
        } else if (!isValidEmail(trimmed)) {
          error = 'Please enter a valid email address (e.g. you@example.com).';
        }
        break;

      case 'phone':
        if (!trimmed) {
          error = 'Phone number is required.';
        } else if (!isValidPhone(trimmed)) {
          error = 'Enter a valid Bangladeshi phone number (e.g. 017XXXXXXXX or +88017XXXXXXXX).';
        }
        break;

      case 'password':
        if (!value) {
          error = 'Password is required.';
        } else if (value.length < 6) {
          error = 'Password must be at least 6 characters.';
        }
        break;

      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm your password.';
        } else if (value !== allValues.password) {
          error = 'Passwords do not match.';
        }
        break;

      case 'trade_licence':
        if (allValues.role === 'organizer' && !trimmed) {
          error = 'Trade licence / business registration number is required.';
        }
        break;

      case 'shop_name':
        if (allValues.role === 'seller' && !trimmed) {
          error = 'Shop or merchant name is required.';
        }
        break;

      case 'payout_account':
        if ((allValues.role === 'organizer' || allValues.role === 'seller') && !trimmed) {
          error = 'Payout account details (bKash/Nagad/Bank) are required.';
        }
        break;

      default:
        break;
    }

    return error;
  }

  function handleChange(field, value) {
    const updatedForm = { ...form, [field]: value };
    setForm(updatedForm);

    if (touched[field]) {
      const err = validateField(field, value, updatedForm);
      setErrors((prev) => ({ ...prev, [field]: err }));
    }

    // Revalidate confirmPassword when password changes
    if (field === 'password' && touched.confirmPassword) {
      const confirmErr = validateField('confirmPassword', form.confirmPassword, updatedForm);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmErr }));
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

    // Mark all relevant fields as touched
    const touchedFields = {
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    };
    if (form.role === 'organizer') {
      touchedFields.trade_licence = true;
      touchedFields.payout_account = true;
    } else if (form.role === 'seller') {
      touchedFields.shop_name = true;
      touchedFields.payout_account = true;
    }
    setTouched(touchedFields);

    const { errors: validationErrors, isValid } = validateRegistrationForm(form);
    setErrors(validationErrors);

    if (!isValid) {
      return;
    }

    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
      };

      if (form.role === 'organizer') {
        payload.trade_licence = form.trade_licence.trim();
        payload.payout_account = form.payout_account.trim();
      } else if (form.role === 'seller') {
        payload.shop_name = form.shop_name.trim();
        payload.payout_account = form.payout_account.trim();
      } else if (form.address) {
        payload.address = form.address.trim();
      }

      const res = await register(payload);

      if (res?.requires_approval || form.role === 'organizer' || form.role === 'seller') {
        setPendingApprovalModal({
          role: form.role,
          name: form.name.trim(),
        });
      } else {
        navigate('/profile');
      }
    } catch (err) {
      setServerError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full min-h-[calc(100vh-100px)] flex items-center justify-center px-4 py-12 bg-neutral-50/50">
      <div className="w-full max-w-xl bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-9 shadow-xl shadow-neutral-900/5">
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

        {/* Server Error Callout */}
        {serverError && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Role Selection Dropdown & Quick Selector */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Select Your Role <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-semibold text-[#16a34a]">
                Choose from 3 roles
              </span>
            </div>

            {/* Dropdown Input */}
            <select
              value={form.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-white cursor-pointer"
            >
              <option value="customer">Player / Customer (Book Pitches & Buy Gear)</option>
              <option value="organizer">Turf Host / Organizer (List Arenas & Manage Bookings)</option>
              <option value="seller">Gear Merchant / Seller (List & Sell Sports Equipment)</option>
            </select>

            {/* Visual Role Pills */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleChange('role', 'customer')}
                className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                  form.role === 'customer'
                    ? 'border-[#16a34a] bg-white shadow-xs text-neutral-900 ring-2 ring-green-100'
                    : 'border-neutral-200 bg-white/50 text-neutral-600 hover:bg-white'
                }`}
              >
                <ShoppingBag className={`w-4 h-4 ${form.role === 'customer' ? 'text-[#16a34a]' : 'text-neutral-400'}`} />
                <span className="text-[11px] font-bold">Player</span>
                <span className="text-[9px] text-neutral-400">Instant Access</span>
              </button>

              <button
                type="button"
                onClick={() => handleChange('role', 'organizer')}
                className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                  form.role === 'organizer'
                    ? 'border-[#16a34a] bg-white shadow-xs text-neutral-900 ring-2 ring-green-100'
                    : 'border-neutral-200 bg-white/50 text-neutral-600 hover:bg-white'
                }`}
              >
                <Trophy className={`w-4 h-4 ${form.role === 'organizer' ? 'text-[#16a34a]' : 'text-neutral-400'}`} />
                <span className="text-[11px] font-bold">Organizer</span>
                <span className="text-[9px] text-amber-600 font-semibold">Admin Approval</span>
              </button>

              <button
                type="button"
                onClick={() => handleChange('role', 'seller')}
                className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                  form.role === 'seller'
                    ? 'border-[#16a34a] bg-white shadow-xs text-neutral-900 ring-2 ring-green-100'
                    : 'border-neutral-200 bg-white/50 text-neutral-600 hover:bg-white'
                }`}
              >
                <Store className={`w-4 h-4 ${form.role === 'seller' ? 'text-[#16a34a]' : 'text-neutral-400'}`} />
                <span className="text-[11px] font-bold">Seller</span>
                <span className="text-[9px] text-amber-600 font-semibold">Admin Approval</span>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
              Full name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cristiano Ronaldo"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium focus:outline-none transition bg-neutral-50/30 ${
                  errors.name && touched.name
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                    : 'border-neutral-200 focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a]'
                }`}
              />
            </div>
            {errors.name && touched.name && (
              <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
              Email address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium focus:outline-none transition bg-neutral-50/30 ${
                  errors.email && touched.email
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                    : 'border-neutral-200 focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a]'
                }`}
              />
            </div>
            {errors.email && touched.email && (
              <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
              Phone number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="017XXXXXXXX"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium focus:outline-none transition bg-neutral-50/30 ${
                  errors.phone && touched.phone
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                    : 'border-neutral-200 focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a]'
                }`}
              />
            </div>
            {errors.phone && touched.phone ? (
              <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.phone}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-neutral-400">
                11-digit Bangladeshi mobile number (e.g. 01712345678)
              </p>
            )}
          </div>

          {/* Conditional Role Fields */}
          {form.role === 'customer' && (
            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                Default Delivery Address <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <textarea
                  rows={2}
                  placeholder="House, Road, Area (e.g. Dhanmondi, Dhaka)"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-neutral-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] transition bg-neutral-50/30"
                />
              </div>
            </div>
          )}

          {form.role === 'organizer' && (
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3.5">
              <div className="flex items-start gap-2 text-amber-800">
                <ShieldCheck className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">Organizer Verification Required</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Your organizer credentials will be reviewed and approved by the admin before your venue listings go public.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1">
                  Trade Licence / Business Reg. No. <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. TL-2026-DHAKA-1029"
                    value={form.trade_licence}
                    onChange={(e) => handleChange('trade_licence', e.target.value)}
                    onBlur={() => handleBlur('trade_licence')}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition bg-white ${
                      errors.trade_licence && touched.trade_licence
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : 'border-neutral-300 focus:ring-2 focus:ring-[#16a34a]'
                    }`}
                  />
                </div>
                {errors.trade_licence && touched.trade_licence && (
                  <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.trade_licence}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1">
                  Payout Account Details <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. bkash: 017XXXXXXXX or Bank Account info"
                    value={form.payout_account}
                    onChange={(e) => handleChange('payout_account', e.target.value)}
                    onBlur={() => handleBlur('payout_account')}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition bg-white ${
                      errors.payout_account && touched.payout_account
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : 'border-neutral-300 focus:ring-2 focus:ring-[#16a34a]'
                    }`}
                  />
                </div>
                {errors.payout_account && touched.payout_account && (
                  <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.payout_account}
                  </p>
                )}
              </div>
            </div>
          )}

          {form.role === 'seller' && (
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3.5">
              <div className="flex items-start gap-2 text-amber-800">
                <ShieldCheck className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">Seller Verification Required</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Your store details will be reviewed and approved by the admin before your marketplace gear goes live.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1">
                  Shop / Merchant Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Dhaka Sports Gear & Boots"
                    value={form.shop_name}
                    onChange={(e) => handleChange('shop_name', e.target.value)}
                    onBlur={() => handleBlur('shop_name')}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition bg-white ${
                      errors.shop_name && touched.shop_name
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : 'border-neutral-300 focus:ring-2 focus:ring-[#16a34a]'
                    }`}
                  />
                </div>
                {errors.shop_name && touched.shop_name && (
                  <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.shop_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1">
                  Payout Account Details <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. bkash / nagad: 017XXXXXXXX or Bank info"
                    value={form.payout_account}
                    onChange={(e) => handleChange('payout_account', e.target.value)}
                    onBlur={() => handleBlur('payout_account')}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition bg-white ${
                      errors.payout_account && touched.payout_account
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : 'border-neutral-300 focus:ring-2 focus:ring-[#16a34a]'
                    }`}
                  />
                </div>
                {errors.payout_account && touched.payout_account && (
                  <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.payout_account}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
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

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
              Confirm password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                className={`w-full pl-10 pr-11 py-3 rounded-2xl border text-sm font-medium focus:outline-none transition bg-neutral-50/30 ${
                  errors.confirmPassword && touched.confirmPassword
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                    : 'border-neutral-200 focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && touched.confirmPassword && (
              <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={busy}
            className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] disabled:bg-neutral-300 text-white text-sm font-bold shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{busy ? 'Creating account…' : `Sign up as ${form.role.charAt(0).toUpperCase() + form.role.slice(1)}`}</span>
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

      {/* Pending Approval Success Modal */}
      {pendingApprovalModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-neutral-900">
              Application Submitted!
            </h3>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Welcome, <strong className="text-neutral-900">{pendingApprovalModal.name}</strong>! Your account has been registered with the{' '}
              <strong className="text-amber-800 uppercase font-bold">
                {pendingApprovalModal.role}
              </strong>{' '}
              role.
            </p>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Admin Approval in Progress</span>
              </p>
              <p className="text-[11px] text-amber-800">
                Our administrative team is verifying your business details. Once approved, your listings will go live. Meanwhile, you can explore the platform as a player.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setPendingApprovalModal(null);
                navigate('/profile');
              }}
              className="w-full py-3 rounded-2xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Continue to Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
