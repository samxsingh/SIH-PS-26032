const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const StaffRegistrationApplication = require('../models/StaffRegistrationApplication');
const { inMemoryApplications } = require('../models/StaffRegistrationApplication');
const ProcurementCentre = require('../models/ProcurementCentre');
const User = require('../models/User');
const { inMemoryUsers } = require('../middleware/authMiddleware');
const AuditLog = require('../models/AuditLog');
const { inMemoryAuditLogs } = require('../services/auditService');
const { validateLocationHierarchy } = require('../data/locations');

// Helper to generate unique Centre Code on Approval
const generateCentreCode = async (districtCode) => {
  const prefix = (districtCode || 'CEN').replace(/[^a-zA-Z]/g, '').slice(-3).toUpperCase() || 'CEN';
  const rand = Math.floor(10 + Math.random() * 90);
  return `${prefix}${rand}`;
};

// @desc    Get List of Staff & Centre Applications for Admin
// @route   GET /api/admin/staff-applications
// @access  Private (ADMIN only)
const getStaffApplications = async (req, res, next) => {
  try {
    const { status, search, district, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (status && status !== 'ALL') {
      if (status === 'NEEDS_CORRECTION') {
        filter.status = { $in: ['NEEDS_CORRECTION', 'NEEDS_MORE_INFORMATION'] };
      } else {
        filter.status = status;
      }
    }
    if (district && district !== 'ALL') {
      filter.district = district;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { applicationId: regex },
        { centreName: regex },
        { fullName: regex },
        { email: regex },
        { mobile: regex }
      ];
    }

    let applications = [];
    let totalCount = 0;

    try {
      totalCount = await StaffRegistrationApplication.countDocuments(filter);
      applications = await StaffRegistrationApplication.find(filter)
        .sort({ submittedAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    } catch (dbErr) {
      // In-memory fallback
      let memList = Array.from(inMemoryApplications.values());
      if (filter.status) {
        if (Array.isArray(filter.status.$in)) {
          memList = memList.filter((a) => filter.status.$in.includes(a.status));
        } else {
          memList = memList.filter((a) => a.status === filter.status);
        }
      }
      if (filter.district) {
        memList = memList.filter((a) => a.district === filter.district);
      }
      if (search && search.trim()) {
        const s = search.trim().toLowerCase();
        memList = memList.filter(
          (a) =>
            a.applicationId.toLowerCase().includes(s) ||
            a.centreName.toLowerCase().includes(s) ||
            a.fullName.toLowerCase().includes(s) ||
            a.email.toLowerCase().includes(s) ||
            a.mobile.includes(s)
        );
      }
      totalCount = memList.length;
      applications = memList.slice((page - 1) * limit, page * limit);
    }

    // Compute Status Counts
    let allApps = [];
    try {
      allApps = await StaffRegistrationApplication.find({}, 'status');
    } catch (e) {
      allApps = Array.from(inMemoryApplications.values());
    }

    const counts = {
      all: allApps.length,
      pending: allApps.filter((a) => a.status === 'PENDING_REVIEW').length,
      underReview: allApps.filter((a) => a.status === 'UNDER_REVIEW').length,
      approved: allApps.filter((a) => a.status === 'APPROVED').length,
      rejected: allApps.filter((a) => a.status === 'REJECTED').length,
      needsCorrection: allApps.filter((a) => a.status === 'NEEDS_CORRECTION' || a.status === 'NEEDS_MORE_INFORMATION').length
    };

    res.status(200).json({
      success: true,
      data: {
        applications: applications.map((a) => ({
          applicationId: a.applicationId,
          centreName: a.centreName,
          centreType: a.centreType,
          registrationNumber: a.registrationNumber || '',
          representative: {
            fullName: a.fullName,
            email: a.email,
            mobile: a.mobile
          },
          state: a.state,
          district: a.district,
          localityName: a.localityName,
          status: a.status,
          submittedAt: a.submittedAt,
          reviewedAt: a.reviewedAt,
          documentCount: (a.documents || []).length,
          verifiedDocCount: (a.documents || []).filter((d) => d.status === 'VERIFIED').length
        })),
        pagination: {
          total: totalCount,
          page: parseInt(page),
          pages: Math.ceil(totalCount / limit) || 1
        },
        counts
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Detailed Staff Application by ID
// @route   GET /api/admin/staff-applications/:id
// @access  Private (ADMIN only)
const getStaffApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let app = null;

    try {
      app = await StaffRegistrationApplication.findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { applicationId: id.toUpperCase() }].filter(Boolean)
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
        error: { code: 'NOT_FOUND', message: 'Staff application not found.' }
      });
    }

    // Auto update to UNDER_REVIEW if currently PENDING_REVIEW
    if (app.status === 'PENDING_REVIEW') {
      app.status = 'UNDER_REVIEW';
      app.reviewedAt = new Date();
      app.reviewedBy = req.user._id ? req.user._id : req.user.id;
      if (app.save) {
        await app.save();
      } else {
        inMemoryApplications.set(app.applicationId, app);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        application: {
          applicationId: app.applicationId,
          status: app.status,
          submittedAt: app.submittedAt,
          reviewedAt: app.reviewedAt,
          approvedAt: app.approvedAt,
          rejectedAt: app.rejectedAt,
          rejectionReason: app.rejectionReason,
          correctionNote: app.correctionNote || app.infoRequestMessage,
          infoRequestMessage: app.infoRequestMessage,
          representative: {
            fullName: app.fullName,
            email: app.email,
            mobile: app.mobile
          },
          centreDetails: {
            name: app.centreName,
            type: app.centreType,
            registrationNumber: app.registrationNumber || '',
            address: app.address,
            state: app.state,
            stateCode: app.stateCode,
            district: app.district,
            districtCode: app.districtCode,
            locality: app.localityName,
            pinCode: app.pinCode,
            contactPhone: app.centreContact,
            coordinates: app.coordinates,
            locationSource: app.locationSource || 'OFFICIAL_DATA'
          },
          documents: (app.documents || []).map((d) => ({
            documentId: d.documentId,
            docType: d.docType,
            docName: d.docName,
            originalFileName: d.originalFileName,
            storageReference: d.storageReference,
            fileSize: d.fileSize,
            mimeType: d.mimeType,
            status: d.status,
            verifiedAt: d.verifiedAt,
            verifiedBy: d.verifiedBy,
            notes: d.notes,
            uploadedAt: d.uploadedAt
          }))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify an Individual Uploaded Document
// @route   POST /api/admin/staff-applications/:id/verify-document
// @route   POST /api/admin/staff-applications/:id/documents/:documentId/verify
// @access  Private (ADMIN only)
const verifyDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const documentId = req.params.documentId || req.body.documentId;
    const notes = req.body.notes || '';

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: { code: 'DOC_ID_REQUIRED', message: 'Document ID is required.' }
      });
    }

    let app = null;
    try {
      app = await StaffRegistrationApplication.findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { applicationId: id.toUpperCase() }].filter(Boolean)
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
        error: { code: 'NOT_FOUND', message: 'Staff application not found.' }
      });
    }

    const doc = (app.documents || []).find((d) => d.documentId === documentId);
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: { code: 'DOC_NOT_FOUND', message: 'Document not found in application.' }
      });
    }

    doc.status = 'VERIFIED';
    doc.verifiedAt = new Date();
    doc.verifiedBy = req.user._id ? req.user._id : req.user.id;
    doc.notes = notes || 'Verified authentic by Government Administrator.';

    if (app.save) {
      await app.save();
    } else {
      inMemoryApplications.set(app.applicationId, app);
    }

    // Audit Log
    try {
      await AuditLog.create({
        action: 'STAFF_DOCUMENT_VERIFIED',
        performedBy: req.user._id || req.user.id,
        performedByRole: req.user.role,
        targetId: app.applicationId,
        targetType: 'StaffRegistrationApplication',
        details: { documentId, docType: doc.docType, notes: doc.notes },
        ipAddress: req.ip
      });
    } catch (e) {
      inMemoryAuditLogs.push({
        action: 'STAFF_DOCUMENT_VERIFIED',
        performedBy: req.user.fullName || 'District Collector (Admin)',
        performedByRole: 'ADMIN',
        targetId: app.applicationId,
        targetType: 'StaffRegistrationApplication',
        timestamp: new Date(),
        details: { documentId, docType: doc.docType }
      });
    }

    res.status(200).json({
      success: true,
      message: `Document "${doc.docName}" marked as VERIFIED.`,
      data: {
        documentId: doc.documentId,
        status: doc.status,
        verifiedAt: doc.verifiedAt,
        notes: doc.notes
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a Specific Document
// @route   POST /api/admin/staff-applications/:id/reject-document
// @access  Private (ADMIN only)
const rejectDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const documentId = req.params.documentId || req.body.documentId;
    const notes = req.body.notes || '';

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: { code: 'DOC_ID_REQUIRED', message: 'Document ID is required.' }
      });
    }

    let app = null;
    try {
      app = await StaffRegistrationApplication.findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { applicationId: id.toUpperCase() }].filter(Boolean)
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
        error: { code: 'NOT_FOUND', message: 'Staff application not found.' }
      });
    }

    const doc = (app.documents || []).find((d) => d.documentId === documentId);
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: { code: 'DOC_NOT_FOUND', message: 'Document not found in application.' }
      });
    }

    doc.status = 'REJECTED';
    doc.verifiedAt = new Date();
    doc.verifiedBy = req.user._id ? req.user._id : req.user.id;
    doc.notes = notes || 'Document rejected by administrator during verification.';

    if (app.save) {
      await app.save();
    } else {
      inMemoryApplications.set(app.applicationId, app);
    }

    res.status(200).json({
      success: true,
      message: `Document "${doc.docName}" marked as REJECTED.`,
      data: {
        documentId: doc.documentId,
        status: doc.status,
        notes: doc.notes
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request Correction / More Information from Staff Applicant
// @route   POST /api/admin/staff-applications/:id/request-correction
// @route   POST /api/admin/staff-applications/:id/request-information
// @access  Private (ADMIN only)
const requestCorrection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const message = (req.body.correctionNote || req.body.message || '').trim();

    if (!message) {
      return res.status(400).json({
        success: false,
        error: { code: 'MESSAGE_REQUIRED', message: 'Please provide a clear correction note describing what needs to be corrected.' }
      });
    }

    let app = null;
    try {
      app = await StaffRegistrationApplication.findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { applicationId: id.toUpperCase() }].filter(Boolean)
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
        error: { code: 'NOT_FOUND', message: 'Staff application not found.' }
      });
    }

    app.status = 'NEEDS_CORRECTION';
    app.correctionNote = message;
    app.infoRequestMessage = message;
    app.reviewedAt = new Date();
    app.reviewedBy = req.user._id ? req.user._id : req.user.id;

    if (app.save) {
      await app.save();
    } else {
      inMemoryApplications.set(app.applicationId, app);
    }

    // Audit Log
    try {
      await AuditLog.create({
        action: 'STAFF_APPLICATION_CORRECTION_REQUESTED',
        performedBy: req.user._id || req.user.id,
        performedByRole: req.user.role,
        targetId: app.applicationId,
        targetType: 'StaffRegistrationApplication',
        details: { correctionNote: message },
        ipAddress: req.ip
      });
    } catch (e) {
      inMemoryAuditLogs.push({
        action: 'STAFF_APPLICATION_CORRECTION_REQUESTED',
        performedBy: req.user.fullName || 'District Collector (Admin)',
        performedByRole: 'ADMIN',
        targetId: app.applicationId,
        targetType: 'StaffRegistrationApplication',
        timestamp: new Date(),
        details: { message }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Correction request submitted to applicant.',
      data: {
        applicationId: app.applicationId,
        status: app.status,
        correctionNote: app.correctionNote
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve Staff Application & Activate Procurement Centre
// @route   POST /api/admin/staff-applications/:id/approve
// @access  Private (ADMIN only)
const approveStaffApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approvalNote } = req.body;

    let app = null;
    try {
      app = await StaffRegistrationApplication.findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { applicationId: id.toUpperCase() }].filter(Boolean)
      }).select('+passwordHash');
    } catch (e) {
      app = inMemoryApplications.get(id.toUpperCase());
    }

    if (!app) {
      app = inMemoryApplications.get(id.toUpperCase());
    }

    if (!app) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Staff application not found.' }
      });
    }

    // Idempotency: If already approved, return existing authoritative centre
    if (app.status === 'APPROVED') {
      let existingCentre = null;
      if (app.assignedCentreId) {
        try {
          existingCentre = await ProcurementCentre.findById(app.assignedCentreId);
        } catch (e) {
          existingCentre = null;
        }
      }
      if (!existingCentre) {
        try {
          existingCentre = await ProcurementCentre.findOne({
            $or: [
              { applicationId: app.applicationId },
              { sourceReference: `Gov Admin Approval (${app.applicationId})` }
            ]
          });
        } catch (e) {
          existingCentre = null;
        }
      }

      if (existingCentre) {
        const cId = existingCentre._id ? existingCentre._id.toString() : existingCentre.id;
        return res.status(200).json({
          success: true,
          message: `Staff application already approved. Procurement Centre "${existingCentre.name}" is active with code ${existingCentre.centreCode}.`,
          data: {
            applicationId: app.applicationId,
            status: 'APPROVED',
            centreId: cId,
            centreCode: existingCentre.centreCode,
            userId: app.createdUserId ? app.createdUserId.toString() : null,
            staffEmail: app.email,
            staffPhone: app.mobile,
            loginNotice: `Staff member can log in using Official Centre Email: ${app.email}`
          }
        });
      }
    }

    // 1. Verify Documents are valid
    const unverifiedDocs = (app.documents || []).filter((d) => d.status !== 'VERIFIED');
    if (unverifiedDocs.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DOCUMENTS_NOT_VERIFIED',
          message: `Cannot approve application. ${unverifiedDocs.length} documents remain unverified.`
        }
      });
    }

    // 2. Validate Location Hierarchy
    if ((app.locationSource || 'OFFICIAL_DATA') === 'OFFICIAL_DATA') {
      const locationValidation = validateLocationHierarchy(app.state, app.district, app.localityName, 'OFFICIAL_DATA');
      if (!locationValidation.valid) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_LOCATION_HIERARCHY', message: locationValidation.reason }
        });
      }
    }

    // 3. Find or Create exactly ONE ProcurementCentre (Idempotent)
    let targetCentre = null;
    if (app.assignedCentreId) {
      try {
        targetCentre = await ProcurementCentre.findById(app.assignedCentreId);
      } catch (e) {
        targetCentre = null;
      }
    }
    if (!targetCentre) {
      try {
        targetCentre = await ProcurementCentre.findOne({
          $or: [
            { applicationId: app.applicationId },
            { sourceReference: `Gov Admin Approval (${app.applicationId})` }
          ]
        });
      } catch (e) {
        targetCentre = null;
      }
    }

    if (targetCentre) {
      targetCentre.name = app.centreName;
      targetCentre.address = app.address;
      targetCentre.villageName = app.localityName || app.district;
      targetCentre.district = app.district;
      targetCentre.districtCode = app.districtCode;
      targetCentre.state = app.state;
      targetCentre.stateCode = app.stateCode;
      targetCentre.localityCode = app.localityCode || '';
      targetCentre.pincode = app.pinCode;
      targetCentre.contactPhone = app.centreContact;
      targetCentre.verificationStatus = 'VERIFIED';
      targetCentre.isActive = true;
      targetCentre.applicationId = app.applicationId;
      targetCentre.lastVerifiedAt = new Date();
      if (targetCentre.save) {
        await targetCentre.save();
      }
    } else {
      const centreCode = await generateCentreCode(app.districtCode);
      const centreData = {
        centreCode,
        name: app.centreName,
        address: app.address,
        villageName: app.localityName || app.district,
        district: app.district,
        districtCode: app.districtCode,
        state: app.state,
        stateCode: app.stateCode,
        localityCode: app.localityCode || '',
        pincode: app.pinCode,
        location: {
          type: 'Point',
          coordinates: [app.coordinates.longitude, app.coordinates.latitude]
        },
        verificationStatus: 'VERIFIED',
        dataSource: 'ADMIN',
        sourceReference: `Gov Admin Approval (${app.applicationId})`,
        applicationId: app.applicationId,
        sourceName: 'Department of Consumer Affairs',
        lastVerifiedAt: new Date(),
        contactPhone: app.centreContact,
        operatingHours: { open: '08:00', close: '18:00' },
        dailyCapacityQuintals: 1200,
        maxConcurrentFarmers: 40,
        currentLoadPercentage: 10,
        activeQueueCount: 0,
        isActive: true
      };

      try {
        targetCentre = await ProcurementCentre.create(centreData);
      } catch (dbErr) {
        const cid = 'c_' + Date.now();
        targetCentre = {
          _id: cid,
          id: cid,
          ...centreData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    }

    const centreId = targetCentre._id ? targetCentre._id.toString() : targetCentre.id;
    const centreCode = targetCentre.centreCode;

    // 4. Create or Activate Staff User Account as Appointed Centre Head
    let validPasswordHash = app.passwordHash;
    if (!validPasswordHash) {
      const salt = await bcrypt.genSalt(10);
      validPasswordHash = await bcrypt.hash('Staff@AgriNexus2026', salt);
    }

    let targetUser = null;
    try {
      targetUser = await User.findOne({
        $or: [{ email: app.email.toLowerCase() }, { phone: app.mobile }]
      });
    } catch (e) {
      for (const [, u] of inMemoryUsers) {
        if ((u.email && u.email.toLowerCase() === app.email.toLowerCase()) || u.phone === app.mobile) {
          targetUser = u;
          break;
        }
      }
    }

    const isMongoCentre = mongoose.Types.ObjectId.isValid(centreId);

    if (targetUser) {
      targetUser.role = 'CENTRE_STAFF';
      targetUser.accountStatus = 'ACTIVE';
      targetUser.isActive = true;
      targetUser.isCentreHead = true;
      targetUser.designation = 'Centre Head';
      targetUser.assignedCentreId = isMongoCentre ? targetCentre._id : (targetCentre._id || targetCentre.id);
      if (targetUser.save) {
        await targetUser.save();
      }
    } else {
      const userData = {
        fullName: app.fullName,
        phone: app.mobile,
        email: app.email.toLowerCase(),
        passwordHash: validPasswordHash,
        role: 'CENTRE_STAFF',
        accountStatus: 'ACTIVE',
        designation: 'Centre Head',
        isCentreHead: true,
        assignedCentreId: isMongoCentre ? targetCentre._id : (targetCentre._id || targetCentre.id),
        district: app.district,
        state: app.state,
        stateCode: app.stateCode,
        districtCode: app.districtCode,
        localityCode: app.localityCode || '',
        languagePreference: 'en',
        isActive: true
      };

      try {
        targetUser = await User.create(userData);
      } catch (dbErr) {
        const uid = 'u_staff_' + Date.now();
        targetUser = {
          _id: uid,
          id: uid,
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        inMemoryUsers.set(uid, targetUser);
      }
    }

    const userId = targetUser._id ? targetUser._id.toString() : targetUser.id;

    // Link Centre's current appointed head if valid ObjectId
    if (mongoose.Types.ObjectId.isValid(userId)) {
      targetCentre.currentHeadId = targetUser._id;
      if (targetCentre.save) {
        await targetCentre.save();
      }
    } else {
      const { inMemoryCentres } = require('./centreController');
      const idx = inMemoryCentres.findIndex((c) => (c._id || c.id) === centreId);
      if (idx !== -1) inMemoryCentres[idx].currentHeadId = userId;
    }

    // 5. Update Application to APPROVED
    app.status = 'APPROVED';
    app.approvalNote = approvalNote || 'Verified and approved by Government Administrator.';
    if (isMongoCentre) {
      app.assignedCentreId = targetCentre._id;
    }
    if (mongoose.Types.ObjectId.isValid(userId)) {
      app.createdUserId = targetUser._id;
    }
    app.reviewedBy = req.user._id || req.user.id;
    app.approvedAt = new Date();
    app.reviewedAt = new Date();

    if (app.save) {
      await app.save();
    } else {
      inMemoryApplications.set(app.applicationId, app);
    }

    // 6. Clean up any accidental orphan duplicate centres created previously for this application
    if (isMongoCentre) {
      try {
        await ProcurementCentre.deleteMany({
          _id: { $ne: targetCentre._id },
          $or: [
            { applicationId: app.applicationId },
            { sourceReference: `Gov Admin Approval (${app.applicationId})` }
          ]
        });
      } catch (cleanErr) {
        // Non-blocking cleanup
      }
    }

    // 7. Generate Immutable Audit Events
    try {
      await AuditLog.create([
        {
          action: 'CENTRE_APPLICATION_APPROVED',
          performedBy: req.user._id || req.user.id,
          performedByRole: req.user.role,
          targetId: app.applicationId,
          targetType: 'StaffRegistrationApplication',
          details: { centreCode, centreName: app.centreName, staffName: app.fullName, email: app.email, phone: app.mobile },
          ipAddress: req.ip
        },
        {
          action: 'CENTRE_HEAD_ASSIGNED',
          performedBy: req.user._id || req.user.id,
          performedByRole: req.user.role,
          targetId: userId,
          targetType: 'User',
          details: { centreId, headEmail: app.email, headName: app.fullName, designation: 'Centre Head' },
          ipAddress: req.ip
        },
        {
          action: 'STAFF_ACCOUNT_ACTIVATED',
          performedBy: req.user._id || req.user.id,
          performedByRole: req.user.role,
          targetId: userId,
          targetType: 'User',
          details: { centreId, staffEmail: app.email, staffName: app.fullName },
          ipAddress: req.ip
        },
        {
          action: 'STAFF_APPLICATION_APPROVED',
          performedBy: req.user._id || req.user.id,
          performedByRole: req.user.role,
          targetId: app.applicationId,
          targetType: 'StaffRegistrationApplication',
          details: { centreCode, centreName: app.centreName, staffName: app.fullName, email: app.email, phone: app.mobile },
          ipAddress: req.ip
        },
        {
          action: 'CENTRE_VERIFIED',
          performedBy: req.user._id || req.user.id,
          performedByRole: req.user.role,
          targetId: centreId,
          targetType: 'ProcurementCentre',
          details: { centreCode, centreName: app.centreName, district: app.district, state: app.state },
          ipAddress: req.ip
        }
      ]);
    } catch (e) {
      inMemoryAuditLogs.push(
        {
          action: 'CENTRE_APPLICATION_APPROVED',
          performedBy: req.user.fullName || 'District Collector (Admin)',
          performedByRole: 'ADMIN',
          targetId: app.applicationId,
          targetType: 'StaffRegistrationApplication',
          timestamp: new Date(),
          details: { centreCode, centreName: app.centreName, staffName: app.fullName, email: app.email }
        },
        {
          action: 'STAFF_ACCOUNT_ACTIVATED',
          performedBy: req.user.fullName || 'District Collector (Admin)',
          performedByRole: 'ADMIN',
          targetId: userId,
          targetType: 'User',
          timestamp: new Date(),
          details: { centreId, staffEmail: app.email, staffName: app.fullName }
        },
        {
          action: 'STAFF_APPLICATION_APPROVED',
          performedBy: req.user.fullName || 'District Collector (Admin)',
          performedByRole: 'ADMIN',
          targetId: app.applicationId,
          targetType: 'StaffRegistrationApplication',
          timestamp: new Date(),
          details: { centreCode, centreName: app.centreName, staffName: app.fullName, email: app.email }
        }
      );
    }

    res.status(200).json({
      success: true,
      message: `Staff application approved! Procurement Centre "${app.centreName}" activated with code ${centreCode}.`,
      data: {
        applicationId: app.applicationId,
        status: 'APPROVED',
        centreId,
        centreCode,
        userId,
        staffEmail: app.email,
        staffPhone: app.mobile,
        loginNotice: `Staff member can now log in using Official Centre Email: ${app.email}`
      }
    });
  } catch (error) {
    next(error);
  }

};

// @desc    Reject Staff Application
// @route   POST /api/admin/staff-applications/:id/reject
// @access  Private (ADMIN only)
const rejectStaffApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reason = (req.body.rejectionReason || req.body.reason || '').trim();

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: { code: 'REASON_REQUIRED', message: 'A rejection reason is required for administrative compliance.' }
      });
    }

    let app = null;
    try {
      app = await StaffRegistrationApplication.findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { applicationId: id.toUpperCase() }].filter(Boolean)
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
        error: { code: 'NOT_FOUND', message: 'Staff application not found.' }
      });
    }

    app.status = 'REJECTED';
    app.rejectionReason = reason;
    app.reviewedBy = req.user._id || req.user.id;
    app.rejectedAt = new Date();
    app.reviewedAt = new Date();

    if (app.save) {
      await app.save();
    } else {
      inMemoryApplications.set(app.applicationId, app);
    }

    // Disable staff user account if it existed
    try {
      await User.updateOne({ email: app.email }, { isActive: false, accountStatus: 'REJECTED' });
    } catch (e) {
      for (const [, u] of inMemoryUsers) {
        if (u.email === app.email) {
          u.isActive = false;
          u.accountStatus = 'REJECTED';
          break;
        }
      }
    }

    // Audit Log
    try {
      await AuditLog.create([
        {
          action: 'CENTRE_APPLICATION_REJECTED',
          performedBy: req.user._id || req.user.id,
          performedByRole: req.user.role,
          targetId: app.applicationId,
          targetType: 'StaffRegistrationApplication',
          details: { rejectionReason: reason },
          ipAddress: req.ip
        },
        {
          action: 'STAFF_APPLICATION_REJECTED',
          performedBy: req.user._id || req.user.id,
          performedByRole: req.user.role,
          targetId: app.applicationId,
          targetType: 'StaffRegistrationApplication',
          details: { rejectionReason: reason },
          ipAddress: req.ip
        }
      ]);
    } catch (e) {
      inMemoryAuditLogs.push(
        {
          action: 'CENTRE_APPLICATION_REJECTED',
          performedBy: req.user.fullName || 'District Collector (Admin)',
          performedByRole: 'ADMIN',
          targetId: app.applicationId,
          targetType: 'StaffRegistrationApplication',
          timestamp: new Date(),
          details: { rejectionReason: reason }
        },
        {
          action: 'STAFF_APPLICATION_REJECTED',
          performedBy: req.user.fullName || 'District Collector (Admin)',
          performedByRole: 'ADMIN',
          targetId: app.applicationId,
          targetType: 'StaffRegistrationApplication',
          timestamp: new Date(),
          details: { rejectionReason: reason }
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Staff application has been rejected.',
      data: {
        applicationId: app.applicationId,
        status: 'REJECTED',
        rejectionReason: app.rejectionReason
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin Secure Document Retrieval
// @route   GET /api/admin/staff-applications/:id/documents/:documentId
// @access  Private (ADMIN only)
const getAdminDocument = async (req, res, next) => {
  try {
    const { id, documentId } = req.params;

    let app = null;
    try {
      app = await StaffRegistrationApplication.findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { applicationId: id.toUpperCase() }].filter(Boolean)
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
        error: { code: 'NOT_FOUND', message: 'Staff application not found.' }
      });
    }

    const doc = (app.documents || []).find((d) => d.documentId === documentId);
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: { code: 'DOC_NOT_FOUND', message: 'Document not found in application.' }
      });
    }

    // Check primary filePath or fallback directory search
    let resolvedPath = null;
    if (doc.filePath && fs.existsSync(doc.filePath)) {
      resolvedPath = path.resolve(doc.filePath);
    } else if (doc.filePath || doc.originalFileName) {
      const baseName1 = path.basename(doc.filePath || '');
      const baseName2 = path.basename(doc.originalFileName || '');
      const candidate1 = path.join(__dirname, '../../uploads/verification-docs', baseName1);
      const candidate2 = path.join(__dirname, '../../uploads/verification-docs', baseName2);
      if (baseName1 && fs.existsSync(candidate1)) {
        resolvedPath = candidate1;
      } else if (baseName2 && fs.existsSync(candidate2)) {
        resolvedPath = candidate2;
      }
    }

    if (resolvedPath) {
      res.setHeader('Content-Type', doc.mimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${doc.originalFileName}"`);
      return res.sendFile(resolvedPath);
    }

    // If client specifically queries metadata
    if (req.query.metadata === 'true') {
      return res.status(200).json({
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
          notes: doc.notes,
          uploadedAt: doc.uploadedAt
        }
      });
    }

    // Document file is not found on disk: return 404 with safe error message
    return res.status(404).json({
      success: false,
      error: {
        code: 'DOCUMENT_UNAVAILABLE',
        message: 'Document unavailable'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStaffApplications,
  getStaffApplicationById,
  verifyDocument,
  rejectDocument,
  requestMoreInformation: requestCorrection,
  requestCorrection,
  approveStaffApplication,
  rejectStaffApplication,
  getAdminDocument
};
