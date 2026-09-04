const mongoose = require('mongoose');

// In-memory fallback map for test environments
const inMemoryApplications = new Map();

const staffRegistrationApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    fullName: {
      type: String,
      required: [true, 'Authorized representative name is required'],
      trim: true
    },
    mobile: {
      type: String,
      required: [true, 'Contact mobile number is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Official centre email address is required'],
      trim: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false
    },
    centreName: {
      type: String,
      required: [true, 'Procurement centre name is required'],
      trim: true
    },
    centreType: {
      type: String,
      enum: ['APMC_MANDI', 'GOVERNMENT_CENTRE', 'COOPERATIVE', 'AUTHORIZED_PRIVATE', 'OTHER'],
      default: 'GOVERNMENT_CENTRE',
      required: true
    },
    registrationNumber: {
      type: String,
      trim: true,
      default: ''
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    stateCode: {
      type: String,
      required: [true, 'State code is required'],
      trim: true
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true
    },
    districtCode: {
      type: String,
      required: [true, 'District code is required'],
      trim: true
    },
    localityName: {
      type: String,
      trim: true,
      default: ''
    },
    localityCode: {
      type: String,
      trim: true,
      default: ''
    },
    locationSource: {
      type: String,
      enum: ['OFFICIAL_DATA', 'USER_ENTERED'],
      default: 'OFFICIAL_DATA'
    },
    address: {
      type: String,
      required: [true, 'Complete centre address is required'],
      trim: true
    },
    pinCode: {
      type: String,
      required: [true, 'PIN code is required'],
      trim: true
    },
    centreContact: {
      type: String,
      required: [true, 'Centre contact number is required'],
      trim: true
    },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    documents: [
      {
        documentId: { type: String, required: true },
        docType: {
          type: String,
          enum: [
            'CENTRE_REGISTRATION',
            'MANDI_AUTHORIZATION',
            'GOVT_AUTHORIZATION_LETTER',
            'GOVT_AUTHORIZATION',
            'COOPERATIVE_REGISTRATION',
            'ADDRESS_PROOF',
            'REPRESENTATIVE_ID',
            'SUPPORTING_DOC'
          ],
          required: true
        },
        docName: { type: String, required: true },
        originalFileName: { type: String, required: true },
        storageReference: { type: String, default: '' },
        filePath: { type: String, default: '' },
        mimeType: { type: String, default: 'application/pdf' },
        fileSize: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ['PENDING', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED'],
          default: 'PENDING_REVIEW'
        },
        verifiedAt: { type: Date, default: null },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        notes: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    status: {
      type: String,
      enum: [
        'PENDING_REVIEW',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED',
        'NEEDS_CORRECTION',
        'NEEDS_MORE_INFORMATION'
      ],
      default: 'PENDING_REVIEW',
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectedAt: {
      type: Date,
      default: null
    },
    approvalNote: {
      type: String,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },
    correctionNote: {
      type: String,
      default: null
    },
    infoRequestMessage: {
      type: String,
      default: null
    },
    assignedCentreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcurementCentre',
      default: null
    },
    createdUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true,
    bufferCommands: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual properties for structured representation
staffRegistrationApplicationSchema.virtual('representative').get(function () {
  return {
    fullName: this.fullName,
    email: this.email,
    phone: this.mobile
  };
});

staffRegistrationApplicationSchema.virtual('centreDetails').get(function () {
  return {
    name: this.centreName,
    type: this.centreType,
    registrationNumber: this.registrationNumber,
    address: this.address,
    state: this.state,
    district: this.district,
    locality: this.localityName,
    pinCode: this.pinCode,
    contact: this.centreContact
  };
});

staffRegistrationApplicationSchema.index({ mobile: 1 });
staffRegistrationApplicationSchema.index({ email: 1 });
staffRegistrationApplicationSchema.index({ status: 1 });
staffRegistrationApplicationSchema.index({ districtCode: 1 });

const StaffRegistrationApplication = mongoose.model(
  'StaffRegistrationApplication',
  staffRegistrationApplicationSchema
);

module.exports = StaffRegistrationApplication;
module.exports.inMemoryApplications = inMemoryApplications;
