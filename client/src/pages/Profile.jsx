import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

function RoleForm({ title, fields, endpoint, onDone }) {
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
    <form onSubmit={handleSubmit} className="form form-inline">
      <h4>{title}</h4>
      {fields.map((f) => (
        <label key={f.name}>
          {f.label}
          <input
            required={f.required}
            value={values[f.name]}
            onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
          />
        </label>
      ))}
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary" disabled={busy} type="submit">
        {busy ? 'Saving…' : `Become ${title}`}
      </button>
    </form>
  );
}

export default function Profile() {
  const { user, refreshProfile } = useAuth();

  if (!user) return null;

  return (
    <div>
      <h2>Your profile</h2>
      <div className="card">
        <p>
          <strong>{user.name}</strong> — {user.email}
        </p>
        <p className="muted">Phone: {user.phone || '—'}</p>
        <p className="muted">Roles: {user.roles?.length ? user.roles.join(', ') : 'none yet'}</p>
      </div>

      <h3>Add a role</h3>
      <p className="muted">
        One User account can hold every role at once (overlapping specialization) — add whichever ones you need.
      </p>

      <div className="role-grid">
        {!user.organizer && (
          <RoleForm
            title="Organizer"
            endpoint="/users/me/roles/organizer"
            fields={[
              { name: 'trade_licence', label: 'Trade licence' },
              { name: 'payout_account', label: 'Payout account' },
            ]}
            onDone={refreshProfile}
          />
        )}
        {!user.seller && (
          <RoleForm
            title="Seller"
            endpoint="/users/me/roles/seller"
            fields={[
              { name: 'shop_name', label: 'Shop name', required: true },
              { name: 'payout_account', label: 'Payout account' },
            ]}
            onDone={refreshProfile}
          />
        )}
        {!user.customer && (
          <RoleForm
            title="Customer"
            endpoint="/users/me/roles/customer"
            fields={[{ name: 'default_address', label: 'Default address' }]}
            onDone={refreshProfile}
          />
        )}
      </div>

      {user.organizer && (
        <div className="card">
          <h4>Organizer profile</h4>
          <p className="muted">Trade licence: {user.organizer.trade_licence || '—'}</p>
          <p className="muted">Payout account: {user.organizer.payout_account || '—'}</p>
        </div>
      )}
      {user.seller && (
        <div className="card">
          <h4>Seller profile</h4>
          <p className="muted">Shop name: {user.seller.shop_name}</p>
          <p className="muted">Payout account: {user.seller.payout_account || '—'}</p>
        </div>
      )}
      {user.customer && (
        <div className="card">
          <h4>Customer profile</h4>
          <p className="muted">Default address: {user.customer.default_address || '—'}</p>
        </div>
      )}
    </div>
  );
}
