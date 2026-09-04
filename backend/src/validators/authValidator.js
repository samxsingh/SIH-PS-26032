const Joi = require('joi');
const { validateLocationHierarchy } = require('../data/locations');

const registerSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Full name is required',
    'string.min': 'Full name must be at least 2 characters long'
  }),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required().messages({
    'string.empty': 'Phone number is required',
    'string.pattern.base': 'Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9'
  }),
  email: Joi.string().email().allow('', null).optional(),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters long'
  }),
  role: Joi.string().valid('FARMER').default('FARMER').messages({
    'any.only': 'Privileged accounts (Staff, Admin) cannot be publicly registered.'
  }),
  languagePreference: Joi.string().valid('en', 'hi').default('en'),
  state: Joi.string().required().messages({
    'string.empty': 'State / Union Territory is required'
  }),
  district: Joi.string().required().messages({
    'string.empty': 'District is required'
  }),
  villageName: Joi.string().allow('', null).optional(),
  stateCode: Joi.string().allow('', null).optional(),
  districtCode: Joi.string().allow('', null).optional(),
  localityCode: Joi.string().allow('', null).optional(),
  locationSource: Joi.string().valid('OFFICIAL_DATA', 'USER_ENTERED', 'NEEDS_REVIEW').default('OFFICIAL_DATA')
});

const staffProvisionSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Staff full name is required'
  }),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required().messages({
    'string.empty': 'Phone number is required',
    'string.pattern.base': 'Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9'
  }),
  email: Joi.string().email().allow('', null).optional(),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required'
  }),
  assignedCentreId: Joi.string().required().messages({
    'string.empty': 'Assigned procurement centre ID is required'
  }),
  district: Joi.string().required(),
  state: Joi.string().default('Madhya Pradesh')
});

const loginSchema = Joi.object({
  phone: Joi.string().allow('', null).optional(),
  mobile: Joi.string().allow('', null).optional(),
  email: Joi.string().allow('', null).optional(),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  }),
  role: Joi.string().valid('FARMER', 'CENTRE_STAFF', 'ADMIN').optional()
}).or('phone', 'mobile', 'email').messages({
  'object.missing': 'Official email or mobile number is required'
});

const validateRegister = (req, res, next) => {
  // Reject explicit role escalation to ADMIN or CENTRE_STAFF
  if (req.body.role && req.body.role !== 'FARMER') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN_ROLE_ESCALATION',
        message: 'Privileged accounts (Staff, Admin) cannot be publicly registered. Access is strictly provisioned by Government Administrator.'
      }
    });
  }

  const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorDetails = error.details.map((detail) => detail.message);
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errorDetails[0],
        details: errorDetails
      }
    });
  }

  // Server-side Authoritative Location Hierarchy Validation
  const locValidation = validateLocationHierarchy(
    value.state,
    value.district,
    value.villageName,
    value.locationSource
  );

  if (!locValidation.valid) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: locValidation.message,
        details: [locValidation.message]
      }
    });
  }

  // Attach verified location attributes to request body
  req.body.state = locValidation.state;
  req.body.stateCode = locValidation.stateCode;
  req.body.district = locValidation.district;
  req.body.districtCode = locValidation.districtCode;
  req.body.villageName = locValidation.villageName;
  req.body.localityCode = locValidation.localityCode;
  req.body.locationSource = locValidation.locationSource;

  next();
};

const validateStaffProvision = (req, res, next) => {
  const { error } = staffProvisionSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorDetails = error.details.map((detail) => detail.message);
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errorDetails[0],
        details: errorDetails
      }
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorDetails = error.details.map((detail) => detail.message);
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errorDetails[0],
        details: errorDetails
      }
    });
  }
  next();
};

module.exports = {
  validateRegister,
  validateStaffProvision,
  validateLogin
};
