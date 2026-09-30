const router = require('express').Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  getStats,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  listPendingOrganizers,
  listPendingSellers,
  listPendingTurfs,
  listPendingProducts,
  approveOrganizer,
  rejectOrganizer,
  approveSeller,
  rejectSeller,
  approveTurf,
  rejectTurf,
  approveProduct,
  rejectProduct,
  deleteTurf,
  deleteProduct,
  listAllBookings,
  updateBookingStatus,
  listAllOrders,
  updateAdminOrderStatus,
  listAllTurfs,
  updateTurfStatus,
  listAllProducts,
  updateProductStatus,
  getFinancialSummary,
  listTransactions,
  updateTransactionStatus,
  getPlatformSettings,
  updatePlatformSettings,
  listAuditLogs,
  listReviews,
  deleteReview,
  listAreas,
  createArea,
  updateArea,
  deleteArea,
} = require('../controllers/admin.controller');

// All admin endpoints require authentication and is_admin === true
router.use(requireAuth, requireAdmin);

router.get('/stats', getStats);
router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Operational Oversight: Bookings
router.get('/bookings', listAllBookings);
router.patch('/bookings/:id/status', updateBookingStatus);

// Operational Oversight: Orders
router.get('/orders', listAllOrders);
router.patch('/orders/:id/status', updateAdminOrderStatus);

// Catalog Governance: Turfs & Products
router.get('/turfs', listAllTurfs);
router.patch('/turfs/:id/status', updateTurfStatus);
router.get('/products', listAllProducts);
router.patch('/products/:id/status', updateProductStatus);

// Financials & Commission Ledger
router.get('/financials/summary', getFinancialSummary);
router.get('/financials/transactions', listTransactions);
router.patch('/financials/transactions/:id/status', updateTransactionStatus);

// Platform System Configuration & Operational Settings
router.get('/settings', getPlatformSettings);
router.patch('/settings', updatePlatformSettings);

// Security & Audit Logs
router.get('/audit-logs', listAuditLogs);

// Review Moderation
router.get('/reviews', listReviews);
router.delete('/reviews/:type/:id', deleteReview);

// Coverage Zones & Areas
router.get('/areas', listAreas);
router.post('/areas', createArea);
router.patch('/areas/:id', updateArea);
router.delete('/areas/:id', deleteArea);

// Pending approvals
router.get('/pending-organizers', listPendingOrganizers);
router.get('/pending-sellers', listPendingSellers);
router.get('/pending-turfs', listPendingTurfs);
router.get('/pending-products', listPendingProducts);

// Approval actions
router.patch('/organizers/:id/approve', approveOrganizer);
router.patch('/organizers/:id/reject', rejectOrganizer);
router.patch('/sellers/:id/approve', approveSeller);
router.patch('/sellers/:id/reject', rejectSeller);
router.patch('/turfs/:id/approve', approveTurf);
router.patch('/turfs/:id/reject', rejectTurf);
router.patch('/products/:id/approve', approveProduct);
router.patch('/products/:id/reject', rejectProduct);

// Deletions
router.delete('/turfs/:id', deleteTurf);
router.delete('/products/:id', deleteProduct);

module.exports = router;

