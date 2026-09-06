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
      roleTitle: 'Farmer',
      roleTitleHi: 'किसान',
      roleLabel: 'Farmer Demo',
      category: 'FARMER',
      description: 'Canonical Journey • Token GOM01-109 (Booked / Waiting)',
      descriptionHi: 'प्राथमिक यात्रा • टोकन GOM01-109 (स्लॉट आरक्षित)',
      location: 'Chinhat, Lucknow',
      district: 'Lucknow, Uttar Pradesh',
      identifier: '9876543210',
      identifierType: 'phone',
      crops: 'Wheat (गेहूं)',
      password: 'password123',
      badge: 'GOM01-109 • Booked'
    },
    {
      id: 'farmer_02',
      name: 'Chotey Lal',
      roleTitle: 'Farmer',
      roleTitleHi: 'किसान',
      roleLabel: 'Farmer Demo',
      category: 'FARMER',
      description: 'Completed Journey • Settled & DBT Paid',
      descriptionHi: 'पूर्ण खरीद यात्रा • प्रत्यक्ष लाभ अंतरण (DBT) भुगतान संपन्न',
      location: 'Gosainganj, Lucknow',
      district: 'Lucknow, Uttar Pradesh',
      identifier: '9876500055',
      identifierType: 'phone',
      crops: 'Wheat (गेहूं)',
      password: 'password123',
      badge: 'GOM01-101 • Paid'
    },
    {
      id: 'farmer_03',
      name: 'Ramlal Kashyap',
      roleTitle: 'Farmer',
      roleTitleHi: 'किसान',
      roleLabel: 'Farmer Demo',
      category: 'FARMER',
      description: 'Weighing Done • Procurement Confirmed',
      descriptionHi: 'धर्मकांटा तौल पूर्ण • खरीद पुष्ट',
      location: 'Mall, Lucknow',
      district: 'Lucknow, Uttar Pradesh',
      identifier: '9876500051',
      identifierType: 'phone',
      crops: 'Wheat (गेहूं)',
      password: 'password123',
      badge: 'GOM01-102 • Confirmed'
    },
    {
      id: 'farmer_04',
      name: 'Kavita Devi',
      roleTitle: 'Farmer',
      roleTitleHi: 'किसान',
      roleLabel: 'Farmer Demo',
      category: 'FARMER',
      description: 'Called to Counter • Intake In Progress',
      descriptionHi: 'टोकन बुलाया गया • काउंटर पर आगमन',
      location: 'Kakori, Lucknow',
      district: 'Lucknow, Uttar Pradesh',
      identifier: '9876500004',
      identifierType: 'phone',
      crops: 'Paddy (धान)',
      password: 'password123',
      badge: 'GOM01-107 • Called'
    },
    {
      id: 'farmer_05',
      name: 'Sunil Verma',
      roleTitle: 'Farmer',
      roleTitleHi: 'किसान',
      roleLabel: 'Farmer Demo',
      category: 'FARMER',
      description: 'At Centre • Document Verification Stage',
      descriptionHi: 'केंद्र उपस्थित • दस्तावेज़ सत्यापन जारी',
      location: 'Indira Nagar, Lucknow',
      district: 'Lucknow, Uttar Pradesh',
      identifier: '9876500006',
      identifierType: 'phone',
      crops: 'Mustard (सरसों)',
      password: 'password123',
      badge: 'GOM01-105 • Verification'
    },
    {
      id: 'farmer_06',
      name: 'Anil Kumar',
      roleTitle: 'Farmer',
      roleTitleHi: 'किसान',
      roleLabel: 'Farmer Demo',
      category: 'FARMER',
      description: 'Sample Assaying • Quality Testing Stage',
      descriptionHi: 'नमी व गुणवत्ता जांच • गुणवत्ता परीक्षण जारी',
      location: 'Alambagh, Lucknow',
      district: 'Lucknow, Uttar Pradesh',
      identifier: '9876500007',
      identifierType: 'phone',
      crops: 'Wheat (गेहूं)',
      password: 'password123',
      badge: 'GOM01-104 • Quality'
    }
  ],
  CENTRE_STAFF: [
    {
      id: 'centre_01',
      name: 'Satish Kumar',
      roleTitle: 'Centre Staff',
      roleTitleHi: 'केन्द्र कर्मचारी',
      roleLabel: 'Procurement Centre Operations',
      category: 'CENTRE_STAFF',
      description: 'Procurement centre operations',
      descriptionHi: 'खरीद केंद्र संचालन',
      centreName: 'Krishi Seva Procurement Centre — Gomti Nagar',
      location: 'Vibhuti Khand, Gomti Nagar',
      district: 'Lucknow, Uttar Pradesh',
      identifier: 'gomtinagar.centre@agrinexus.demo',
      identifierType: 'email',
      code: 'LKO_GOM01',
      password: 'password123',
      badge: 'Gomti Nagar'
    },
    {
      id: 'centre_02',
      name: 'Kisan Seva Manager — Jankipuram',
      roleTitle: 'Centre Staff',
      roleTitleHi: 'केन्द्र कर्मचारी',
      roleLabel: 'Procurement Centre Operations',
      category: 'CENTRE_STAFF',
      description: 'Procurement centre operations',
      descriptionHi: 'खरीद केंद्र संचालन',
      centreName: 'Kisan Seva Centre — Jankipuram',
      location: 'Engineering College Road, Jankipuram',
      district: 'Lucknow, Uttar Pradesh',
      identifier: 'jankipuram.centre@agrinexus.demo',
      identifierType: 'email',
      code: 'LKO_JAN04',
      password: 'password123',
      badge: 'Jankipuram'
    },
    {
      id: 'centre_03',
      name: 'Kishan Seva Manager — Aliganj',
      roleTitle: 'Centre Staff',
      roleTitleHi: 'केन्द्र कर्मचारी',
      roleLabel: 'Procurement Centre Operations',
      category: 'CENTRE_STAFF',
      description: 'Procurement centre operations',
      descriptionHi: 'खरीद केंद्र संचालन',
      centreName: 'Kisan Suvidha Procurement Centre — Aliganj',
      location: 'Sector B, Aliganj',
      district: 'Lucknow, Uttar Pradesh',
      identifier: 'aliganj.centre@agrinexus.demo',
      identifierType: 'email',
      code: 'LKO_ALI02',
      password: 'password123',
      badge: 'Aliganj'
    },
    {
      id: 'centre_04',
      name: 'Grain Mandi Incharge — Indira Nagar',
      roleTitle: 'Centre Staff',
      roleTitleHi: 'केन्द्र कर्मचारी',
      roleLabel: 'Procurement Centre Operations',
      category: 'CENTRE_STAFF',
      description: 'Procurement centre operations',
      descriptionHi: 'खरीद केंद्र संचालन',
      centreName: 'Lucknow Grain Procurement Centre — Indira Nagar',
      location: 'Ring Road, Sector 14, Indira Nagar',
      district: 'Lucknow, Uttar Pradesh',
      identifier: 'indiranagar.centre@agrinexus.demo',
      identifierType: 'email',
      code: 'LKO_IND03',
      password: 'password123',
      badge: 'Indira Nagar'
    },
    {
      id: 'centre_05',
      name: 'APMC Officer — Alambagh',
      roleTitle: 'Centre Staff',
      roleTitleHi: 'केन्द्र कर्मचारी',
      roleLabel: 'Procurement Centre Operations',
      category: 'CENTRE_STAFF',
      description: 'Procurement centre operations',
      descriptionHi: 'खरीद केंद्र संचालन',
      centreName: 'APMC Sub-Mandi Procurement Centre — Alambagh',
      location: 'Kanpur Road, Alambagh',
      district: 'Lucknow, Uttar Pradesh',
      identifier: 'alambagh.centre@agrinexus.demo',
      identifierType: 'email',
      code: 'LKO_ALA05',
      password: 'password123',
      badge: 'Alambagh'
    }
  ],
  ADMIN: [
    {
      id: 'admin_01',
      name: 'Administrator',
      roleTitle: 'Administrator',
      roleTitleHi: 'प्रशासक',
      roleLabel: 'District Administrator',
      category: 'ADMIN',
      description: 'District-level monitoring and operations',
      descriptionHi: 'जिला स्तरीय निगरानी एवं संचालन',
      location: 'District Command Centre, Lucknow',
      district: 'Lucknow, Uttar Pradesh',
      identifier: 'admin@agrinexus.gov.in',
      identifierType: 'email',
      password: 'adminpassword',
      badge: 'District Command',
      hideIdentifier: true
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
