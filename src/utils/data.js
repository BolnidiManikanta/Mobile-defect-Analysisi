// ═══════════════════════════════════════════════════════════
// SMARTSEP AI — Device Database + Seed Data
// ═══════════════════════════════════════════════════════════

export const BRANDS = [
  'Apple','Samsung','OnePlus','Xiaomi/Redmi','Realme',
  'Vivo','OPPO','Motorola','Nokia','Itel','Lava','Other'
];

export const MODELS = {
  Apple: [
    'iPhone 15 Pro Max','iPhone 15 Pro','iPhone 15 Plus','iPhone 15',
    'iPhone 14 Pro Max','iPhone 14 Pro','iPhone 14 Plus','iPhone 14',
    'iPhone 13 Pro Max','iPhone 13 Pro','iPhone 13','iPhone 13 Mini',
    'iPhone 12 Pro Max','iPhone 12 Pro','iPhone 12','iPhone 12 Mini',
    'iPhone SE (3rd Gen)','iPhone 11 Pro Max','iPhone 11 Pro','iPhone 11',
    'iPhone XS Max','iPhone XS','iPhone XR','iPhone X',
  ],
  Samsung: [
    'Galaxy S24 Ultra','Galaxy S24+','Galaxy S24','Galaxy S23 Ultra','Galaxy S23+',
    'Galaxy Z Fold5','Galaxy Z Fold4','Galaxy Z Flip5','Galaxy Z Flip4',
    'Galaxy A55 5G','Galaxy A35 5G','Galaxy A34 5G','Galaxy A15',
    'Galaxy M54 5G','Galaxy M34 5G','Galaxy M14 5G','Galaxy F55 5G',
    'Galaxy F15 5G','Galaxy F14 5G',
  ],
  OnePlus: [
    'OnePlus 12','OnePlus 12R','OnePlus 11','OnePlus 11R','OnePlus 10 Pro',
    'Nord 4','Nord CE4','Nord CE4 Lite','Nord CE3 Lite','Nord CE3 5G',
    'Nord 3 5G','Nord 2T','OnePlus Open','OnePlus 10T',
  ],
  'Xiaomi/Redmi': [
    'Redmi Note 13 Pro+','Redmi Note 13 Pro','Redmi Note 13','Redmi Note 13 5G',
    'Redmi Note 12 Pro+','Redmi Note 12 Pro','Redmi Note 12',
    'POCO X6 Pro','POCO X6','POCO M6 Pro','POCO M6','POCO C65',
    'Xiaomi 14','Xiaomi 13T Pro','Xiaomi 13','Redmi 13C','Redmi 12',
    'Redmi 12C','Redmi A3','Mi 11X Pro',
  ],
  Realme: [
    'Realme 12 Pro+','Realme 12 Pro','Realme 12','Realme 12+',
    'Realme 11 Pro+','Realme 11 Pro','Realme 11',
    'Narzo 70 Pro','Narzo 60 Pro','Narzo 60','Narzo 60x',
    'Realme GT 6','Realme GT 5 Pro','Realme C67','Realme C55','Realme C51',
  ],
  Vivo: [
    'Vivo X100 Pro','Vivo X100','Vivo V30 Pro','Vivo V30e','Vivo V30',
    'Vivo V29 Pro','Vivo V29','Vivo T3x 5G','Vivo T3 5G','Vivo T2x 5G',
    'Vivo Y200','Vivo Y200e','Vivo Y100','Vivo Y73t','Vivo Y17s',
  ],
  OPPO: [
    'OPPO Find N3 Flip','OPPO Reno 12 Pro','OPPO Reno 12',
    'OPPO Reno 11 Pro','OPPO Reno 11','OPPO Reno 10 Pro+',
    'OPPO A80','OPPO A79','OPPO A78','OPPO A58','OPPO F25 Pro',
    'OPPO A18','OPPO K12 5G',
  ],
  Motorola: [
    'Edge 50 Ultra','Edge 50 Pro','Edge 50 Fusion','Edge 30 Ultra',
    'Edge 30 Pro','Edge 30 Neo','Moto G84','Moto G73','Moto G54',
    'Moto G44','Moto G24','Moto E14','Moto G04',
  ],
  Nokia: [
    'Nokia G42 5G','Nokia G22','Nokia C32','Nokia C22','Nokia C12',
    'Nokia XR21','Nokia 8210 4G',
  ],
  Itel:  ['Itel S23+','Itel S23','Itel P55+','Itel P40','Itel A70','Itel A05s'],
  Lava:  ['Lava Blaze 2','Lava Blaze Pro 5G','Lava Agni 2','Lava Yuva 3 Pro','Lava BE Flex'],
  Other: ['Other Model'],
};

// Damage type definitions
export const DAMAGE_TYPES = {
  screen_crack:     { label: 'Screen Crack', icon: '📱', color: 'var(--rose)' },
  display_damage:   { label: 'Display Damage', icon: '🖥️', color: 'var(--violet)' },
  battery_swelling: { label: 'Battery Swelling', icon: '🔋', color: 'var(--rose)' },
  water_damage:     { label: 'Water Damage', icon: '💧', color: 'var(--cyan)' },
  frame_damage:     { label: 'Frame / Body Damage', icon: '🔨', color: 'var(--amber)' },
  camera_crack:     { label: 'Camera Glass Crack', icon: '📷', color: 'var(--amber)' },
  scratches:        { label: 'Surface Scratches', icon: '✏️', color: 'var(--green)' },
  charging_port:    { label: 'Charging Port Damage', icon: '🔌', color: 'var(--amber)' },
};

// Seed data for shops (local repair vendors in Sivakasi area)
export const MOCK_SHOPS = [
  { id: 'v1', name: 'Sivakasi Mobiles', address: '124, N.R.K.R. Road', phone: '04562-123456', rating: 4.8, services: ['screen','battery','water','frame'], lat: 9.4533, lng: 77.8021 },
  { id: 'v2', name: 'Digital Care', address: '45, Velayutham Road', phone: '04562-223344', rating: 4.5, services: ['screen','charging','camera'], lat: 9.4550, lng: 77.7980 },
  { id: 'v3', name: 'Smart Tech Repairs', address: 'Opp. Bus Stand', phone: '98421-55667', rating: 4.2, services: ['display','battery','software'], lat: 9.4500, lng: 77.8050 },
];

export const DEVICE_DATA = [
  { brand: 'Apple', model: 'iPhone 15 Pro Max', base_costs: { screen_crack: 28000, display_damage: 32000, battery_swelling: 8500, water_damage: 15000, frame_damage: 12000, camera_crack: 14000, charging_port: 6000 } },
  { brand: 'Apple', model: 'iPhone 15', base_costs: { screen_crack: 22000, display_damage: 26000, battery_swelling: 7500, water_damage: 12000, frame_damage: 9000, camera_crack: 10000, charging_port: 5000 } },
  { brand: 'Samsung', model: 'Galaxy S24 Ultra', base_costs: { screen_crack: 24000, display_damage: 28000, battery_swelling: 6500, water_damage: 10000, frame_damage: 8000, camera_crack: 9000, charging_port: 4500 } },
  { brand: 'Samsung', model: 'Galaxy A54', base_costs: { screen_crack: 8000, display_damage: 11000, battery_swelling: 3500, water_damage: 5000, frame_damage: 4000, camera_crack: 3500, charging_port: 2500 } },
  { brand: 'OnePlus', model: 'OnePlus 12', base_costs: { screen_crack: 18000, display_damage: 22000, battery_swelling: 5500, water_damage: 8000, frame_damage: 7000, camera_crack: 7500, charging_port: 3500 } },
  { brand: 'Xiaomi', model: 'Redmi Note 13 Pro', base_costs: { screen_crack: 6500, display_damage: 8500, battery_swelling: 2800, water_damage: 4000, frame_damage: 3500, camera_crack: 3000, charging_port: 1800 } },
  { brand: 'Realme', model: 'Realme 12 Pro+', base_costs: { screen_crack: 7000, display_damage: 9000, battery_swelling: 3000, water_damage: 4500, frame_damage: 3800, camera_crack: 3200, charging_port: 2000 } },
];

export const MOCK_SHOPS_EXTENDED = [
  {
    id: 'sh1', name: 'TechFix Pro',
    address: 'Main Road, Near Lakshmi Theater, Sivakasi 626123',
    rating: 4.8, reviews: 234, open: true, distance: '0.8 km', distanceKm: 0.8,
    services: ['Screen Replacement','Battery','Water Damage','Motherboard'],
    price: '₹₹', time: '~30 min', phone: '+91 98765 43210',
    lat: 9.4539, lng: 77.7977, verified: true,
    priceList: { screen_crack: 2500, battery_swelling: 1200, water_damage: 3000, frame_damage: 1500 },
  },
  {
    id: 'sh2', name: 'Mobile Care Center',
    address: 'Virudhunagar Road, Sivakasi 626124',
    rating: 4.6, reviews: 189, open: true, distance: '1.2 km', distanceKm: 1.2,
    services: ['All Brands','Screen','Battery','Charging Port'],
    price: '₹', time: '~45 min', phone: '+91 98765 43211',
    lat: 9.4489, lng: 77.8020, verified: true,
    priceList: { screen_crack: 1800, battery_swelling: 900, charging_port: 500, frame_damage: 1200 },
  },
  {
    id: 'sh3', name: 'iRepair Solutions',
    address: 'Collector Office Road, Sivakasi 626123',
    rating: 4.9, reviews: 412, open: false, distance: '2.1 km', distanceKm: 2.1,
    services: ['Apple Specialist','Samsung','Data Recovery','Unlocking'],
    price: '₹₹₹', time: '~1 hr', phone: '+91 98765 43212',
    lat: 9.4580, lng: 77.8050, verified: true,
    priceList: { screen_crack: 4000, display_damage: 6000, water_damage: 5000, camera_crack: 3500 },
  },
  {
    id: 'sh4', name: 'QuickFix Mobile',
    address: 'New Bus Stand, Sivakasi 626125',
    rating: 4.4, reviews: 98, open: true, distance: '2.8 km', distanceKm: 2.8,
    services: ['Budget Repair','All Brands','Accessories','Screen Protector'],
    price: '₹', time: '~20 min', phone: '+91 98765 43213',
    lat: 9.4450, lng: 77.7950, verified: false,
    priceList: { screen_crack: 1200, battery_swelling: 700, scratches: 300, frame_damage: 900 },
  },
  {
    id: 'sh5', name: 'SmartPhone Clinic',
    address: 'Gandhi Nagar, Sattur Road, Sivakasi 626123',
    rating: 4.3, reviews: 67, open: true, distance: '3.4 km', distanceKm: 3.4,
    services: ['All Android Brands','Software Issues','Unlocking','Accessories'],
    price: '₹', time: '~1 hr', phone: '+91 97865 12345',
    lat: 9.4600, lng: 77.7900, verified: false,
    priceList: { screen_crack: 1500, battery_swelling: 800, charging_port: 450, camera_crack: 2000 },
  },
  {
    id: 'sh6', name: 'Apple Galaxy Service Hub',
    address: 'Tenkasi Road, Sivakasi 626124',
    rating: 4.7, reviews: 178, open: true, distance: '1.9 km', distanceKm: 1.9,
    services: ['Apple','Samsung','OnePlus','Motherboard Repair','BGA Reballing'],
    price: '₹₹₹', time: '2–4 hrs', phone: '+91 88888 99999',
    lat: 9.4510, lng: 77.8010, verified: true,
    priceList: { screen_crack: 3500, display_damage: 5500, water_damage: 4500, battery_swelling: 2000 },
  },
];

// Realistic scan data for demo mode
export const MOCK_SCANS = [
  {
    id: 'sc001', brand: 'Apple', model: 'iPhone 15 Pro',
    created_at: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
    overall_severity: 'high', repair_status: 'pending',
    assessment_confidence: 0.94,
    estimated_repair_cost: { min: 9200, max: 14500, avg: 11500, currency: 'INR' },
    damages: [
      {
        label: 'Screen Crack', type: 'screen_crack',
        description: 'Deep crack running diagonally across upper half of display. Touch responsiveness affected in top-left quadrant.',
        location: 'Front — upper-left to center', severity: 'high',
        confidence: 0.96, affects_function: true, isPrimary: true,
      },
      {
        label: 'Frame / Body Damage', type: 'frame_damage',
        description: 'Minor dent on titanium frame near volume buttons — likely from drop impact. Cosmetic only.',
        location: 'Right edge — volume area', severity: 'low',
        confidence: 0.82, affects_function: false, isPrimary: false,
      },
    ],
    aiTip: 'Screen is cracked — stop using until repaired to prevent further damage to the display panel.',
    repairOrReplace: { action: 'repair', reason: 'Repair is cost-effective for this device' },
  },
  {
    id: 'sc002', brand: 'Samsung', model: 'Galaxy S24 Ultra',
    created_at: new Date(Date.now() - 7*24*60*60*1000).toISOString(),
    overall_severity: 'medium', repair_status: 'repaired',
    assessment_confidence: 0.91,
    estimated_repair_cost: { min: 2800, max: 5200, avg: 3900, currency: 'INR' },
    damages: [
      {
        label: 'Camera Glass Crack', type: 'camera_crack',
        description: 'Hairline crack on rear camera module glass. Visible lens flare in bright conditions.',
        location: 'Rear — top camera island', severity: 'medium',
        confidence: 0.89, affects_function: true, isPrimary: true,
      },
    ],
    aiTip: 'Camera glass crack repaired. Apply a camera protector to prevent recurrence.',
    repairOrReplace: { action: 'repair', reason: 'Single camera module is cost-effective to repair' },
  },
  {
    id: 'sc003', brand: 'OnePlus', model: 'OnePlus 12',
    created_at: new Date(Date.now() - 14*24*60*60*1000).toISOString(),
    overall_severity: 'low', repair_status: 'pending',
    assessment_confidence: 0.88,
    estimated_repair_cost: { min: 600, max: 1400, avg: 950, currency: 'INR' },
    damages: [
      {
        label: 'Surface Scratches', type: 'scratches',
        description: 'Multiple fine scratches on rear glass panel. Purely cosmetic — no functional impact.',
        location: 'Rear — center panel', severity: 'low',
        confidence: 0.92, affects_function: false, isPrimary: true,
      },
    ],
    aiTip: 'Only surface scratches detected. Apply a back cover to prevent further cosmetic damage.',
    repairOrReplace: { action: 'repair', reason: 'Minor cosmetic issue — polishing or cover sufficient' },
  },
  {
    id: 'sc004', brand: 'Xiaomi/Redmi', model: 'Redmi Note 13 Pro+',
    created_at: new Date(Date.now() - 21*24*60*60*1000).toISOString(),
    overall_severity: 'critical', repair_status: 'pending',
    assessment_confidence: 0.97,
    estimated_repair_cost: { min: 4200, max: 7800, avg: 5900, currency: 'INR' },
    damages: [
      {
        label: 'Shattered Display', type: 'screen_crack',
        description: 'Complete display shatter with LCD bleeding. Touch entirely non-functional.',
        location: 'Front — entire panel', severity: 'critical',
        confidence: 0.97, affects_function: true, isPrimary: true,
      },
      {
        label: 'Frame Bend', type: 'frame_damage',
        description: 'Structural damage to chassis — port misalignment and back cover gap visible.',
        location: 'Bottom edge', severity: 'high',
        confidence: 0.91, affects_function: true, isPrimary: false,
      },
    ],
    aiTip: 'Critical damage — device unusable. Seek repair immediately to prevent internal component damage.',
    repairOrReplace: { action: 'repair', reason: 'Repair still cheaper than replacement for this model' },
  },
];

// Booking slot times
export const TIME_SLOTS = [
  '09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM',
  '04:00 PM','04:30 PM','05:00 PM','05:30 PM','06:00 PM',
];

// Booking status flow
export const BOOKING_STATUSES = ['requested','accepted','in_progress','completed'];
