/**
 * AgriNexus - Canonical District Domain Configuration
 * 
 * Geographic Scope: Lucknow District (Primary Operational Territory) + Adjacent Operational Zones
 * Designed for hierarchical expansion: District -> State -> Country
 */

const CANONICAL_DISTRICTS = [
  {
    districtCode: 'UP_LUK',
    districtName: 'Lucknow',
    stateCode: 'UP',
    stateName: 'Uttar Pradesh',
    isPrimaryOperational: true,
    status: 'ACTIVE',
    coordinates: { latitude: 26.8467, longitude: 80.9462 },
    boundaryZones: [
      { code: 'UP_LUK_01', name: 'Bakshi Ka Talab' },
      { code: 'UP_LUK_02', name: 'Malihabad' },
      { code: 'UP_LUK_03', name: 'Mohanlalganj' },
      { code: 'UP_LUK_04', name: 'Sarojini Nagar' },
      { code: 'UP_LUK_05', name: 'Chinhat' },
      { code: 'UP_LUK_06', name: 'Gomti Nagar' },
      { code: 'UP_LUK_07', name: 'Aliganj' },
      { code: 'UP_LUK_08', name: 'Indira Nagar' },
      { code: 'UP_LUK_09', name: 'Jankipuram' },
      { code: 'UP_LUK_10', name: 'Alambagh' },
      { code: 'UP_LUK_11', name: 'Mohan Road' }
    ]
  },
  {
    districtCode: 'UP_UNN',
    districtName: 'Unnao',
    stateCode: 'UP',
    stateName: 'Uttar Pradesh',
    isPrimaryOperational: false,
    status: 'ADJACENT_ZONE',
    coordinates: { latitude: 26.5393, longitude: 80.4878 },
    boundaryZones: [
      { code: 'UP_UNN_01', name: 'Safi Pur' },
      { code: 'UP_UNN_02', name: 'Purwa' },
      { code: 'UP_UNN_03', name: 'Hasanganj' }
    ]
  },
  {
    districtCode: 'UP_BBK',
    districtName: 'Barabanki',
    stateCode: 'UP',
    stateName: 'Uttar Pradesh',
    isPrimaryOperational: false,
    status: 'ADJACENT_ZONE',
    coordinates: { latitude: 26.9268, longitude: 81.1834 },
    boundaryZones: [
      { code: 'UP_BBK_01', name: 'Nawabganj' },
      { code: 'UP_BBK_02', name: 'Fatehpur' },
      { code: 'UP_BBK_03', name: 'Haidergarh' }
    ]
  },
  {
    districtCode: 'UP_STP',
    districtName: 'Sitapur',
    stateCode: 'UP',
    stateName: 'Uttar Pradesh',
    isPrimaryOperational: false,
    status: 'ADJACENT_ZONE',
    coordinates: { latitude: 27.5670, longitude: 80.6829 },
    boundaryZones: [
      { code: 'UP_STP_01', name: 'Sidhauli' },
      { code: 'UP_STP_02', name: 'Maholi' }
    ]
  },
  {
    districtCode: 'UP_RBL',
    districtName: 'Rae Bareli',
    stateCode: 'UP',
    stateName: 'Uttar Pradesh',
    isPrimaryOperational: false,
    status: 'ADJACENT_ZONE',
    coordinates: { latitude: 26.2298, longitude: 81.2409 },
    boundaryZones: [
      { code: 'UP_RBL_01', name: 'Bachhrawan' },
      { code: 'UP_RBL_02', name: 'Lalganj' }
    ]
  }
];

const getPrimaryDistrict = () => CANONICAL_DISTRICTS.find(d => d.isPrimaryOperational);

const getDistrictByCode = (code) => CANONICAL_DISTRICTS.find(d => d.districtCode === code);

const getDistrictByName = (name) => {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  return CANONICAL_DISTRICTS.find(d => d.districtName.toLowerCase() === lower);
};

module.exports = {
  CANONICAL_DISTRICTS,
  getPrimaryDistrict,
  getDistrictByCode,
  getDistrictByName
};
