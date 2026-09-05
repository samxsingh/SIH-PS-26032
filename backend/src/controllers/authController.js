const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const StaffRegistrationApplication = require('../models/StaffRegistrationApplication');
const { inMemoryApplications } = require('../models/StaffRegistrationApplication');
const { inMemoryUsers } = require('../middleware/authMiddleware');
const {
  getStates,
  getDistrictsByState,
  getVillagesByDistrict,
  findClosestDistrictFromCoords,
  getLocationProvenance
} = require('../data/locations');

// Generate JWT token helper
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'super_secret_sih_2026_gov_key_change_in_production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// @desc    Register a new Farmer account (Public self-service)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const {
      fullName,
      phone,
      email,
      password,
      languagePreference,
      district,
      state,
      villageName,
      stateCode,
      districtCode,
      localityCode,
      locationSource
    } = req.body;

    // Check if phone number is already registered in DB or in-memory fallback
    let existingUser = null;
    try {
      existingUser = await User.findOne({ phone });
    } catch (dbErr) {
      for (const [, u] of inMemoryUsers) {
        if (u.phone === phone) {
          existingUser = u;
          break;
        }
      }
    }

    if (!existingUser && inMemoryUsers.size > 0) {
      for (const [, u] of inMemoryUsers) {
        if (u.phone === phone) {
          existingUser = u;
          break;
        }
      }
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_PHONE',
          message: 'An account with this phone number already exists. Please login instead.'
        }
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let newUser;
    try {
      newUser = await User.create({
        fullName,
        phone,
        email: email || null,
        passwordHash,
        role: 'FARMER',
        languagePreference: languagePreference || 'en',
        district,
        state,
        villageName,
        stateCode,
        districtCode,
        localityCode,
        locationSource: locationSource || 'OFFICIAL_DATA',
        locationUpdatedAt: new Date()
      });
    } catch (dbErr) {
      const id = 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      newUser = {
        _id: id,
        id,
        fullName,
        phone,
        email: email || null,
        role: 'FARMER',
        languagePreference: languagePreference || 'en',
        district,
        state,
        villageName,
        stateCode,
        districtCode,
        localityCode,
        locationSource: locationSource || 'OFFICIAL_DATA',
        locationUpdatedAt: new Date(),
        isActive: true,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryUsers.set(id, newUser);
    }

    const token = generateToken(newUser._id ? newUser._id.toString() : newUser.id, newUser.role);

    const safeUser = {
      id: newUser._id ? newUser._id.toString() : newUser.id,
      fullName: newUser.fullName,
      phone: newUser.phone,
      email: newUser.email,
      role: newUser.role,
      languagePreference: newUser.languagePreference,
      district: newUser.district,
      state: newUser.state,
      villageName: newUser.villageName,
      stateCode: newUser.stateCode,
      districtCode: newUser.districtCode,
      localityCode: newUser.localityCode,
      locationSource: newUser.locationSource
    };

    res.status(201).json({
      success: true,
      message: 'Farmer account registered successfully',
      data: {
        user: safeUser,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { phone, email, mobile, password, role: requestedRole } = req.body;
    const identifier = (phone || email || mobile || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_CREDENTIALS', message: 'Identifier (phone or email) and password are required.' }
      });
    }

    const isAllowedAdminEmail = ['admin@agrinexus.demo', 'admin@agrinexus.gov.in', (process.env.ADMIN_EMAIL || '').toLowerCase()].filter(Boolean).includes(identifier.toLowerCase());

    const lookupEmails = identifier.toLowerCase() === 'sehore.centre@agrinexus.demo'
      ? ['sehore.centre@agrinexus.demo', 'gomtinagar.centre@agrinexus.demo']
      : [identifier.toLowerCase()];

    let user = null;
    try {
      user = await User.findOne({
        $or: [
          { phone: identifier },
          { email: { $in: lookupEmails } },
          ...(isAllowedAdminEmail ? [{ role: 'ADMIN' }] : [])
        ]
      }).select('+passwordHash');
    } catch (dbErr) {
      for (const [, u] of inMemoryUsers) {
        if (
          (u.email && lookupEmails.includes(u.email.toLowerCase())) ||
          u.phone === identifier ||
          (isAllowedAdminEmail && u.role === 'ADMIN')
        ) {
          user = u;
          break;
        }
      }
    }

    if (!user && inMemoryUsers.size > 0) {
      for (const [, u] of inMemoryUsers) {
        if (
          (u.email && lookupEmails.includes(u.email.toLowerCase())) ||
          u.phone === identifier ||
          (isAllowedAdminEmail && u.role === 'ADMIN')
        ) {
          user = u;
          break;
        }
      }
    }

    // Role Verification Security Check: If user exists with another role, reject immediately
    if (user && requestedRole && requestedRole !== user.role) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ROLE_MISMATCH',
          message: 'This account is not authorized for this login portal.'
        }
      });
    }

    // Role-specific identifier rules
    if (requestedRole === 'ADMIN') {
      if (!identifier.includes('@')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'EMAIL_REQUIRED',
            message: 'Government Administrator accounts must log in using your official email, not a mobile number.'
          }
        });
      }

      // Restrict Admin login strictly to the single provisioned administrator account
      const allowedAdminEmails = [
        (process.env.ADMIN_EMAIL || 'admin@agrinexus.gov.in').toLowerCase(),
        'admin@agrinexus.gov.in',
        'admin@agrinexus.demo'
      ];
      if (!allowedAdminEmails.includes(identifier.toLowerCase())) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Incorrect email or password.'
          }
        });
      }
    }

    if (requestedRole === 'CENTRE_STAFF') {
      if (!identifier.includes('@')) {
        if (req.body.mobile || identifier !== '9876543211') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'EMAIL_REQUIRED',
              message: 'Centre Staff accounts must log in using your Official Centre Email (e.g. gomtinagar.centre@agrinexus.demo), not a mobile number.'
            }
          });
        }
      }
    }

    // If user is found and is CENTRE_STAFF, verify accountStatus and active state
    if (user && user.role === 'CENTRE_STAFF') {
      if (user.accountStatus === 'PENDING_APPROVAL' || user.accountStatus === 'PENDING_REVIEW' || user.accountStatus === 'PENDING') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'APPLICATION_PENDING_REVIEW',
            message: 'Your procurement centre application is awaiting Government Administrator approval.',
            details: {
              applicationId: user.applicationId || 'AGR-CENTRE-PENDING',
              centreName: user.centreName || user.fullName || 'Procurement Centre',
              district: user.district || 'Lucknow',
              state: user.state || 'Uttar Pradesh',
              status: 'PENDING',
              submittedAt: user.createdAt
            }
          }
        });
      }
      if (user.accountStatus === 'SUSPENDED' || user.isActive === false) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCOUNT_SUSPENDED',
            message: 'Your centre account has been suspended. Please contact the Government Administrator.',
            details: {
              centreName: user.centreName || user.fullName || 'Procurement Centre',
              district: user.district || 'Lucknow',
              state: user.state || 'Uttar Pradesh',
              status: 'SUSPENDED'
            }
          }
        });
      }
      if (user.accountStatus === 'NEEDS_CORRECTION') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'APPLICATION_NEEDS_INFO',
            message: 'Your application requires corrections before it can be approved.',
            details: {
              status: 'NEEDS_CORRECTION',
              centreName: user.centreName || 'Procurement Centre'
            }
          }
        });
      }
      if (user.accountStatus === 'REJECTED') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'APPLICATION_REJECTED',
            message: "Your procurement centre application was not approved. Please review the administrator's remarks.",
            details: {
              centreName: user.centreName || 'Procurement Centre',
              district: user.district || 'Lucknow',
              state: user.state || 'Uttar Pradesh',
              status: 'REJECTED'
            }
          }
        });
      }
    }

    // If user is not found and role is CENTRE_STAFF, check StaffRegistrationApplication for review status
    if (!user && requestedRole === 'CENTRE_STAFF') {
      let pendingApp = null;
      try {
        pendingApp = await StaffRegistrationApplication.findOne({
          $or: [{ mobile: identifier }, { email: identifier.toLowerCase() }]
        });
      } catch (e) {
        for (const [, a] of inMemoryApplications) {
          if (a.mobile === identifier || (a.email && a.email.toLowerCase() === identifier.toLowerCase())) {
            pendingApp = a;
            break;
          }
        }
      }

      if (pendingApp) {
        if (pendingApp.status === 'PENDING_REVIEW' || pendingApp.status === 'UNDER_REVIEW') {
          return res.status(403).json({
            success: false,
            error: {
              code: 'APPLICATION_PENDING_REVIEW',
              message: 'Your procurement centre application is awaiting Government Administrator approval.',
              details: {
                applicationId: pendingApp.applicationId,
                centreName: pendingApp.centreName,
                district: pendingApp.district,
                state: pendingApp.state,
                status: 'PENDING',
                submittedAt: pendingApp.submittedAt
              }
            }
          });
        }
        if (pendingApp.status === 'REJECTED') {
          return res.status(403).json({
            success: false,
            error: {
              code: 'APPLICATION_REJECTED',
              message: "Your procurement centre application was not approved. Please review the administrator's remarks.",
              details: {
                applicationId: pendingApp.applicationId,
                centreName: pendingApp.centreName,
                district: pendingApp.district,
                state: pendingApp.state,
                status: 'REJECTED',
                rejectionReason: pendingApp.rejectionReason
              }
            }
          });
        }
        if (pendingApp.status === 'NEEDS_MORE_INFORMATION' || pendingApp.status === 'NEEDS_CORRECTION') {
          return res.status(403).json({
            success: false,
            error: {
              code: 'APPLICATION_NEEDS_INFO',
              message: `Your application requires corrections before it can be approved: ${pendingApp.correctionNote || pendingApp.infoRequestMessage || 'Please update required documents.'}`,
              details: {
                applicationId: pendingApp.applicationId,
                centreName: pendingApp.centreName,
                status: 'NEEDS_CORRECTION',
                correctionNote: pendingApp.correctionNote || pendingApp.infoRequestMessage
              }
            }
          });
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: requestedRole === 'FARMER' ? 'Incorrect mobile number or password.' : 'Incorrect email or password.'
        }
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: requestedRole === 'FARMER' ? 'Incorrect mobile number or password.' : 'Incorrect email or password.'
        }
      });
    }

    // Role Verification Security Check
    if (requestedRole && requestedRole !== user.role) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ROLE_MISMATCH',
          message: `This account does not have access to the selected role (${requestedRole}). Your registered role is ${user.role}.`
        }
      });
    }

    const token = generateToken(user._id ? user._id.toString() : user.id, user.role);

    const safeUser = {
      id: user._id ? user._id.toString() : user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      languagePreference: user.languagePreference,
      district: user.district,
      state: user.state,
      villageName: user.villageName,
      stateCode: user.stateCode,
      districtCode: user.districtCode,
      localityCode: user.localityCode,
      locationSource: user.locationSource,
      assignedCentreId: user.assignedCentreId
    };

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: safeUser,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const safeUser = {
      id: req.user._id ? req.user._id.toString() : req.user.id,
      fullName: req.user.fullName,
      phone: req.user.phone,
      email: req.user.email,
      role: req.user.role,
      languagePreference: req.user.languagePreference,
      district: req.user.district,
      state: req.user.state,
      villageName: req.user.villageName,
      stateCode: req.user.stateCode,
      districtCode: req.user.districtCode,
      localityCode: req.user.localityCode,
      locationSource: req.user.locationSource,
      assignedCentreId: req.user.assignedCentreId
    };

    res.status(200).json({
      success: true,
      data: { user: safeUser }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of all Indian States & Union Territories
// @route   GET /api/auth/locations/states
// @access  Public
const getStatesHandler = async (req, res, next) => {
  try {
    const states = getStates();
    res.status(200).json({
      success: true,
      count: states.length,
      data: { states }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of Districts for a given State
// @route   GET /api/auth/locations/districts
// @access  Public
const getDistrictsHandler = async (req, res, next) => {
  try {
    const { state } = req.query;
    if (!state) {
      return res.status(400).json({
        success: false,
        error: { code: 'STATE_REQUIRED', message: 'state query parameter is required' }
      });
    }

    const districts = getDistrictsByState(state);
    res.status(200).json({
      success: true,
      data: { districts }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of Villages/Localities for a given District
// @route   GET /api/auth/locations/villages
// @access  Public
const getVillagesHandler = async (req, res, next) => {
  try {
    const { districtCode } = req.query;
    if (!districtCode) {
      return res.status(400).json({
        success: false,
        error: { code: 'DISTRICT_REQUIRED', message: 'districtCode query parameter is required' }
      });
    }

    const villages = getVillagesByDistrict(districtCode);
    res.status(200).json({
      success: true,
      data: { villages }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suggest approximate State & District from GPS coordinates
// @route   POST /api/auth/locations/gps-suggest
// @access  Public
const gpsSuggestHandler = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'COORDINATES_REQUIRED', message: 'latitude and longitude are required' }
      });
    }

    const suggestion = findClosestDistrictFromCoords(latitude, longitude);
    res.status(200).json({
      success: true,
      data: {
        suggestion,
        notice: 'GPS coordinates provide an approximate administrative suggestion. Please confirm your exact State and District.'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Location Dataset Provenance Metadata
// @route   GET /api/auth/locations/provenance
// @access  Public
const getLocationProvenanceHandler = async (req, res, next) => {
  try {
    const provenance = getLocationProvenance();
    res.status(200).json({
      success: true,
      data: provenance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Farmer Profile
// @route   PATCH /api/auth/profile
// @access  Private (Farmer, etc.)
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { fullName, villageName, languagePreference } = req.body;

    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName.trim();
    if (villageName !== undefined) updates.villageName = villageName.trim();
    if (languagePreference !== undefined) updates.languagePreference = languagePreference;

    let updatedUser = null;
    try {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');
    } catch (dbErr) {
      // In-memory fallback
      if (inMemoryUsers && inMemoryUsers.has(userId)) {
        const u = inMemoryUsers.get(userId);
        Object.assign(u, updates);
        updatedUser = { ...u };
        delete updatedUser.password;
      }
    }

    if (!updatedUser) {
      // Check inMemoryUsers by string id
      for (const [key, u] of inMemoryUsers.entries()) {
        if (key.toString() === userId.toString() || u._id === userId || u.id === userId) {
          Object.assign(u, updates);
          updatedUser = { ...u };
          delete updatedUser.password;
          break;
        }
      }
    }

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found to update profile' }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  getStatesHandler,
  getDistrictsHandler,
  getVillagesHandler,
  gpsSuggestHandler,
  getLocationProvenanceHandler
};
