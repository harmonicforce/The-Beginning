/**
 * tunables.ts
 * ----------------------------------------------------------------------------
 * Single source of truth for every value the DGFS-1.0 spec marks [TUNABLE].
 * These are STARTING POINTS for playtesting. Change them here, never inline.
 *
 * Values transcribed from DGFS-1.0-Spec-Addendum.md. Where the addendum gives
 * a range, the midpoint or stated suggestion is used as the starting value.
 * ----------------------------------------------------------------------------
 */

// ─── KITCHEN: HEAT ZONE BAR ──────────────────────────────────────────────────
export const HEAT_ZONE = {
  baseBarSpeed: 1.0,          // relative units; yips multiplies this
  baseGreenZoneWidth: 0.22,   // fraction of the bar (0..1) that is "green"
  // Score bands by zone (timing_execution_score):
  greenScoreMin: 0.85,
  greenScoreMax: 1.0,
  yellowScoreMin: 0.5,
  yellowScoreMax: 0.84,
  redScoreMin: 0.1,
  redScoreMax: 0.49,
} as const;

// ─── INGREDIENT TIERS ────────────────────────────────────────────────────────
export const INGREDIENT_TIERS = {
  COMMON:    { baseQualityModifier: 0.6,  cost: 0,    startingStock: Infinity },
  RARE:      { baseQualityModifier: 0.85, cost: 2.0,  startingStock: 5 },
  LEGENDARY: { baseQualityModifier: 1.0,  cost: 5.0,  startingStock: 1 },
} as const;

// ─── STANDARD MENU (show-accurate prices) ────────────────────────────────────
export const STANDARD_MENU = {
  regular_burger: { price: 5.0,  ingredients: 'common_only' },
  special_burger: { price: 5.95, ingredients: 'common_only' },
  burger_of_day:  { price: 5.95, ingredients: 'any_tier' },
  cheese_add_on:  { price: 0.5 },
  fries:          { price: 2.0,  mechanic: 'pass_fail_timer', burnTimeSec: 8 },
  side_salad:     { price: 2.5,  mechanic: 'pass_fail_timer', wiltTimeSec: 12 },
  soft_drink:     { price: 2.0,  mechanic: 'pass_fail_timer', overflowTimeSec: 5 },
  beer:           { price: 4.0,  mechanic: 'pass_fail_timer', overflowTimeSec: 6 },
} as const;

// ─── BURGER OF THE DAY ───────────────────────────────────────────────────────
export const BOTD = {
  price: 5.95,                          // flat, all tiers — Bob wouldn't upcharge
  ingredientCost: { common: 0, rare: 2.0, legendary: 5.0 },
  creativityCeilingMultiplier: 1.0,
  safetyCeilingMultiplier: 0.75,
  creativityJitter: 0.15,               // ±0.15 random on timing score; Safety = 0
  baseOrderRate: 0.15,                  // 15% of customers order BotD
  maxOrderRate: 0.40,                   // ceiling with both modifiers active
} as const;

// ─── FAMILY MORALE ───────────────────────────────────────────────────────────
export const MORALE = {
  start: 0.75,
  decayPerSec: 0.002,                   // during active service
  lowSpeedThreshold: 0.5,               // below this → crafting speed debuff
  lowSpeedMultiplier: 0.9,
  yipsThreshold: 0.35,                  // below this → yips probability bonus
  lostCustomerHit: 0.05,                // per walkout
} as const;

// ─── FAMILY MEETING ──────────────────────────────────────────────────────────
export const FAMILY_MEETING = {
  baseRestoration: 0.25,
  diminishingMultiplier: 0.6,           // applied per subsequent meeting this session
  servicePauseSec: 8,                   // queue keeps losing patience during pause
} as const;

// ─── BOB'S YIPS ──────────────────────────────────────────────────────────────
export const YIPS = {
  checkIntervalSec: 10,
  baseProbability: 0.05,                // per check
  fischoederPresentBonus: 0.15,
  lowMoraleBonus: 0.10,                 // when morale < MORALE.yipsThreshold
  perExtraStressorBonus: 0.05,
  qualityMultiplier: 0.65,              // applied to final quality while active
  // Difficulty effects while active:
  barSpeedMultiplier: 1.4,              // bar moves faster
  greenZoneShrinkMultiplier: 0.6,       // green zone shrinks to 60% of base...
  greenZoneFloorMultiplier: 0.5,        // ...but never below 50% of base (PRE-BUILD DECISION)
  barSpeedCapMultiplier: 1.5,           // hard cap on speed-up (PRE-BUILD DECISION)
  recoveryThreshold: 1.0,               // float accumulator target
} as const;

export const ENCOURAGEMENT_WEIGHTS = {
  linda_direct:             0.40,
  family_accidental:        0.30,
  teddy_pep_talk:           0.20,
  regular_compliment:       0.20,
  customer_compliment:      0.12,
  successful_burger_streak: 0.05,       // per burger, stackable
} as const;

// ─── TEDDY (REGULAR) ─────────────────────────────────────────────────────────
export const TEDDY = {
  passiveRevenueBuff: 0.10,             // +10% revenue per customer when seated
  questCompleteReward: 0.10,            // relationship gain
  questMissedPenalty: 0.05,             // relationship loss
  backupCompetence: 0.4,                // when filling service role (NOT seated)
} as const;

// ─── LOUISE ──────────────────────────────────────────────────────────────────
export const LOUISE = {
  baselineDisruptionManageable: 0.10,   // chance per task
  baselineDisruptionScheming: 0.30,
  gambitWindowMin: 2 * 60,              // earliest scheming transition (sec into rush)
  gambitWindowMax: 6 * 60,              // latest
  gambitDecisionWindowSec: 10,          // time to choose intervene/deploy
} as const;

// ─── FAMILY SERVICE / DRIFT ──────────────────────────────────────────────────
export const FAMILY_SERVICE = {
  driftDelayMinSec: 30,                 // wrong assignment → problem behavior after...
  driftDelayMaxSec: 60,
  correctCompetence: 1.0,
} as const;

// ─── FISCHOEDER ──────────────────────────────────────────────────────────────
export const FISCHOEDER = {
  appearanceTimerSec: 10 * 60,          // pure 10-minute timer; interrupts active rush
  escalationTierMVP: 1,
} as const;

// ─── SEATING ─────────────────────────────────────────────────────────────────
export const SEATING = {
  boothCount: 4,
  boothPartyMin: 2,
  boothPartyMax: 4,
  boothBusTimeSec: 4,
  stoolCount: 10,
  stoolBusTimeSec: 2,
} as const;

// ─── CUSTOMER RUSH WAVE ──────────────────────────────────────────────────────
export const RUSH = {
  waveDurationSec: 6 * 60,
  arrivalStartMinSec: 8,                // 1 customer every 8–12s at start
  arrivalStartMaxSec: 12,
  arrivalEndMinSec: 5,                  // ramps to every 5–8s by wave end
  arrivalEndMaxSec: 8,
  seatPatienceSec: 20,                  // seated → food delivered, else walkout
  doorQueuePatienceSec: 15,             // waiting for a seat, else leaves
  orderSidesMin: 0,                     // each customer: 1 main + 0–2 sides/drinks
  orderSidesMax: 2,
} as const;

// ─── BELCHER RATING ──────────────────────────────────────────────────────────
export const RATING_WEIGHTS = {
  burger_quality:     0.35,
  family_morale:      0.25,
  teddy_relationship: 0.20,
  revenue:            0.20,
} as const;

export const RATING = {
  // Revenue normalized as actual/target, capped at 1.0.
  // target = (waveDuration / avgArrivalRate) * avgOrderValue * targetFraction
  revenueTargetFraction: 0.75,
} as const;

// ─── PRE-BUILD DECISION: MEANINGFUL-DECISION TARGET ──────────────────────────
// Success metric #1 ("3 meaningful decisions per minute") is an OBSERVATION band,
// not a hard gate. A "meaningful decision" is operationally any logged player
// choice where >=2 options had non-trivial expected-value difference OR a
// time-pressured choice with a real failure branch. See PRE-BUILD-DECISIONS.md.
export const DECISION_METRIC = {
  targetPerMinuteMin: 3,
  treatAsGate: false,
} as const;
