import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Users,
  Trophy,
  ShoppingBag,
  Calendar,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  ShieldAlert,
  ArrowUpDown,
  Lock,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users directory state
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 25;

  // Selected user for editing modal
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', is_active: true, is_admin: false });
  const [savingEdit, setSavingEdit] = useState(false);

  // Feedback notifications
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Load KPI stats
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Load users directory
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setError(null);
    try {
      const params = {
        limit: pageSize,
        offset: page * pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load users directory');
    } finally {
      setLoadingUsers(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Quick Status Toggle (Active / Inactive)
  async function handleToggleStatus(u) {
    if (u.user_id === currentUser.user_id) {
      alert('You cannot deactivate your own admin account.');
      return;
    }
    const newStatus = !u.is_active;
    const confirmMsg = newStatus
      ? `Reactivate account for ${u.name}?`
      : `Deactivate account for ${u.name}? They will not be able to log in.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.patch(`/admin/users/${u.user_id}`, { is_active: newStatus });
      setMessage(`User ${u.name} is now ${newStatus ? 'active' : 'deactivated'}.`);
      fetchUsers();
      fetchStats();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user status.');
      setTimeout(() => setError(null), 5000);
    }
  }

  // Handle Toggle Admin Rights
  async function handleToggleAdmin(u) {
    if (u.user_id === currentUser.user_id) {
      alert('You cannot revoke your own admin rights.');
      return;
    }
    const newAdmin = !u.is_admin;
    const confirmMsg = newAdmin
      ? `Grant Admin privileges to ${u.name}?`
      : `Revoke Admin privileges from ${u.name}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.patch(`/admin/users/${u.user_id}`, { is_admin: newAdmin });
      setMessage(`Admin privileges ${newAdmin ? 'granted to' : 'revoked from'} ${u.name}.`);
      fetchUsers();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update admin role.');
      setTimeout(() => setError(null), 5000);
    }
  }

  // Open Edit Modal
  function startEdit(u) {
    setEditingUser(u);
    setEditForm({
      name: u.name || '',
      phone: u.phone || '',
      is_active: u.is_active,
      is_admin: u.is_admin,
    });
  }

  // Save Edit Modal
  async function saveEdit(e) {
    e.preventDefault();
    if (!editingUser) return;
    setSavingEdit(true);
    try {
      await api.patch(`/admin/users/${editingUser.user_id}`, editForm);
      setMessage(`Updated ${editForm.name} successfully.`);
      setEditingUser(null);
      fetchUsers();
      fetchStats();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save user changes.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSavingEdit(false);
    }
  }

  // Handle Deletion (Soft by default, prompt for Hard delete)
  async function handleDelete(u) {
    if (u.user_id === currentUser.user_id) {
      alert('You cannot delete your own admin account.');
      return;
    }
    const hard = window.confirm(
      `Do you want to permanently HARD delete ${u.name}? Click OK for Permanent Deletion, or Cancel to just Deactivate.`
    );

    try {
      await api.delete(`/admin/users/${u.user_id}?hard=${hard ? 'true' : 'false'}`);
      setMessage(hard ? `Permanently deleted ${u.name}.` : `Deactivated ${u.name}.`);
      fetchUsers();
      fetchStats();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user.');
      setTimeout(() => setError(null), 5000);
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>MatchFix Master Console</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Platform Administration
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-500">
            Monitor real-time system KPIs, oversee user accounts, and enforce platform governance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchStats();
              fetchUsers();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(loadingStats || loadingUsers) ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
          <div className="px-3 py-1.5 rounded-full bg-amber-100/70 border border-amber-300 text-amber-800 text-xs font-extrabold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Admin Clearance</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-neutral-900">
            ৳{stats ? Number(stats.total_revenue).toLocaleString() : '—'}
          </p>
          <span className="text-[10px] text-neutral-400">Completed payments</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-neutral-900">
            {stats ? stats.total_users : '—'}
          </p>
          <span className="text-[10px] text-neutral-400">
            {stats ? `${stats.active_users} active accounts` : ''}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Turf Arenas</span>
            <Trophy className="w-4 h-4 text-[#16a34a]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-neutral-900">
            {stats ? stats.total_turfs : '—'}
          </p>
          <span className="text-[10px] text-neutral-400">
            {stats ? `${stats.total_fields} fields operational` : ''}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pitch Bookings</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-neutral-900">
            {stats ? stats.total_bookings : '—'}
          </p>
          <span className="text-[10px] text-neutral-400">
            {stats ? `${stats.confirmed_bookings} confirmed` : ''}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gear Catalog</span>
            <ShoppingBag className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-neutral-900">
            {stats ? stats.total_products : '—'}
          </p>
          <span className="text-[10px] text-neutral-400">Products for sale</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Store Orders</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-neutral-900">
            {stats ? stats.total_orders : '—'}
          </p>
          <span className="text-[10px] text-neutral-400">Merchant shipments</span>
        </div>
      </div>

      {/* Directory Section Header & Filter Controls */}
      <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-2xs mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-neutral-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-neutral-700" />
              <span>User Directory & Permission Control</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Showing {users.length} of {totalUsers} total registered accounts
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email, phone…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="w-full pl-9 pr-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50"
            >
              <option value="">All Roles</option>
              <option value="admin">Admins Only</option>
              <option value="organizer">Turf Organizers</option>
              <option value="seller">Gear Sellers</option>
              <option value="customer">Regular Customers</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider">
                <th className="pb-3 px-3">User</th>
                <th className="pb-3 px-3">Contact</th>
                <th className="pb-3 px-3">Holdings / Roles</th>
                <th className="pb-3 px-3">Clearance</th>
                <th className="pb-3 px-3">Account Status</th>
                <th className="pb-3 px-3">Joined</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loadingUsers ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-400" />
                    <span>Loading user accounts…</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    No users match the search and filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-neutral-50/70 transition-colors">
                    {/* User Identity */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                          {u.name?.slice(0, 1) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-neutral-900 truncate flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u.user_id === currentUser.user_id && (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded-full">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-neutral-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-3 text-neutral-600 font-medium whitespace-nowrap">
                      {u.phone || '—'}
                    </td>

                    {/* Roles Badges */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map((r) => (
                            <span
                              key={r}
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                r === 'organizer'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : r === 'seller'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                              }`}
                            >
                              {r}
                            </span>
                          ))
                        ) : (
                          <span className="text-neutral-400 text-[11px]">User</span>
                        )}
                      </div>
                    </td>

                    {/* Clearance / Admin badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {u.is_admin ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-full">
                          <Shield className="w-3 h-3 text-amber-600" />
                          <span>Admin</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-neutral-500">Regular</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Deactivated</span>
                        </span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="py-3 px-3 text-neutral-500 whitespace-nowrap text-[11px]">
                      {new Date(u.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {/* Toggle Active status */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          disabled={u.user_id === currentUser.user_id}
                          title={u.is_active ? 'Deactivate account' : 'Reactivate account'}
                          className={`p-1.5 rounded-xl border transition cursor-pointer ${
                            u.is_active
                              ? 'text-neutral-500 hover:text-rose-600 hover:bg-rose-50 border-neutral-200'
                              : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                          } ${u.user_id === currentUser.user_id ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                          {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>

                        {/* Toggle Admin rights */}
                        <button
                          type="button"
                          onClick={() => handleToggleAdmin(u)}
                          disabled={u.user_id === currentUser.user_id}
                          title={u.is_admin ? 'Revoke admin rights' : 'Promote to admin'}
                          className={`p-1.5 rounded-xl border transition cursor-pointer ${
                            u.is_admin
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                              : 'text-neutral-500 hover:text-amber-700 hover:bg-amber-50 border-neutral-200'
                          } ${u.user_id === currentUser.user_id ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit details */}
                        <button
                          type="button"
                          onClick={() => startEdit(u)}
                          title="Edit user details"
                          className="p-1.5 rounded-xl border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete user */}
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          disabled={u.user_id === currentUser.user_id}
                          title="Delete user"
                          className={`p-1.5 rounded-xl border border-neutral-200 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer ${
                            u.user_id === currentUser.user_id ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalUsers > pageSize && (
          <div className="flex items-center justify-between pt-4 border-t border-neutral-100 mt-4 text-xs font-semibold text-neutral-600">
            <span>
              Showing {page * pageSize + 1} – {Math.min((page + 1) * pageSize, totalUsers)} of {totalUsers}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={(page + 1) * pageSize >= totalUsers}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">Edit User Account</h3>
                <p className="text-xs text-neutral-500">ID #{editingUser.user_id} · {editingUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Full Name</label>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Phone Number</label>
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50"
                  placeholder="+8801..."
                />
              </div>

              <div className="pt-2 border-t border-neutral-100 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    disabled={editingUser.user_id === currentUser.user_id}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-neutral-800">Account is Active</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_admin}
                    onChange={(e) => setEditForm({ ...editForm, is_admin: e.target.checked })}
                    disabled={editingUser.user_id === currentUser.user_id}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-neutral-800">Super Admin Privileges</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
