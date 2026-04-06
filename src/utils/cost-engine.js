// ═══════════════════════════════════════════════════════════
// SMARTSEP AI — Smart Cost Estimation Engine
// Brand-aware, damage-type-aware pricing for India market
// ═══════════════════════════════════════════════════════════
import { getDevicePricing } from './firestore-helpers.js';

// Brand tiers (affects cost multiplier)
const BRAND_TIER = {
  Apple:           { tier: 'premium',   multiplier: 1.0, label: 'Apple (Premium)' },
  Samsung:         { tier: 'high',      multiplier: 0.65, label: 'Samsung' },
  OnePlus:         { tier: 'high',      multiplier: 0.55, label: 'OnePlus' },
  'Xiaomi/Redmi':  { tier: 'mid',       multiplier: 0.35, label: 'Xiaomi/Redmi' },
  Realme:          { tier: 'mid',       multiplier: 0.32, label: 'Realme' },
  Vivo:            { tier: 'mid',       multiplier: 0.35, label: 'Vivo' },
  OPPO:            { tier: 'mid',       multiplier: 0.38, label: 'OPPO' },
  Motorola:        { tier: 'mid',       multiplier: 0.30, label: 'Motorola' },
  Nokia:           { tier: 'budget',    multiplier: 0.22, label: 'Nokia' },
  Itel:            { tier: 'budget',    multiplier: 0.18, label: 'Itel' },
  Lava:            { tier: 'budget',    multiplier: 0.20, label: 'Lava' },
  Other:           { tier: 'mid',       multiplier: 0.30, label: 'Other Brand' },
};

// Base costs (INR) at Apple (premium) pricing
// All other brands apply the multiplier on top
const BASE_COSTS = {
  screen_crack: {
    min: 8000, max: 18000, avg: 12000,
    urgency: 'high',
    suggestion: 'Screen replacement recommended urgently to restore touch function',
  },
  display_damage: {
    min: 9000, max: 22000, avg: 14000,
    urgency: 'critical',
    suggestion: 'Full display unit replacement required — LCD bleeding affects usability',
  },
  battery_swelling: {
    min: 4000, max: 9000, avg: 6000,
    urgency: 'critical',
    suggestion: 'Replace battery within 48 hours — swollen battery poses fire/explosion risk',
  },
  water_damage: {
    min: 3000, max: 12000, avg: 7000,
    urgency: 'high',
    suggestion: 'Take to service center immediately — longer wait worsens corrosion damage',
  },
  frame_damage: {
    min: 2500, max: 8000, avg: 4500,
    urgency: 'medium',
    suggestion: 'Frame replacement or straightening. Affects structural integrity over time.',
  },
  camera_crack: {
    min: 3000, max: 10000, avg: 6000,
    urgency: 'medium',
    suggestion: 'Camera glass/module replacement recommended — affects photo quality',
  },
  scratches: {
    min: 500, max: 2000, avg: 1000,
    urgency: 'low',
    suggestion: 'Cosmetic repair optional. Consider a screen protector and back cover going forward.',
  },
  charging_port: {
    min: 1500, max: 5000, avg: 3000,
    urgency: 'high',
    suggestion: 'Port cleaning or replacement needed — affects daily charging',
  },
};

// Severity cost multipliers
const SEVERITY_MULTIPLIER = {
  low:      0.5,
  medium:   0.75,
  high:     1.0,
  critical: 1.3,
};

// Model-specific premium overrides (some models cost more to repair)
const MODEL_OVERRIDES = {
  'iPhone 15 Pro Max': 1.25,
  'iPhone 15 Pro':     1.15,
  'iPhone 14 Pro':     1.10,
  'Galaxy S24 Ultra':  1.20,
  'Galaxy S24+':       1.10,
  'OnePlus 12':        1.08,
};

/**
 * Estimate repair cost for a given device + damage
 */
export async function estimateCost(brand, damageType, severity, model = '') {
  let base = BASE_COSTS[damageType] || BASE_COSTS.scratches;
  const brandInfo = BRAND_TIER[brand] || BRAND_TIER.Other;
  const sevMult = SEVERITY_MULTIPLIER[severity] || 1.0;
  const modelMult = MODEL_OVERRIDES[model] || 1.0;

  // DYNAMIC PRICING ENGINE: Fetch from Firestore if available
  const dbPricing = await getDevicePricing(brand, model);
  if (dbPricing && dbPricing.base_costs?.[damageType]) {
    const cost = dbPricing.base_costs[damageType];
    base = { min: cost * 0.8, max: cost * 1.2, avg: cost };
  }

  const brandMultiplier = brandInfo.tier === 'premium' ? 1.0 : brandInfo.multiplier;

  const rawMin = Math.round(base.min * brandMultiplier * sevMult * modelMult);
  const rawMax = Math.round(base.max * brandMultiplier * sevMult * modelMult);
  const rawAvg = Math.round(base.avg * brandMultiplier * sevMult * modelMult);

  const min = Math.max(rawMin, getFloor(brandInfo.tier));
  const max = Math.max(rawMax, min + 500);
  const avg = Math.round((min + max) / 2);

  const confidence = dbPricing ? 0.95 : (brand && brand !== 'Other' ? (model ? 0.88 : 0.78) : 0.62);

  return {
    min, max, avg, currency: 'INR',
    confidence, suggestion: base.suggestion, urgency: base.urgency,
    repairOrReplace: getRepairOrReplaceRecommendation(brandInfo.tier, severity, damageType, max),
    aiTip: getAITip(damageType, severity, brandInfo.tier),
    brandTier: brandInfo.tier,
    isDynamic: !!dbPricing
  };
}

/**
 * Compute total cost from multiple damage types
 */
export async function estimateTotalCost(brand, damages, model = '') {
  if (!damages || damages.length === 0) return null;

  const estimates = await Promise.all(damages.map(d =>
    estimateCost(brand, d.type, d.severity, model)
  ));

  // Multi-damage discount: 10% off for 2+ issues (labor overlap)
  const discount = estimates.length > 1 ? 0.9 : 1.0;

  return {
    min:        Math.round(estimates.reduce((s, e) => s + e.min, 0) * discount),
    max:        Math.round(estimates.reduce((s, e) => s + e.max, 0) * discount),
    avg:        Math.round(estimates.reduce((s, e) => s + e.avg, 0) * discount),
    currency:   'INR',
    confidence: Math.min(...estimates.map(e => e.confidence)),
    breakdown:  estimates,
    discount:   estimates.length > 1,
  };
}

// ── Helpers ────────────────────────────────────────────────
function getFloor(tier) {
  return { premium: 1500, high: 800, mid: 400, budget: 200 }[tier] || 400;
}

function getRepairOrReplaceRecommendation(tier, severity, damageType, maxCost) {
  // If repair cost > ~40% of typical device value, suggest replace
  const deviceValues = { premium: 80000, high: 35000, mid: 18000, budget: 8000 };
  const deviceValue  = deviceValues[tier] || 18000;
  const costRatio    = maxCost / deviceValue;

  if (severity === 'critical' && costRatio > 0.5) {
    return { action: 'replace', reason: 'Repair cost exceeds 50% of device value — replacement is more economical' };
  }
  if (severity === 'high' && costRatio > 0.4) {
    return { action: 'consider_replace', reason: 'High repair cost — compare with refurbished device prices before deciding' };
  }
  if (damageType === 'display_damage' && severity === 'critical') {
    return { action: 'replace', reason: 'Full display damage on this device — replacement often more cost-effective' };
  }
  return { action: 'repair', reason: 'Repair is the recommended and cost-effective option' };
}

function getAITip(damageType, severity, tier) {
  const tips = {
    screen_crack: {
      critical: 'Screen is fully shattered — touch functionality lost. Seek repair within 24 hours.',
      high:     'Deep crack detected — touch may be unreliable. Stop using until repaired.',
      medium:   'Visible crack — apply screen protector to prevent further damage.',
      low:      'Minor crack — functional but apply a protector immediately.',
    },
    battery_swelling: {
      critical: '🚨 URGENT: Swollen battery is a fire hazard. Do NOT charge the device. Visit service center immediately.',
      high:     'Battery swelling detected — discontinue charging. Replace within 48 hours.',
      medium:   'Battery health degraded — schedule replacement soon.',
      low:      'Early swelling signs — monitor battery temperature and schedule check.',
    },
    water_damage: {
      critical: 'Severe water ingress detected. Power off immediately, do not charge, and visit service center.',
      high:     'Significant water damage — internal corrosion likely. Seek service within 24 hours.',
      medium:   'Moisture detected — dry thoroughly and check for corrosion.',
      low:      'Minor moisture exposure — ensure fully dry before charging.',
    },
    display_damage: {
      critical: 'LCD bleeding across full screen — device unusable without replacement.',
      high:     'Significant display damage — visual artifacts affecting usability.',
      medium:   'Partial display damage — some dead zones or discoloration.',
      low:      'Minor display issue — monitor for progression.',
    },
    frame_damage: {
      high:     'Structural damage may affect port alignment and back panel sealing.',
      medium:   'Frame bent — may cause long-term pressure on internal components.',
      low:      'Minor dent — cosmetic issue, no immediate action required.',
    },
    camera_crack: {
      high:     'Camera glass cracked — lens flare and blur will affect photos.',
      medium:   'Hairline crack on camera glass — photo quality degraded.',
      low:      'Minor camera scratch — use a lens protector.',
    },
    charging_port: {
      high:     'Port damaged — charging unreliable. Repair before battery depletes completely.',
      medium:   'Port partially obstructed — clean with compressed air and inspect.',
      low:      'Minor port issue — avoid loose cables.',
    },
    scratches: {
      low:      'Surface scratches — cosmetic only. Apply a back cover and screen protector.',
    },
  };

  const damageTips = tips[damageType] || {};
  return damageTips[severity] || damageTips.low || 'Schedule a professional inspection at your nearest repair center.';
}

export { BASE_COSTS, BRAND_TIER };
