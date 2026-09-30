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
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Lock,
  Store,
  MapPin,
  Clock,
  FileText,
  CreditCard,
  Check,
  X,
  Phone,
  Mail,
  Eye,
  Truck,
  Package,
  AlertCircle,
  EyeOff,
  Power,
  Star,
  Wallet,
  Receipt,
  TrendingUp,
  ArrowUpRight,
  Percent,
  SlidersHorizontal,
  Megaphone,
  Save,
  RotateCcw,
  Info,
  Bell,
  Download,
  MessageSquare,
  Compass,
  Map,
  History,
  Plus,
} from 'lucide-react';
import { exportToCsv } from '../utils/exportCsv';
import { getImageUrl } from '../utils/imageUrl';


export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Active view tab
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'organizers' | 'sellers' | 'turfs' | 'products'

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
  const [editForm, setEditForm] = useState({ name: '', phone: '', is_active: true });
  const [savingEdit, setSavingEdit] = useState(false);

  // Bookings oversight state
  const [bookings, setBookings] = useState([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [bookingPage, setBookingPage] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelBookingModal, setCancelBookingModal] = useState(null); // { id, customer_name, turf_name, reason: '' }

  // Orders oversight state
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [orderPage, setOrderPage] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Turfs catalog governance state
  const [allTurfs, setAllTurfs] = useState([]);
  const [totalTurfs, setTotalTurfs] = useState(0);
  const [loadingTurfs, setLoadingTurfs] = useState(false);
  const [turfSearch, setTurfSearch] = useState('');
  const [turfStatusFilter, setTurfStatusFilter] = useState(''); // '' | 'approved' | 'pending' | 'rejected'
  const [turfActiveFilter, setTurfActiveFilter] = useState(''); // '' | 'true' | 'false'
  const [turfPage, setTurfPage] = useState(0);
  const [selectedTurf, setSelectedTurf] = useState(null);

  // Products catalog governance state
  const [allProducts, setAllProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState(''); // '' | 'approved' | 'pending' | 'rejected'
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productActiveFilter, setProductActiveFilter] = useState(''); // '' | 'true' | 'false'
  const [productPage, setProductPage] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockEditModal, setStockEditModal] = useState(null); // { id, title, stock }

  // Financials & Transaction Ledger state
  const [financials, setFinancials] = useState(null);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [payoutTab, setPayoutTab] = useState('organizers'); // 'organizers' | 'sellers'
  const [transactions, setTransactions] = useState([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [txSearch, setTxSearch] = useState('');
  const [txTargetFilter, setTxTargetFilter] = useState(''); // '' | 'booking' | 'order'
  const [txMethodFilter, setTxMethodFilter] = useState(''); // '' | 'card' | 'sandbox_card' | 'cash'
  const [txStatusFilter, setTxStatusFilter] = useState(''); // '' | 'completed' | 'pending' | 'refunded'
  const [txPurposeFilter, setTxPurposeFilter] = useState(''); // '' | 'full' | 'advance' | 'balance'
  const [txPage, setTxPage] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Platform System Configuration & Operational Settings state
  const [settings, setSettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState({
    commission_rate: 8,
    advance_percentage: 20,
    broadcast_enabled: false,
    broadcast_message: '',
    broadcast_type: 'info',
    maintenance_mode: false,
    support_phone: '',
    support_email: '',
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(null);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [totalAuditLogs, setTotalAuditLogs] = useState(0);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditTargetFilter, setAuditTargetFilter] = useState('');
  const [auditPage, setAuditPage] = useState(0);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);

  // Review Moderation state
  const [reviews, setReviews] = useState([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewTypeFilter, setReviewTypeFilter] = useState('all');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all');
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewPage, setReviewPage] = useState(0);

  // Coverage Zones & Areas state
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [areaModal, setAreaModal] = useState(null); // { mode: 'create'|'edit', area_id, name, city, center_lat, center_lng }
  const [savingArea, setSavingArea] = useState(false);

  // Pending approvals state
  const [pendingOrganizers, setPendingOrganizers] = useState([]);
  const [pendingSellers, setPendingSellers] = useState([]);
  const [pendingTurfs, setPendingTurfs] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Rejection reason modal
  const [rejectModal, setRejectModal] = useState(null); // { type: 'turf'|'product'|'organizer'|'seller', id, name, reason: '' }

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

  // Load all pending approvals
  const fetchPending = useCallback(async () => {
    setLoadingPending(true);
    try {
      const [orgRes, selRes, turfRes, prodRes] = await Promise.all([
        api.get('/admin/pending-organizers'),
        api.get('/admin/pending-sellers'),
        api.get('/admin/pending-turfs'),
        api.get('/admin/pending-products'),
      ]);
      setPendingOrganizers(orgRes.data || []);
      setPendingSellers(selRes.data || []);
      setPendingTurfs(turfRes.data || []);
      setPendingProducts(prodRes.data || []);
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
    } finally {
      setLoadingPending(false);
    }
  }, []);

  // Load platform bookings
  const fetchBookings = useCallback(async () => {
    setLoadingBookings(true);
    setError(null);
    try {
      const params = {
        limit: pageSize,
        offset: bookingPage * pageSize,
      };
      if (bookingSearch.trim()) params.search = bookingSearch.trim();
      if (bookingStatusFilter) params.status = bookingStatusFilter;

      const { data } = await api.get('/admin/bookings', { params });
      setBookings(data.bookings || []);
      setTotalBookings(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load bookings directory');
    } finally {
      setLoadingBookings(false);
    }
  }, [bookingPage, bookingSearch, bookingStatusFilter]);

  // Load platform orders
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setError(null);
    try {
      const params = {
        limit: pageSize,
        offset: orderPage * pageSize,
      };
      if (orderSearch.trim()) params.search = orderSearch.trim();
      if (orderStatusFilter) params.status = orderStatusFilter;

      const { data } = await api.get('/admin/orders', { params });
      setOrders(data.orders || []);
      setTotalOrders(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load marketplace orders');
    } finally {
      setLoadingOrders(false);
    }
  }, [orderPage, orderSearch, orderStatusFilter]);

  useEffect(() => {
    fetchStats();
    fetchPending();
  }, [fetchStats, fetchPending]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [fetchUsers, activeTab]);

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [fetchBookings, activeTab]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [fetchOrders, activeTab]);

  // Load full turfs catalog
  const fetchTurfs = useCallback(async () => {
    setLoadingTurfs(true);
    setError(null);
    try {
      const params = {
        limit: pageSize,
        offset: turfPage * pageSize,
      };
      if (turfSearch.trim()) params.search = turfSearch.trim();
      if (turfStatusFilter) params.status = turfStatusFilter;
      if (turfActiveFilter) params.active = turfActiveFilter;

      const { data } = await api.get('/admin/turfs', { params });
      setAllTurfs(data.turfs || []);
      setTotalTurfs(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load turf venues catalog');
    } finally {
      setLoadingTurfs(false);
    }
  }, [turfPage, turfSearch, turfStatusFilter, turfActiveFilter]);

  // Load full products catalog
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    setError(null);
    try {
      const params = {
        limit: pageSize,
        offset: productPage * pageSize,
      };
      if (productSearch.trim()) params.search = productSearch.trim();
      if (productStatusFilter) params.status = productStatusFilter;
      if (productCategoryFilter) params.category = productCategoryFilter;
      if (productActiveFilter) params.active = productActiveFilter;

      const { data } = await api.get('/admin/products', { params });
      setAllProducts(data.products || []);
      setTotalProducts(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load marketplace catalog');
    } finally {
      setLoadingProducts(false);
    }
  }, [productPage, productSearch, productStatusFilter, productCategoryFilter, productActiveFilter]);

  useEffect(() => {
    if (activeTab === 'turfs') {
      fetchTurfs();
    }
  }, [fetchTurfs, activeTab]);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    }
  }, [fetchProducts, activeTab]);

  // Load financial summary & payout ledgers
  const fetchFinancials = useCallback(async () => {
    setLoadingFinancials(true);
    try {
      const { data } = await api.get('/admin/financials/summary');
      setFinancials(data);
    } catch (err) {
      console.error('Error fetching financial summary:', err);
    } finally {
      setLoadingFinancials(false);
    }
  }, []);

  // Load transaction ledger
  const fetchTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    setError(null);
    try {
      const params = {
        limit: pageSize,
        offset: txPage * pageSize,
      };
      if (txSearch.trim()) params.search = txSearch.trim();
      if (txTargetFilter) params.target = txTargetFilter;
      if (txMethodFilter) params.method = txMethodFilter;
      if (txStatusFilter) params.status = txStatusFilter;
      if (txPurposeFilter) params.purpose = txPurposeFilter;

      const { data } = await api.get('/admin/financials/transactions', { params });
      setTransactions(data.transactions || []);
      setTotalTransactions(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load transaction ledger');
    } finally {
      setLoadingTransactions(false);
    }
  }, [txPage, txSearch, txTargetFilter, txMethodFilter, txStatusFilter, txPurposeFilter]);

  useEffect(() => {
    if (activeTab === 'financials') {
      fetchFinancials();
      fetchTransactions();
    }
  }, [fetchFinancials, fetchTransactions, activeTab]);

  // Load platform settings
  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const { data } = await api.get('/admin/settings');
      if (data && data.settings) {
        setSettings(data.settings);
        setSettingsForm({
          commission_rate: parseFloat(data.settings.commission_rate) || 8,
          advance_percentage: parseFloat(data.settings.advance_percentage) || 20,
          broadcast_enabled: data.settings.broadcast_enabled === 'true' || data.settings.broadcast_enabled === true,
          broadcast_message: data.settings.broadcast_message || '',
          broadcast_type: data.settings.broadcast_type || 'info',
          maintenance_mode: data.settings.maintenance_mode === 'true' || data.settings.maintenance_mode === true,
          support_phone: data.settings.support_phone || '',
          support_email: data.settings.support_email || '',
        });
      }
    } catch (err) {
      console.error('Error fetching platform settings:', err);
      setError(err.response?.data?.error || 'Could not load platform settings');
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [fetchSettings, activeTab]);

  // Load Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    setLoadingAuditLogs(true);
    try {
      const params = {
        limit: pageSize,
        offset: auditPage * pageSize,
      };
      if (auditSearch.trim()) params.search = auditSearch.trim();
      if (auditActionFilter && auditActionFilter !== 'all') params.action = auditActionFilter;
      if (auditTargetFilter && auditTargetFilter !== 'all') params.target_type = auditTargetFilter;

      const { data } = await api.get('/admin/audit-logs', { params });
      setAuditLogs(data.logs || []);
      setTotalAuditLogs(data.total || 0);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoadingAuditLogs(false);
    }
  }, [auditPage, auditSearch, auditActionFilter, auditTargetFilter]);

  // Load Reviews
  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const params = {
        limit: pageSize,
        offset: reviewPage * pageSize,
      };
      if (reviewTypeFilter && reviewTypeFilter !== 'all') params.type = reviewTypeFilter;
      if (reviewRatingFilter && reviewRatingFilter !== 'all') params.rating = reviewRatingFilter;
      if (reviewSearch.trim()) params.search = reviewSearch.trim();

      const { data } = await api.get('/admin/reviews', { params });
      setReviews(data.reviews || []);
      setTotalReviews(data.total || 0);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  }, [reviewPage, reviewTypeFilter, reviewRatingFilter, reviewSearch]);

  // Load Coverage Areas
  const fetchAreas = useCallback(async () => {
    setLoadingAreas(true);
    try {
      const { data } = await api.get('/admin/areas');
      setAreas(data.areas || []);
    } catch (err) {
      console.error('Error fetching coverage areas:', err);
    } finally {
      setLoadingAreas(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
  }, [fetchAuditLogs, activeTab]);

  useEffect(() => {
    if (activeTab === 'reviews') fetchReviews();
  }, [fetchReviews, activeTab]);

  useEffect(() => {
    if (activeTab === 'areas') fetchAreas();
  }, [fetchAreas, activeTab]);

  // Refresh all dashboard data
  function refreshAll() {
    fetchStats();
    fetchPending();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'bookings') fetchBookings();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'turfs') fetchTurfs();
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'financials') {
      fetchFinancials();
      fetchTransactions();
    }
    if (activeTab === 'settings') fetchSettings();
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'reviews') fetchReviews();
    if (activeTab === 'areas') fetchAreas();
  }

  // --- Platform Settings Handlers ---
  async function handleSaveSettings(e) {
    if (e) e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(null);
    setError(null);
    try {
      const payload = {
        commission_rate: Number(settingsForm.commission_rate),
        advance_percentage: Number(settingsForm.advance_percentage),
        broadcast_enabled: settingsForm.broadcast_enabled ? 'true' : 'false',
        broadcast_message: settingsForm.broadcast_message,
        broadcast_type: settingsForm.broadcast_type,
        maintenance_mode: settingsForm.maintenance_mode ? 'true' : 'false',
        support_phone: settingsForm.support_phone,
        support_email: settingsForm.support_email,
      };
      const { data } = await api.patch('/admin/settings', payload);
      setSettings(data.settings);
      setSettingsSuccess('Platform operational settings saved successfully!');
      fetchStats();
      setTimeout(() => setSettingsSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update platform settings');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSavingSettings(false);
    }
  }

  function handleResetSettings() {
    if (settings) {
      setSettingsForm({
        commission_rate: parseFloat(settings.commission_rate) || 8,
        advance_percentage: parseFloat(settings.advance_percentage) || 20,
        broadcast_enabled: settings.broadcast_enabled === 'true' || settings.broadcast_enabled === true,
        broadcast_message: settings.broadcast_message || '',
        broadcast_type: settings.broadcast_type || 'info',
        maintenance_mode: settings.maintenance_mode === 'true' || settings.maintenance_mode === true,
        support_phone: settings.support_phone || '',
        support_email: settings.support_email || '',
      });
      setMessage('Settings form reset to current values.');
      setTimeout(() => setMessage(null), 3000);
    }
  }

  // --- Review Moderation Handler ---
  async function handleDeleteReview(type, id) {
    if (!window.confirm(`Permanently delete this ${type} review? This action cannot be undone.`)) return;
    setActionBusy(true);
    try {
      await api.delete(`/admin/reviews/${type}/${id}`);
      setMessage('Review deleted successfully.');
      fetchReviews();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete review');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionBusy(false);
    }
  }

  // --- Coverage Area Handlers ---
  async function handleSaveArea(e) {
    e.preventDefault();
    if (!areaModal || !areaModal.name.trim()) return;
    setSavingArea(true);
    try {
      if (areaModal.mode === 'create') {
        await api.post('/admin/areas', {
          name: areaModal.name.trim(),
          city: areaModal.city || 'Dhaka',
          center_lat: areaModal.center_lat ? parseFloat(areaModal.center_lat) : null,
          center_lng: areaModal.center_lng ? parseFloat(areaModal.center_lng) : null,
        });
        setMessage(`Coverage zone "${areaModal.name}" added successfully.`);
      } else {
        await api.patch(`/admin/areas/${areaModal.area_id}`, {
          name: areaModal.name.trim(),
          city: areaModal.city || 'Dhaka',
          center_lat: areaModal.center_lat ? parseFloat(areaModal.center_lat) : null,
          center_lng: areaModal.center_lng ? parseFloat(areaModal.center_lng) : null,
        });
        setMessage(`Coverage zone "${areaModal.name}" updated successfully.`);
      }
      setAreaModal(null);
      fetchAreas();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save coverage area');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSavingArea(false);
    }
  }

  async function handleDeleteArea(area) {
    if (!window.confirm(`Delete coverage zone "${area.name}"?`)) return;
    setActionBusy(true);
    try {
      await api.delete(`/admin/areas/${area.area_id}`);
      setMessage(`Zone "${area.name}" removed successfully.`);
      fetchAreas();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete zone');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionBusy(false);
    }
  }

  // --- CSV Export Handlers ---
  function handleExportUsers() {
    exportToCsv(
      'MatchFix_Users_Directory',
      [
        { key: 'user_id', label: 'User ID' },
        { key: 'name', label: 'Full Name' },
        { key: 'email', label: 'Email Address' },
        { key: 'phone', label: 'Phone' },
        { key: 'is_active', label: 'Status', getter: (r) => (r.is_active ? 'Active' : 'Suspended') },
        { key: 'is_admin', label: 'Role', getter: (r) => (r.is_admin ? 'Admin' : 'User') },
        { key: 'created_at', label: 'Registered At', getter: (r) => new Date(r.created_at).toLocaleString('en-GB') },
      ],
      users
    );
  }

  function handleExportBookings() {
    exportToCsv(
      'MatchFix_Pitch_Bookings',
      [
        { key: 'booking_id', label: 'Booking ID' },
        { key: 'customer_name', label: 'Customer Name' },
        { key: 'customer_phone', label: 'Customer Phone' },
        { key: 'turf_name', label: 'Turf Arena' },
        { key: 'slot_date', label: 'Slot Date' },
        { key: 'time_range', label: 'Time Window' },
        { key: 'total_amount', label: 'Total (BDT)' },
        { key: 'advance_amount', label: 'Advance Paid (BDT)' },
        { key: 'cash_balance', label: 'Cash Due (BDT)' },
        { key: 'status', label: 'Booking Status' },
        { key: 'created_at', label: 'Booked On', getter: (r) => new Date(r.created_at).toLocaleString('en-GB') },
      ],
      bookings
    );
  }

  function handleExportOrders() {
    exportToCsv(
      'MatchFix_Marketplace_Orders',
      [
        { key: 'order_id', label: 'Order ID' },
        { key: 'customer_name', label: 'Customer Name' },
        { key: 'delivery_phone', label: 'Contact Phone' },
        { key: 'total_amount', label: 'Total Amount (BDT)' },
        { key: 'payment_method', label: 'Payment Channel' },
        { key: 'status', label: 'Order Status' },
        { key: 'delivery_address', label: 'Shipping Address' },
        { key: 'created_at', label: 'Placed At', getter: (r) => new Date(r.created_at).toLocaleString('en-GB') },
      ],
      orders
    );
  }

  function handleExportTransactions() {
    exportToCsv(
      'MatchFix_Transactions_Ledger',
      [
        { key: 'payment_id', label: 'Payment ID' },
        { key: 'payment_target', label: 'Target Type' },
        { key: 'method', label: 'Channel / Method' },
        { key: 'amount', label: 'Gross Amount (BDT)' },
        { key: 'platform_fee', label: 'Platform Fee (BDT)' },
        { key: 'net_payout', label: 'Net Payout (BDT)' },
        { key: 'status', label: 'Transaction Status' },
        { key: 'customer_name', label: 'Payer Customer' },
        { key: 'organizer_name', label: 'Beneficiary Partner', getter: (r) => r.organizer_name || r.seller_name || '—' },
        { key: 'created_at', label: 'Settled At', getter: (r) => new Date(r.created_at).toLocaleString('en-GB') },
      ],
      transactions
    );
  }

  function handleExportAuditLogs() {
    exportToCsv(
      'MatchFix_Admin_Audit_Trail',
      [
        { key: 'log_id', label: 'Audit ID' },
        { key: 'action', label: 'Action Key' },
        { key: 'admin_name', label: 'Admin Name' },
        { key: 'admin_email', label: 'Admin Email' },
        { key: 'target_type', label: 'Target Type' },
        { key: 'target_id', label: 'Target ID' },
        { key: 'ip_address', label: 'IP Address' },
        { key: 'details', label: 'Action Details', getter: (r) => JSON.stringify(r.details || {}) },
        { key: 'created_at', label: 'Logged At', getter: (r) => new Date(r.created_at).toLocaleString('en-GB') },
      ],
      auditLogs
    );
  }

  // --- Financial & Transaction Admin Actions ---
  async function handleUpdateTransactionStatus(paymentId, newStatus) {
    if (!window.confirm(`Update Transaction #${paymentId} status to "${newStatus}"?`)) return;
    setActionBusy(true);
    try {
      await api.patch(`/admin/financials/transactions/${paymentId}/status`, { status: newStatus });
      setMessage(`Transaction #${paymentId} status updated to "${newStatus}".`);
      if (selectedTransaction && selectedTransaction.payment_id === paymentId) {
        setSelectedTransaction((prev) => ({ ...prev, status: newStatus }));
      }
      fetchTransactions();
      fetchFinancials();
      fetchStats();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update transaction status.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionBusy(false);
    }
  }

  // --- Catalog Governance Actions ---
  async function handleToggleTurfActive(t) {
    const newActive = !t.is_active;
    const confirmMsg = newActive
      ? `Reactivate turf venue "${t.name}"? It will become publicly bookable.`
      : `Suspend turf venue "${t.name}"? It will be hidden from public searches and bookings.`;
    if (!window.confirm(confirmMsg)) return;

    setActionBusy(true);
    try {
      await api.patch(`/admin/turfs/${t.turf_id}/status`, { is_active: newActive });
      setMessage(`Turf "${t.name}" is now ${newActive ? 'active & live' : 'suspended'}.`);
      if (selectedTurf && selectedTurf.turf_id === t.turf_id) {
        setSelectedTurf((prev) => ({ ...prev, is_active: newActive }));
      }
      fetchTurfs();
      fetchStats();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update turf status.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionBusy(false);
    }
  }

  async function handleToggleProductActive(p) {
    const newActive = !p.is_active;
    const confirmMsg = newActive
      ? `Publish product "${p.title}"? It will be visible in the marketplace.`
      : `Delist product "${p.title}"? It will be hidden from the marketplace.`;
    if (!window.confirm(confirmMsg)) return;

    setActionBusy(true);
    try {
      await api.patch(`/admin/products/${p.product_id}/status`, { is_active: newActive });
      setMessage(`Product "${p.title}" is now ${newActive ? 'published & live' : 'delisted'}.`);
      if (selectedProduct && selectedProduct.product_id === p.product_id) {
        setSelectedProduct((prev) => ({ ...prev, is_active: newActive }));
      }
      fetchProducts();
      fetchStats();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update product status.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionBusy(false);
    }
  }

  async function handleSaveStockEdit(e) {
    e.preventDefault();
    if (!stockEditModal) return;
    setActionBusy(true);
    try {
      await api.patch(`/admin/products/${stockEditModal.id}/status`, { stock: stockEditModal.stock });
      setMessage(`Stock for "${stockEditModal.title}" updated to ${stockEditModal.stock}.`);
      if (selectedProduct && selectedProduct.product_id === stockEditModal.id) {
        setSelectedProduct((prev) => ({ ...prev, stock: stockEditModal.stock }));
      }
      setStockEditModal(null);
      fetchProducts();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update stock.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionBusy(false);
    }
  }

  async function handleDeleteTurf(t) {
    if (
      !window.confirm(
        `Permanently delete turf venue "${t.name}" (ID #${t.turf_id})?\n\nThis will permanently purge this venue, fields, and pricing rules. This cannot be undone.`
      )
    )
      return;

    setActionBusy(true);
    try {
      await api.delete(`/admin/turfs/${t.turf_id}`);
      setMessage(`Permanently deleted turf "${t.name}".`);
      fetchTurfs();
      fetchPending();
      fetchStats();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete turf venue.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionBusy(false);
    }
  }

  async function handleDeleteProduct(p) {
    if (
      !window.confirm(
        `Permanently delete product "${p.title}" (ID #${p.product_id})?\n\nThis will remove this listing from the database. This cannot be undone.`
      )
    )
      return;

    setActionBusy(true);
    try {
      await api.delete(`/admin/products/${p.product_id}`);
      setMessage(`Permanently deleted product "${p.title}".`);
      fetchProducts();
      fetchPending();
      fetchStats();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete product.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionBusy(false);
    }
  }

  // --- Booking & Order Admin Actions ---
  async function handleUpdateBookingStatus(bookingId, newStatus, reason = '') {
    setActionBusy(true);
    try {
      await api.patch(`/admin/bookings/${bookingId}/status`, {
        status: newStatus,
        cancel_reason: reason,
      });
      setMessage(`Booking #${bookingId} status updated to "${newStatus}".`);
      setCancelBookingModal(null);
      if (selectedBooking && selectedBooking.booking_id === bookingId) {
        setSelectedBooking((prev) => ({
          ...prev,
          status: newStatus,
          cancel_reason: newStatus === 'cancelled' ? reason : null,
        }));
      }
      fetchBookings();
      fetchStats();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update booking status.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionBusy(false);
    }
  }

  async function handleUpdateOrderStatus(orderId, newStatus) {
    if (!window.confirm(`Update Order #${orderId} status to "${newStatus}"?`)) return;
    setActionBusy(true);
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      setMessage(`Order #${orderId} status updated to "${newStatus}".`);
      if (selectedOrder && selectedOrder.order_id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
      fetchOrders();
      fetchStats();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update order status.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionBusy(false);
    }
  }

  // --- Approval & Rejection Handlers ---
  async function handleApprove(type, id, title) {
    if (!window.confirm(`Approve ${type} for "${title}"?`)) return;
    setActionBusy(true);
    try {
      await api.patch(`/admin/${type}s/${id}/approve`);
      setMessage(`🎉 Successfully approved ${type}: ${title}`);
      refreshAll();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to approve ${type}.`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionBusy(false);
    }
  }

  async function handleConfirmReject() {
    if (!rejectModal) return;
    const { type, id, name, reason } = rejectModal;
    setActionBusy(true);
    try {
      const reasonText = (reason || '').trim() || 'Declined by administration.';
      await api.patch(`/admin/${type}s/${id}/reject`, { reason: reasonText });
      setMessage(`Declined ${type} application: ${name}`);
      setRejectModal(null);
      refreshAll();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to decline ${type}.`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionBusy(false);
    }
  }

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

  // Open Edit Modal
  function startEdit(u) {
    setEditingUser(u);
    setEditForm({
      name: u.name || '',
      phone: u.phone || '',
      is_active: u.is_active,
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

  // Handle Deletion (Permanent Hard Delete from database)
  async function handleDelete(u) {
    if (u.user_id === currentUser.user_id) {
      alert('You cannot delete your own admin account.');
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete user "${u.name}" (ID #${u.user_id}) from the database?\n\nThis will permanently purge this account and cascade delete all associated records (turfs, bookings, products, orders). This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/admin/users/${u.user_id}?hard=true`);
      setMessage(`Permanently deleted user "${u.name}" from database.`);
      fetchUsers();
      fetchStats();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user.');
      setTimeout(() => setError(null), 5000);
    }
  }

  const totalPending =
    (stats?.pending_organizers || 0) +
    (stats?.pending_sellers || 0) +
    (stats?.pending_turfs || 0) +
    (stats?.pending_products || 0);

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
            Monitor real-time system KPIs, approve organizer & merchant submissions, oversee user governance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStats || loadingUsers || loadingPending ? 'animate-spin' : ''}`} />
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

      {/* Pending Verifications Alert Banner */}
      {totalPending > 0 && (
        <div className="mb-8 p-4 rounded-3xl bg-amber-500/10 border border-amber-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-sm flex-shrink-0">
              {totalPending}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-amber-950">
                Action Required: {totalPending} Pending Platform Verifications
              </p>
              <p className="text-[11px] text-amber-800">
                {stats?.pending_organizers || 0} organizers · {stats?.pending_sellers || 0} sellers · {stats?.pending_turfs || 0} turfs · {stats?.pending_products || 0} products awaiting admin approval.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {stats?.pending_organizers > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('organizers')}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition cursor-pointer"
              >
                Review Organizers ({stats.pending_organizers})
              </button>
            )}
            {stats?.pending_sellers > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('sellers')}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition cursor-pointer"
              >
                Review Sellers ({stats.pending_sellers})
              </button>
            )}
            {stats?.pending_turfs > 0 && (
              <button
                type="button"
                onClick={() => {
                  setTurfStatusFilter('pending');
                  setTurfPage(0);
                  setActiveTab('turfs');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition cursor-pointer"
              >
                Review Turfs ({stats.pending_turfs})
              </button>
            )}
            {stats?.pending_products > 0 && (
              <button
                type="button"
                onClick={() => {
                  setProductStatusFilter('pending');
                  setProductPage(0);
                  setActiveTab('products');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition cursor-pointer"
              >
                Review Products ({stats.pending_products})
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        <div
          onClick={() => setActiveTab('financials')}
          className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-neutral-900">
            ৳{stats ? Number(stats.total_revenue).toLocaleString() : '—'}
          </p>
          <span className="text-[10px] text-neutral-400">Completed payments</span>
        </div>

        <div
          onClick={() => setActiveTab('users')}
          className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs hover:border-blue-400 hover:shadow-xs transition cursor-pointer"
        >
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

        <div
          onClick={() => setActiveTab('turfs')}
          className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Turf Arenas</span>
            <Trophy className="w-4 h-4 text-[#16a34a]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-neutral-900">
            {stats ? stats.total_turfs : '—'}
          </p>
          <span className="text-[10px] text-neutral-400">
            {stats?.pending_turfs > 0 ? (
              <strong className="text-amber-600">{stats.pending_turfs} pending approval</strong>
            ) : (
              `${stats?.total_fields || 0} fields operational`
            )}
          </span>
        </div>

        <div
          onClick={() => setActiveTab('bookings')}
          className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs hover:border-purple-400 hover:shadow-xs transition cursor-pointer"
        >
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

        <div
          onClick={() => setActiveTab('products')}
          className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs hover:border-orange-400 hover:shadow-xs transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gear Catalog</span>
            <ShoppingBag className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-neutral-900">
            {stats ? stats.total_products : '—'}
          </p>
          <span className="text-[10px] text-neutral-400">
            {stats?.pending_products > 0 ? (
              <strong className="text-amber-600">{stats.pending_products} pending approval</strong>
            ) : (
              'Products listed'
            )}
          </span>
        </div>

        <div
          onClick={() => setActiveTab('orders')}
          className="p-5 rounded-3xl bg-white border border-neutral-200/90 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition cursor-pointer"
        >
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

      {/* Modern Navigation Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-neutral-200/80 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'users'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200/40 text-inherit">
            {totalUsers}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'bookings'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Calendar className="w-4 h-4 text-purple-400" />
          <span>Pitch Bookings</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200/40 text-inherit">
            {stats?.total_bookings || totalBookings}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Truck className="w-4 h-4 text-emerald-400" />
          <span>Marketplace Orders</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200/40 text-inherit">
            {stats?.total_orders || totalOrders}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('financials')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'financials'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>Financials & Ledger</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200/40 text-inherit">
            ৳{stats ? Number(stats.total_revenue).toLocaleString() : '—'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('organizers')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'organizers'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Pending Organizers</span>
          {pendingOrganizers.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-black animate-pulse">
              {pendingOrganizers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sellers')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'sellers'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Pending Sellers</span>
          {pendingSellers.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-black animate-pulse">
              {pendingSellers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('turfs')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'turfs'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>Turf Arenas</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200/40 text-inherit">
            {stats?.total_turfs || totalTurfs}
          </span>
          {pendingTurfs.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-black animate-pulse" title={`${pendingTurfs.length} pending approval`}>
              {pendingTurfs.length} pending
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'products'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-orange-400" />
          <span>Gear Catalog</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200/40 text-inherit">
            {stats?.total_products || totalProducts}
          </span>
          {pendingProducts.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-black animate-pulse" title={`${pendingProducts.length} pending approval`}>
              {pendingProducts.length} pending
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <span>System Settings</span>
          {settings?.maintenance_mode === 'true' && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black animate-pulse">
              MAINTENANCE
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <History className="w-4 h-4 text-rose-400" />
          <span>Audit Trail</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200/40 text-inherit">
            {totalAuditLogs}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'reviews'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span>Review Moderation</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200/40 text-inherit">
            {totalReviews}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('areas')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'areas'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Compass className="w-4 h-4 text-teal-400" />
          <span>Coverage Zones</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200/40 text-inherit">
            {areas.length}
          </span>
        </button>
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
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

              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(0);
                }}
                className="px-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50 cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="admin">Admins Only</option>
                <option value="organizer">Turf Organizers</option>
                <option value="seller">Gear Sellers</option>
                <option value="customer">Regular Customers</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                className="px-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50 cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              <button
                type="button"
                onClick={handleExportUsers}
                disabled={users.length === 0}
                className="px-3 py-2 rounded-2xl border border-neutral-200 hover:bg-neutral-100 text-xs font-bold text-neutral-700 flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5 text-neutral-500" />
                <span>Export CSV</span>
              </button>
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

                      <td className="py-3 px-3 text-neutral-600 font-medium whitespace-nowrap">
                        {u.phone || '—'}
                      </td>

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

                      <td className="py-3 px-3 text-neutral-500 whitespace-nowrap text-[11px]">
                        {new Date(u.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
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

                          <button
                            type="button"
                            onClick={() => startEdit(u)}
                            title="Edit user details"
                            className="p-1.5 rounded-xl border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

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
      )}

      {/* TAB: PITCH BOOKINGS OVERSIGHT */}
      {activeTab === 'bookings' && (
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-2xs mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-neutral-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span>Pitch Bookings Oversight</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Showing {bookings.length} of {totalBookings} total pitch reservations platform-wide
              </p>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search booking #, customer, turf…"
                  value={bookingSearch}
                  onChange={(e) => {
                    setBookingSearch(e.target.value);
                    setBookingPage(0);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50"
                />
              </div>

              <select
                value={bookingStatusFilter}
                onChange={(e) => {
                  setBookingStatusFilter(e.target.value);
                  setBookingPage(0);
                }}
                className="px-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50 cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="advance_paid">Advance Paid</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                type="button"
                onClick={handleExportBookings}
                disabled={bookings.length === 0}
                className="px-3 py-2 rounded-2xl border border-neutral-200 hover:bg-neutral-100 text-xs font-bold text-neutral-700 flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5 text-neutral-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-3">Booking</th>
                  <th className="pb-3 px-3">Customer</th>
                  <th className="pb-3 px-3">Turf & Pitch</th>
                  <th className="pb-3 px-3">Schedule</th>
                  <th className="pb-3 px-3">Amount & Payment</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loadingBookings ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-400" />
                      <span>Loading platform bookings…</span>
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-400">
                      No bookings match the search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.booking_id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-neutral-900">#{b.booking_id}</span>
                        <p className="text-[10px] text-neutral-400">
                          {new Date(b.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-bold text-neutral-900">{b.customer_name || 'Customer'}</p>
                        <p className="text-[11px] text-neutral-500">{b.customer_phone || b.customer_email || '—'}</p>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-bold text-neutral-900">{b.turf_name || 'Turf Arena'}</p>
                        <p className="text-[11px] text-neutral-500">{b.area_name ? `${b.area_name}, ${b.city || 'Dhaka'}` : 'Dhaka'}</p>
                      </td>

                      <td className="py-3 px-3">
                        {b.slots && b.slots.length > 0 ? (
                          <div>
                            <span className="font-semibold text-neutral-800">
                              {b.slots[0].slot_date}
                            </span>
                            <p className="text-[11px] text-purple-700 font-mono font-medium truncate max-w-[180px]">
                              {b.slots.map((s) => `${s.field_name}: ${s.start_time?.slice(0, 5)}`).join(', ')}
                            </p>
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic">No slot details</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <strong className="text-neutral-900 font-bold">৳{Number(b.total_amount).toLocaleString()}</strong>
                        <div className="text-[10px] text-neutral-500">
                          {b.payment_method === 'cash_advance' ? (
                            <span className="text-blue-600 font-semibold">
                              Adv: ৳{Number(b.advance_amount).toLocaleString()} · Bal: ৳{Number(b.cash_balance).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">Online Paid</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            b.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : b.status === 'advance_paid'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : b.status === 'completed'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : b.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {b.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(b)}
                            title="Inspect Booking Details"
                            className="px-2.5 py-1.5 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>

                          {b.status !== 'cancelled' && b.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() =>
                                setCancelBookingModal({
                                  id: b.booking_id,
                                  customer_name: b.customer_name,
                                  turf_name: b.turf_name,
                                  reason: '',
                                })
                              }
                              title="Force Cancel Reservation"
                              className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalBookings > pageSize && (
            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 mt-4 text-xs font-semibold text-neutral-600">
              <span>
                Showing {bookingPage * pageSize + 1} – {Math.min((bookingPage + 1) * pageSize, totalBookings)} of {totalBookings}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={bookingPage === 0}
                  onClick={() => setBookingPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={(bookingPage + 1) * pageSize >= totalBookings}
                  onClick={() => setBookingPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: MARKETPLACE ORDERS OVERSIGHT */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-2xs mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-neutral-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <span>Marketplace Orders Oversight</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Showing {orders.length} of {totalOrders} total gear shipments across all merchants
              </p>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search order #, customer, address, item…"
                  value={orderSearch}
                  onChange={(e) => {
                    setOrderSearch(e.target.value);
                    setOrderPage(0);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50"
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) => {
                  setOrderStatusFilter(e.target.value);
                  setOrderPage(0);
                }}
                className="px-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50 cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="placed">Placed</option>
                <option value="advance_paid">Advance Paid</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                type="button"
                onClick={handleExportOrders}
                disabled={orders.length === 0}
                className="px-3 py-2 rounded-2xl border border-neutral-200 hover:bg-neutral-100 text-xs font-bold text-neutral-700 flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5 text-neutral-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-3">Order</th>
                  <th className="pb-3 px-3">Customer</th>
                  <th className="pb-3 px-3">Purchased Items</th>
                  <th className="pb-3 px-3">Destination</th>
                  <th className="pb-3 px-3">Financials</th>
                  <th className="pb-3 px-3">Fulfillment Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loadingOrders ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-400" />
                      <span>Loading marketplace orders…</span>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-400">
                      No orders match the search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.order_id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-neutral-900">#{o.order_id}</span>
                        <p className="text-[10px] text-neutral-400">
                          {new Date(o.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-bold text-neutral-900">{o.customer_name || 'Customer'}</p>
                        <p className="text-[11px] text-neutral-500">{o.customer_phone || o.customer_email || '—'}</p>
                      </td>

                      <td className="py-3 px-3">
                        {o.items && o.items.length > 0 ? (
                          <div>
                            <p className="font-bold text-neutral-900 truncate max-w-[200px]">
                              {o.items[0].title}
                              {o.items.length > 1 && (
                                <span className="text-neutral-500 font-normal"> +{o.items.length - 1} more</span>
                              )}
                            </p>
                            <p className="text-[10px] text-neutral-500 truncate max-w-[200px]">
                              Shop: {o.items[0].shop_name || 'Merchant'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic">No item info</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <p className="text-neutral-800 line-clamp-1 max-w-[180px]">{o.delivery_address || '—'}</p>
                        <p className="text-[10px] text-neutral-500">{o.delivery_phone || ''}</p>
                      </td>

                      <td className="py-3 px-3">
                        <strong className="text-neutral-900 font-bold">৳{Number(o.total_amount).toLocaleString()}</strong>
                        <div className="text-[10px] text-neutral-500">
                          {o.payment_method === 'cash_advance' ? (
                            <span className="text-blue-600 font-semibold">
                              Adv: ৳{Number(o.advance_amount).toLocaleString()} · COD: ৳{Number(o.cash_balance).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">Online Paid</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            o.status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : o.status === 'shipped'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : o.status === 'confirmed'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : o.status === 'advance_paid'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : o.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {o.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(o)}
                            title="Inspect Order Details"
                            className="px-2.5 py-1.5 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>

                          {o.status !== 'delivered' && o.status !== 'cancelled' && (
                            <select
                              value={o.status}
                              onChange={(e) => handleUpdateOrderStatus(o.order_id, e.target.value)}
                              className="px-2 py-1 rounded-xl border border-neutral-200 bg-neutral-50 text-[11px] font-semibold text-neutral-700 cursor-pointer"
                            >
                              <option value="placed" disabled>Placed</option>
                              <option value="confirmed">Confirm</option>
                              <option value="shipped">Ship</option>
                              <option value="delivered">Deliver</option>
                              <option value="cancelled">Cancel</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalOrders > pageSize && (
            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 mt-4 text-xs font-semibold text-neutral-600">
              <span>
                Showing {orderPage * pageSize + 1} – {Math.min((orderPage + 1) * pageSize, totalOrders)} of {totalOrders}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={orderPage === 0}
                  onClick={() => setOrderPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={(orderPage + 1) * pageSize >= totalOrders}
                  onClick={() => setOrderPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: FINANCIALS & TRANSACTION LEDGER */}
      {activeTab === 'financials' && (
        <div className="space-y-6 mb-8">
          {/* Financial Overview KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-neutral-200/90 rounded-3xl p-5 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Cash Inflow</span>
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-neutral-900">
                ৳{financials ? Number(financials.summary.total_inflow).toLocaleString() : '—'}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 text-[11px] text-neutral-500">
                <span>Completed Settlements</span>
                <span className="font-bold text-neutral-800">{financials?.summary?.total_transactions || 0} trx</span>
              </div>
            </div>

            <div className="bg-white border border-neutral-200/90 rounded-3xl p-5 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Revenue By Stream</span>
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <div className="space-y-1.5 mt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Pitch Bookings:</span>
                  <span className="font-extrabold text-neutral-900">
                    ৳{financials ? Number(financials.summary.turf_revenue).toLocaleString() : '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Gear Marketplace:</span>
                  <span className="font-extrabold text-neutral-900">
                    ৳{financials ? Number(financials.summary.gear_revenue).toLocaleString() : '0'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-neutral-200/90 rounded-3xl p-5 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Settlement Channels</span>
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <div className="space-y-1 mt-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Online Gateway:</span>
                  <span className="font-bold text-blue-700">
                    ৳{financials ? Number(financials.summary.online_revenue).toLocaleString() : '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Cash / COD:</span>
                  <span className="font-bold text-amber-700">
                    ৳{financials ? Number(financials.summary.cash_revenue).toLocaleString() : '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-neutral-400 pt-0.5">
                  <span>Advance Deposits:</span>
                  <span className="font-semibold text-neutral-700">
                    ৳{financials ? Number(financials.summary.advance_collected).toLocaleString() : '0'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-neutral-200/90 rounded-3xl p-5 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">MatchFix Commission (8%)</span>
                <Percent className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-900">
                ৳{financials ? Number(financials.summary.platform_commission).toLocaleString() : '—'}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 text-[11px]">
                <span className="text-neutral-500">Net Host/Merchant Due</span>
                <span className="font-bold text-emerald-700">
                  ৳{financials ? Number(financials.summary.payout_liability).toLocaleString() : '0'}
                </span>
              </div>
            </div>
          </div>

          {/* Beneficiary Payouts Ledger Table */}
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Beneficiary Payouts & Commission Ledger</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Platform fee breakdown (8% MatchFix take) and net payable disbursements owed to verified hosts and merchants.
                </p>
              </div>

              {/* Toggle Organizers vs Sellers */}
              <div className="inline-flex rounded-2xl bg-neutral-100 p-1 border border-neutral-200/80 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPayoutTab('organizers')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    payoutTab === 'organizers'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Turf Hosts ({financials?.organizer_payouts?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutTab('sellers')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    payoutTab === 'sellers'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Gear Merchants ({financials?.seller_payouts?.length || 0})
                </button>
              </div>
            </div>

            {loadingFinancials ? (
              <div className="py-10 text-center text-neutral-400 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-400" />
                <span>Calculating platform financial ledgers…</span>
              </div>
            ) : payoutTab === 'organizers' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider">
                      <th className="pb-3 px-3">Turf Host Organizer</th>
                      <th className="pb-3 px-3">Contact & Trade Licence</th>
                      <th className="pb-3 px-3">Payout Account</th>
                      <th className="pb-3 px-3">Bookings</th>
                      <th className="pb-3 px-3">Gross Inflow</th>
                      <th className="pb-3 px-3 text-amber-700">Platform Take (8%)</th>
                      <th className="pb-3 px-3 text-emerald-700">Net Payout Due (92%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {financials?.organizer_payouts?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-neutral-400">
                          No organizer payout records available yet.
                        </td>
                      </tr>
                    ) : (
                      financials?.organizer_payouts?.map((o) => (
                        <tr key={o.organizer_id} className="hover:bg-neutral-50/70 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-extrabold text-neutral-900">{o.organizer_name}</span>
                            <span className="block font-mono text-[10px] text-neutral-400">ID #{o.organizer_id}</span>
                          </td>
                          <td className="py-3 px-3 text-neutral-600">
                            <p>{o.organizer_phone || o.organizer_email}</p>
                            <p className="text-[10px] text-neutral-400 font-mono">{o.trade_licence || 'No licence record'}</p>
                          </td>
                          <td className="py-3 px-3">
                            {o.payout_account ? (
                              <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 font-semibold text-[11px]">
                                {o.payout_account}
                              </span>
                            ) : (
                              <span className="text-neutral-400 italic">Not configured</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-semibold text-neutral-800">
                            {o.bookings_count}
                          </td>
                          <td className="py-3 px-3 font-bold text-neutral-900">
                            ৳{Number(o.gross_collected).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 font-bold text-amber-800">
                            ৳{Number(o.platform_fee).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <strong className="font-black text-emerald-700 text-sm">
                              ৳{Number(o.net_payout).toLocaleString()}
                            </strong>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider">
                      <th className="pb-3 px-3">Merchant Store</th>
                      <th className="pb-3 px-3">Owner Contact</th>
                      <th className="pb-3 px-3">Payout Account</th>
                      <th className="pb-3 px-3">Orders</th>
                      <th className="pb-3 px-3">Gross Sales</th>
                      <th className="pb-3 px-3 text-amber-700">Platform Take (8%)</th>
                      <th className="pb-3 px-3 text-emerald-700">Net Payout Due (92%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {financials?.seller_payouts?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-neutral-400">
                          No merchant payout records available yet.
                        </td>
                      </tr>
                    ) : (
                      financials?.seller_payouts?.map((s) => (
                        <tr key={s.seller_id} className="hover:bg-neutral-50/70 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-extrabold text-neutral-900">{s.shop_name}</span>
                            <span className="block font-mono text-[10px] text-neutral-400">ID #{s.seller_id} · {s.seller_name}</span>
                          </td>
                          <td className="py-3 px-3 text-neutral-600">
                            <p>{s.seller_phone || s.seller_email}</p>
                          </td>
                          <td className="py-3 px-3">
                            {s.payout_account ? (
                              <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 font-semibold text-[11px]">
                                {s.payout_account}
                              </span>
                            ) : (
                              <span className="text-neutral-400 italic">Not configured</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-semibold text-neutral-800">
                            {s.orders_count}
                          </td>
                          <td className="py-3 px-3 font-bold text-neutral-900">
                            ৳{Number(s.gross_sales).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 font-bold text-amber-800">
                            ৳{Number(s.platform_fee).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <strong className="font-black text-emerald-700 text-sm">
                              ৳{Number(s.net_payout).toLocaleString()}
                            </strong>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Global Platform Transactions Ledger */}
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <span>Global Transaction Audit Ledger</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Showing {transactions.length} of {totalTransactions} total platform payment transactions
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search trx, customer, turf, shop…"
                    value={txSearch}
                    onChange={(e) => {
                      setTxSearch(e.target.value);
                      setTxPage(0);
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50"
                  />
                </div>

                <select
                  value={txTargetFilter}
                  onChange={(e) => {
                    setTxTargetFilter(e.target.value);
                    setTxPage(0);
                  }}
                  className="px-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50 cursor-pointer"
                >
                  <option value="">All Targets</option>
                  <option value="booking">Pitch Bookings</option>
                  <option value="order">Marketplace Orders</option>
                </select>

                <select
                  value={txMethodFilter}
                  onChange={(e) => {
                    setTxMethodFilter(e.target.value);
                    setTxPage(0);
                  }}
                  className="px-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50 cursor-pointer"
                >
                  <option value="">All Channels</option>
                  <option value="sandbox_card">Online / Card</option>
                  <option value="cash">Cash Settlement</option>
                </select>

                <select
                  value={txStatusFilter}
                  onChange={(e) => {
                    setTxStatusFilter(e.target.value);
                    setTxPage(0);
                  }}
                  className="px-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="refunded">Refunded</option>
                  <option value="failed">Failed</option>
                </select>

                <button
                  type="button"
                  onClick={handleExportTransactions}
                  disabled={transactions.length === 0}
                  className="px-3 py-2 rounded-2xl border border-neutral-200 hover:bg-neutral-100 text-xs font-bold text-neutral-700 flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider">
                    <th className="pb-3 px-3">Transaction</th>
                    <th className="pb-3 px-3">Target Entity</th>
                    <th className="pb-3 px-3">Customer</th>
                    <th className="pb-3 px-3">Beneficiary</th>
                    <th className="pb-3 px-3">Method & Purpose</th>
                    <th className="pb-3 px-3">Amount</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {loadingTransactions ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-neutral-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-400" />
                        <span>Loading platform transactions ledger…</span>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-neutral-400">
                        No transactions match the search and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.payment_id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-neutral-900">#{tx.payment_id}</span>
                          {tx.trx_id && <p className="font-mono text-[10px] text-neutral-400 truncate max-w-[120px]">{tx.trx_id}</p>}
                          <p className="text-[10px] text-neutral-400">
                            {new Date(tx.created_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </td>

                        <td className="py-3 px-3">
                          {tx.payment_target === 'booking' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 text-[10px]">
                              <Calendar className="w-3 h-3" />
                              <span>Booking #{tx.booking_id}</span>
                            </span>
                          ) : tx.payment_target === 'order' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px]">
                              <Truck className="w-3 h-3" />
                              <span>Order #{tx.order_id}</span>
                            </span>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <p className="font-bold text-neutral-900">{tx.customer_name || 'Customer'}</p>
                          <p className="text-[10px] text-neutral-500">{tx.customer_phone || tx.customer_email || '—'}</p>
                        </td>

                        <td className="py-3 px-3">
                          {tx.turf_name ? (
                            <div>
                              <p className="font-bold text-neutral-900 truncate max-w-[150px]">{tx.turf_name}</p>
                              <p className="text-[10px] text-neutral-500">Host: {tx.organizer_name}</p>
                            </div>
                          ) : tx.shop_name ? (
                            <div>
                              <p className="font-bold text-neutral-900 truncate max-w-[150px]">{tx.shop_name}</p>
                              <p className="text-[10px] text-neutral-500">Merchant: {tx.seller_name}</p>
                            </div>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-semibold text-neutral-800 uppercase text-[10px] tracking-wider block">
                            {tx.method?.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-neutral-500 capitalize">
                            {tx.purpose} {tx.is_advance && '• Advance'}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <strong className="text-neutral-900 font-bold">৳{Number(tx.amount).toLocaleString()}</strong>
                          <p className="text-[10px] text-neutral-400">
                            Fee: ৳{Number(tx.platform_fee).toLocaleString()} · Net: ৳{Number(tx.net_payout).toLocaleString()}
                          </p>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              tx.status === 'completed' || tx.status === 'success'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : tx.status === 'refunded'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : tx.status === 'failed'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {tx.status?.toUpperCase()}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedTransaction(tx)}
                              title="Inspect Receipt & Settlement"
                              className="px-2.5 py-1.5 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Details</span>
                            </button>

                            {tx.status === 'completed' && (
                              <button
                                type="button"
                                disabled={actionBusy}
                                onClick={() => handleUpdateTransactionStatus(tx.payment_id, 'refunded')}
                                title="Mark as Refunded"
                                className="px-2 py-1.5 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[10px] font-bold transition cursor-pointer"
                              >
                                Refund
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalTransactions > pageSize && (
              <div className="flex items-center justify-between pt-4 border-t border-neutral-100 mt-4 text-xs font-semibold text-neutral-600">
                <span>
                  Showing {txPage * pageSize + 1} – {Math.min((txPage + 1) * pageSize, totalTransactions)} of {totalTransactions}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={txPage === 0}
                    onClick={() => setTxPage((p) => Math.max(0, p - 1))}
                    className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={(txPage + 1) * pageSize >= totalTransactions}
                    onClick={() => setTxPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PENDING ORGANIZERS */}
      {activeTab === 'organizers' && (
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-2xs mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-neutral-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-emerald-600" />
                <span>Pending Organizer Verification</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Review trade licences and business registration before authorizing turf host privileges.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              {pendingOrganizers.length} Awaiting Review
            </span>
          </div>

          {loadingPending ? (
            <div className="py-12 text-center text-neutral-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-400" />
              <span>Loading pending organizers…</span>
            </div>
          ) : pendingOrganizers.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-neutral-700">All organizer requests have been processed!</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">New organizer signups will appear here for verification.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingOrganizers.map((o) => (
                <div key={o.user_id} className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-neutral-900">{o.name}</h4>
                      <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span>{o.email}</span>
                      </p>
                      <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{o.phone || 'No phone provided'}</span>
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                      Pending
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-neutral-200/80 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-neutral-400" />
                        Trade Licence:
                      </span>
                      <strong className="text-neutral-800 font-mono">{o.trade_licence || 'None'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                        Payout Details:
                      </span>
                      <strong className="text-neutral-800 font-mono">{o.payout_account || 'None'}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => setRejectModal({ type: 'organizer', id: o.user_id, name: o.name, reason: '' })}
                      className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => handleApprove('organizer', o.user_id, o.name)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Organizer</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PENDING SELLERS */}
      {activeTab === 'sellers' && (
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-2xs mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-neutral-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-600" />
                <span>Pending Gear Seller Verification</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Review store credentials and payment accounts before authorizing merchant storefronts.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              {pendingSellers.length} Awaiting Review
            </span>
          </div>

          {loadingPending ? (
            <div className="py-12 text-center text-neutral-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-400" />
              <span>Loading pending sellers…</span>
            </div>
          ) : pendingSellers.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-neutral-700">All merchant requests have been processed!</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">New merchant signups will appear here for verification.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingSellers.map((s) => (
                <div key={s.user_id} className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-blue-600" />
                        <h4 className="font-extrabold text-sm text-neutral-900">{s.shop_name}</h4>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">Owner: {s.name}</p>
                      <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span>{s.email}</span>
                      </p>
                      <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{s.phone || 'No phone provided'}</span>
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                      Pending
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-neutral-200/80 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                        Payout Details:
                      </span>
                      <strong className="text-neutral-800 font-mono">{s.payout_account || 'None'}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => setRejectModal({ type: 'seller', id: s.user_id, name: s.shop_name || s.name, reason: '' })}
                      className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => handleApprove('seller', s.user_id, s.shop_name)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Seller</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: TURF ARENAS CATALOG GOVERNANCE */}
      {activeTab === 'turfs' && (
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-2xs mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-neutral-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>Turf Arenas Catalog & Governance</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Showing {allTurfs.length} of {totalTurfs} total football venues across Dhaka
              </p>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search arena, area, host…"
                  value={turfSearch}
                  onChange={(e) => {
                    setTurfSearch(e.target.value);
                    setTurfPage(0);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50"
                />
              </div>

              <select
                value={turfStatusFilter}
                onChange={(e) => {
                  setTurfStatusFilter(e.target.value);
                  setTurfPage(0);
                }}
                className="px-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50 cursor-pointer"
              >
                <option value="">All Approvals</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending Review</option>
                <option value="rejected">Declined</option>
              </select>

              <select
                value={turfActiveFilter}
                onChange={(e) => {
                  setTurfActiveFilter(e.target.value);
                  setTurfPage(0);
                }}
                className="px-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50 cursor-pointer"
              >
                <option value="">All Visibility</option>
                <option value="true">Active / Live</option>
                <option value="false">Suspended / Hidden</option>
              </select>
            </div>
          </div>

          {/* Pending Alert Notice inside tab if there are pending turfs and filter is not pending */}
          {pendingTurfs.length > 0 && turfStatusFilter !== 'pending' && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  <strong>{pendingTurfs.length} pending turf venue(s)</strong> awaiting administrative verification.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTurfStatusFilter('pending');
                  setTurfPage(0);
                }}
                className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] cursor-pointer"
              >
                Filter Pending Only
              </button>
            </div>
          )}

          {/* Turfs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-3">Arena Venue</th>
                  <th className="pb-3 px-3">Location & Area</th>
                  <th className="pb-3 px-3">Host Organizer</th>
                  <th className="pb-3 px-3">Hourly Rate & Pitches</th>
                  <th className="pb-3 px-3">Bookings & Rating</th>
                  <th className="pb-3 px-3">Approval</th>
                  <th className="pb-3 px-3">Visibility</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loadingTurfs ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-400" />
                      <span>Loading turf venues catalog…</span>
                    </td>
                  </tr>
                ) : allTurfs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-400">
                      No turf venues match the search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  allTurfs.map((t) => (
                    <tr key={t.turf_id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageUrl(
                              t.cover_image,
                              'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=200&q=80'
                            )}
                            alt={t.name}
                            className="w-10 h-10 rounded-xl object-cover bg-neutral-100 flex-shrink-0 border border-neutral-200/60"
                          />
                          <div className="min-w-0">
                            <span className="font-extrabold text-neutral-900 block truncate max-w-[180px]">{t.name}</span>
                            <span className="font-mono text-[10px] text-neutral-400">ID #{t.turf_id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-bold text-neutral-900">{t.area_name}, {t.city || 'Dhaka'}</p>
                        <p className="text-[11px] text-neutral-500 truncate max-w-[180px]">{t.address}</p>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-bold text-neutral-900">{t.organizer_name}</p>
                        <p className="text-[11px] text-neutral-500">{t.organizer_phone || t.organizer_email}</p>
                      </td>

                      <td className="py-3 px-3">
                        <strong className="text-neutral-900 font-bold">৳{Number(t.hourly_rate).toLocaleString()}</strong>
                        <span className="text-[11px] text-neutral-500"> / hr</span>
                        <p className="text-[10px] text-emerald-700 font-semibold">{t.fields_count || 1} pitch field(s)</p>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-bold text-neutral-900">{t.bookings_count || 0} reservations</p>
                        <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{Number(t.rating || 0).toFixed(1)}</span>
                        </p>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            t.approval_status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : t.approval_status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {t.approval_status.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {t.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Suspended</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedTurf(t)}
                            title="Inspect Venue Details"
                            className="px-2.5 py-1.5 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>

                          {t.approval_status === 'pending' && (
                            <>
                              <button
                                type="button"
                                disabled={actionBusy}
                                onClick={() => handleApprove('turf', t.turf_id, t.name)}
                                title="Approve Turf"
                                className="p-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={actionBusy}
                                onClick={() => setRejectModal({ type: 'turf', id: t.turf_id, name: t.name, reason: '' })}
                                title="Decline Turf"
                                className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {t.approval_status === 'approved' && (
                            <button
                              type="button"
                              disabled={actionBusy}
                              onClick={() => handleToggleTurfActive(t)}
                              title={t.is_active ? 'Suspend Turf from public booking' : 'Reactivate Turf for public booking'}
                              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                                t.is_active
                                  ? 'text-neutral-500 hover:text-rose-600 hover:bg-rose-50 border-neutral-200'
                                  : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {t.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={actionBusy}
                            onClick={() => handleDeleteTurf(t)}
                            title="Permanently Delete Turf"
                            className="p-1.5 rounded-xl border border-neutral-200 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer"
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

          {/* Pagination */}
          {totalTurfs > pageSize && (
            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 mt-4 text-xs font-semibold text-neutral-600">
              <span>
                Showing {turfPage * pageSize + 1} – {Math.min((turfPage + 1) * pageSize, totalTurfs)} of {totalTurfs}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={turfPage === 0}
                  onClick={() => setTurfPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={(turfPage + 1) * pageSize >= totalTurfs}
                  onClick={() => setTurfPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: GEAR CATALOG MARKETPLACE GOVERNANCE */}
      {activeTab === 'products' && (
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-2xs mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-neutral-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
                <span>Gear Catalog & Marketplace Governance</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Showing {allProducts.length} of {totalProducts} total sports gear listings across all merchant storefronts
              </p>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search gear, shop, seller…"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setProductPage(0);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50"
                />
              </div>

              <select
                value={productCategoryFilter}
                onChange={(e) => {
                  setProductCategoryFilter(e.target.value);
                  setProductPage(0);
                }}
                className="px-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50 cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="boots">Boots</option>
                <option value="jerseys">Kits & Jerseys</option>
                <option value="balls">Match Balls</option>
                <option value="gloves">Gloves</option>
                <option value="accessories">Accessories</option>
                <option value="training">Training</option>
              </select>

              <select
                value={productStatusFilter}
                onChange={(e) => {
                  setProductStatusFilter(e.target.value);
                  setProductPage(0);
                }}
                className="px-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50 cursor-pointer"
              >
                <option value="">All Approvals</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending Review</option>
                <option value="rejected">Declined</option>
              </select>

              <select
                value={productActiveFilter}
                onChange={(e) => {
                  setProductActiveFilter(e.target.value);
                  setProductPage(0);
                }}
                className="px-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50 cursor-pointer"
              >
                <option value="">All Visibility</option>
                <option value="true">Listed / Public</option>
                <option value="false">Delisted / Hidden</option>
              </select>
            </div>
          </div>

          {/* Pending Alert Notice inside tab if there are pending products and filter is not pending */}
          {pendingProducts.length > 0 && productStatusFilter !== 'pending' && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  <strong>{pendingProducts.length} pending gear listing(s)</strong> awaiting merchant review and catalog authorization.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProductStatusFilter('pending');
                  setProductPage(0);
                }}
                className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] cursor-pointer"
              >
                Filter Pending Only
              </button>
            </div>
          )}

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-3">Product Item</th>
                  <th className="pb-3 px-3">Category & Condition</th>
                  <th className="pb-3 px-3">Merchant Store</th>
                  <th className="pb-3 px-3">Price & Stock</th>
                  <th className="pb-3 px-3">Units Sold</th>
                  <th className="pb-3 px-3">Approval</th>
                  <th className="pb-3 px-3">Visibility</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loadingProducts ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-400" />
                      <span>Loading marketplace gear catalog…</span>
                    </td>
                  </tr>
                ) : allProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-400">
                      No gear listings match the search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  allProducts.map((p) => (
                    <tr key={p.product_id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageUrl(
                              p.cover_image,
                              'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=200&q=80'
                            )}
                            alt={p.title}
                            className="w-10 h-10 rounded-xl object-cover bg-neutral-100 flex-shrink-0 border border-neutral-200/60"
                          />
                          <div className="min-w-0">
                            <span className="font-extrabold text-neutral-900 block truncate max-w-[180px]">{p.title}</span>
                            <span className="font-mono text-[10px] text-neutral-400">ID #{p.product_id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-neutral-800 uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200">
                          {p.category}
                        </span>
                        <p className="text-[10px] text-neutral-500 capitalize mt-1">{p.condition?.replace('_', ' ') || 'New'}</p>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-bold text-neutral-900">{p.shop_name}</p>
                        <p className="text-[11px] text-neutral-500">{p.seller_name}</p>
                      </td>

                      <td className="py-3 px-3">
                        <strong className="text-neutral-900 font-bold">৳{Number(p.price).toLocaleString()}</strong>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {p.stock > 0 ? (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                              {p.stock} units
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded-md">
                              Out of stock
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setStockEditModal({ id: p.product_id, title: p.title, stock: p.stock })}
                            title="Adjust inventory count"
                            className="p-1 rounded-md text-neutral-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-neutral-800">{p.units_sold || 0}</span>
                        <span className="text-[10px] text-neutral-500"> sold</span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            p.approval_status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : p.approval_status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {p.approval_status.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {p.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Listed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3 text-neutral-500" />
                            <span>Delisted</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(p)}
                            title="Inspect Product Details"
                            className="px-2.5 py-1.5 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>

                          {p.approval_status === 'pending' && (
                            <>
                              <button
                                type="button"
                                disabled={actionBusy}
                                onClick={() => handleApprove('product', p.product_id, p.title)}
                                title="Approve Product"
                                className="p-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={actionBusy}
                                onClick={() => setRejectModal({ type: 'product', id: p.product_id, name: p.title, reason: '' })}
                                title="Decline Product"
                                className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {p.approval_status === 'approved' && (
                            <button
                              type="button"
                              disabled={actionBusy}
                              onClick={() => handleToggleProductActive(p)}
                              title={p.is_active ? 'Delist item from public marketplace' : 'Publish item to public marketplace'}
                              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                                p.is_active
                                  ? 'text-neutral-500 hover:text-rose-600 hover:bg-rose-50 border-neutral-200'
                                  : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {p.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={actionBusy}
                            onClick={() => handleDeleteProduct(p)}
                            title="Permanently Delete Product"
                            className="p-1.5 rounded-xl border border-neutral-200 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer"
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

          {/* Pagination */}
          {totalProducts > pageSize && (
            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 mt-4 text-xs font-semibold text-neutral-600">
              <span>
                Showing {productPage * pageSize + 1} – {Math.min((productPage + 1) * pageSize, totalProducts)} of {totalProducts}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={productPage === 0}
                  onClick={() => setProductPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={(productPage + 1) * pageSize >= totalProducts}
                  onClick={() => setProductPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 8: PLATFORM SYSTEM CONFIGURATION & OPERATIONAL SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6 mb-8">
          {/* Header Action Card */}
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-700 uppercase tracking-wider mb-1">
                <SlidersHorizontal className="w-4 h-4 text-cyan-600" />
                <span>System Configuration</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                Platform Operational Parameters
              </h2>
              <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
                Tune system-wide financial models, mandatory deposit thresholds, global broadcast announcements, and platform maintenance controls in real-time.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetSettings}
                disabled={savingSettings || loadingSettings}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
                <span>Discard Changes</span>
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings || loadingSettings}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-black shadow-xs transition disabled:opacity-60 cursor-pointer"
              >
                {savingSettings ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes…</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Save All Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback alerts */}
          {settingsSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{settingsSuccess}</span>
            </div>
          )}

          {loadingSettings && !settings ? (
            <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center text-neutral-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-600" />
              <p className="text-sm font-bold text-neutral-700">Loading platform settings…</p>
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* SECTION 1: FINANCIAL PARAMETERS */}
              <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
                <div className="flex items-start justify-between border-b border-neutral-100 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                      <span>Financial Policy & Settlement Engine</span>
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Configure revenue sharing cuts and mandatory deposit requirements. Changes apply immediately to new bookings and marketplace orders.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold">
                    Commission Model
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Commission Rate Control */}
                  <div className="p-5 rounded-2xl bg-neutral-50/70 border border-neutral-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
                          Platform Commission Fee
                        </label>
                        <p className="text-[11px] text-neutral-500">
                          Percentage deducted by MatchFix from gross transactions
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-neutral-300 font-black text-sm text-neutral-900 shadow-2xs">
                        <input
                          type="number"
                          min="0"
                          max="50"
                          step="0.5"
                          value={settingsForm.commission_rate}
                          onChange={(e) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              commission_rate: Math.min(50, Math.max(0, parseFloat(e.target.value) || 0)),
                            }))
                          }
                          className="w-12 text-right focus:outline-hidden"
                        />
                        <span className="text-neutral-500">%</span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="0.5"
                      value={settingsForm.commission_rate}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          commission_rate: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full accent-neutral-900 cursor-pointer"
                    />

                    <div className="flex justify-between text-[11px] text-neutral-400 font-semibold">
                      <span>0% (Fee Free)</span>
                      <span>Current: {settingsForm.commission_rate}%</span>
                      <span>50% (Max)</span>
                    </div>

                    {/* Dynamic Payout Visualizer */}
                    <div className="p-3.5 rounded-xl bg-white border border-neutral-200 text-xs space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Payout Simulation (৳1,000 Gross)
                      </span>
                      <div className="flex justify-between items-center text-amber-800 font-semibold">
                        <span>MatchFix Take ({settingsForm.commission_rate}%):</span>
                        <span className="font-extrabold">
                          ৳{Math.round(1000 * (settingsForm.commission_rate / 100))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-800 font-semibold pt-1 border-t border-neutral-100">
                        <span>Partner Net Payout ({(100 - settingsForm.commission_rate).toFixed(1)}%):</span>
                        <span className="font-black text-sm">
                          ৳{Math.round(1000 * (1 - settingsForm.commission_rate / 100))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Advance Deposit Control */}
                  <div className="p-5 rounded-2xl bg-neutral-50/70 border border-neutral-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
                          Mandatory Advance Booking Deposit
                        </label>
                        <p className="text-[11px] text-neutral-500">
                          Upfront deposit quota for Cash at Venue / COD reservations
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-neutral-300 font-black text-sm text-neutral-900 shadow-2xs">
                        <input
                          type="number"
                          min="10"
                          max="100"
                          step="1"
                          value={settingsForm.advance_percentage}
                          onChange={(e) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              advance_percentage: Math.min(100, Math.max(10, parseFloat(e.target.value) || 10)),
                            }))
                          }
                          className="w-12 text-right focus:outline-hidden"
                        />
                        <span className="text-neutral-500">%</span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={settingsForm.advance_percentage}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          advance_percentage: parseFloat(e.target.value) || 20,
                        }))
                      }
                      className="w-full accent-neutral-900 cursor-pointer"
                    />

                    <div className="flex justify-between text-[11px] text-neutral-400 font-semibold">
                      <span>10% (Minimum)</span>
                      <span>Current: {settingsForm.advance_percentage}%</span>
                      <span>100% (Full Online)</span>
                    </div>

                    {/* Policy Visualizer */}
                    <div className="p-3.5 rounded-xl bg-white border border-neutral-200 text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Customer Checkout Split
                      </span>
                      <p className="text-neutral-700">
                        Customer pays <strong className="text-neutral-900">{settingsForm.advance_percentage}%</strong> online to secure slot.
                      </p>
                      <p className="text-neutral-500 text-[11px]">
                        The remaining <strong className="text-neutral-900">{100 - settingsForm.advance_percentage}%</strong> is collected directly at venue check-in or delivery.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: GLOBAL BROADCAST ANNOUNCEMENT */}
              <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-amber-500" />
                      <span>Global Broadcast Announcement</span>
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Display an announcement banner across the header of the website to communicate updates or promotions.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        settingsForm.broadcast_enabled
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                          : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                      }`}
                    >
                      {settingsForm.broadcast_enabled ? '● Live Across Platform' : 'Banner Inactive / Off'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          broadcast_enabled: !prev.broadcast_enabled,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        settingsForm.broadcast_enabled ? 'bg-emerald-600' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          settingsForm.broadcast_enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Severity Style Selector */}
                  <div>
                    <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-2">
                      Banner Severity / Visual Theme
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { key: 'info', label: 'Info (Blue)', icon: Info, style: 'border-blue-500 bg-blue-50 text-blue-900' },
                        { key: 'warning', label: 'Warning (Amber)', icon: AlertTriangle, style: 'border-amber-500 bg-amber-50 text-amber-950' },
                        { key: 'success', label: 'Success (Green)', icon: CheckCircle2, style: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
                        { key: 'alert', label: 'Alert (Red)', icon: Megaphone, style: 'border-rose-500 bg-rose-50 text-rose-900' },
                      ].map((t) => {
                        const Icon = t.icon;
                        const isSelected = settingsForm.broadcast_type === t.key;
                        return (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => setSettingsForm((prev) => ({ ...prev, broadcast_type: t.key }))}
                            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                              isSelected
                                ? `${t.style} ring-2 ring-neutral-900 shadow-xs font-black`
                                : 'border-neutral-200 bg-neutral-50/50 text-neutral-600 hover:bg-neutral-100'
                            }`}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Broadcast Message Input */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        Broadcast Announcement Text
                      </label>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {settingsForm.broadcast_message.length}/250 characters
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={250}
                      value={settingsForm.broadcast_message}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          broadcast_message: e.target.value,
                        }))
                      }
                      placeholder="e.g. Grand Weekend Tournament Registration is open! Book early to secure team entry."
                      className="w-full px-4 py-3 rounded-2xl border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 font-medium"
                    />
                  </div>

                  {/* Live Website Preview Card */}
                  <div className="p-4 rounded-2xl bg-neutral-100/70 border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      <span>Live Website Header Preview</span>
                      <span>
                        {settingsForm.broadcast_enabled ? (
                          <span className="text-emerald-700 font-extrabold">Active Render</span>
                        ) : (
                          <span className="text-neutral-400">Simulated (Banner is currently OFF)</span>
                        )}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-2xs transition-all ${
                        settingsForm.broadcast_type === 'info'
                          ? 'bg-blue-600 text-white'
                          : settingsForm.broadcast_type === 'warning'
                          ? 'bg-amber-500 text-neutral-950'
                          : settingsForm.broadcast_type === 'success'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Megaphone className="w-4 h-4 flex-shrink-0 animate-pulse" />
                        <span className="truncate">
                          {settingsForm.broadcast_message || 'Enter an announcement message above to preview it here.'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-black/15 text-[11px] font-mono flex-shrink-0">
                        ✕
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PLATFORM OPERATIONS & SUPPORT */}
              <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    <span>Platform Operations & Support Coordinates</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Official support contact details and system maintenance control switches.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Maintenance Mode Card */}
                  <div
                    className={`p-5 rounded-2xl border transition ${
                      settingsForm.maintenance_mode
                        ? 'bg-rose-50 border-rose-300'
                        : 'bg-neutral-50/70 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle
                            className={`w-4 h-4 ${
                              settingsForm.maintenance_mode ? 'text-rose-600' : 'text-neutral-500'
                            }`}
                          />
                          <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                            Maintenance Mode
                          </h4>
                        </div>
                        <p className="text-xs text-neutral-600 mt-1">
                          When active, the platform notifies visitors that routine upgrades or database maintenance are underway.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            maintenance_mode: !prev.maintenance_mode,
                          }))
                        }
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          settingsForm.maintenance_mode ? 'bg-rose-600' : 'bg-neutral-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            settingsForm.maintenance_mode ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {settingsForm.maintenance_mode && (
                      <div className="mt-3 p-2.5 rounded-xl bg-rose-100/70 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                        <span>Warning: Platform is currently marked in maintenance mode.</span>
                      </div>
                    )}
                  </div>

                  {/* Support Coordinates Card */}
                  <div className="p-5 rounded-2xl bg-neutral-50/70 border border-neutral-200 space-y-3">
                    <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                      Official Customer Support
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-neutral-600 block mb-1">
                          Support Helpline Phone
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            value={settingsForm.support_phone}
                            onChange={(e) =>
                              setSettingsForm((prev) => ({
                                ...prev,
                                support_phone: e.target.value,
                              }))
                            }
                            placeholder="+880 1700-000000"
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-neutral-600 block mb-1">
                          Support Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                          <input
                            type="email"
                            value={settingsForm.support_email}
                            onChange={(e) =>
                              setSettingsForm((prev) => ({
                                ...prev,
                                support_email: e.target.value,
                              }))
                            }
                            placeholder="support@matchfix.dev"
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="p-4 rounded-3xl bg-neutral-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-extrabold">Ready to apply configuration changes?</p>
                    <p className="text-[11px] text-neutral-400">Settings update immediately across active booking & order transactions.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleResetSettings}
                    disabled={savingSettings || loadingSettings}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-neutral-300 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={savingSettings || loadingSettings}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-black transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    {savingSettings ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving…</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Save All Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 9: ADMINISTRATIVE AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-2xs mb-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-neutral-900 flex items-center gap-2">
                <History className="w-5 h-5 text-rose-600" />
                <span>Security & Administrative Audit Trail</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Showing {auditLogs.length} of {totalAuditLogs} total immutable admin action logs platform-wide
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleExportAuditLogs}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-bold text-neutral-700 transition shadow-2xs cursor-pointer"
                title="Export audit logs as CSV"
              >
                <Download className="w-3.5 h-3.5 text-neutral-500" />
                <span>Export Audit CSV</span>
              </button>

              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search admin, target ID, details…"
                  value={auditSearch}
                  onChange={(e) => {
                    setAuditSearch(e.target.value);
                    setAuditPage(0);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-hidden focus:border-neutral-900 bg-neutral-50/50"
                />
              </div>

              <select
                value={auditActionFilter}
                onChange={(e) => {
                  setAuditActionFilter(e.target.value);
                  setAuditPage(0);
                }}
                className="px-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-hidden focus:border-neutral-900 bg-neutral-50/50 cursor-pointer"
              >
                <option value="">All Actions</option>
                <option value="USER_UPDATE">User Updated</option>
                <option value="USER_DELETE">User Deleted</option>
                <option value="TURF_APPROVE">Turf Approved</option>
                <option value="TURF_REJECT">Turf Rejected</option>
                <option value="TURF_STATUS_UPDATE">Turf Status Toggle</option>
                <option value="TURF_DELETE">Turf Deleted</option>
                <option value="PRODUCT_APPROVE">Product Approved</option>
                <option value="PRODUCT_REJECT">Product Rejected</option>
                <option value="PRODUCT_STATUS_UPDATE">Product Stock/Status</option>
                <option value="PRODUCT_DELETE">Product Deleted</option>
                <option value="ORGANIZER_APPROVE">Organizer Approved</option>
                <option value="ORGANIZER_REJECT">Organizer Rejected</option>
                <option value="SELLER_APPROVE">Seller Approved</option>
                <option value="SELLER_REJECT">Seller Rejected</option>
                <option value="BOOKING_STATUS_UPDATE">Booking Status Update</option>
                <option value="ORDER_STATUS_UPDATE">Order Status Update</option>
                <option value="TRANSACTION_STATUS_UPDATE">Transaction Override</option>
                <option value="SETTINGS_UPDATE">Settings Updated</option>
                <option value="AREA_CREATE">Coverage Zone Created</option>
                <option value="AREA_UPDATE">Coverage Zone Updated</option>
                <option value="AREA_DELETE">Coverage Zone Deleted</option>
                <option value="REVIEW_DELETE">Review Deleted</option>
              </select>

              <select
                value={auditTargetFilter}
                onChange={(e) => {
                  setAuditTargetFilter(e.target.value);
                  setAuditPage(0);
                }}
                className="px-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-hidden focus:border-neutral-900 bg-neutral-50/50 cursor-pointer"
              >
                <option value="">All Targets</option>
                <option value="user">User</option>
                <option value="turf">Turf</option>
                <option value="product">Product</option>
                <option value="booking">Booking</option>
                <option value="order">Order</option>
                <option value="transaction">Transaction</option>
                <option value="setting">Setting</option>
                <option value="area">Area Zone</option>
                <option value="turf_review">Turf Review</option>
                <option value="product_review">Product Review</option>
              </select>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200/80 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3">Log ID & Time</th>
                  <th className="pb-3 px-3">Administrator</th>
                  <th className="pb-3 px-3">Action Performed</th>
                  <th className="pb-3 px-3">Target Entity</th>
                  <th className="pb-3 px-3">IP Address</th>
                  <th className="pb-3 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loadingAuditLogs ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-neutral-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-rose-500" />
                      <span>Loading audit trail records…</span>
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-neutral-400">
                      <CheckCircle2 className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-neutral-700">No audit log records found</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Admin actions will be logged here automatically.</p>
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => {
                    const isDanger = log.action.includes('DELETE') || log.action.includes('REJECT');
                    const isSuccess = log.action.includes('APPROVE') || log.action.includes('CREATE');
                    return (
                      <tr key={log.log_id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-neutral-900">#{log.log_id}</span>
                          <span className="block text-[10px] text-neutral-400">
                            {new Date(log.created_at).toLocaleString('en-GB')}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-extrabold text-neutral-900">{log.admin_name}</span>
                          <span className="block text-[10px] text-neutral-400 font-mono">{log.admin_email}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              isDanger
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : isSuccess
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-neutral-800 uppercase text-[11px]">
                            {log.target_type}
                          </span>
                          {log.target_id && (
                            <span className="block font-mono text-[10px] text-neutral-500">ID #{log.target_id}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-neutral-500 text-[11px]">
                          {log.ip_address || '—'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedAuditLog(log)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-[11px] font-bold text-neutral-700 cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3 h-3 text-neutral-500" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalAuditLogs > pageSize && (
            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 text-xs text-neutral-500">
              <span>
                Showing {auditPage * pageSize + 1} to{' '}
                {Math.min((auditPage + 1) * pageSize, totalAuditLogs)} of {totalAuditLogs}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={auditPage === 0}
                  onClick={() => setAuditPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={(auditPage + 1) * pageSize >= totalAuditLogs}
                  onClick={() => setAuditPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 10: CUSTOMER REVIEWS & MODERATION */}
      {activeTab === 'reviews' && (
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-2xs mb-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-neutral-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <span>Customer Reviews & Feedback Moderation</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Inspect player reviews for turf arenas and merchant gear. Delete fraudulent, fake, or abusive submissions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search reviewer, arena, product…"
                  value={reviewSearch}
                  onChange={(e) => {
                    setReviewSearch(e.target.value);
                    setReviewPage(0);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-hidden focus:border-neutral-900 bg-neutral-50/50"
                />
              </div>

              <select
                value={reviewTypeFilter}
                onChange={(e) => {
                  setReviewTypeFilter(e.target.value);
                  setReviewPage(0);
                }}
                className="px-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-hidden focus:border-neutral-900 bg-neutral-50/50 cursor-pointer"
              >
                <option value="all">All Review Types</option>
                <option value="turf">Turf Arenas</option>
                <option value="product">Gear Marketplace</option>
              </select>

              <select
                value={reviewRatingFilter}
                onChange={(e) => {
                  setReviewRatingFilter(e.target.value);
                  setReviewPage(0);
                }}
                className="px-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-hidden focus:border-neutral-900 bg-neutral-50/50 cursor-pointer"
              >
                <option value="all">All Star Ratings</option>
                <option value="5">★★★★★ 5 Stars</option>
                <option value="4">★★★★☆ 4 Stars</option>
                <option value="3">★★★☆☆ 3 Stars</option>
                <option value="2">★★☆☆☆ 2 Stars</option>
                <option value="1">★☆☆☆☆ 1 Star</option>
              </select>
            </div>
          </div>

          {/* Reviews Grid */}
          {loadingReviews ? (
            <div className="py-12 text-center text-neutral-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
              <span>Loading reviews moderation queue…</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">
              <CheckCircle2 className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-neutral-700">No reviews found matching the filters</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Player feedback will appear here as users complete games and purchases.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((r) => (
                <div key={`${r.review_type}_${r.review_id}`} className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              r.review_type === 'turf'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {r.review_type === 'turf' ? 'Turf Arena' : 'Sports Gear'}
                          </span>
                          <span className="font-extrabold text-neutral-900 text-xs truncate max-w-[200px]">
                            {r.target_name}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-neutral-800">
                          {r.customer_name} <span className="font-normal text-neutral-400 font-mono text-[11px]">({r.customer_email})</span>
                        </p>
                      </div>

                      {/* Star Rating */}
                      <div className="flex items-center gap-0.5 bg-white px-2 py-1 rounded-xl border border-neutral-200 shadow-2xs">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Review text */}
                    <p className="text-xs text-neutral-700 bg-white p-3 rounded-xl border border-neutral-200/80 italic leading-relaxed">
                      "{r.comment || 'No written comment provided with rating.'}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 text-[11px] text-neutral-400">
                    <div className="flex items-center gap-2">
                      <span>{new Date(r.created_at).toLocaleDateString('en-GB')}</span>
                      {r.booking_id ? (
                        <span className="font-mono text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                          Booking #{r.booking_id}
                        </span>
                      ) : (
                        <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                          Order #{r.order_id}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => handleDeleteReview(r.review_type, r.review_id)}
                      className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer"
                      title="Remove abusive or fraudulent review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalReviews > pageSize && (
            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 text-xs text-neutral-500">
              <span>
                Showing {reviewPage * pageSize + 1} to{' '}
                {Math.min((reviewPage + 1) * pageSize, totalReviews)} of {totalReviews}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={reviewPage === 0}
                  onClick={() => setReviewPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={(reviewPage + 1) * pageSize >= totalReviews}
                  onClick={() => setReviewPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 11: DHAKA COVERAGE ZONES */}
      {activeTab === 'areas' && (
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-2xs mb-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-neutral-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-teal-600" />
                <span>Dhaka Coverage Zones & Area Directory</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Manage city districts and geographical centers for distance radius searches and arena distribution.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setAreaModal({
                  mode: 'create',
                  name: '',
                  city: 'Dhaka',
                  center_lat: '',
                  center_lng: '',
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add New Coverage Zone</span>
            </button>
          </div>

          {loadingAreas ? (
            <div className="py-12 text-center text-neutral-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
              <span>Loading coverage areas…</span>
            </div>
          ) : areas.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">
              <Compass className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-neutral-700">No coverage zones configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {areas.map((a) => (
                <div key={a.area_id} className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-neutral-900">{a.name}</h4>
                      <p className="text-xs text-neutral-500">{a.city}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-black">
                      {a.turfs_count} {a.turfs_count === 1 ? 'Arena' : 'Arenas'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-neutral-200/80 font-mono text-[11px] text-neutral-600 flex items-center justify-between">
                    <span className="text-neutral-400 text-[10px] uppercase font-bold">GPS Coordinates:</span>
                    <span>
                      {a.center_lat && a.center_lng
                        ? `${Number(a.center_lat).toFixed(4)}, ${Number(a.center_lng).toFixed(4)}`
                        : 'Not calibrated'}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200/60">
                    <button
                      type="button"
                      onClick={() =>
                        setAreaModal({
                          mode: 'edit',
                          area_id: a.area_id,
                          name: a.name,
                          city: a.city,
                          center_lat: a.center_lat || '',
                          center_lng: a.center_lng || '',
                        })
                      }
                      className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-xs font-bold text-neutral-700 cursor-pointer shadow-2xs"
                    >
                      Edit Zone
                    </button>
                    <button
                      type="button"
                      disabled={actionBusy || a.turfs_count > 0}
                      onClick={() => handleDeleteArea(a)}
                      title={
                        a.turfs_count > 0
                          ? `Cannot delete zone while ${a.turfs_count} active turfs are assigned.`
                          : 'Delete coverage zone'
                      }
                      className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* Decline / Rejection Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  Decline {rejectModal.type.charAt(0).toUpperCase() + rejectModal.type.slice(1)} Submission
                </h3>
                <p className="text-xs text-neutral-500">{rejectModal.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Reason for Rejection <span className="text-neutral-400 font-normal">(sent to applicant)</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Incomplete trade licence details or invalid documentation."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 bg-neutral-50/50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionBusy}
                onClick={handleConfirmReject}
                className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {actionBusy ? 'Processing…' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Inspection Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-neutral-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-neutral-900">
                    Booking #{selectedBooking.booking_id}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      selectedBooking.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedBooking.status === 'advance_paid'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : selectedBooking.status === 'completed'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : selectedBooking.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {selectedBooking.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Booked on {new Date(selectedBooking.created_at).toLocaleString('en-GB')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Customer & Turf Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Customer Details</span>
                <p className="font-extrabold text-neutral-900">{selectedBooking.customer_name}</p>
                <p className="text-neutral-600 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-neutral-400" />
                  <span className="truncate">{selectedBooking.customer_email}</span>
                </p>
                <p className="text-neutral-600 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-neutral-400" />
                  <span>{selectedBooking.customer_phone || 'No phone'}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Turf & Organizer</span>
                <p className="font-extrabold text-neutral-900">{selectedBooking.turf_name}</p>
                <p className="text-neutral-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-neutral-400" />
                  <span>{selectedBooking.area_name}, {selectedBooking.city || 'Dhaka'}</span>
                </p>
                <p className="text-neutral-500 text-[11px] truncate">
                  Host: {selectedBooking.organizer_name} ({selectedBooking.organizer_phone || selectedBooking.organizer_email})
                </p>
              </div>
            </div>

            {/* Reserved Slots */}
            <div>
              <h4 className="text-xs font-bold text-neutral-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                <span>Reserved Match Slots</span>
              </h4>
              <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100 text-xs space-y-1.5">
                {selectedBooking.slots && selectedBooking.slots.length > 0 ? (
                  selectedBooking.slots.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between font-mono">
                      <span className="font-bold text-neutral-800">{s.field_name}</span>
                      <span className="text-purple-800 font-semibold">{s.slot_date} · {s.start_time?.slice(0, 5)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-400 italic">No slot records found.</p>
                )}
              </div>
            </div>

            {/* Financials & Breakdown */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Total Booking Amount:</span>
                <strong className="text-neutral-900 font-extrabold text-sm">৳{Number(selectedBooking.total_amount).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center text-neutral-600">
                <span>Payment Method:</span>
                <span className="font-semibold uppercase">{selectedBooking.payment_method}</span>
              </div>
              {selectedBooking.payment_method === 'cash_advance' && (
                <>
                  <div className="flex justify-between items-center text-blue-700">
                    <span>Advance Paid Online:</span>
                    <span className="font-bold">৳{Number(selectedBooking.advance_amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-amber-800">
                    <span>Cash Balance Owed At Venue:</span>
                    <span className="font-bold">৳{Number(selectedBooking.cash_balance).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            {/* Cancellation Reason if cancelled */}
            {selectedBooking.status === 'cancelled' && selectedBooking.cancel_reason && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Cancellation Notice</span>
                </span>
                <p className="text-rose-900 font-medium">{selectedBooking.cancel_reason}</p>
              </div>
            )}

            {/* Admin Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                {selectedBooking.status === 'pending' && (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => handleUpdateBookingStatus(selectedBooking.booking_id, 'confirmed')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm</span>
                  </button>
                )}
                {['confirmed', 'advance_paid'].includes(selectedBooking.status) && (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => handleUpdateBookingStatus(selectedBooking.booking_id, 'completed')}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Completed</span>
                  </button>
                )}
                {selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'completed' && (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => {
                      setCancelBookingModal({
                        id: selectedBooking.booking_id,
                        customer_name: selectedBooking.customer_name,
                        turf_name: selectedBooking.turf_name,
                        reason: '',
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel Reservation</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Prompt Modal */}
      {cancelBookingModal && (
        <div className="fixed inset-0 z-[130] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  Cancel Booking #{cancelBookingModal.id}
                </h3>
                <p className="text-xs text-neutral-500">{cancelBookingModal.turf_name} · {cancelBookingModal.customer_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setCancelBookingModal(null)}
                className="text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Cancellation Reason <span className="text-neutral-400 font-normal">(notified to player & organizer)</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Inclement weather / pitch flooding / schedule dispute resolved."
                value={cancelBookingModal.reason}
                onChange={(e) => setCancelBookingModal({ ...cancelBookingModal, reason: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 bg-neutral-50/50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelBookingModal(null)}
                className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
              >
                Nevermind
              </button>
              <button
                type="button"
                disabled={actionBusy}
                onClick={() =>
                  handleUpdateBookingStatus(
                    cancelBookingModal.id,
                    'cancelled',
                    cancelBookingModal.reason
                  )
                }
                className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {actionBusy ? 'Cancelling…' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Inspection Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-neutral-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-neutral-900">
                    Order #{selectedOrder.order_id}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      selectedOrder.status === 'delivered'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedOrder.status === 'shipped'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : selectedOrder.status === 'confirmed'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : selectedOrder.status === 'advance_paid'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : selectedOrder.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Placed on {new Date(selectedOrder.created_at).toLocaleString('en-GB')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Customer & Shipping Destination */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Customer & Delivery Info</span>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-extrabold text-neutral-900">{selectedOrder.customer_name}</p>
                  <p className="text-neutral-600">{selectedOrder.customer_email}</p>
                  <p className="text-neutral-600">{selectedOrder.customer_phone || 'No phone'}</p>
                </div>
                <div className="text-right max-w-xs">
                  <span className="text-[10px] text-neutral-400 uppercase font-bold">Shipping Address:</span>
                  <p className="font-medium text-neutral-800">{selectedOrder.delivery_address || '—'}</p>
                  {selectedOrder.delivery_phone && (
                    <p className="text-neutral-500 font-mono text-[11px]">Contact: {selectedOrder.delivery_phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Purchased Items List */}
            <div>
              <h4 className="text-xs font-bold text-neutral-700 mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-orange-600" />
                <span>Purchased Items ({selectedOrder.items?.length || 0})</span>
              </h4>
              <div className="border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-100 text-xs">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between bg-white hover:bg-neutral-50/50">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-extrabold text-neutral-900 truncate">{item.title}</p>
                        <p className="text-[11px] text-neutral-500">
                          Category: {item.category} · Shop: {item.shop_name} ({item.seller_name})
                        </p>
                        {item.seller_phone && <p className="text-[10px] text-neutral-400">Seller Phone: {item.seller_phone}</p>}
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <span className="text-neutral-500">{item.qty} × ৳{Number(item.unit_price).toLocaleString()}</span>
                        <p className="font-black text-neutral-900">৳{(item.qty * Number(item.unit_price)).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-neutral-400 italic">No item data</div>
                )}
              </div>
            </div>

            {/* Financials Breakdown */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Total Order Amount:</span>
                <strong className="text-neutral-900 font-extrabold text-sm">৳{Number(selectedOrder.total_amount).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center text-neutral-600">
                <span>Payment Mode:</span>
                <span className="font-semibold uppercase">{selectedOrder.payment_method}</span>
              </div>
              {selectedOrder.payment_method === 'cash_advance' && (
                <>
                  <div className="flex justify-between items-center text-blue-700">
                    <span>Advance Paid Online:</span>
                    <span className="font-bold">৳{Number(selectedOrder.advance_amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-amber-800">
                    <span>Cash on Delivery Due:</span>
                    <span className="font-bold">৳{Number(selectedOrder.cash_balance).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            {/* Admin Status Changer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-700">Override Status:</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleUpdateOrderStatus(selectedOrder.order_id, e.target.value)}
                  disabled={actionBusy}
                  className="px-3 py-1.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-800 bg-white cursor-pointer"
                >
                  <option value="placed">Placed</option>
                  <option value="advance_paid">Advance Paid</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Turf Inspection Modal */}
      {selectedTurf && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-neutral-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-neutral-900">
                    {selectedTurf.name}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      selectedTurf.approval_status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedTurf.approval_status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {selectedTurf.approval_status}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      selectedTurf.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {selectedTurf.is_active ? 'Active' : 'Suspended'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Turf Venue ID #{selectedTurf.turf_id} · Registered {new Date(selectedTurf.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTurf(null)}
                className="text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Banner Cover Image */}
            <div className="w-full h-44 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/80">
              <img
                src={getImageUrl(
                  selectedTurf.cover_image,
                  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'
                )}
                alt={selectedTurf.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Location & Host Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Venue Location</span>
                <p className="font-extrabold text-neutral-900">{selectedTurf.area_name}, {selectedTurf.city || 'Dhaka'}</p>
                <p className="text-neutral-600 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 mt-0.5" />
                  <span>{selectedTurf.address}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Organizer Details</span>
                <p className="font-extrabold text-neutral-900">{selectedTurf.organizer_name}</p>
                <p className="text-neutral-600 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-neutral-400" />
                  <span className="truncate">{selectedTurf.organizer_email}</span>
                </p>
                <p className="text-neutral-600 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-neutral-400" />
                  <span>{selectedTurf.organizer_phone || 'No phone'}</span>
                </p>
                {selectedTurf.trade_licence && (
                  <p className="text-[11px] text-neutral-500 font-mono">Licence: {selectedTurf.trade_licence}</p>
                )}
              </div>
            </div>

            {/* Operational & Pricing stats */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold">Hourly Rate</span>
                <span className="text-sm font-black text-neutral-900">৳{Number(selectedTurf.hourly_rate).toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold">Pitches</span>
                <span className="text-sm font-black text-emerald-700">{selectedTurf.fields_count || 1} fields</span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold">Total Bookings</span>
                <span className="text-sm font-black text-purple-700">{selectedTurf.bookings_count || 0}</span>
              </div>
            </div>

            {/* Description */}
            {selectedTurf.description && (
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">About Venue</span>
                <p className="text-neutral-700 whitespace-pre-line">{selectedTurf.description}</p>
              </div>
            )}

            {/* Rejection Notice if rejected */}
            {selectedTurf.approval_status === 'rejected' && selectedTurf.rejection_reason && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Rejection Reason</span>
                </span>
                <p className="text-rose-900 font-medium">{selectedTurf.rejection_reason}</p>
              </div>
            )}

            {/* Admin Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                {selectedTurf.approval_status === 'pending' && (
                  <>
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => {
                        handleApprove('turf', selectedTurf.turf_id, selectedTurf.name);
                        setSelectedTurf(null);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Venue</span>
                    </button>
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => {
                        setRejectModal({ type: 'turf', id: selectedTurf.turf_id, name: selectedTurf.name, reason: '' });
                        setSelectedTurf(null);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </>
                )}

                {selectedTurf.approval_status === 'approved' && (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => handleToggleTurfActive(selectedTurf)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      selectedTurf.is_active
                        ? 'border border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {selectedTurf.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                    <span>{selectedTurf.is_active ? 'Suspend Turf' : 'Reactivate Turf'}</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => {
                    handleDeleteTurf(selectedTurf);
                    setSelectedTurf(null);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTurf(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Inspection Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-neutral-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-neutral-900">
                    {selectedProduct.title}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      selectedProduct.approval_status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedProduct.approval_status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {selectedProduct.approval_status}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      selectedProduct.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    {selectedProduct.is_active ? 'Listed' : 'Delisted'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Product ID #{selectedProduct.product_id} · Listed {new Date(selectedProduct.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Banner Cover Image */}
            <div className="w-full h-44 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/80 flex items-center justify-center">
              <img
                src={getImageUrl(
                  selectedProduct.cover_image,
                  'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=800&q=80'
                )}
                alt={selectedProduct.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Category & Merchant Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Classification</span>
                <p className="font-extrabold text-neutral-900 uppercase">{selectedProduct.category}</p>
                <p className="text-neutral-600 capitalize">Condition: {selectedProduct.condition?.replace('_', ' ') || 'New'}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Merchant Store</span>
                <p className="font-extrabold text-neutral-900">{selectedProduct.shop_name}</p>
                <p className="text-neutral-600">Owner: {selectedProduct.seller_name}</p>
                <p className="text-neutral-500 text-[11px]">{selectedProduct.seller_phone || selectedProduct.seller_email}</p>
              </div>
            </div>

            {/* Inventory & Pricing Grid */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold">Unit Price</span>
                <span className="text-sm font-black text-neutral-900">৳{Number(selectedProduct.price).toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold">Stock Remaining</span>
                <span className={`text-sm font-black ${selectedProduct.stock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {selectedProduct.stock} units
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                <span className="text-[10px] text-neutral-500 block uppercase font-bold">Units Sold</span>
                <span className="text-sm font-black text-blue-700">{selectedProduct.units_sold || 0}</span>
              </div>
            </div>

            {/* Description */}
            {selectedProduct.description && (
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Description</span>
                <p className="text-neutral-700 whitespace-pre-line">{selectedProduct.description}</p>
              </div>
            )}

            {/* Rejection Notice if rejected */}
            {selectedProduct.approval_status === 'rejected' && selectedProduct.rejection_reason && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Rejection Reason</span>
                </span>
                <p className="text-rose-900 font-medium">{selectedProduct.rejection_reason}</p>
              </div>
            )}

            {/* Admin Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStockEditModal({ id: selectedProduct.product_id, title: selectedProduct.title, stock: selectedProduct.stock })}
                  className="px-3 py-2 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-100 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Stock</span>
                </button>

                {selectedProduct.approval_status === 'pending' && (
                  <>
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => {
                        handleApprove('product', selectedProduct.product_id, selectedProduct.title);
                        setSelectedProduct(null);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Product</span>
                    </button>
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => {
                        setRejectModal({ type: 'product', id: selectedProduct.product_id, name: selectedProduct.title, reason: '' });
                        setSelectedProduct(null);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </>
                )}

                {selectedProduct.approval_status === 'approved' && (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => handleToggleProductActive(selectedProduct)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      selectedProduct.is_active
                        ? 'border border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {selectedProduct.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                    <span>{selectedProduct.is_active ? 'Delist Item' : 'Publish Item'}</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => {
                    handleDeleteProduct(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Edit Modal */}
      {stockEditModal && (
        <div className="fixed inset-0 z-[130] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  Update Stock Inventory
                </h3>
                <p className="text-xs text-neutral-500 truncate max-w-[220px]">{stockEditModal.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setStockEditModal(null)}
                className="text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStockEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Available Units in Warehouse / Shop
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockEditModal.stock}
                  onChange={(e) =>
                    setStockEditModal({
                      ...stockEditModal,
                      stock: Math.max(0, parseInt(e.target.value, 10) || 0),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50"
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  Setting stock to 0 will display the product as 'Out of stock'.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStockEditModal(null)}
                  className="px-4 py-2 rounded-2xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionBusy}
                  className="px-5 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {actionBusy ? 'Saving…' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Inspection Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-neutral-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-neutral-900">
                    Transaction #{selectedTransaction.payment_id}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      selectedTransaction.status === 'completed' || selectedTransaction.status === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedTransaction.status === 'refunded'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {selectedTransaction.status}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Processed on {new Date(selectedTransaction.created_at).toLocaleString('en-GB')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Financials & Payout Split Card */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Payment & Split Calculation</span>
              <div className="flex justify-between items-center text-sm font-extrabold text-neutral-900">
                <span>Gross Amount:</span>
                <span className="text-lg font-black text-neutral-900">৳{Number(selectedTransaction.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-amber-800">
                <span>MatchFix Platform Take (8%):</span>
                <span className="font-bold">৳{Number(selectedTransaction.platform_fee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-800 pt-1 border-t border-neutral-200">
                <span>Net Payable to Beneficiary (92%):</span>
                <span className="font-black text-sm">৳{Number(selectedTransaction.net_payout).toLocaleString()}</span>
              </div>
            </div>

            {/* Transaction Parameters */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                <span className="text-[10px] text-neutral-400 font-bold uppercase">Payment Method</span>
                <p className="font-bold text-neutral-900 uppercase">{selectedTransaction.method?.replace('_', ' ')}</p>
                <p className="text-[11px] text-neutral-500">Purpose: {selectedTransaction.purpose}</p>
                {selectedTransaction.is_advance && (
                  <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                    Advance Payment
                  </span>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                <span className="text-[10px] text-neutral-400 font-bold uppercase">Target Reference</span>
                {selectedTransaction.payment_target === 'booking' ? (
                  <>
                    <p className="font-bold text-purple-700">Pitch Booking #{selectedTransaction.booking_id}</p>
                    <p className="text-[11px] text-neutral-600 truncate">{selectedTransaction.turf_name}</p>
                  </>
                ) : selectedTransaction.payment_target === 'order' ? (
                  <>
                    <p className="font-bold text-emerald-700">Gear Order #{selectedTransaction.order_id}</p>
                    <p className="text-[11px] text-neutral-600 truncate">{selectedTransaction.shop_name}</p>
                  </>
                ) : (
                  <p className="text-neutral-500">Unlinked Target</p>
                )}
              </div>
            </div>

            {/* Customer & Beneficiary Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Payer / Customer</span>
                <p className="font-extrabold text-neutral-900">{selectedTransaction.customer_name || 'Customer'}</p>
                <p className="text-neutral-600 truncate">{selectedTransaction.customer_email || '—'}</p>
                <p className="text-neutral-600">{selectedTransaction.customer_phone || 'No phone'}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Payee Beneficiary</span>
                <p className="font-extrabold text-neutral-900">
                  {selectedTransaction.organizer_name || selectedTransaction.seller_name || 'Partner'}
                </p>
                <p className="text-neutral-600">
                  {selectedTransaction.turf_name || selectedTransaction.shop_name || '—'}
                </p>
                <p className="text-[11px] text-emerald-700 font-mono font-semibold">
                  Payout: {selectedTransaction.organizer_payout || selectedTransaction.seller_payout || 'Not set'}
                </p>
              </div>
            </div>

            {/* Admin Override Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-700">Status:</span>
                <select
                  value={selectedTransaction.status}
                  onChange={(e) => handleUpdateTransactionStatus(selectedTransaction.payment_id, e.target.value)}
                  disabled={actionBusy}
                  className="px-3 py-1.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-800 bg-white cursor-pointer"
                >
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="refunded">Refunded</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Inspection Modal */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-neutral-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-neutral-900">
                    Audit Log #{selectedAuditLog.log_id}
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border bg-neutral-100 text-neutral-800 border-neutral-200">
                    {selectedAuditLog.action}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Logged on {new Date(selectedAuditLog.created_at).toLocaleString('en-GB')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditLog(null)}
                className="text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                <span className="text-[10px] text-neutral-400 font-bold uppercase">Administrator</span>
                <p className="font-bold text-neutral-900">{selectedAuditLog.admin_name || 'Admin'}</p>
                <p className="text-[11px] text-neutral-500 truncate">{selectedAuditLog.admin_email}</p>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1">
                <span className="text-[10px] text-neutral-400 font-bold uppercase">Target Reference</span>
                <p className="font-bold text-neutral-900 capitalize">{selectedAuditLog.target_type || 'System'}</p>
                <p className="text-[11px] text-neutral-500 font-mono">ID: {selectedAuditLog.target_id || 'N/A'}</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-xs space-y-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase">Client IP Address</span>
              <p className="font-mono text-neutral-800">{selectedAuditLog.ip_address || '127.0.0.1'}</p>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Action Metadata / Details</span>
              <pre className="p-3.5 rounded-2xl bg-neutral-900 text-emerald-400 text-[11px] font-mono overflow-x-auto max-h-60 whitespace-pre-wrap">
                {typeof selectedAuditLog.details === 'object'
                  ? JSON.stringify(selectedAuditLog.details, null, 2)
                  : selectedAuditLog.details || 'No additional payload details.'}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setSelectedAuditLog(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coverage Area Zone Create / Edit Modal */}
      {areaModal && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  {areaModal.mode === 'create' ? 'Add Coverage Zone' : 'Edit Coverage Zone'}
                </h3>
                <p className="text-xs text-neutral-500">
                  {areaModal.mode === 'create'
                    ? 'Define a new metropolitan location zone for turfs'
                    : `Zone #${areaModal.area_id} — ${areaModal.name}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAreaModal(null)}
                className="text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveArea} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Area / Neighborhood Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhanmondi, Banani, Uttara"
                  value={areaModal.name}
                  onChange={(e) => setAreaModal({ ...areaModal, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">City / Division</label>
                <input
                  type="text"
                  placeholder="Dhaka"
                  value={areaModal.city || 'Dhaka'}
                  onChange={(e) => setAreaModal({ ...areaModal, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Center Latitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="23.7465"
                    value={areaModal.center_lat ?? ''}
                    onChange={(e) => setAreaModal({ ...areaModal, center_lat: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Center Longitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="90.3760"
                    value={areaModal.center_lng ?? ''}
                    onChange={(e) => setAreaModal({ ...areaModal, center_lng: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-neutral-50/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setAreaModal(null)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingArea || !areaModal.name?.trim()}
                  className="px-6 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {savingArea ? 'Saving...' : areaModal.mode === 'create' ? 'Create Zone' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
