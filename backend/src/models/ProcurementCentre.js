const mongoose = require('mongoose');

const procurementCentreSchema = new mongoose.Schema(
  {
    centreCode: {
      type: String,
      required: [true, 'Centre code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Centre name is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    villageName: {
      type: String,
      trim: true,
      default: ''
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      default: 'Uttar Pradesh',
      trim: true
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
      default: ''
    },
    pincode: {
      type: String,
      trim: true,
      default: '466001'
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    verificationStatus: {
      type: String,
      enum: ['VERIFIED', 'UNVERIFIED', 'NEEDS_REVIEW', 'INACTIVE'],
      default: 'UNVERIFIED'
    },
    dataSource: {
      type: String,
      enum: ['GOVERNMENT_SOURCE', 'CENTRE_OPERATOR', 'ADMIN', 'DEMO'],
      default: 'DEMO'
    },
    sourceReference: {
      type: String,
      default: 'SIH 2026 Simulation Seed Record'
    },
    sourceName: {
      type: String,
      default: 'MPSCSC'
    },
    lastVerifiedAt: {
      type: Date,
      default: null
    },
    contactPhone: {
      type: String,
      default: '+91 7562 220011'
    },
    operatingHours: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '18:00' }
    },
    currentHeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    centreType: {
      type: String,
      enum: ['PROCUREMENT_CENTRE', 'MANDI', 'COLLECTION_POINT', 'MARKET_YARD'],
      default: 'PROCUREMENT_CENTRE'
    },
    mandiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mandi',
      default: null
    },
    staffIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    locality: {
      type: String,
      trim: true,
      default: ''
    },
    locationSource: {
      type: String,
      enum: ['GOOGLE_MAPS_CONFIRMED', 'USER_ENTERED', 'GOVERNMENT_SOURCE', 'DEMO'],
      default: 'DEMO'
    },
    dailyCapacityQuintals: {
      type: Number,
      required: true,
      default: 1000
    },
    maxConcurrentFarmers: {
      type: Number,
      default: 50
    },
    currentLoadPercentage: {
      type: Number,
      default: 0
    },
    activeQueueCount: {
      type: Number,
      default: 0
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

// 2dsphere index for geospatial location queries
procurementCentreSchema.index({ location: '2dsphere' });
procurementCentreSchema.index({ district: 1, isActive: 1 });
procurementCentreSchema.index({ verificationStatus: 1 });
procurementCentreSchema.index({ currentHeadId: 1 });
procurementCentreSchema.index({ mandiId: 1 });

const ProcurementCentre = mongoose.model('ProcurementCentre', procurementCentreSchema);

module.exports = ProcurementCentre;
