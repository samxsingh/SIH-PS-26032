/**
 * AgriNexus User & Location Data Integrity Audit & Migration Utility
 * Safe, non-destructive audit tool for validating user administrative location integrity.
 */

const User = require('../models/User');
const { validateLocationHierarchy } = require('../data/locations');
const { inMemoryUsers } = require('../middleware/authMiddleware');

const auditAndMigrateUserLocations = async () => {
  const report = {
    timestamp: new Date().toISOString(),
    totalChecked: 0,
    validLocations: 0,
    invalidLocations: 0,
    recordsRequiringReview: 0,
    recordsRepaired: 0,
    details: []
  };

  let users = [];
  let isMongo = true;
  try {
    users = await User.find({});
  } catch (err) {
    isMongo = false;
    users = Array.from(inMemoryUsers.values());
  }

  report.totalChecked = users.length;

  for (const user of users) {
    const userId = user._id ? user._id.toString() : user.id;
    const validation = validateLocationHierarchy(
      user.state,
      user.district,
      user.villageName,
      user.locationSource
    );

    if (validation.valid) {
      report.validLocations++;
      // Check if codes need enrichment
      const needsEnrichment = !user.stateCode || !user.districtCode;
      if (needsEnrichment) {
        if (isMongo) {
          await User.findByIdAndUpdate(userId, {
            stateCode: validation.stateCode,
            districtCode: validation.districtCode,
            localityCode: validation.localityCode || user.localityCode,
            locationSource: user.locationSource || 'OFFICIAL_DATA'
          });
        } else {
          user.stateCode = validation.stateCode;
          user.districtCode = validation.districtCode;
          user.localityCode = validation.localityCode || user.localityCode;
          user.locationSource = user.locationSource || 'OFFICIAL_DATA';
        }
        report.recordsRepaired++;
      }
    } else {
      report.invalidLocations++;
      report.recordsRequiringReview++;
      report.details.push({
        userId,
        phone: user.phone,
        role: user.role,
        currentState: user.state,
        currentDistrict: user.district,
        reason: validation.message
      });

      // Mark as needing review non-destructively
      if (isMongo) {
        await User.findByIdAndUpdate(userId, {
          locationSource: 'NEEDS_REVIEW'
        });
      } else {
        user.locationSource = 'NEEDS_REVIEW';
      }
    }
  }

  return report;
};

module.exports = {
  auditAndMigrateUserLocations
};
