const express = require('express');
const router = express.Router();
const {
  getStaffApplications,
  getStaffApplicationById,
  verifyDocument,
  rejectDocument,
  requestCorrection,
  approveStaffApplication,
  rejectStaffApplication,
  getAdminDocument
} = require('../controllers/adminApplicationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// All Admin staff application routes require ADMIN role authorization
router.use(authenticate, authorize('ADMIN'));

router.get('/', getStaffApplications);
router.get('/:id', getStaffApplicationById);
router.post('/:id/verify-document', verifyDocument);
router.post('/:id/documents/:documentId/verify', verifyDocument);
router.post('/:id/reject-document', rejectDocument);
router.post('/:id/request-information', requestCorrection);
router.post('/:id/request-correction', requestCorrection);
router.post('/:id/approve', approveStaffApplication);
router.post('/:id/reject', rejectStaffApplication);
router.get('/:id/documents/:documentId', getAdminDocument);

module.exports = router;
