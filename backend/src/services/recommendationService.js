const { calculateEstimatedWaitTime } = require('./waitTimeService');

// Haversine formula to compute distance in km
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

/**
 * Deterministic Centre Recommendation Engine
 * Calculates Recommendation Cost (Lower = Better) based on normalized factors.
 */
const recommendCentre = (userLocation, centres, targetDate) => {
  if (!centres || centres.length === 0) {
    return { recommended: null, alternatives: [] };
  }

  const userLat = userLocation?.latitude || 23.2000;
  const userLon = userLocation?.longitude || 77.0800;

  // 1. Calculate raw metrics per centre
  const enrichedCentres = centres.map((centre) => {
    const centreLat = centre.location?.coordinates[1] || 23.2000;
    const centreLon = centre.location?.coordinates[0] || 77.0800;
    const distanceKm = calculateDistanceKm(userLat, userLon, centreLat, centreLon);
    const estimatedWaitMinutes = calculateEstimatedWaitTime(centre);
    const queueLoadPct = centre.currentLoadPercentage || 50;
    const capacityQuintals = centre.dailyCapacityQuintals || 1000;
    const hasAvailableSlots = centre.hasAvailableSlots !== false;

    return {
      centre,
      distanceKm,
      estimatedWaitMinutes,
      queueLoadPct,
      capacityQuintals,
      hasAvailableSlots
    };
  });

  // 2. Find min/max ranges for normalization
  const distances = enrichedCentres.map((c) => c.distanceKm);
  const minDist = Math.min(...distances);
  const maxDist = Math.max(...distances) || minDist + 1;

  const waits = enrichedCentres.map((c) => c.estimatedWaitMinutes);
  const minWait = Math.min(...waits);
  const maxWait = Math.max(...waits) || minWait + 1;

  const maxCap = Math.max(...enrichedCentres.map((c) => c.capacityQuintals)) || 1000;

  // 3. Compute Recommendation Cost (Lower = Better)
  const scoredCentres = enrichedCentres.map((item) => {
    // Normalization into [0, 1] where 0 is best
    const distScore = (item.distanceKm - minDist) / (maxDist - minDist || 1);
    const waitScore = (item.estimatedWaitMinutes - minWait) / (maxWait - minWait || 1);
    const loadScore = item.queueLoadPct / 100;
    const capScore = 1 - item.capacityQuintals / maxCap; // Higher capacity = lower cost score
    const availScore = item.hasAvailableSlots ? 0 : 1;

    const recommendationCost =
      0.40 * distScore +
      0.30 * waitScore +
      0.15 * loadScore +
      0.10 * capScore +
      0.05 * availScore;

    // Build transparent human-readable explanations based on empirical metrics
    const reasons = [];
    if (item.distanceKm <= minDist + 2) {
      reasons.push(`Nearby location (${item.distanceKm} km away)`);
    } else {
      reasons.push(`Accessible distance (${item.distanceKm} km)`);
    }

    if (item.estimatedWaitMinutes <= minWait + 15) {
      reasons.push(`Shorter current wait time (~${item.estimatedWaitMinutes} mins)`);
    } else {
      reasons.push(`Estimated wait time ~${item.estimatedWaitMinutes} mins`);
    }

    if (item.queueLoadPct < 50) {
      reasons.push(`Low queue congestion (${item.queueLoadPct}% capacity load)`);
    }

    if (item.hasAvailableSlots) {
      reasons.push(`Open delivery slots available today`);
    }

    return {
      ...item,
      recommendationCost: Math.round(recommendationCost * 1000) / 1000,
      reasons
    };
  });

  // Sort by Recommendation Cost ascending (Lower = Better)
  scoredCentres.sort((a, b) => a.recommendationCost - b.recommendationCost);

  const topPick = scoredCentres[0];
  const alternatives = scoredCentres.slice(1);

  return {
    recommended: {
      centre: topPick.centre,
      distanceKm: topPick.distanceKm,
      estimatedWaitMinutes: topPick.estimatedWaitMinutes,
      queueLoadPct: topPick.queueLoadPct,
      recommendationCost: topPick.recommendationCost,
      reasons: topPick.reasons
    },
    alternatives: alternatives.map((alt) => ({
      centre: alt.centre,
      distanceKm: alt.distanceKm,
      estimatedWaitMinutes: alt.estimatedWaitMinutes,
      queueLoadPct: alt.queueLoadPct,
      recommendationCost: alt.recommendationCost,
      reasons: alt.reasons
    }))
  };
};

module.exports = {
  recommendCentre,
  calculateDistanceKm
};
