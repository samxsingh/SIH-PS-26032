const express = require('express');
const router = express.Router();
const {
  getOverview,
  getCentresList,
  getDistricts,
  getProcurementAnalytics,
  getPaymentAnalytics,
  getAlerts,
  getAuditLogs,
  getReconciliation,
  provisionStaff,
  reassignCentreHead,
  getCentreStaffList
} = require('../controllers/adminController');
const { validateStaffProvision } = require('../validators/authValidator');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// All Admin routes require ADMIN role authorization
router.use(authenticate, authorize('ADMIN'));

router.get('/overview', getOverview);
router.get('/centres', getCentresList);
router.get('/centres/:centreId/staff', getCentreStaffList);
router.patch('/centres/:centreId/reassign-head', reassignCentreHead);
router.get('/districts', getDistricts);
router.get('/procurement', getProcurementAnalytics);
router.get('/payments', getPaymentAnalytics);
router.get('/alerts', getAlerts);
router.get('/audit-logs', getAuditLogs);
router.get('/reconciliation', getReconciliation);
router.post('/staff', validateStaffProvision, provisionStaff);

module.exports = router;
