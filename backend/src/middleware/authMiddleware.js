const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { DEMO_USERS_CANONICAL } = require('../config/demoUsers');

// In-memory fallback user store when MongoDB is disconnected during testing
const inMemoryUsers = new Map();

// Initialize standard demo accounts in memory for resilient testing & presentation
const initDemoUsers = () => {
  const commonHash = bcrypt.hashSync('password123', 10);
  const adminPassword = process.env.AGRINEXUS_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'adminpassword';
  const adminHash = bcrypt.hashSync(adminPassword, 10);

  DEMO_USERS_CANONICAL.forEach((u) => {
    const isAdm = u.role === 'ADMIN';
    const passwordHash = isAdm ? adminHash : commonHash;
    const userObj = {
      _id: u.id,
      id: u.id,
      fullName: u.fullName,
      phone: u.phone,
      email: isAdm ? (process.env.ADMIN_EMAIL || u.email) : u.email,
      role: u.role,
      assignedCentreId: u.assignedCentreId || null,
      accountStatus: u.accountStatus || 'ACTIVE',
      designation: u.designation || (u.role === 'FARMER' ? undefined : 'Staff'),
      isCentreHead: !!u.isCentreHead,
      languagePreference: u.languagePreference || 'en',
      district: u.district || 'Lucknow',
      state: u.state || 'Uttar Pradesh',
      villageName: u.villageName || '',
      stateCode: u.stateCode || 'UP',
      districtCode: u.districtCode || 'UP_LUK',
      localityCode: u.localityCode || '',
      locationSource: u.locationSource || 'REGISTERED',
      isActive: true,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryUsers.set(u.id, userObj);
  });
};

initDemoUsers();

const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token is required. Please log in.'
        }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_sih_2026_gov_key_change_in_production');

    let user = null;
    try {
      user = await User.findById(decoded.userId);
    } catch (dbErr) {
      user = inMemoryUsers.get(decoded.userId) || null;
    }

    if (!user && inMemoryUsers.has(decoded.userId)) {
      user = inMemoryUsers.get(decoded.userId);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The user belonging to this token no longer exists.'
        }
      });
    }

    if (user.isActive === false || user.accountStatus === 'INACTIVE' || user.accountStatus === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        error: {
          code: user.accountStatus === 'SUSPENDED' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_INACTIVE',
          message: 'This account has been deactivated or suspended. Access denied.'
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token.'
      }
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required before authorization check.'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Role '${req.user.role}' is not authorized to access this resource. Required: [${roles.join(', ')}]`
        }
      });
    }

    next();
  };
};

const optionalAuthenticate = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next();
  }
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_sih_2026_gov_key_change_in_production'
    );
    const userId = decoded.userId || decoded.id || decoded._id;
    let user = null;
    try {
      user = await User.findById(userId);
    } catch (e) {
      user = inMemoryUsers.get(userId);
    }
    if (!user) {
      user = inMemoryUsers.get(userId);
    }
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // Ignore invalid optional token
  }
  next();
};

const requireCentreAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication is required.' }
    });
  }
  if (req.user.role === 'ADMIN') return next();
  if (req.user.role !== 'CENTRE_STAFF') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only authorized Procurement Centre personnel can access this resource.' }
    });
  }
  const targetCentreId = req.params.centreId || req.query.centreId || req.body.centreId;
  if (targetCentreId) {
    const userCentre = req.user.assignedCentreId ? req.user.assignedCentreId.toString() : '';
    if (userCentre !== targetCentreId.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied: You can only access your assigned procurement centre.' }
      });
    }
  }
  next();
};

const requireCentreHead = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication is required.' }
    });
  }
  if (req.user.role === 'ADMIN') return next();
  if (req.user.role !== 'CENTRE_STAFF') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only authorized Procurement Centre personnel can access this resource.' }
    });
  }
  const isHead = req.user.isCentreHead === true || req.user.designation === 'Centre Head';
  if (!isHead) {
    return res.status(403).json({
      success: false,
      error: { code: 'CENTRE_HEAD_REQUIRED', message: 'Only the Appointed Head / Centre Head can perform this action.' }
    });
  }
  next();
};

const authorizeCentreAccess = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' }
      });
    }

    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (req.user.role !== 'CENTRE_STAFF') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only Centre Staff and Admins may access centre-scoped resources.' }
      });
    }

    const targetCentreId = req.params.centreId || req.query.centreId || req.body.centreId;
    if (targetCentreId && req.user.assignedCentreId) {
      const userCentre = req.user.assignedCentreId.toString();
      if (userCentre !== targetCentreId.toString()) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'CENTRE_ACCESS_DENIED',
            message: 'You are not authorized to perform operations for a centre other than your assigned facility.'
          }
        });
      }
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  optionalAuthenticate,
  requireCentreAccess,
  requireCentreHead,
  authorizeCentreAccess,
  inMemoryUsers
};

