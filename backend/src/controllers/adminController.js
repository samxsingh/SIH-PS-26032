const bcrypt = require('bcryptjs');
const {
  getKpiOverview,
  getCropAnalytics,
  getDistrictSummaries,
  getPaymentPipelineAnalytics,
  verifyDataReconciliation
} = require('../services/adminAnalyticsService');
const { calculateCentreHealth, determineOperationalStatus } = require('../services/centreHealthService');
const { generateOperationalAlerts } = require('../services/alertService');
const { getTodayIST } = require('../utils/dateUtils');
const ProcurementCentre = require('../models/ProcurementCentre');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { inMemoryCentres } = require('./centreController');
const { inMemoryUsers } = require('../middleware/authMiddleware');
const { inMemoryAuditLogs, logAuditEvent } = require('../services/auditService');

const getOverview = async (req, res, next) => {
  try {
    const kpis = await getKpiOverview(req.query.date);

    let centres = [];
    try {
      centres = await ProcurementCentre.find().lean();
    } catch (err) {
      centres = Array.from(inMemoryCentres.values());
    }
    if (!centres || centres.length === 0) {
      centres = Array.from(inMemoryCentres.values());
    }

    const alerts = await generateOperationalAlerts(centres);

    res.status(200).json({
      success: true,
      data: {
        kpis,
        alerts,
        systemStatus: {
          operationalDate: req.query.date || getTodayIST(),
          timezone: 'Asia/Kolkata (IST)',
          isHealthy: alerts.filter((a) => a.severity === 'CRITICAL').length === 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCentresList = async (req, res, next) => {
  try {
    const { district, health, status } = req.query;

    let centres = [];
    try {
      centres = await ProcurementCentre.find().lean();
    } catch (err) {
      centres = Array.from(inMemoryCentres.values());
    }
    if (!centres || centres.length === 0) {
      centres = Array.from(inMemoryCentres.values());
    }

    let formattedCentres = centres.map((c) => {
      const wait = c.estimatedWaitMinutes || 30;
      const load = c.queueLoadPercentage || 45;
      const computedHealth = calculateCentreHealth(wait, load);
      const computedStatus = determineOperationalStatus(c.isActive, c.activeQueueCount || 0, wait, load);

      return {
        id: c._id ? c._id.toString() : c.id,
        name: c.name,
        centreCode: c.centreCode,
        district: c.district || 'Lucknow',
        state: c.state || 'Uttar Pradesh',
        address: c.address,
        location: c.location,
        health: computedHealth,
        status: computedStatus,
        verificationStatus: c.verificationStatus || 'UNVERIFIED',
        dataSource: c.dataSource || 'DEMO',
        estimatedWaitMinutes: wait,
        queueLoadPercentage: load,
        activeQueueCount: c.activeQueueCount || 0,
        dailyCapacityQuintals: c.dailyCapacityQuintals || 1000
      };
    });

    if (district) {
      formattedCentres = formattedCentres.filter((c) => c.district.toLowerCase() === district.toLowerCase());
    }
    if (health) {
      formattedCentres = formattedCentres.filter((c) => c.health === health.toUpperCase());
    }
    if (status) {
      formattedCentres = formattedCentres.filter((c) => c.status === status.toUpperCase());
    }

    res.status(200).json({
      success: true,
      count: formattedCentres.length,
      data: formattedCentres
    });
  } catch (error) {
    next(error);
  }
};

const getDistricts = async (req, res, next) => {
  try {
    const summaries = await getDistrictSummaries();

    res.status(200).json({
      success: true,
      data: summaries
    });
  } catch (error) {
    next(error);
  }
};

const getProcurementAnalytics = async (req, res, next) => {
  try {
    const crops = await getCropAnalytics();

    res.status(200).json({
      success: true,
      data: {
        cropBreakdown: crops,
        totalTransactions: crops.reduce((sum, c) => sum + c.transactionCount, 0),
        totalVolumeQuintals: crops.reduce((sum, c) => sum + c.totalQuantityQuintals, 0),
        totalValueRs: crops.reduce((sum, c) => sum + c.totalValueRs, 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentAnalytics = async (req, res, next) => {
  try {
    const pipelineData = await getPaymentPipelineAnalytics();

    res.status(200).json({
      success: true,
      data: pipelineData
    });
  } catch (error) {
    next(error);
  }
};

const getAlerts = async (req, res, next) => {
  try {
    let centres = [];
    try {
      centres = await ProcurementCentre.find().lean();
    } catch (err) {
      centres = Array.from(inMemoryCentres.values());
    }

    const alerts = await generateOperationalAlerts(centres);

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    let logs = [];
    try {
      logs = await AuditLog.find().sort({ createdAt: -1 }).limit(50).lean();
    } catch (err) {
      logs = inMemoryAuditLogs;
    }
    if (!logs || logs.length === 0) {
      logs = inMemoryAuditLogs;
    }

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

const getReconciliation = async (req, res, next) => {
  try {
    const reconciliation = await verifyDataReconciliation();

    res.status(200).json({
      success: true,
      data: reconciliation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Provision a verified Procurement Centre Staff Account (Admin Only)
// @route   POST /api/admin/staff
// @access  Admin
const provisionStaff = async (req, res, next) => {
  try {
    const { fullName, phone, email, password, assignedCentreId, district, state } = req.body;

    // Check duplicate phone
    let existingUser = null;
    try {
      existingUser = await User.findOne({ phone });
    } catch (err) {
      for (const [, u] of inMemoryUsers) {
        if (u.phone === phone) existingUser = u;
      }
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_PHONE',
          message: 'A user account with this phone number already exists.'
        }
      });
    }

    // Verify centre exists
    let centre = null;
    try {
      centre = await ProcurementCentre.findById(assignedCentreId);
    } catch (err) {
      centre = inMemoryCentres.find((c) => c._id === assignedCentreId || c.id === assignedCentreId);
    }

    if (!centre && inMemoryCentres) {
      centre = inMemoryCentres.find((c) => c._id === assignedCentreId || c.id === assignedCentreId);
    }

    if (!centre) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CENTRE_NOT_FOUND',
          message: 'The specified assigned procurement centre ID does not exist.'
        }
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let newStaff;
    try {
      newStaff = await User.create({
        fullName,
        phone,
        email: email || null,
        passwordHash,
        role: 'CENTRE_STAFF',
        assignedCentreId: centre._id || centre.id,
        district: district || centre.district,
        state: state || centre.state || 'Madhya Pradesh',
        languagePreference: 'en',
        isActive: true
      });
    } catch (dbErr) {
      const id = 'mem_staff_' + Date.now();
      newStaff = {
        _id: id,
        id,
        fullName,
        phone,
        email: email || null,
        role: 'CENTRE_STAFF',
        assignedCentreId: centre._id || centre.id,
        district: district || centre.district,
        state: state || centre.state || 'Madhya Pradesh',
        languagePreference: 'en',
        isActive: true
      };
      inMemoryUsers.set(id, newStaff);
    }

    await logAuditEvent({
      userId: req.user._id ? req.user._id.toString() : req.user.id,
      userRole: 'ADMIN',
      action: 'STAFF_PROVISIONED',
      entityType: 'User',
      entityId: newStaff._id.toString(),
      centreId: centre._id || centre.id,
      previousState: null,
      newState: 'ACTIVE',
      details: { staffName: fullName, staffPhone: phone, centreName: centre.name }
    });

    res.status(201).json({
      success: true,
      message: 'Procurement Centre Staff account provisioned successfully',
      data: {
        staff: {
          id: newStaff._id.toString(),
          fullName: newStaff.fullName,
          phone: newStaff.phone,
          email: newStaff.email,
          role: newStaff.role,
          assignedCentreId: newStaff.assignedCentreId,
          district: newStaff.district,
          state: newStaff.state
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const reassignCentreHead = async (req, res, next) => {
  try {
    const { centreId } = req.params;
    const { newHeadUserId, newHeadEmail, reason } = req.body;

    let centre = null;
    try {
      centre = await ProcurementCentre.findById(centreId);
    } catch (e) {
      centre = inMemoryCentres.find(c => c._id === centreId || c.id === centreId || c.centreCode === centreId);
    }

    if (!centre) {
      return res.status(404).json({
        success: false,
        error: { code: 'CENTRE_NOT_FOUND', message: 'Procurement centre not found.' }
      });
    }

    let newHead = null;
    try {
      if (newHeadUserId) {
        newHead = await User.findById(newHeadUserId);
      } else if (newHeadEmail) {
        newHead = await User.findOne({ emailNormalized: newHeadEmail.trim().toLowerCase() });
      }
    } catch (e) {
      for (const [, u] of inMemoryUsers) {
        if (
          (newHeadUserId && (u._id === newHeadUserId || u.id === newHeadUserId)) ||
          (newHeadEmail && u.email && u.email.toLowerCase() === newHeadEmail.trim().toLowerCase())
        ) {
          newHead = u;
          break;
        }
      }
    }

    if (!newHead) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Specified user to be appointed as Centre Head was not found.' }
      });
    }

    // Demote existing head if applicable
    const oldHeadId = centre.currentHeadId ? centre.currentHeadId.toString() : null;
    if (oldHeadId) {
      try {
        await User.findByIdAndUpdate(oldHeadId, { isCentreHead: false, designation: 'Procurement Operator' });
      } catch (e) {
        const oldU = inMemoryUsers.get(oldHeadId);
        if (oldU) {
          oldU.isCentreHead = false;
          oldU.designation = 'Procurement Operator';
        }
      }
    }

    // Promote new head
    newHead.isCentreHead = true;
    newHead.designation = 'Centre Head';
    newHead.assignedCentreId = centre._id || centre.id;
    newHead.accountStatus = 'ACTIVE';
    if (newHead.save) await newHead.save();

    centre.currentHeadId = newHead._id || newHead.id;
    if (centre.save) await centre.save();

    await logAuditEvent({
      userId: req.user._id ? req.user._id.toString() : req.user.id,
      userRole: 'ADMIN',
      action: 'CENTRE_HEAD_CHANGED',
      entityType: 'ProcurementCentre',
      entityId: (centre._id || centre.id).toString(),
      centreId: centre._id || centre.id,
      previousState: oldHeadId,
      newState: (newHead._id || newHead.id).toString(),
      details: {
        centreName: centre.name,
        newHeadName: newHead.fullName,
        newHeadEmail: newHead.email,
        reason: reason || 'Administrative reassignment by Government Administrator'
      }
    });

    res.status(200).json({
      success: true,
      message: `Appointed Centre Head updated to ${newHead.fullName}.`,
      data: {
        centreId: centre._id || centre.id,
        currentHeadId: newHead._id || newHead.id,
        currentHeadName: newHead.fullName,
        currentHeadEmail: newHead.email,
        designation: 'Centre Head'
      }
    });
  } catch (error) {
    next(error);
  }
};

const getCentreStaffList = async (req, res, next) => {
  try {
    const { centreId } = req.params;
    const centreIdStr = centreId.toString();
    let staffList = [];

    try {
      staffList = await User.find({
        assignedCentreId: centreId,
        role: 'CENTRE_STAFF'
      }).select('_id fullName email phone designation isCentreHead accountStatus employeeId dateOfJoining createdAt').lean();
    } catch (e) {
      staffList = [];
    }

    if (!staffList || staffList.length === 0) {
      for (const [, u] of inMemoryUsers) {
        if (
          (u.assignedCentreId === centreIdStr || (centreIdStr === 'c1' && u.assignedCentreId === 'c1')) &&
          u.role === 'CENTRE_STAFF'
        ) {
          staffList.push({
            _id: u._id || u.id,
            fullName: u.fullName,
            email: u.email,
            phone: u.phone,
            designation: u.designation || (u.isCentreHead ? 'Centre Head' : 'Procurement Operator'),
            isCentreHead: !!u.isCentreHead,
            accountStatus: u.accountStatus || 'ACTIVE'
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      count: staffList.length,
      data: staffList
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
