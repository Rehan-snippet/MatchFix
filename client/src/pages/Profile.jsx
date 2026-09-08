import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  User,
  ShieldCheck,
  Trophy,
  Store,
  ShoppingBag,
  Mail,
  Phone,
  CheckCircle2,
  PlusCircle,
  CreditCard,
  MapPin,
  FileText,
} from 'lucide-react';

function RoleForm({ title, icon: Icon, description, fields, endpoint, onDone }) {
  const [values, setValues] = useState(Object.fromEntries(fields.map((f) => [f.name, ''])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post(endpoint, values);
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[#16a34a]">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-base text-neutral-900">Become {title}</h4>
          <p className="text-xs text-neutral-500">{description}</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 pt-2">
        {fields.map((f) => (
          <div key={f.name}>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              {f.label} {f.required && <span className="text-rose-500">*</span>}
            </label>
            <input
              required={f.required}
              placeholder={f.placeholder || ''}
              value={values[f.name]}
              onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16a34a] bg-neutral-50/50"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs transition active:scale-98 cursor-pointer"
        >
          {busy ? 'Activating…' : `Activate ${title} Role`}
        </button>
      </form>
    </div>
  );
}

export default function Profile() {
  const { user, refreshProfile } = useAuth();

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'MF';

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-[#16a34a] uppercase tracking-wider mb-1.5">
          <User className="w-3.5 h-3.5" />
          <span>MatchFix Account Settings</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
          Personal Profile
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-neutral-500">
          Manage your overlapping platform roles, contact information, and payout settings.
        </p>
      </div>

      {/* Main Profile Identity Card */}
      <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xs mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-neutral-900 text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-sm">
            {initials}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900">{user.name}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                <span>{user.email}</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                <span>{user.phone || 'No phone added'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Roles Tags */}
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {user.roles?.map((r) => (
            <span
              key={r}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold capitalize bg-green-50 text-[#16a34a] border border-green-200 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{r}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Active Profiles Details */}
      <div className="mb-10">
        <h3 className="text-lg font-extrabold text-neutral-900 mb-4">Active Role Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer */}
          {user.customer && (
            <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#16a34a]" />
                  <h4 className="font-bold text-sm text-neutral-900">Player & Customer</h4>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-green-50 text-[#16a34a] text-[10px] font-bold">
                  Active
                </span>
              </div>
              <div className="text-xs text-neutral-600 space-y-1">
                <p className="font-medium text-neutral-500">Default Delivery Address:</p>
                <p className="font-semibold text-neutral-800">
                  {user.customer.default_address || 'Not specified'}
                </p>
              </div>
            </div>
          )}

          {/* Organizer */}
          {user.organizer && (
            <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#16a34a]" />
                  <h4 className="font-bold text-sm text-neutral-900">Turf Host & Organizer</h4>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-green-50 text-[#16a34a] text-[10px] font-bold">
                  Active
                </span>
              </div>
              <div className="text-xs text-neutral-600 space-y-1">
                <p className="text-neutral-500">
                  Trade Licence:{' '}
                  <strong className="text-neutral-800">
                    {user.organizer.trade_licence || 'Verified'}
                  </strong>
                </p>
                <p className="text-neutral-500">
                  Payout Account:{' '}
                  <strong className="text-neutral-800">
                    {user.organizer.payout_account || 'Default'}
                  </strong>
                </p>
              </div>
            </div>
          )}

          {/* Seller */}
          {user.seller && (
            <div className="p-6 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#16a34a]" />
                  <h4 className="font-bold text-sm text-neutral-900">Gear Merchant</h4>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-green-50 text-[#16a34a] text-[10px] font-bold">
                  Active
                </span>
              </div>
              <div className="text-xs text-neutral-600 space-y-1">
                <p className="text-neutral-500">
                  Shop Name:{' '}
                  <strong className="text-neutral-800">{user.seller.shop_name}</strong>
                </p>
                <p className="text-neutral-500">
                  Payout Account:{' '}
                  <strong className="text-neutral-800">
                    {user.seller.payout_account || 'Default'}
                  </strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add New Roles (Overlapping Specialization) */}
      {(!user.organizer || !user.seller || !user.customer) && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-extrabold text-neutral-900">
              Expand Your Permissions
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              One account can hold all three roles at once. Activate additional roles below with no separate logins required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {!user.customer && (
              <RoleForm
                title="Customer"
                icon={ShoppingBag}
                description="Book turfs and order gear"
                endpoint="/users/me/roles/customer"
                fields={[
                  {
                    name: 'default_address',
                    label: 'Default Delivery Address',
                    placeholder: 'Dhanmondi, Dhaka',
                  },
                ]}
                onDone={refreshProfile}
              />
            )}

            {!user.organizer && (
              <RoleForm
                title="Organizer"
                icon={Trophy}
                description="List & manage turf fields"
                endpoint="/users/me/roles/organizer"
                fields={[
                  {
                    name: 'trade_licence',
                    label: 'Trade Licence ID',
                    placeholder: 'TL-89210',
                  },
                  {
                    name: 'payout_account',
                    label: 'bKash / Nagad / Bank Account',
                    placeholder: '017XXXXXXXX',
                  },
                ]}
                onDone={refreshProfile}
              />
            )}

            {!user.seller && (
              <RoleForm
                title="Seller"
                icon={Store}
                description="Sell boots & football gear"
                endpoint="/users/me/roles/seller"
                fields={[
                  {
                    name: 'shop_name',
                    label: 'Shop / Store Name',
                    required: true,
                    placeholder: 'KickZone Sports',
                  },
                  {
                    name: 'payout_account',
                    label: 'Merchant Payout Account',
                    placeholder: '018XXXXXXXX',
                  },
                ]}
                onDone={refreshProfile}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
