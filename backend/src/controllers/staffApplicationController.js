const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const StaffRegistrationApplication = require('../models/StaffRegistrationApplication');
const { inMemoryApplications } = require('../models/StaffRegistrationApplication');
const User = require('../models/User');
const { inMemoryUsers } = require('../middleware/authMiddleware');
const { inMemoryAuditLogs } = require('../services/auditService');
const AuditLog = require('../models/AuditLog');
const { validateLocationHierarchy, getDistrictsByState } = require('../data/locations');

// Helper to generate institutional application ID (e.g., AGR-CENTRE-2026-0001)
const generateApplicationId = () => {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `AGR-CENTRE-2026-${rand}`;
};

// Allowed and disallowed extensions for strict server-side document verification
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const DISALLOWED_EXTENSIONS = ['.exe', '.sh', '.bat', '.bin', '.js', '.vbs', '.py', '.msi', '.cmd', '.com'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

// @desc    Submit Staff & Centre Registration Application
// @route   POST /api/staff/applications
// @access  Public
const submitStaffApplication = async (req, res, next) => {
  try {
    const {
      fullName,
      mobile,
      email,
      password,
      confirmPassword,
      centreName,
      centreType,
      registrationNumber,
      licenseNumber,
      state,
      stateCode,
      district,
      districtCode,
      localityName,
      localityCode,
      locationSource,
      address,
      pinCode,
      centreContact,
      latitude,
      longitude,
      documentsMetadata
    } = req.body;

    // 1. Personal Details Validation
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Authorized representative name is required.' }
      });
    }

    const cleanedPhone = (mobile || '').toString().trim().replace(/\D/g, '');
    if (cleanedPhone.length !== 10 || !['6', '7', '8', '9'].includes(cleanedPhone[0])) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PHONE', message: 'Please enter a valid 10-digit Indian mobile number.' }
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL', message: 'Please enter a valid official centre email address.' }
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters long.' }
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: { code: 'PASSWORD_MISMATCH', message: 'Passwords do not match.' }
      });
    }

    // 2. Duplicate Email Check across User and pending Applications
    const normalizedEmail = email.trim().toLowerCase();
    let existingEmailUser = null;
    try {
      existingEmailUser = await User.findOne({ email: normalizedEmail });
    } catch (e) {
      for (const [, u] of inMemoryUsers) {
        if (u.email && u.email.toLowerCase() === normalizedEmail) {
          existingEmailUser = u;
          break;
        }
      }
    }

    if (existingEmailUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_EMAIL',
          message: 'An account with this official email is already registered. Please login or contact administration.'
        }
      });
    }

    let existingEmailApp = null;
    try {
      existingEmailApp = await StaffRegistrationApplication.findOne({
        email: normalizedEmail,
        status: { $in: ['PENDING_REVIEW', 'UNDER_REVIEW', 'NEEDS_CORRECTION', 'NEEDS_MORE_INFORMATION'] }
      });
    } catch (e) {
      for (const [, a] of inMemoryApplications) {
        if (
          a.email &&
          a.email.toLowerCase() === normalizedEmail &&
          ['PENDING_REVIEW', 'UNDER_REVIEW', 'NEEDS_CORRECTION', 'NEEDS_MORE_INFORMATION'].includes(a.status)
        ) {
          existingEmailApp = a;
          break;
        }
      }
    }

    if (existingEmailApp) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_EMAIL',
          message: `An active application (#${existingEmailApp.applicationId}) is already under review for this official email.`
        }
      });
    }

    // 3. Centre Details Validation
    if (!centreName || !centreName.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Procurement centre name is required.' }
      });
    }

    const validCentreTypes = ['APMC_MANDI', 'GOVERNMENT_CENTRE', 'COOPERATIVE', 'AUTHORIZED_PRIVATE', 'OTHER'];
    const chosenType = centreType || 'GOVERNMENT_CENTRE';
    if (!validCentreTypes.includes(chosenType)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CENTRE_TYPE', message: `Centre type must be one of: ${validCentreTypes.join(', ')}` }
      });
    }

    if (!state || !stateCode || !district || !districtCode) {
      return res.status(400).json({
        success: false,
        error: { code: 'LOCATION_REQUIRED', message: 'State and District selections are required.' }
      });
    }

    // Location source handling (OFFICIAL_DATA vs USER_ENTERED)
    const effectiveLocationSource = locationSource === 'USER_ENTERED' ? 'USER_ENTERED' : 'OFFICIAL_DATA';
    if (effectiveLocationSource === 'OFFICIAL_DATA') {
      const locationValidation = validateLocationHierarchy(state, district, localityName || '', 'OFFICIAL_DATA');
      if (!locationValidation.valid) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_LOCATION_HIERARCHY', message: locationValidation.reason }
        });
      }
    } else {
      // Validate at least state and district exist
      const stateDistricts = getDistrictsByState(state);
      const matched = stateDistricts.find(
        (d) => d.districtCode === districtCode || d.districtName.toLowerCase() === district.toLowerCase()
      );
      if (!matched) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_LOCATION_HIERARCHY', message: `District "${district}" does not belong to State "${state}".` }
        });
      }
    }

    if (!address || !address.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Full centre address is required.' }
      });
    }

    const cleanedPin = (pinCode || '').toString().trim().replace(/\D/g, '');
    if (cleanedPin.length !== 6) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PINCODE', message: 'Please enter a valid 6-digit Indian PIN code.' }
      });
    }

    // Coordinates Resolution
    let lat = parseFloat(latitude);
    let lon = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lon)) {
      const dists = getDistrictsByState(state);
      const matchedDist = dists.find((d) => d.districtCode === districtCode || d.districtName === district);
      if (matchedDist && matchedDist.coordinates) {
        lat = matchedDist.coordinates.latitude;
        lon = matchedDist.coordinates.longitude;
      } else {
        lat = 23.204;
        lon = 77.085;
      }
    }

    // Check for existing active user with this mobile
    let existingUser = null;
    try {
      existingUser = await User.findOne({ phone: cleanedPhone });
    } catch (e) {
      for (const [, u] of inMemoryUsers) {
        if (u.phone === cleanedPhone) {
          existingUser = u;
          break;
        }
      }
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_ACCOUNT',
          message: 'An account with this phone number is already registered. Please login or contact administration.'
        }
      });
    }

    // 4. Process and Validate Uploaded Documents
    let rawDocs = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((f, idx) => {
        const docType = req.body[`docType_${idx}`] || req.body[`docType_${f.fieldname}`] || 'CENTRE_REGISTRATION';
        const docName = req.body[`docName_${idx}`] || f.originalname;
        rawDocs.push({
          docType,
          docName,
          originalFileName: f.originalname,
          filePath: f.path,
          mimeType: f.mimetype,
          fileSize: f.size
        });
      });
    } else if (documentsMetadata) {
      let metaArray = documentsMetadata;
      if (typeof documentsMetadata === 'string') {
        try {
          metaArray = JSON.parse(documentsMetadata);
        } catch (e) {
          metaArray = [];
        }
      }
      if (Array.isArray(metaArray)) {
        rawDocs = metaArray.map((m) => ({
          docType: m.docType || 'CENTRE_REGISTRATION',
          docName: m.docName || m.originalFileName || 'Verification Document',
          originalFileName: m.originalFileName || 'document.pdf',
          filePath: m.filePath || '',
          mimeType: m.mimeType || 'application/pdf',
          fileSize: m.fileSize || 102400
        }));
      }
    }

    if (rawDocs.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DOCUMENTS_REQUIRED',
          message: 'At least one centre authorization or representative verification document must be uploaded.'
        }
      });
    }

    // Validate file extensions and sizes
    for (const doc of rawDocs) {
      const ext = path.extname(doc.originalFileName || '').toLowerCase();
      if (DISALLOWED_EXTENSIONS.includes(ext)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: `Executable or script files (${ext}) are prohibited for security.`
          }
        });
      }
      if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: `Unsupported file type (${ext}). Only PDF, JPG, JPEG, and PNG files are accepted.`
          }
        });
      }
      if (doc.fileSize > MAX_FILE_SIZE) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `Document "${doc.originalFileName}" exceeds the maximum allowed file size of 10MB.`
          }
        });
      }
    }

    const parsedDocs = rawDocs.map((d, idx) => ({
      documentId: `DOC-${Date.now()}-${idx + 1}`,
      docType: d.docType,
      docName: d.docName,
      originalFileName: d.originalFileName,
      storageReference: `local-storage://verification-docs/${path.basename(d.filePath || d.originalFileName)}`,
      filePath: d.filePath,
      mimeType: d.mimeType,
      fileSize: d.fileSize,
      status: 'PENDING_REVIEW',
      uploadedAt: new Date()
    }));

    // 5. Hash Password & Create Application
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const applicationId = generateApplicationId();

    const applicationData = {
      applicationId,
      fullName: fullName.trim(),
      mobile: cleanedPhone,
      email: normalizedEmail,
      passwordHash,
      centreName: centreName.trim(),
      centreType: chosenType,
      registrationNumber: (registrationNumber || licenseNumber || '').toString().trim(),
      state: state.trim(),
      stateCode: stateCode.trim().toUpperCase(),
      district: district.trim(),
      districtCode: districtCode.trim(),
      localityName: (localityName || '').trim(),
      localityCode: (localityCode || '').trim(),
      locationSource: effectiveLocationSource,
      address: address.trim(),
      pinCode: cleanedPin,
      centreContact: (centreContact || cleanedPhone).toString().trim(),
      coordinates: { latitude: lat, longitude: lon },
      documents: parsedDocs,
      status: 'PENDING_REVIEW',
      submittedAt: new Date()
    };

    let newApp;
    try {
      newApp = await StaffRegistrationApplication.create(applicationData);
    } catch (dbErr) {
      const id = 'app_mem_' + Date.now();
      newApp = {
        _id: id,
        id,
        ...applicationData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryApplications.set(applicationId, newApp);
    }

    // Log Audit Trail
    try {
      await AuditLog.create([
        {
          action: 'CENTRE_APPLICATION_SUBMITTED',
          performedBy: null,
          performedByRole: 'ANONYMOUS',
          targetId: applicationId,
          targetType: 'StaffRegistrationApplication',
          details: {
            applicantName: fullName,
            mobile: cleanedPhone,
            email: normalizedEmail,
            centreName,
            centreType: chosenType,
            district,
            state,
            documentCount: parsedDocs.length
          },
          ipAddress: req.ip
        },
        {
          action: 'STAFF_APPLICATION_SUBMITTED',
          performedBy: null,
          performedByRole: 'ANONYMOUS',
          targetId: applicationId,
          targetType: 'StaffRegistrationApplication',
          details: {
            applicantName: fullName,
            mobile: cleanedPhone,
            email: normalizedEmail,
            centreName,
            centreType: chosenType,
            district,
            state,
            documentCount: parsedDocs.length
          },
          ipAddress: req.ip
        }
      ]);
    } catch (e) {
      inMemoryAuditLogs.push(
        {
          action: 'CENTRE_APPLICATION_SUBMITTED',
          performedByRole: 'ANONYMOUS',
          targetId: applicationId,
          targetType: 'StaffRegistrationApplication',
          timestamp: new Date(),
          details: { applicantName: fullName, centreName, district, state, email: normalizedEmail }
        },
        {
          action: 'STAFF_APPLICATION_SUBMITTED',
          performedByRole: 'ANONYMOUS',
          targetId: applicationId,
          targetType: 'StaffRegistrationApplication',
          timestamp: new Date(),
          details: { applicantName: fullName, centreName, district, state, email: normalizedEmail }
        }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Your procurement centre registration application has been submitted successfully.',
      data: {
        applicationId,
        status: 'PENDING_REVIEW',
        submittedAt: applicationData.submittedAt,
        representative: {
          fullName: applicationData.fullName,
          mobile: applicationData.mobile,
          email: applicationData.email
        },
        centreDetails: {
          name: applicationData.centreName,
          type: applicationData.centreType,
          registrationNumber: applicationData.registrationNumber,
          district: applicationData.district,
          state: applicationData.state,
          address: applicationData.address,
          pinCode: applicationData.pinCode
        },
        documentCount: parsedDocs.length,
        notice: 'Submitting this application does not activate your centre. Your documents and centre details will be reviewed by the Government Administrator.'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Staff Application Status (Safe / Public Check)
// @route   GET /api/staff/applications/:id
// @access  Public
const getApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    let app = null;

    try {
      app = await StaffRegistrationApplication.findOne({
        $or: [
          { applicationId: id.toUpperCase() },
          { mobile: id },
          { email: id.toLowerCase() }
        ]
      });
    } catch (e) {
      app = inMemoryApplications.get(id.toUpperCase());
      if (!app) {
        for (const [, a] of inMemoryApplications) {
          if (a.mobile === id || (a.email && a.email.toLowerCase() === id.toLowerCase())) {
            app = a;
            break;
          }
        }
      }
    }

    if (!app) {
      app = inMemoryApplications.get(id.toUpperCase());
      if (!app) {
        for (const [, a] of inMemoryApplications) {
          if (a.mobile === id || (a.email && a.email.toLowerCase() === id.toLowerCase())) {
            app = a;
            break;
          }
        }
      }
    }

    if (!app) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Procurement centre application not found.' }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        applicationId: app.applicationId,
        status: app.status,
        submittedAt: app.submittedAt,
        reviewedAt: app.reviewedAt,
        rejectionReason: app.rejectionReason,
        correctionNote: app.correctionNote || app.infoRequestMessage,
        infoRequestMessage: app.infoRequestMessage,
        representative: {
          fullName: app.fullName,
          email: app.email,
          phone: app.mobile
        },
        centreDetails: {
          name: app.centreName,
          type: app.centreType,
          registrationNumber: app.registrationNumber,
          district: app.district,
          state: app.state,
          address: app.address,
          locality: app.localityName,
          pinCode: app.pinCode
        },
        documents: (app.documents || []).map((d) => ({
          documentId: d.documentId,
          docType: d.docType,
          docName: d.docName,
          status: d.status,
          notes: d.notes,
          uploadedAt: d.uploadedAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current User's Application
// @route   GET /api/staff/applications/me
// @access  Private / Safe lookup
const getMyApplication = async (req, res, next) => {
  try {
    const userEmail = req.user?.email || req.query.email;
    const userPhone = req.user?.phone || req.query.phone;

    if (!userEmail && !userPhone) {
      return res.status(400).json({
        success: false,
        error: { code: 'IDENTIFIER_REQUIRED', message: 'Email or phone identifier required.' }
      });
    }

    let app = null;
    try {
      app = await StaffRegistrationApplication.findOne({
        $or: [
          userEmail ? { email: userEmail.toLowerCase() } : null,
          userPhone ? { mobile: userPhone } : null
        ].filter(Boolean)
      }).sort({ createdAt: -1 });
    } catch (e) {
      for (const [, a] of inMemoryApplications) {
        if (
          (userEmail && a.email && a.email.toLowerCase() === userEmail.toLowerCase()) ||
          (userPhone && a.mobile === userPhone)
        ) {
          app = a;
          break;
        }
      }
    }

    if (!app) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No application found for this account.' }
      });
    }

    return getApplicationStatus({ params: { id: app.applicationId } }, res, next);
  } catch (error) {
    next(error);
  }
};

// @desc    Resubmit or upload correction documents
// @route   POST /api/staff/applications/:id/documents
// @access  Public / Applicant
const resubmitDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;
    let app = null;

    try {
      app = await StaffRegistrationApplication.findOne({
        $or: [{ applicationId: id.toUpperCase() }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }].filter(Boolean)
      });
    } catch (e) {
      app = inMemoryApplications.get(id.toUpperCase());
    }

    if (!app) {
      app = inMemoryApplications.get(id.toUpperCase());
    }

    if (!app) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Application not found.' }
      });
    }

    const { docType, originalFileName, mimeType, fileSize, documentsMetadata } = req.body;
    let newDocs = [];

    if (req.files && req.files.length > 0) {
      req.files.forEach((f, idx) => {
        newDocs.push({
          documentId: `DOC-${Date.now()}-${idx + 1}`,
          docType: req.body[`docType_${idx}`] || docType || 'SUPPORTING_DOC',
          docName: f.originalname,
          originalFileName: f.originalname,
          storageReference: `local-storage://verification-docs/${f.filename}`,
          filePath: f.path,
          mimeType: f.mimetype,
          fileSize: f.size,
          status: 'PENDING_REVIEW',
          uploadedAt: new Date()
        });
      });
    } else if (documentsMetadata) {
      const meta = typeof documentsMetadata === 'string' ? JSON.parse(documentsMetadata) : documentsMetadata;
      if (Array.isArray(meta)) {
        newDocs = meta.map((m, idx) => ({
          documentId: `DOC-${Date.now()}-${idx + 1}`,
          docType: m.docType || 'SUPPORTING_DOC',
          docName: m.docName || m.originalFileName || 'Resubmitted Document',
          originalFileName: m.originalFileName || 'document.pdf',
          storageReference: `local-storage://verification-docs/${m.originalFileName || 'doc.pdf'}`,
          filePath: m.filePath || '',
          mimeType: m.mimeType || 'application/pdf',
          fileSize: m.fileSize || 102400,
          status: 'PENDING_REVIEW',
          uploadedAt: new Date()
        }));
      }
    } else if (originalFileName) {
      newDocs.push({
        documentId: `DOC-${Date.now()}-1`,
        docType: docType || 'SUPPORTING_DOC',
        docName: originalFileName,
        originalFileName,
        storageReference: `local-storage://verification-docs/${originalFileName}`,
        filePath: '',
        mimeType: mimeType || 'application/pdf',
        fileSize: fileSize || 102400,
        status: 'PENDING_REVIEW',
        uploadedAt: new Date()
      });
    }

    if (newDocs.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_DOCUMENTS', message: 'Please provide at least one replacement document.' }
      });
    }

    // Append new documents and reset status to PENDING_REVIEW
    app.documents = [...(app.documents || []), ...newDocs];
    app.status = 'PENDING_REVIEW';
    app.submittedAt = new Date();

    if (app.save) {
      await app.save();
    } else {
      inMemoryApplications.set(app.applicationId, app);
    }

    // Audit log
    try {
      await AuditLog.create({
        action: 'STAFF_APPLICATION_REVIEWED',
        performedBy: null,
        performedByRole: 'APPLICANT',
        targetId: app.applicationId,
        targetType: 'StaffRegistrationApplication',
        details: { action: 'DOCUMENTS_RESUBMITTED', count: newDocs.length },
        ipAddress: req.ip
      });
    } catch (e) {
      inMemoryAuditLogs.push({
        action: 'STAFF_APPLICATION_REVIEWED',
        targetId: app.applicationId,
        targetType: 'StaffRegistrationApplication',
        timestamp: new Date(),
        details: { action: 'DOCUMENTS_RESUBMITTED' }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Correction documents submitted successfully. Application status reset to PENDING_REVIEW.',
      data: {
        applicationId: app.applicationId,
        status: app.status,
        newDocuments: newDocs
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Secure Protected Document Retrieval
// @route   GET /api/staff/applications/:id/documents/:documentId
// @access  Protected (Applicant or ADMIN only)
const getDocument = async (req, res, next) => {
  try {
    const { id, documentId } = req.params;

    let app = null;
    try {
      app = await StaffRegistrationApplication.findOne({
        $or: [{ applicationId: id.toUpperCase() }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }].filter(Boolean)
      });
    } catch (e) {
      app = inMemoryApplications.get(id.toUpperCase());
    }

    if (!app) {
      app = inMemoryApplications.get(id.toUpperCase());
    }

    if (!app) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Application not found.' }
      });
    }

    // Access control: only ADMIN or submitting applicant can view
    const userRole = req.user?.role;
    const userEmail = req.user?.email;
    const userPhone = req.user?.phone;
    const appEmail = (app.representative?.email || app.email || '').toLowerCase();
    const appPhone = app.representative?.phone || app.mobile;

    const isAuthorized =
      userRole === 'ADMIN' ||
      (userEmail && userEmail.toLowerCase() === appEmail) ||
      (userPhone && userPhone === appPhone);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to access documents.'
        }
      });
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_DOCUMENT_ACCESS',
          message: "You do not have authorization to view this application's verification documents."
        }
      });
    }

    const doc = (app.documents || []).find((d) => d.documentId === documentId);
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found in application.' }
      });
    }

    // If file exists on disk, send it securely; otherwise send simulated metadata
    if (doc.filePath && fs.existsSync(doc.filePath)) {
      res.setHeader('Content-Type', doc.mimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${doc.originalFileName}"`);
      return res.sendFile(path.resolve(doc.filePath));
    }

    res.status(200).json({
      success: true,
      data: {
        documentId: doc.documentId,
        docType: doc.docType,
        docName: doc.docName,
        originalFileName: doc.originalFileName,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        storageReference: doc.storageReference,
        status: doc.status,
        verifiedAt: doc.verifiedAt,
        verifiedBy: doc.verifiedBy,
        uploadedAt: doc.uploadedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitStaffApplication,
  getApplicationStatus,
  getMyApplication,
  resubmitDocuments,
  getDocument
};
