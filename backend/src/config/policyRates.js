/**
 * Centralized Government Minimum Support Price (MSP) Policy Rate Configuration
 * Department of Consumer Affairs / Ministry of Agriculture & Farmers Welfare
 * Season: KMS / RMS 2026-27 (Madhya Pradesh & Central Pool)
 */

const MSP_POLICY_RATES = {
  Wheat: {
    cropType: 'Wheat',
    hindiName: 'गेहूं',
    mspRatePerQuintal: 2275,
    effectiveFrom: '2026-04-01',
    effectiveTo: '2027-03-31',
    standardMoistureLimitPercentage: 14.0,
    policySeason: 'RMS 2026-27',
    sourceAgency: 'CACP / Department of Consumer Affairs'
  },
  Paddy: {
    cropType: 'Paddy',
    hindiName: 'धान',
    mspRatePerQuintal: 2300,
    effectiveFrom: '2026-10-01',
    effectiveTo: '2027-09-30',
    standardMoistureLimitPercentage: 17.0,
    policySeason: 'KMS 2026-27',
    sourceAgency: 'CACP / Department of Consumer Affairs'
  },
  Pulses: {
    cropType: 'Pulses',
    hindiName: 'दलहन (चना/अरहर)',
    mspRatePerQuintal: 6600,
    effectiveFrom: '2026-04-01',
    effectiveTo: '2027-03-31',
    standardMoistureLimitPercentage: 12.0,
    policySeason: 'RMS 2026-27',
    sourceAgency: 'CACP / Department of Consumer Affairs'
  },
  Mustard: {
    cropType: 'Mustard',
    hindiName: 'सरसों',
    mspRatePerQuintal: 5650,
    effectiveFrom: '2026-04-01',
    effectiveTo: '2027-03-31',
    standardMoistureLimitPercentage: 9.0,
    policySeason: 'RMS 2026-27',
    sourceAgency: 'CACP / Department of Consumer Affairs'
  }
};

/**
 * Server-authoritative MSP rate lookup
 * Guaranteed not to be overridable by client payloads
 */
const getMspRateForCrop = (cropType) => {
  const policy = MSP_POLICY_RATES[cropType];
  if (!policy) {
    // Default fallback to Wheat MSP
    return 2275;
  }
  return policy.mspRatePerQuintal;
};

const getPolicyMetadata = () => {
  return {
    season: '2026-27 Government Procurement Operations',
    supportedCrops: Object.values(MSP_POLICY_RATES),
    sourceNotice: 'Official MSP Policy Rates authorized for Government Central Pool'
  };
};

module.exports = {
  MSP_POLICY_RATES,
  getMspRateForCrop,
  getPolicyMetadata
};
