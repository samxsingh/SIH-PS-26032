/**
 * AgriNexus - Centralized Demo Accounts Registry
 * 
 * Standard demonstration credentials matching backend seed & test environments.
 * Strictly organized by portal role. Passwords are never displayed in the visible UI.
 */

export const DEMO_ACCOUNTS = {
  FARMER: [
    {
      id: 'farmer_01',
      name: 'Ramesh Patel',
      roleLabel: 'Farmer Demo',
      category: 'FARMER',
      location: 'Chinhat, Lucknow',
      district: 'Lucknow, Uttar Pradesh',
      identifier: '9876543210',
      identifierType: 'phone',
      crops: 'Wheat, Paddy',
      password: 'password123',
      badge: 'Verified Farmer'
    },
    {
      id: 'farmer_02',
      name: 'Rahul Sharma',
      roleLabel: 'Farmer Demo',
      category: 'FARMER',
      location: 'Malihabad, Lucknow',
      district: 'Lucknow, Uttar Pradesh',
      identifier: '9876543220',
      identifierType: 'phone',
      crops: 'Mustard, Wheat',
      password: 'password123',
      badge: 'Verified Farmer'
    },
    {
      id: 'farmer_03',
      name: 'Priya Verma',
      roleLabel: 'Farmer Demo',
      category: 'FARMER',
      location: 'Bakshi Ka Talab, Lucknow',
      district: 'Lucknow, Uttar Pradesh',
      identifier: '9876543221',
      identifierType: 'phone',
      crops: 'Paddy, Pulses',
      password: 'password123',
      badge: 'Verified Farmer'
    },
    {
      id: 'farmer_04',
      name: 'Amit Yadav',
      roleLabel: 'Farmer Demo',
      category: 'FARMER',
      location: 'Mohan Road, Lucknow',
      district: 'Lucknow, Uttar Pradesh',
      identifier: '9876543202',
      identifierType: 'phone',
      crops: 'Wheat, Gram',
      password: 'password123',
      badge: 'Verified Farmer'
    }
  ],
  CENTRE_STAFF: [
    {
      id: 'centre_01',
      name: 'Gomti Nagar Procurement Centre',
      roleLabel: 'Procurement Centre',
      category: 'CENTRE',
      location: 'Vibhuti Khand, Gomti Nagar',
      district: 'Lucknow, Uttar Pradesh',
      identifier: 'gomtinagar.centre@agrinexus.demo',
      identifierType: 'email',
      code: 'LKO_GOM01',
      password: 'password123',
      badge: 'Authorized Mandi'
    },
    {
      id: 'centre_02',
      name: 'Sehore Mandi Procurement Centre',
      roleLabel: 'Procurement Centre',
      category: 'CENTRE',
      location: 'Krishi Upaj Mandi, Sehore',
      district: 'Sehore, Madhya Pradesh',
      identifier: 'sehore.centre@agrinexus.demo',
      identifierType: 'email',
      code: 'SEH01',
      password: 'password123',
      badge: 'Authorized Mandi'
    },
    {
      id: 'centre_03',
      name: 'Aliganj Kisan Suvidha Centre',
      roleLabel: 'Procurement Centre',
      category: 'CENTRE',
      location: 'Sector B, Aliganj',
      district: 'Lucknow, Uttar Pradesh',
      identifier: 'aliganj.centre@agrinexus.demo',
      identifierType: 'email',
      code: 'LKO_ALI02',
      password: 'password123',
      badge: 'Authorized Mandi'
    },
    {
      id: 'centre_04',
      name: 'Indira Nagar Grain Procurement Centre',
      roleLabel: 'Procurement Centre',
      category: 'CENTRE',
      location: 'Sector 14, Indira Nagar',
      district: 'Lucknow, Uttar Pradesh',
      identifier: 'indiranagar.centre@agrinexus.demo',
      identifierType: 'email',
      code: 'LKO_IND03',
      password: 'password123',
      badge: 'Authorized Mandi'
    },
    {
      id: 'centre_05',
      name: 'Alambagh APMC Sub-Mandi Centre',
      roleLabel: 'Procurement Centre',
      category: 'CENTRE',
      location: 'Kanpur Road, Alambagh',
      district: 'Lucknow, Uttar Pradesh',
      identifier: 'alambagh.centre@agrinexus.demo',
      identifierType: 'email',
      code: 'LKO_ALA05',
      password: 'password123',
      badge: 'Authorized Mandi'
    }
  ],
  ADMIN: [
    {
      id: 'admin_01',
      name: 'AgriNexus State Administrator',
      roleLabel: 'Government Administrator',
      category: 'ADMIN',
      organization: 'Department of Food & Public Distribution, Uttar Pradesh',
      location: 'State Command Centre, Lucknow',
      district: 'Lucknow, Uttar Pradesh',
      identifier: 'admin@agrinexus.gov.in',
      identifierType: 'email',
      password: 'adminpassword',
      badge: 'State Oversight'
    }
  ]
};

/**
 * Get demo accounts filtered strictly for the active portal role.
 * @param {'FARMER'|'CENTRE_STAFF'|'ADMIN'} role Current active portal role
 * @returns {Array} List of demo account definitions
 */
export const getDemoAccountsForRole = (role) => {
  const normalized = (role || '').toUpperCase();
  if (normalized === 'FARMER') return DEMO_ACCOUNTS.FARMER || [];
  if (normalized === 'CENTRE_STAFF' || normalized === 'CENTRE') return DEMO_ACCOUNTS.CENTRE_STAFF || [];
  if (normalized === 'ADMIN') return DEMO_ACCOUNTS.ADMIN || [];
  return [];
};

export default DEMO_ACCOUNTS;
