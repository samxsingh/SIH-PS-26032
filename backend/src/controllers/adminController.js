const bcrypt = require('bcryptjs');
const {
  getKpiOverview,
  getCropAnalytics,
  getDistrictSummaries,
  getPaymentPipelineAnalytics,
  verifyDataReconciliation
} = require('../services/adminAnalyticsService');
const { runFullSystemReconciliation } = require('../services/reconciliationService');
const { calculateCentreHealth, determineOperationalStatus } = require('../services/centreHealthService');
const { generateOperationalAlerts } = require('../services/alertService');
const { getTodayIST } = require('../utils/dateUtils');
const ProcurementCentre = require('../models/ProcurementCentre');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Mandi = require('../models/Mandi');
const Booking = require('../models/Booking');
const QueueEntry = require('../models/QueueEntry');
const Procurement = require('../models/Procurement');
const PaymentStatus = require('../models/PaymentStatus');
const { CANONICAL_DISTRICTS } = require('../config/districts');
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
    const reconciliation = await runFullSystemReconciliation();

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
        state: state || centre.state || 'Uttar Pradesh',
        languagePreference: 'en',
        isActive: true
      });
      if (newStaff && centre._id) {
        await ProcurementCentre.findByIdAndUpdate(centre._id, {
          $addToSet: { staffIds: newStaff._id }
        });
      }
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
        state: state || centre.state || 'Uttar Pradesh',
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

    // Demote ALL other users for this centre atomically to guarantee exactly ONE Centre Manager invariant
    const targetCentreId = centre._id || centre.id;
    const newHeadId = newHead._id || newHead.id;
    const oldHeadId = centre.currentHeadId ? centre.currentHeadId.toString() : null;

    try {
      await User.updateMany(
        {
          assignedCentreId: targetCentreId,
          _id: { $ne: newHeadId },
          isCentreHead: true
        },
        {
          $set: {
            isCentreHead: false,
            designation: 'Procurement Operator'
          }
        }
      );
      if (oldHeadId && oldHeadId !== newHeadId.toString()) {
        await User.findByIdAndUpdate(oldHeadId, { isCentreHead: false, designation: 'Procurement Operator' });
      }
    } catch (e) {
      for (const [, u] of inMemoryUsers) {
        const uCentre = u.assignedCentreId ? u.assignedCentreId.toString() : '';
        if (uCentre === targetCentreId.toString() && (u._id !== newHeadId && u.id !== newHeadId)) {
          u.isCentreHead = false;
          u.designation = 'Procurement Operator';
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
    if (centre.save) {
      if (centre.staffIds && !centre.staffIds.some(id => id.toString() === (newHead._id || newHead.id).toString())) {
        centre.staffIds.push(newHead._id || newHead.id);
      }
      await centre.save();
    }

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

    // Broadcast to Centre Room and Admin Global Room
    const io = req.app.get('io');
    if (io) {
      const payload = {
        centreId: (centre._id || centre.id).toString(),
        centreCode: centre.centreCode,
        currentHeadId: (newHead._id || newHead.id).toString(),
        currentHeadName: newHead.fullName,
        previousHeadId: oldHeadId,
        updatedAt: new Date()
      };
      io.to(`centre_${centre._id || centre.id}`).emit('centre:manager_updated', payload);
      io.to('admin_global').emit('centre:manager_updated', payload);
    }

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

/**
 * @desc    Comprehensive Aggregated District Command Centre Overview
 * @route   GET /api/admin/district-overview
 * @access  Admin
 */
const getDistrictOverview = async (req, res, next) => {
  try {
    const todayStr = req.query.date || getTodayIST();

    // 1. Fetch Mandis in Lucknow
    let mandis = [];
    try {
      mandis = await Mandi.find({ district: 'Lucknow', isActive: true }).lean();
    } catch (mErr) {
      mandis = [];
    }

    // 2. Fetch Centres in Lucknow with Mandi & Head Populated
    let centres = [];
    try {
      centres = await ProcurementCentre.find({ district: 'Lucknow' })
        .populate('mandiId', 'mandiCode name category location address')
        .populate('currentHeadId', 'fullName email phone designation')
        .lean();
    } catch (cErr) {
      centres = Array.from(inMemoryCentres.values());
    }
    if (!centres || centres.length === 0) {
      centres = Array.from(inMemoryCentres.values());
    }

    // 3. Fetch Today's Queue Entries
    let queueEntries = [];
    try {
      queueEntries = await QueueEntry.find({ queueDate: todayStr })
        .populate('farmerId', 'fullName phone villageName district')
        .populate('centreId', 'name centreCode')
        .populate('bookingId')
        .lean();
    } catch (qErr) {
      queueEntries = [];
    }

    // 4. Fetch Procurements
    let procurements = [];
    try {
      procurements = await Procurement.find().lean();
    } catch (pErr) {
      procurements = [];
    }

    // 5. Fetch Payment Records
    let payments = [];
    try {
      payments = await PaymentStatus.find().lean();
    } catch (payErr) {
      payments = [];
    }

    // 6. Fetch Recent Audit Logs
    let auditLogs = [];
    try {
      auditLogs = await AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('centreId', 'name centreCode')
        .lean();
    } catch (aErr) {
      auditLogs = inMemoryAuditLogs;
    }

    // 7. Calculate Centre-by-Centre Real-Time Metrics
    const enrichedCentres = centres.map((c) => {
      const cIdStr = (c._id || c.id).toString();
      const centreQueue = queueEntries.filter((q) => {
        const qCId = (q.centreId?._id || q.centreId)?.toString();
        return qCId === cIdStr || (c.centreCode === 'LKO_GOM01' && (qCId === 'c1' || qCId === cIdStr));
      });
      const centreProcs = procurements.filter((p) => {
        const pCId = (p.centreId?._id || p.centreId)?.toString();
        return pCId === cIdStr || (c.centreCode === 'LKO_GOM01' && (pCId === 'c1' || pCId === cIdStr));
      });

      const waitingCount = centreQueue.filter((q) => q.state === 'WAITING').length;
      const servingCount = centreQueue.filter((q) =>
        ['CALLED', 'ARRIVED', 'VERIFICATION', 'QUALITY_CHECK', 'WEIGHING'].includes(q.state)
      ).length;
      const completedCount = centreQueue.filter((q) =>
        ['PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED', 'COMPLETED'].includes(q.state)
      ).length;

      // Deterministic bottleneck calculation based on current active stage counts
      const verificationCount = centreQueue.filter((q) => q.state === 'VERIFICATION').length;
      const qualityCount = centreQueue.filter((q) => q.state === 'QUALITY_CHECK').length;
      const weighingCount = centreQueue.filter((q) => q.state === 'WEIGHING').length;
      const calledCount = centreQueue.filter((q) => ['CALLED', 'ARRIVED'].includes(q.state)).length;

      let currentBottleneck = 'None';
      const stageCandidates = [
        { name: 'Quality Assaying', count: qualityCount },
        { name: 'Weighing', count: weighingCount },
        { name: 'Intake Verification', count: verificationCount },
        { name: 'Counter Check-In', count: calledCount }
      ];
      stageCandidates.sort((a, b) => b.count - a.count);
      if (waitingCount >= 4) {
        currentBottleneck = 'Intake Verification';
      } else if (stageCandidates[0].count > 0) {
        currentBottleneck = stageCandidates[0].name;
      }

      const produceTodayQuintals = centreProcs.reduce((sum, p) => sum + (Number(p.netWeightQuintals) || 0), 0) || (completedCount * 42);
      const payableTodayRs = centreProcs.reduce((sum, p) => sum + (Number(p.netPayableAmount) || 0), 0) || (produceTodayQuintals * 2275);

      const maxConcurrent = c.maxConcurrentFarmers || 50;
      const queueLoad = Math.min(100, Math.round(((waitingCount + servingCount) / maxConcurrent) * 100)) || c.currentLoadPercentage || 35;
      const waitMins = Math.max(12, Math.round(waitingCount * 7.5)) || c.estimatedWaitMinutes || 25;

      let queuePressure = 'Low';
      if (waitingCount >= 3 || queueLoad >= 60) {
        queuePressure = 'High';
      } else if (waitingCount >= 2 || queueLoad >= 40) {
        queuePressure = 'Moderate';
      }

      let health = 'NORMAL';
      let statusText = 'NORMAL';
      if (queueLoad >= 80 || waitingCount >= 10) {
        health = 'CRITICAL';
        statusText = 'ATTENTION REQUIRED';
      } else if (queueLoad >= 50 || waitingCount >= 5) {
        health = 'WATCH';
        statusText = 'BUSY';
      }

      const tehsilMap = {
        'LKO_GOM01': 'Lucknow Sadar',
        'LKO_ALI02': 'Lucknow Sadar',
        'LKO_IND03': 'Lucknow Sadar',
        'LKO_JAN04': 'Lucknow Sadar',
        'LKO_ALA05': 'Sarojini Nagar',
        'LKO_CHI06': 'Lucknow Sadar',
        'LKO_MOH07': 'Sarojini Nagar',
        'LKO_BKT08': 'Bakshi Ka Talab'
      };
      const tehsil = tehsilMap[c.centreCode] || c.tehsil || 'Lucknow Sadar';

      return {
        id: cIdStr,
        _id: cIdStr,
        centreCode: c.centreCode,
        name: c.name,
        centreType: c.centreType || 'PROCUREMENT_CENTRE',
        mandiId: c.mandiId?._id || c.mandiId,
        mandi: c.mandiId ? {
          id: c.mandiId._id,
          mandiCode: c.mandiId.mandiCode,
          name: c.mandiId.name,
          category: c.mandiId.category
        } : null,
        location: c.location,
        address: c.address,
        operatingHours: c.operatingHours || { open: '08:00', close: '18:00' },
        contactPhone: c.contactPhone || '+91 522 2720011',
        currentHead: c.currentHeadId ? {
          fullName: c.currentHeadId.fullName,
          phone: c.currentHeadId.phone,
          email: c.currentHeadId.email,
          designation: c.currentHeadId.designation || 'Centre Head'
        } : {
          fullName: 'Satish Kumar',
          phone: '9876543201',
          email: `${c.centreCode?.toLowerCase() || 'centre'}@agrinexus.demo`,
          designation: 'Centre Head'
        },
        staffCount: c.staffIds?.length || 4,
        countersCount: 4,
        weighbridgesCount: 2,
        dailyCapacityQuintals: c.dailyCapacityQuintals || 1500,
        waitingCount,
        servingCount,
        completedCount,
        produceTodayQuintals: Number(produceTodayQuintals.toFixed(1)),
        payableTodayRs: Math.round(payableTodayRs),
        queueLoadPercentage: queueLoad,
        estimatedWaitMinutes: waitMins,
        health,
        statusText,
        tehsil,
        currentBottleneck,
        queuePressure,
        isActive: c.isActive !== false
      };
    });

    // 8. Mandi Aggregations
    const enrichedMandis = mandis.map((m) => {
      const mIdStr = m._id.toString();
      const affiliatedCentres = enrichedCentres.filter((c) => c.mandiId?.toString() === mIdStr);
      const totalBookings = affiliatedCentres.reduce((sum, c) => sum + c.waitingCount + c.servingCount + c.completedCount, 0);
      const totalProduce = affiliatedCentres.reduce((sum, c) => sum + c.produceTodayQuintals, 0);
      const totalPayable = affiliatedCentres.reduce((sum, c) => sum + c.payableTodayRs, 0);

      return {
        id: mIdStr,
        _id: mIdStr,
        mandiCode: m.mandiCode,
        name: m.name,
        category: m.category,
        address: m.address,
        location: m.location,
        associatedCentresCount: affiliatedCentres.length,
        associatedCentres: affiliatedCentres.map((c) => ({ id: c.id, centreCode: c.centreCode, name: c.name, health: c.health })),
        totalBookings,
        activeFarmers: totalBookings,
        todayProcureQuintals: Number(totalProduce.toFixed(1)),
        todayPayableRs: Math.round(totalPayable)
      };
    });

    // 9. Canonical 10-Stage District Queue Funnel
    const queueFunnel = {
      BOOKED: queueEntries.filter((q) => q.state === 'BOOKED').length,
      WAITING: queueEntries.filter((q) => q.state === 'WAITING').length,
      CALLED: queueEntries.filter((q) => q.state === 'CALLED').length,
      ARRIVED: queueEntries.filter((q) => q.state === 'ARRIVED').length,
      VERIFICATION: queueEntries.filter((q) => q.state === 'VERIFICATION').length,
      QUALITY_CHECK: queueEntries.filter((q) => q.state === 'QUALITY_CHECK').length,
      WEIGHING: queueEntries.filter((q) => q.state === 'WEIGHING').length,
      PROCUREMENT_CONFIRMED: queueEntries.filter((q) => q.state === 'PROCUREMENT_CONFIRMED').length,
      PAYMENT_PROCESSING: queueEntries.filter((q) => q.state === 'PAYMENT_PROCESSING').length,
      PAYMENT_COMPLETED: queueEntries.filter((q) => ['PAYMENT_COMPLETED', 'COMPLETED'].includes(q.state)).length
    };

    // 10. District High-Level Summary
    const totalWaiting = queueFunnel.WAITING;
    const totalProcessing = queueFunnel.CALLED + queueFunnel.ARRIVED + queueFunnel.VERIFICATION + queueFunnel.QUALITY_CHECK + queueFunnel.WEIGHING;
    const totalCompleted = queueFunnel.PROCUREMENT_CONFIRMED + queueFunnel.PAYMENT_PROCESSING + queueFunnel.PAYMENT_COMPLETED;
    const totalProduce = enrichedCentres.reduce((sum, c) => sum + c.produceTodayQuintals, 0);
    const totalPayable = enrichedCentres.reduce((sum, c) => sum + c.payableTodayRs, 0);

    // 11. Payment Pipeline Aggregation
    const payConfirmedProcs = procurements.filter((p) => p.status === 'COMPLETED');
    const payProcessing = payments.filter((p) => ['PAYMENT_INITIATED', 'PAYMENT_PROCESSING'].includes(p.currentStage));
    const payCompleted = payments.filter((p) => p.currentStage === 'PAID');

    const paymentPipeline = {
      confirmed: {
        count: payConfirmedProcs.length || queueFunnel.PROCUREMENT_CONFIRMED,
        amount: Math.round(payConfirmedProcs.reduce((sum, p) => sum + (Number(p.netPayableAmount) || 0), 0) || (totalPayable * 0.4))
      },
      processing: {
        count: payProcessing.length || queueFunnel.PAYMENT_PROCESSING,
        amount: Math.round(payProcessing.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0) || (totalPayable * 0.25))
      },
      completed: {
        count: payCompleted.length || queueFunnel.PAYMENT_COMPLETED,
        amount: Math.round(payCompleted.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0) || (totalPayable * 0.35))
      },
      demoNotice: 'Demo Payment Status — Visual Tracking Only'
    };

    // 12. Commodity Breakdown
    const cropStats = {
      Wheat: { crop: 'Wheat', quantityQuintals: 0, count: 0, payableRs: 0, mspRate: 2275 },
      Paddy: { crop: 'Paddy', quantityQuintals: 0, count: 0, payableRs: 0, mspRate: 2300 },
      Pulses: { crop: 'Pulses', quantityQuintals: 0, count: 0, payableRs: 0, mspRate: 6600 },
      Mustard: { crop: 'Mustard', quantityQuintals: 0, count: 0, payableRs: 0, mspRate: 5650 }
    };
    procurements.forEach((p) => {
      const c = p.cropType || 'Wheat';
      if (cropStats[c]) {
        cropStats[c].quantityQuintals += Number(p.netWeightQuintals) || 0;
        cropStats[c].payableRs += Number(p.netPayableAmount) || 0;
        cropStats[c].count += 1;
      }
    });

    // 13. Dynamic Operational Congestion Alerts
    const alerts = [];
    enrichedCentres.forEach((c) => {
      if (c.waitingCount >= 8) {
        alerts.push({
          id: `alert-queue-${c.id}`,
          severity: 'HIGH',
          priority: 'High',
          title: 'High Queue Threshold Exceeded',
          message: `${c.name} has ${c.waitingCount} farmers waiting in line, exceeding standard dispatch threshold.`,
          centreId: c.id,
          centreName: c.name,
          centreCode: c.centreCode,
          metric: `${c.waitingCount} Waiting (~${c.estimatedWaitMinutes} min)`
        });
      }
      if (c.queueLoadPercentage >= 80) {
        alerts.push({
          id: `alert-cap-${c.id}`,
          severity: 'CRITICAL',
          priority: 'Critical',
          title: 'Centre Approaching Peak Capacity',
          message: `${c.name} is operating at ${c.queueLoadPercentage}% capacity. Re-routing recommended.`,
          centreId: c.id,
          centreName: c.name,
          centreCode: c.centreCode,
          metric: `${c.queueLoadPercentage}% Capacity`
        });
      }
    });

    if (paymentPipeline.processing.count >= 6) {
      alerts.push({
        id: 'alert-payment-delay',
        severity: 'ATTENTION',
        priority: 'Attention',
        title: 'Payment Disbursement Queue Backlog',
        message: `${paymentPipeline.processing.count} transactions currently in payment processing stage.`,
        metric: `₹${paymentPipeline.processing.amount.toLocaleString('en-IN')}`
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 'alert-normal-ops',
        severity: 'INFO',
        priority: 'Informational',
        title: 'All Operational Zones Normal',
        message: 'District procurement centres operating within target turnaround SLA (<25 min).',
        metric: 'SLA Compliant'
      });
    }

    // 14. Composite District Operational Health & Governance Status
    let operationalHealthLevel = 'STABLE';
    let operationalHealthLabel = 'STABLE (OPTIMAL OPERATIONS)';
    let operationalHealthRationale = 'All 8 centres operating within normal throughput parameters (<20 min avg wait).';

    const criticalCount = enrichedCentres.filter((c) => c.health === 'CRITICAL').length;
    const watchCount = enrichedCentres.filter((c) => c.health === 'WATCH').length;

    if (criticalCount > 0 || totalWaiting >= 20) {
      operationalHealthLevel = 'ATTENTION_REQUIRED';
      operationalHealthLabel = 'ATTENTION REQUIRED';
      operationalHealthRationale = `${criticalCount} centre(s) experiencing elevated intake pressure or SLA risk. Prioritized dispatch active.`;
    } else if (watchCount > 0 || totalWaiting >= 10) {
      operationalHealthLevel = 'BUSY';
      operationalHealthLabel = 'BUSY (PEAK HARVEST INTAKE)';
      operationalHealthRationale = `Active peak delivery volume across Lucknow facilities. All bays operating within statutory SLAs.`;
    }

    res.status(200).json({
      success: true,
      data: {
        district: {
          name: 'Lucknow',
          districtCode: 'UP_LUK',
          state: 'Uttar Pradesh',
          stateCode: 'UP',
          scopeNotice: 'District-First Pilot Environment • Lucknow District',
          totalCentres: enrichedCentres.length,
          totalMandis: enrichedMandis.length,
          adjacentZonesCount: 4,
          adjacentZones: ['Unnao', 'Barabanki', 'Sitapur', 'Rae Bareli'],
          activeFarmers: queueEntries.length || 29,
          waitingFarmers: totalWaiting,
          processingFarmers: totalProcessing,
          completedToday: totalCompleted,
          totalProduceQuintals: Number(totalProduce.toFixed(1)),
          totalPayableRs: Math.round(totalPayable),
          operationalHealth: {
            level: operationalHealthLevel,
            label: operationalHealthLabel,
            rationale: operationalHealthRationale,
            criticalCentresCount: criticalCount,
            watchCentresCount: watchCount
          },
          procurementBottleneck: enrichedCentres.find(c => c.centreCode === 'LKO_GOM01')?.currentBottleneck || 'Quality Assaying'
        },
        procurementBottleneck: enrichedCentres.find(c => c.centreCode === 'LKO_GOM01')?.currentBottleneck || 'Quality Assaying',
        totalProcuredTodayQuintals: Number(totalProduce.toFixed(1)),
        centres: enrichedCentres,
        mandis: enrichedMandis,
        queueFunnel,
        recentFarmersQueue: [...queueEntries]
          .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
          .slice(0, 30)
          .map((q) => {
          const bIdStr = (q.bookingId?._id || q.bookingId)?.toString();
          const proc = procurements.find((p) => (p.bookingId?._id || p.bookingId)?.toString() === bIdStr || p.tokenNumber === q.tokenNumber);
          const pay = payments.find((p) => (p.bookingId?._id || p.bookingId)?.toString() === bIdStr);

          return {
            id: q._id ? q._id.toString() : q.id,
            tokenNumber: q.tokenNumber,
            state: q.state,
            counterId: q.counterId || 'Counter 1',
            farmerName: q.farmerId?.fullName || 'Farmer',
            phoneMasked: q.farmerId?.phone ? `******${q.farmerId.phone.slice(-4)}` : '******3210',
            village: q.farmerId?.villageName || 'Lucknow Rural',
            district: q.farmerId?.district || 'Lucknow',
            centreName: q.centreId?.name || 'Procurement Centre',
            centreCode: q.centreId?.centreCode || 'LKO_GOM01',
            cropType: proc?.cropType || q.bookingId?.cropType || 'Wheat',
            declaredQuantity: q.bookingId?.estimatedQuantityQuintals || 44.0,
            verifiedQuantity: proc?.verifiedQuantityQuintals || proc?.netWeightQuintals || 44.0,
            moisturePercentage: proc?.moisturePercentage ?? (q.state === 'BOOKED' || q.state === 'WAITING' ? null : 12.3),
            impurityPercentage: proc?.impurityPercentage ?? (q.state === 'BOOKED' || q.state === 'WAITING' ? null : 0.4),
            qualityGrade: proc?.qualityGrade || (['QUALITY_CHECK', 'WEIGHING', 'PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED'].includes(q.state) ? 'Grade A' : 'Pending'),
            grossWeightQuintals: proc?.grossWeightQuintals || (['WEIGHING', 'PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED'].includes(q.state) ? 45.5 : null),
            tareWeightQuintals: proc?.tareWeightQuintals || (['WEIGHING', 'PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED'].includes(q.state) ? 1.5 : null),
            netWeightQuintals: proc?.netWeightQuintals || (['PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED'].includes(q.state) ? 44.0 : null),
            mspRate: proc?.procurementRatePerQuintal || 2275,
            grossAmount: proc?.grossAmount || (['PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED'].includes(q.state) ? 100100 : null),
            netPayableAmount: proc?.netPayableAmount || (['PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED'].includes(q.state) ? 100100 : null),
            receiptSerialNumber: proc?.receiptSerialNumber || (['PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED'].includes(q.state) ? `REC-${q.centreId?.centreCode || 'LKO_GOM01'}-20260906-${q.sequenceNumber || 109}` : null),
            paymentStatus: pay?.currentStage || (q.state === 'PAYMENT_COMPLETED' ? 'PAID' : q.state === 'PAYMENT_PROCESSING' ? 'PROCESSING' : 'PENDING'),
            paymentReference: pay?.dbtReference || pay?.demoReferenceNumber || (['PAYMENT_PROCESSING', 'PAYMENT_COMPLETED'].includes(q.state) ? `DBT-LKO-2026-${q.tokenNumber || '109'}` : null),
            calledAt: q.calledAt,
            arrivedAt: q.arrivedAt,
            verificationStartedAt: q.verificationStartedAt,
            weighingStartedAt: q.weighingStartedAt,
            completedAt: q.completedAt || proc?.completedAt,
            updatedAt: q.updatedAt
          };
        }),
        commodityBreakdown: Object.values(cropStats),
        paymentPipeline,
        alerts,
        exceptions: [
          {
            id: 'EXC-LKO-001',
            severity: 'HIGH',
            tokenNumber: 'LKO-GOM-102',
            farmerName: 'Ramesh Patel',
            centreName: 'Krishi Seva Procurement Centre — Gomti Nagar',
            centreCode: 'LKO_GOM01',
            stage: 'Quality Assaying',
            problem: 'Moisture content measured at 14.8% (statutory limit ≤ 14.0%)',
            requiredAction: 'Provide on-site sun drying slot or re-assay following aeration',
            status: 'OPEN',
            reportedAt: '10:15 AM'
          },
          {
            id: 'EXC-LKO-002',
            severity: 'MEDIUM',
            tokenNumber: 'LKO-ALA-084',
            farmerName: 'Dinesh Yadav',
            centreName: 'APMC Sub-Mandi Procurement Centre — Alambagh',
            centreCode: 'LKO_ALA05',
            stage: 'Intake Verification',
            problem: 'Aadhaar name spelling mismatch with land revenue record khatauni',
            requiredAction: 'Tehsil revenue officer cross-verification or biometric override',
            status: 'IN_REVIEW',
            reportedAt: '11:05 AM'
          },
          {
            id: 'EXC-LKO-003',
            severity: 'LOW',
            tokenNumber: 'LKO-BKT-033',
            farmerName: 'Suresh Chandra',
            centreName: 'Bakshi Ka Talab Kisan Mandi',
            centreCode: 'LKO_BKT08',
            stage: 'Electronic Weighing',
            problem: 'Gross weight variance ±1.4% between axle scale and gross platform',
            requiredAction: 'Re-zero digital weighbridge and execute dual-pass tare validation',
            status: 'RESOLVED',
            reportedAt: '09:40 AM'
          },
          {
            id: 'EXC-LKO-004',
            severity: 'MEDIUM',
            tokenNumber: 'LKO-IND-047',
            farmerName: 'Manoj Kumar',
            centreName: 'Lucknow Grain Procurement Centre — Indira Nagar',
            centreCode: 'LKO_IND03',
            stage: 'Payment Settlement',
            problem: 'PFMS bank IFSC response delayed (NPCI clearing batch awaiting ack)',
            requiredAction: 'Re-trigger Aadhaar payment bridge (APB) validation batch',
            status: 'PENDING',
            reportedAt: '11:30 AM'
          }
        ],
        recentAuditLogs: auditLogs.slice(0, 10).map((l) => ({
          id: l._id ? l._id.toString() : l.id,
          createdAt: l.createdAt,
          actor: l.userRole,
          action: l.action,
          previousState: l.previousState,
          newState: l.newState,
          centreName: l.centreId?.name || 'Gomti Nagar Centre',
          tokenNumber: l.details?.tokenNumber || 'LKO-101',
          counterId: l.details?.counterId || 'Counter 1'
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAdminMandis = async (req, res, next) => {
  try {
    const mandis = await Mandi.find({ district: 'Lucknow', isActive: true }).lean();
    res.status(200).json({ success: true, count: mandis.length, data: mandis });
  } catch (err) {
    next(err);
  }
};

const getAdminCentreDetail = async (req, res, next) => {
  try {
    const { centreId } = req.params;
    let centre = null;
    try {
      centre = await ProcurementCentre.findById(centreId)
        .populate('mandiId')
        .populate('currentHeadId', 'fullName email phone designation isCentreHead')
        .lean();
    } catch (e) {
      centre = Array.from(inMemoryCentres.values()).find((c) => (c._id || c.id) === centreId || c.centreCode === centreId);
    }
    if (!centre) {
      centre = Array.from(inMemoryCentres.values()).find((c) => (c._id || c.id) === centreId || c.centreCode === centreId);
    }
    if (!centre) {
      return res.status(404).json({ success: false, error: { message: 'Centre not found' } });
    }

    const todayStr = getTodayIST();
    let centreQueue = [];
    try {
      centreQueue = await QueueEntry.find({ centreId: centre._id, queueDate: todayStr })
        .populate('farmerId', 'fullName phone villageName')
        .lean();
    } catch (e) {
      centreQueue = [];
    }

    let centreProcs = [];
    try {
      centreProcs = await Procurement.find({ centreId: centre._id }).lean();
    } catch (e) {
      centreProcs = [];
    }

    let staffList = [];
    try {
      staffList = await User.find({ assignedCentreId: centre._id, role: 'CENTRE_STAFF' })
        .select('_id fullName email phone designation isCentreHead accountStatus')
        .lean();
    } catch (e) {
      staffList = [];
    }

    let auditList = [];
    try {
      auditList = await AuditLog.find({ centreId: centre._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
    } catch (e) {
      auditList = [];
    }

    res.status(200).json({
      success: true,
      data: {
        centre,
        queue: centreQueue,
        procurements: centreProcs,
        staff: staffList,
        auditLogs: auditList
      }
    });
  } catch (err) {
    next(err);
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
  getCentreStaffList,
  getDistrictOverview,
  getAdminMandis,
  getAdminCentreDetail
};
