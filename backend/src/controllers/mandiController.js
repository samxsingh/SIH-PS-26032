const Mandi = require('../models/Mandi');
const ProcurementCentre = require('../models/ProcurementCentre');

// Fallback in-memory mandis
const inMemoryMandis = [
  {
    _id: 'm1',
    mandiCode: 'MND_LKO_DUB',
    name: 'Dubagga Naveen Phal Va Krishi Mandi Samiti',
    category: 'PRINCIPAL_MARKET_YARD',
    address: 'Hardoi Road, Dubagga, Lucknow',
    district: 'Lucknow',
    districtCode: 'UP_LUK',
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    pincode: '226003',
    location: { type: 'Point', coordinates: [80.8650, 26.8720] },
    operatingAuthority: 'UP State Agricultural Marketing Board (Mandi Parishad)',
    supportedCommodities: ['Wheat', 'Paddy', 'Mustard', 'Gram', 'Maize'],
    operatingHours: { open: '06:00', close: '20:00' },
    isActive: true
  },
  {
    _id: 'm2',
    mandiCode: 'MND_LKO_STP',
    name: 'Naveen Galla Mandi Samiti — Sitapur Road',
    category: 'PRINCIPAL_MARKET_YARD',
    address: 'Sitapur Road, Mohibullapur, Lucknow',
    district: 'Lucknow',
    districtCode: 'UP_LUK',
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    pincode: '226021',
    location: { type: 'Point', coordinates: [80.9320, 26.9050] },
    operatingAuthority: 'UP State Agricultural Marketing Board (Mandi Parishad)',
    supportedCommodities: ['Wheat', 'Paddy', 'Mustard', 'Barley'],
    operatingHours: { open: '06:00', close: '20:00' },
    isActive: true
  },
  {
    _id: 'm3',
    mandiCode: 'MND_LKO_MOH',
    name: 'Mohanlalganj Sub-Market Yard',
    category: 'SUB_MARKET_YARD',
    address: 'Raebareli Highway, Mohanlalganj, Lucknow',
    district: 'Lucknow',
    districtCode: 'UP_LUK',
    state: 'Uttar Pradesh',
    stateCode: 'UP',
    pincode: '226301',
    location: { type: 'Point', coordinates: [80.9850, 26.6800] },
    operatingAuthority: 'UP State Agricultural Marketing Board (Mandi Parishad)',
    supportedCommodities: ['Paddy', 'Wheat', 'Mustard'],
    operatingHours: { open: '07:00', close: '19:00' },
    isActive: true
  }
];

const getMandis = async (req, res, next) => {
  try {
    const { district } = req.query;
    let mandis = [];
    try {
      const query = { isActive: true };
      if (district) query.district = new RegExp(district, 'i');
      mandis = await Mandi.find(query).lean();
    } catch (dbErr) {
      mandis = inMemoryMandis;
    }

    if (!mandis || mandis.length === 0) {
      mandis = inMemoryMandis;
    }

    // Format for frontend
    const formatted = mandis.map(m => ({
      ...m,
      id: m._id ? m._id.toString() : m.id
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

const getMandiById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let mandi = null;
    try {
      mandi = await Mandi.findById(id).lean();
    } catch (err) {
      mandi = inMemoryMandis.find(m => m._id === id || m.id === id || m.mandiCode === id);
    }
    if (!mandi) {
      mandi = inMemoryMandis.find(m => m._id === id || m.id === id || m.mandiCode === id);
    }

    if (!mandi) {
      return res.status(404).json({
        success: false,
        error: { code: 'MANDI_NOT_FOUND', message: 'Mandi not found.' }
      });
    }

    // Also fetch associated centres
    let linkedCentres = [];
    try {
      linkedCentres = await ProcurementCentre.find({ mandiId: mandi._id || mandi.id, isActive: true }).select('name centreCode centreType location address dailyCapacityQuintals currentLoadPercentage activeQueueCount').lean();
    } catch (cErr) {}

    res.status(200).json({
      success: true,
      data: {
        ...mandi,
        id: mandi._id ? mandi._id.toString() : mandi.id,
        linkedCentres: linkedCentres.map(c => ({ ...c, id: c._id ? c._id.toString() : c.id }))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMandis,
  getMandiById,
  inMemoryMandis
};
