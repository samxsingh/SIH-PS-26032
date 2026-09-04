const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      validate: {
        validator: function (v) {
          if (this.role === 'FARMER') {
            return !!v && /^[6-9]\d{9}$/.test(v.trim());
          }
          return true;
        },
        message: 'A valid 10-digit mobile number is required for Farmer accounts'
      }
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      validate: {
        validator: function (v) {
          if (this.role === 'CENTRE_STAFF' || this.role === 'ADMIN') {
            return !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
          }
          return true;
        },
        message: 'A valid email address is required for Staff and Admin accounts'
      }
    },
    emailNormalized: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      sparse: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false
    },
    role: {
      type: String,
      enum: ['FARMER', 'CENTRE_STAFF', 'ADMIN'],
      default: 'FARMER',
      required: true
    },
    languagePreference: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en'
    },
    district: {
      type: String,
      trim: true,
      default: 'Lucknow'
    },
    state: {
      type: String,
      trim: true,
      default: 'Uttar Pradesh'
    },
    villageName: {
      type: String,
      trim: true,
      default: 'Chinhat'
    },
    stateCode: {
      type: String,
      trim: true,
      default: 'UP'
    },
    districtCode: {
      type: String,
      trim: true,
      default: 'UP_LUK'
    },
    localityCode: {
      type: String,
      trim: true,
      default: 'UP_LUK_05'
    },
    locationSource: {
      type: String,
      enum: ['REGISTERED', 'GPS'],
      default: 'REGISTERED'
    },
    locationUpdatedAt: {
      type: Date,
      default: Date.now
    },
    assignedCentreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcurementCentre',
      default: null
    },
    designation: {
      type: String,
      trim: true,
      default: 'Procurement Operator'
    },
    isCentreHead: {
      type: Boolean,
      default: false
    },
    employeeId: {
      type: String,
      trim: true,
      sparse: true,
      default: null
    },
    dateOfJoining: {
      type: Date,
      default: Date.now
    },
    permissions: {
      type: [String],
      default: ['QUEUE_OPERATIONS', 'QUALITY_INSPECTION', 'WEIGHING', 'PROCUREMENT']
    },
    accountStatus: {
      type: String,
      enum: ['PENDING', 'PENDING_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'INACTIVE', 'REJECTED', 'NEEDS_CORRECTION', 'SUSPENDED'],
      default: 'ACTIVE'
    },
    applicationStatus: {
      type: String,
      enum: ['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_CORRECTION', 'NONE'],
      default: 'NONE'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

// Pre-save hook to normalize email
userSchema.pre('save', function (next) {
  if (this.email) {
    this.emailNormalized = this.email.trim().toLowerCase();
  }
  next();
});

// Method to verify password match
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Static method to hash password
userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Remove sensitive info when converting to JSON
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
