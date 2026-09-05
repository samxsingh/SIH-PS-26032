const mongoose = require('mongoose');

const mandiSchema = new mongoose.Schema(
  {
    mandiCode: {
      type: String,
      required: [true, 'Mandi code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Mandi name is required'],
      trim: true
    },
    category: {
      type: String,
      enum: ['PRINCIPAL_MARKET_YARD', 'SUB_MARKET_YARD', 'REGULATED_MANDI', 'PRIVATE_MANDI'],
      default: 'PRINCIPAL_MARKET_YARD'
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
      default: 'Lucknow'
    },
    districtCode: {
      type: String,
      trim: true,
      default: 'UP_LUK'
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      default: 'Uttar Pradesh'
    },
    stateCode: {
      type: String,
      trim: true,
      default: 'UP'
    },
    pincode: {
      type: String,
      trim: true,
      default: '226001'
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
    operatingAuthority: {
      type: String,
      default: 'UP State Agricultural Marketing Board (Mandi Parishad)'
    },
    supportedCommodities: {
      type: [String],
      default: ['Wheat', 'Paddy', 'Mustard', 'Gram', 'Maize', 'Barley']
    },
    operatingHours: {
      open: { type: String, default: '06:00' },
      close: { type: String, default: '20:00' }
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

mandiSchema.index({ location: '2dsphere' });
mandiSchema.index({ district: 1, isActive: 1 });

const Mandi = mongoose.model('Mandi', mandiSchema);

module.exports = Mandi;
