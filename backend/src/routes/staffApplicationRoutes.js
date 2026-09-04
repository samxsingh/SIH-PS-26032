const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/uploadMiddleware');
const {
  submitStaffApplication,
  getApplicationStatus,
  getMyApplication,
  resubmitDocuments,
  getDocument
} = require('../controllers/staffApplicationController');
const { optionalAuthenticate } = require('../middleware/authMiddleware');

// Submit staff application (supports both JSON body and multipart file uploads)
router.post('/', upload.any(), submitStaffApplication);

// Get my application
router.get('/me', optionalAuthenticate, getMyApplication);

// Check application status
router.get('/status/:id', getApplicationStatus);
router.get('/:id', getApplicationStatus);

// Resubmit correction documents
router.post('/:id/documents', upload.any(), resubmitDocuments);

// Secure Document Retrieval
router.get('/:id/documents/:documentId', optionalAuthenticate, getDocument);

module.exports = router;
