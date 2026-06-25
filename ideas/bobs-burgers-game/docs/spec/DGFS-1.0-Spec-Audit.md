# DGFS-1.0 Spec Audit Report
## Pre-Build Gap & Conflict Analysis
**Auditor:** Claude | **Date:** 2026-02-18 | **Scope:** All three spec documents (JSON, Design Doc, Coding Prompt)

---

## Audit Summary

**Overall assessment:** The spec triangle is well-constructed. The three documents are largely consistent in intent and structure. However, there are **7 blocking gaps**, **4 conflicts/ambiguities**, and **6 implementation risks** that should be resolved before coding begins. None are fatal — most require a 1-2 sentence decision from you.

---

## SECTION 1: BLOCKING GAPS
*These will force the coder to invent solutions if not resolved. That violates your own "extract, do not invent" constraint.*

### GAP-01: Encouragement Weights Are Qualitative, Not Numeric
- **Location:** JSON `pressure_engine.yips_mechanic.encouragement_weights`
- **Problem:** Weights are strings ("high", "medium-high", "medium", etc.). The coding prompt says "Weights defined in JSON" and expects a float accumulator system. The coder has no numeric values to implement.
- **Impact:** Layer 4 (Yips) cannot be built to spec. Coder must guess or ask.
- **Recommendation:** Define float values. Suggested mapping:
  - Linda direct encouragement: **0.40**
  - Family member accidental encouragement: **0.30**
  - Teddy pep talk: **0.20**
  - Regular compliment: **0.20**
  - Customer compliment: **0.12**
  - Successful burger streak: **0.05** (stackable)
  - Recovery threshold: **1.0** (as stated in coding prompt)

### GAP-02: Yips Quality Degradation Magnitude Undefined
- **Location:** Coding prompt Layer 4 says "Bob's quality score modifier drops." JSON says "temporarily degraded."
- **Problem:** By how much? Is it a flat penalty (e.g., -0.3 to quality modifier) or a multiplier (e.g., 0.6x)? Does it worsen over time if unresolved?
- **Impact:** Without this, the yips either feel trivial or catastrophic. Core balance issue.
- **Recommendation:** Define as a multiplier on final quality score. Suggest: **0.65x** while yips are active. No escalation in MVP — save spiral risk for post-prototype.

### GAP-03: Family Morale Decay Rate Undefined
- **Location:** Coding prompt Layer 3 says "decays slowly over time during service." JSON says it's a float 0.0-1.0.
- **Problem:** No decay rate specified. "Slowly" is not a number.
- **Impact:** Layer 3 balance. If decay is too fast, family meeting spam. If too slow, morale is ignorable (which is a red flag condition).
- **Recommendation:** Define decay rate per second. Suggest: **-0.002/sec** during active service (~8.3 minutes from 1.0 to 0.0 with no intervention). Tunable constant.

### GAP-04: Family Meeting Mechanic Unspecified for MVP
- **Location:** Telemetry logs `family_meeting_called` with morale before/after. Red flags include "player never calls family meeting." Decision points list it with "diminishing returns."
- **Problem:** The family meeting is referenced as a core mechanic across all three documents, logged in telemetry, tracked as a red flag — but **never specified as an MVP build layer**. It's not in the 8-layer build order. It's not in `mvp_scope`. But the telemetry and red flags assume it exists.
- **Impact:** If not built, the morale system has no player-initiated recovery mechanism in MVP, and the red flag "player never calls family meeting" is untestable.
- **Recommendation:** Either (a) add family meeting as Layer 3.5 with a simple spec (pause service, restore X morale, diminishing returns multiplier per use), or (b) remove the telemetry event and red flag from MVP scope and rely on encouragement events alone for morale recovery during prototype.

### GAP-05: Customer Rush Wave Mechanics Undefined
- **Location:** The 30-second loop is "burger crafting" but the customer rush wave — the thing generating demand — has no specification.
- **Problem:** How do customers arrive? How many per wave? What's their patience timer? What happens when a customer leaves unsatisfied? How does revenue generate per customer? None of this is specified in any document.
- **Impact:** Layers 1-2 cannot function without customers. This is the demand side of the entire core loop.
- **Recommendation:** Define a minimal customer wave spec:
  - Wave duration (suggest: 5-8 minutes)
  - Customer arrival rate (suggest: 1 every 8-12 seconds, ramping)
  - Customer patience timer (suggest: 15-25 seconds)
  - Revenue per satisfied customer (base value, modified by quality score)
  - Penalty for lost customer (satisfaction hit, potential morale impact)

### GAP-06: Revenue System Undefined
- **Location:** Revenue is a Belcher Rating input (0.20 weight), logged in telemetry, and referenced in the negative feedback loop.
- **Problem:** How is revenue calculated? Per burger? Per customer? Is there a cost structure (ingredient costs deducted)? What are the actual numbers?
- **Impact:** Layer 8 (Belcher Rating) needs a revenue input. Without a revenue model, the Rating composite is incomplete.
- **Recommendation:** Define for MVP: revenue = base_price × quality_score per served customer. Ingredient costs = fixed per tier (common: low, rare: medium, legendary: high). Net revenue = gross - costs. Keep it simple.

### GAP-07: Ingredient Counts / Starting Inventory Undefined
- **Location:** Coding prompt references ingredient management, telemetry logs `ingredient_levels`. JSON has tiered rarity.
- **Problem:** How many ingredients does the player start with? How are they consumed (one per burger? one per ingredient slot?)? How are they restocked during a rush? Between rushes?
- **Impact:** Layer 1 cannot manage ingredients without this.
- **Recommendation:** Define starting inventory per tier and consumption model. Suggest: Common (unlimited in MVP), Rare (start with 5, no restock during rush), Legendary (start with 1-2, no restock during rush).

---

## SECTION 2: CONFLICTS & AMBIGUITIES
*These are cases where documents disagree or where reasonable coders would implement differently.*

### CONFLICT-01: Morale Threshold for Yips vs. Morale Effect on Crafting
- **Location:** Layer 3 says low morale "degrades burger crafting speed and increases yips probability." Layer 4 says morale below 0.35 increases yips probability.
- **Ambiguity:** Layer 3 implies morale affects crafting speed directly (separate from yips). Layer 4's yips also degrade quality. Are these two independent debuffs?
- **Risk:** Double-punishment at low morale could create death spirals too easily.
- **Recommendation:** Clarify: does low morale independently slow crafting (separate from yips), or is the yips trigger the *only* mechanical consequence of low morale on burger quality? Suggest: morale below 0.5 applies a mild speed debuff (0.9x crafting speed), yips apply a separate quality debuff (0.65x). Two independent systems, but tuned to avoid stacking into unrecoverable states.

### CONFLICT-02: Fischoeder Timer — "Session End" vs. "Soft Timer ~8-12 Minutes"
- **Location:** JSON `mvp_scope` says "appears at session end." Coding prompt Layer 7 says "after a soft timer — ~8-12 minutes of play."
- **Ambiguity:** Is Fischoeder triggered by session end (wave complete) or by a wall clock timer? These are different if the player finishes the rush in 6 minutes vs. 15 minutes.
- **Recommendation:** Clarify: does Fischoeder appear (a) after the rush wave ends regardless of time, (b) after the timer hits 8-12 min regardless of rush state, or (c) whichever comes later? Suggest option (c) — he appears after rush wave ends, but no earlier than 8 minutes in. This ensures he feels earned and the rush isn't cut short.

### CONFLICT-03: Teddy's Passive Buff — "+10% Customer Satisfaction" vs. Unspecified
- **Location:** Coding prompt Layer 5 says "suggest: +10% customer satisfaction rate." JSON says nothing specific about Teddy's buff value.
- **Ambiguity:** The coding prompt hedges with "suggest." Is this the actual value or a placeholder?
- **Recommendation:** Lock it in. +10% customer satisfaction is reasonable for MVP. Make it a config constant so it's tunable. Also clarify what "customer satisfaction" maps to mechanically — is it revenue per customer? Quality score? Both?

### CONFLICT-04: Character State Table in Design Doc Is Empty
- **Location:** Design doc Section 5.1 has a table header for Character / Tell / Gambit / Collectible but no data rows.
- **Impact:** Low for MVP (only Louise matters), but the document has a structural gap. If anyone reads Section 5.1 expecting character specs, they'll find nothing.
- **Recommendation:** Either populate the table or add a note that character-specific specs are deferred to Phase 2, with Louise's MVP gambit defined in the coding prompt.

---

## SECTION 3: IMPLEMENTATION RISKS
*These won't block coding but could cause rework or failed success metrics.*

### RISK-01: "3 Meaningful Decisions Per Rush Wave" May Not Be Achievable
- **Analysis:** Success metric #1 requires 3 meaningful decisions per wave. In the MVP, the decision space is: (1) Burger of the Day choice (once per session), (2) Louise gambit intervene/deploy (when it triggers), (3) family meeting call (if implemented), (4) individual burger crafting choices. If the rush wave is 5-8 minutes and Louise only triggers once, the player may only get 2 true decision points unless burger crafting itself presents genuine trade-offs.
- **Mitigation:** Ensure ingredient scarcity forces real decisions during crafting (use rare ingredient now or save it?). Consider whether multiple Louise events can occur per session, or if Teddy's quest counts as a decision point.

### RISK-02: Burger of the Day "Safety Always" Red Flag Is Likely Without Variance Implementation
- **Problem:** The spec says Creativity = "higher ceiling, higher variance" and Safety = "lower ceiling, lower variance." But no variance mechanic is defined. If quality = tier × timing × ceiling_multiplier, there's no randomness — the player perfectly controls timing execution. Creativity just means a higher cap with no added risk.
- **Impact:** Rational players will always pick Creativity since it strictly dominates Safety (same floor, higher ceiling, no actual variance penalty).
- **Mitigation:** Define what "variance" means mechanically. Suggest: Creativity adds a random modifier to timing execution scoring (e.g., ±0.15 random jitter on the timing window). Safety removes the jitter. Now the choice is: higher ceiling with execution uncertainty vs. lower ceiling with consistency.

### RISK-03: Timing Execution Mechanic Undefined
- **Problem:** The entire quality scoring formula depends on `timing_execution_score` but no spec describes what the timing mechanic actually is. Is it a rhythm game? A progress bar with a sweet spot? A quick-time event? Button hold duration?
- **Impact:** This is Layer 1 — the most important thing in the prototype. A coder will have to invent the timing mechanic entirely.
- **Mitigation:** Define the timing interaction. Even a high-level description: "player holds a button to fill a bar; releasing in the green zone = 1.0, yellow = 0.7, red = 0.4" would suffice.

### RISK-04: No Customer Satisfaction / Reputation System in MVP
- **Problem:** The positive feedback loop starts with "burger quality → customer satisfaction → reputation." But reputation and satisfaction aren't in MVP scope. The Belcher Rating uses revenue as a proxy, but there's no mechanism for quality to affect customer behavior within a single session.
- **Impact:** The core positive loop is broken in MVP. Quality affects Rating but doesn't dynamically change the session experience.
- **Mitigation:** For MVP, consider a simple satisfaction display (happy/neutral/unhappy customer face based on burger quality) that affects revenue multiplier. This closes the loop without building a full reputation system.

### RISK-05: Louise Gambit Trigger Timing Undefined
- **Problem:** When does Louise's gambit trigger? Randomly during the rush? At a fixed time? Based on her mood state transition? How long does the player have to decide?
- **Impact:** If timing is wrong, Louise feels random (violates pillar: "not an interruption"). If decision window is too short, players miss it. Too long, no tension.
- **Mitigation:** Define: Louise transitions from manageable → scheming after [X minutes or Y conditions]. Once scheming, player has [Z seconds] to decide intervene/deploy. Suggest: scheming triggers once per rush at a semi-random time between 2-6 minutes in. Decision window: 10 seconds.

### RISK-06: Belcher Rating Inputs Not Normalized
- **Problem:** The four Rating inputs (burger quality, family morale, Teddy relationship, revenue) are on different scales. Quality might be 0.0-1.0, morale is 0.0-1.0, Teddy is 0.0-1.0, but revenue is an uncapped dollar amount.
- **Impact:** Revenue will dominate or be negligible depending on scale, making the weights meaningless.
- **Mitigation:** Normalize all inputs to 0.0-1.0 before applying weights. For revenue, define a target revenue for the session and score as actual/target (capped at 1.0).

---

## SECTION 4: DOCUMENT HEALTH

### Cross-Reference Consistency: GOOD
- All three documents agree on MVP scope, build order, and out-of-scope items.
- Telemetry events match between coding prompt and JSON.
- Red flags are identical across documents.

### Structural Completeness by Layer

| Layer | Spec Completeness | Blocking Gaps | Notes |
|-------|------------------|---------------|-------|
| 1 - Burger Crafting | 60% | GAP-05, GAP-06, GAP-07, RISK-03 | Formula defined, but inputs and interaction undefined |
| 2 - Burger of the Day | 85% | RISK-02 | Ceiling multiplier clear, variance mechanic missing |
| 3 - Family Morale | 70% | GAP-03, GAP-04 | Variable defined, decay rate and recovery mechanism missing |
| 4 - Bob's Yips | 65% | GAP-01, GAP-02 | Architecture clear, all numeric values missing |
| 5 - Teddy | 80% | CONFLICT-03 | Clean design, buff value needs confirmation |
| 6 - Louise Chaos | 75% | RISK-05 | Outcome branches described, trigger timing undefined |
| 7 - Fischoeder | 80% | CONFLICT-02 | Clean design, timer ambiguity needs one decision |
| 8 - Belcher Rating | 85% | RISK-06 | Weights defined, normalization needed |

### Missing JSON Fields (Referenced But Absent)
- No numeric encouragement weights
- No morale decay rate
- No yips quality degradation magnitude
- No customer wave parameters
- No revenue calculation model
- No ingredient starting inventory
- No Louise gambit trigger parameters
- No timing execution mechanic type
- Character table (Section 5.1) is empty in design doc

---

## SECTION 5: RECOMMENDED PRE-BUILD ACTIONS

**Priority order — resolve these before any code is written:**

1. **Define the timing execution mechanic** (RISK-03) — This is Layer 1. Everything else builds on it.
2. **Define customer rush wave parameters** (GAP-05) — No customers = no game loop.
3. **Set numeric encouragement weights** (GAP-01) — Required for Layer 4.
4. **Define yips degradation magnitude** (GAP-02) — Required for Layer 4.
5. **Set morale decay rate** (GAP-03) — Required for Layer 3.
6. **Decide on family meeting in MVP** (GAP-04) — Affects morale system design.
7. **Define revenue model** (GAP-06) — Required for Layer 8.
8. **Define ingredient inventory model** (GAP-07) — Required for Layer 1.
9. **Clarify Creativity variance mechanic** (RISK-02) — Required for Layer 2 to not auto-fail its red flag.
10. **Resolve Fischoeder timer ambiguity** (CONFLICT-02) — One sentence decision.
11. **Normalize Belcher Rating inputs** (RISK-06) — Required for Layer 8.
12. **Define Louise gambit trigger timing** (RISK-05) — Required for Layer 6.

---

*End of audit. All findings are addressable with design decisions, not redesign. The spec architecture is sound — it just needs numeric values and a few mechanical definitions before a coder can extract rather than invent.*
