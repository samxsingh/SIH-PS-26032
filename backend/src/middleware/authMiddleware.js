const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// In-memory fallback user store when MongoDB is disconnected during testing
const inMemoryUsers = new Map();

// Initialize standard demo accounts in memory for resilient testing & presentation
const initDemoUsers = () => {
  const commonHash = bcrypt.hashSync('password123', 10);
  const adminPassword = process.env.AGRINEXUS_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'adminpassword';
  const adminHash = bcrypt.hashSync(adminPassword, 10);

  const farmer = {
    _id: 'user_farmer_01',
    id: 'user_farmer_01',
    fullName: 'Ramesh Patel',
    phone: '9876543210',
    email: 'farmer@agrinexus.gov.in',
    role: 'FARMER',
    languagePreference: 'en',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    villageName: 'Chinhat',
    stateCode: 'UP',
    districtCode: 'UP_LUK',
    localityCode: 'UP_LUK_05',
    locationSource: 'REGISTERED',
    isActive: true,
    passwordHash: commonHash,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const staff = {
    _id: 'user_staff_01',
    id: 'user_staff_01',
    fullName: 'Satish Kumar',
    phone: '9876543211',
    email: 'gomtinagar.centre@agrinexus.demo',
    role: 'CENTRE_STAFF',
    assignedCentreId: 'c1',
    accountStatus: 'ACTIVE',
    designation: 'Centre Head',
    isCentreHead: true,
    languagePreference: 'en',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    isActive: true,
    passwordHash: commonHash,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const staff2 = {
    _id: 'user_staff_02',
    id: 'user_staff_02',
    fullName: 'Ravi Sharma',
    phone: '9876543213',
    email: 'ravi.sharma@agrinexus.demo',
    role: 'CENTRE_STAFF',
    assignedCentreId: 'c1',
    accountStatus: 'ACTIVE',
    designation: 'Procurement Operator',
    isCentreHead: false,
    languagePreference: 'en',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    isActive: true,
    passwordHash: commonHash,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const staff3 = {
    _id: 'user_staff_03',
    id: 'user_staff_03',
    fullName: 'Anil Verma',
    phone: '9876543214',
    email: 'anil.verma@agrinexus.demo',
    role: 'CENTRE_STAFF',
    assignedCentreId: 'c1',
    accountStatus: 'ACTIVE',
    designation: 'Quality Inspector',
    isCentreHead: false,
    languagePreference: 'en',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    isActive: true,
    passwordHash: commonHash,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const staff4 = {
    _id: 'user_staff_04',
    id: 'user_staff_04',
    fullName: 'Amit Sharma',
    phone: '9876543215',
    email: 'amit.sharma@agrinexus.demo',
    role: 'CENTRE_STAFF',
    assignedCentreId: 'c1',
    accountStatus: 'ACTIVE',
    designation: 'Procurement Officer',
    isCentreHead: false,
    languagePreference: 'en',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    isActive: true,
    passwordHash: commonHash,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const staff5 = {
    _id: 'user_staff_05',
    id: 'user_staff_05',
    fullName: 'Pooja Verma',
    phone: '9876543216',
    email: 'pooja.verma@agrinexus.demo',
    role: 'CENTRE_STAFF',
    assignedCentreId: 'c1',
    accountStatus: 'ACTIVE',
    designation: 'Quality Inspector',
    isCentreHead: false,
    languagePreference: 'en',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    isActive: true,
    passwordHash: commonHash,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const admin = {
    _id: 'user_admin_01',
    id: 'user_admin_01',
    fullName: 'Government Administrator (Demo)',
    phone: '9876543212',
    email: process.env.ADMIN_EMAIL || 'admin@agrinexus.gov.in',
    role: 'ADMIN',
    languagePreference: 'en',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    isActive: true,
    passwordHash: adminHash,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  inMemoryUsers.set(farmer.id, farmer);
  inMemoryUsers.set(staff.id, staff);
  inMemoryUsers.set('user_staff_sehore_alias', { ...staff, id: 'user_staff_sehore_alias', email: 'sehore.centre@agrinexus.demo' });
  inMemoryUsers.set(staff2.id, staff2);
  inMemoryUsers.set(staff3.id, staff3);
  inMemoryUsers.set(staff4.id, staff4);
  inMemoryUsers.set(staff5.id, staff5);
  inMemoryUsers.set(admin.id, admin);
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

    // Try fetching from MongoDB first
    let user;
    try {
      user = await User.findById(decoded.userId).select('-passwordHash');
    } catch (dbErr) {
      user = inMemoryUsers.get(decoded.userId);
    }

    if (!user) {
      user = inMemoryUsers.get(decoded.userId);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'The user account associated with this token no longer exists.'
        }
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Your account has been deactivated. Please contact administrator.'
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Your session has expired. Please log in again.'
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authorization token.'
      }
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Action requires one of the following roles: ${roles.join(', ')}.`
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

module.exports = {
  authenticate,
  authorize,
  optionalAuthenticate,
  requireCentreAccess,
  requireCentreHead,
  inMemoryUsers
};
