# DGFS-1.0 SPEC ADDENDUM
## Pre-Build Resolution Document
**Authors:** Kyle + Jeff (decisions) | Claude (compilation)
**Date:** 2026-02-18
**Status:** Attach alongside original DGFS-1.0-spec.json, DGFS-1.0-Design-Document.docx, and DGFS-1.0-Master-Coding-Prompt.pdf
**Purpose:** This document resolves all gaps, conflicts, and ambiguities identified in the pre-build audit. Where this addendum specifies a value or mechanic, it supersedes the original documents. All values marked [TUNABLE] are starting points for playtesting — they should be implemented as config constants, not hardcoded.

---

## 1. REVISED BUILD ORDER

The original 8-layer build order assumed burger crafting was the only gameplay in Layer 1. The MVP now includes a full restaurant operations loop. The revised build order reflects this.

### Layer 1 — Restaurant Operations Core
Build as sub-layers. Each must work before adding the next.

**1A — Kitchen: Burger Crafting**
- Player receives customer order
- Ingredient selection phase: choose burger components from available inventory
- Heat Zone Bar for burger patty: rising bar, player releases in sweet spot
  - Green zone: timing_score = 0.85–1.0
  - Yellow zone: timing_score = 0.50–0.84
  - Red zone: timing_score = 0.10–0.49
  - Bar speed: [TUNABLE] base rate, increases under yips
  - Green zone width: [TUNABLE] base width, shrinks under yips
- Sides/drinks: pass/fail timers running in parallel
  - Fries: drop in fryer, pull before burn timer expires. Pass = included. Fail = burned, must restart (time cost)
  - Drinks: start dispensing, stop before overflow. Pass = included. Fail = spill, must restart (time cost)
- Plating: assemble completed items into order
- Quality score formula (unchanged): `tier_modifier × timing_execution_score × burger_of_day_ceiling_multiplier`

**1B — Dining Floor: Seating & Service**
- 4 booths + 10 bar stools
- Booths: seat parties (2–4 customers per booth), higher revenue per party, longer stay duration, longer bus time
- Bar stools: seat individuals, faster turnover, regulars (Teddy) prefer stools, quicker bus time
- Wait service: completed orders must be delivered to seated customers
- Customer patience timer: 20 seconds [TUNABLE] from seating to receiving food. Walkout if exceeded.
- Lost customer: -$revenue for that order + -0.05 morale hit

**1C — Busing**
- Tables/stools must be cleared after customer leaves
- Uncleared seats block new customers from sitting — creates urgency
- Booth bus time > stool bus time [TUNABLE — suggest booth: 4 sec, stool: 2 sec]

**1D — Customer Rush Wave**
- Wave duration: 6 minutes [TUNABLE]
- Customer arrival rate: 1 every 8–12 seconds, ramping to 1 every 5–8 seconds over the wave [TUNABLE]
- Customers queue at door if no seats available
- Door queue has its own patience timer [TUNABLE — suggest 15 seconds]. Customer leaves if no seat opens.

### Layer 2 — Family Service System
Build after restaurant operations core is functional with Bob alone.

**2A — Family Assignment**
- Family members (Linda, Tina, Gene, Louise) can be assigned to: **orders (wait service)** or **busing**
- Player assigns roles directly
- Each family member has **partially visible tells** (body language, mood indicators) hinting at their currently preferred role
- Correct assignment: ~1.0x competence, full task performance
- Wrong assignment: character stays on-task but begins causing **character-specific problems** after a delay [TUNABLE — suggest 30–60 seconds]
- Reassignment costs time — player must actively redirect, briefly pulling attention from kitchen

**2B — Character Drift Behaviors (Wrong Assignment)**

| Character | Drift Behavior | Mechanical Effect |
|-----------|---------------|-------------------|
| Gene | Singing/performing instead of working | Task slowdown + customer distraction (slight satisfaction variance) |
| Tina | Freezing up | Task stalls entirely, queue backs up until reassigned or self-recovers |
| Louise | Universal wildcard — see Section 2C | Cascading disruption |
| Linda | Behavior pool (random per drift event) — see below | Variable |

**Linda drift behavior pool** (one selected randomly per drift event):
1. Chatting up customers too long → service slows, but customer satisfaction gets slight boost
2. Singing/performing → entertaining but disruptive, orders get forgotten
3. Enters kitchen → interferes with Bob's crafting flow (timing bar disruption)
4. Phone call with Ginger → completely off-task, produces zero output until interrupted

**2C — Louise Baseline Disruption (Separate from Gambit System)**
- Louise has a disruption chance on **every task she performs**, regardless of correct/incorrect assignment
- Disruption chance scales with mood state:
  - Manageable: **10%** per task [TUNABLE]
  - Scheming: **30%** per task [TUNABLE]
- Disruption effects (random from pool per trigger):
  - Makes something up to customer (e.g., "there might be human remains in the food") → customer satisfaction tanks, possible walkout
  - Says something insulting → customer satisfaction hit
  - Creates a mess → another family member must clean up, causing cascading delay
  - Builds card tower from menus / other asinine behavior → task abandoned, must be reassigned
- This is her **baseline risk**. Her gambit system (Layer 6) is a separate, player-initiated mechanic layered on top.

**2D — Teddy as Emergency Backup**
- When family members are unavailable (future: Adventure Mode days off), Teddy can fill service roles
- Competence modifier: **0.4x** [TUNABLE] — he is slow and error-prone
- Signature failure mode: gets jalapeño juice in his eyes, goes temporarily blind (task failure + recovery time)
- Despite poor service quality, Teddy's presence provides a slight relationship score boost (he's trying)
- Teddy backup is mutually exclusive with Teddy-as-regular mechanics — when he's working, his passive customer buff is inactive

### Layer 3 — Burger of the Day
*(Unchanged from original spec, with additions)*

- At session start, player chooses: **Creativity** or **Safety**
- Creativity ceiling multiplier: **1.0** (full range)
- Safety ceiling multiplier: **0.75** (capped range)
- **Variance mechanic (new):** Creativity adds **±0.15 random jitter** to timing execution score per burger. Safety removes jitter entirely.
  - This means Creativity has a higher ceiling but inconsistent execution. Safety has a lower ceiling but reliable output.
  - Without this, Creativity strictly dominates Safety and the red flag "always safety choice" becomes "always creativity choice" instead.
- **BotD Pricing:** Flat **$5.95** regardless of ingredient tier used. This is intentional — Bob wouldn't upcharge. BotD exists to drive Belcher Rating, not profit. Using rare/legendary ingredients on BotD is a craft decision at the expense of margins.
  - Common BotD margin: $5.95 (ingredients free)
  - Rare BotD margin: $3.95 ($2 ingredient cost)
  - Legendary BotD margin: $0.95 ($5 ingredient cost)
  - This creates a genuine tension: invest in quality for Rating, or protect revenue with standard orders.
```
BOTD_PRICING = {
  price: 5.95,          // flat, all tiers
  ingredient_cost: {
    common: 0,
    rare: 2.00,
    legendary: 5.00
  }
}
```

### Layer 4 — Family Morale Tracker
*(Unchanged from original spec, with numeric values added)*

- Single float variable: 0.0 to 1.0
- Starting value: **0.75** [TUNABLE]
- Visible to player as UI element
- **Decay rate during active service: -0.002/sec** [TUNABLE] (~8.3 minutes from 1.0 to 0.0 with no intervention)
- Low morale effects:
  - Below 0.50: **0.9x crafting speed** [TUNABLE] (independent of yips)
  - Below 0.35: increases yips trigger probability (see Layer 5)
  - Affects family assignment compliance — lower morale = faster drift to problem behaviors
- Lost customer morale hit: **-0.05** per walkout [TUNABLE]

### Layer 4.5 — Family Meeting (NEW — added to MVP)
- Player-initiated action
- **Effect:** Pauses service (no new orders accepted, active timers continue), restores morale
- **Base morale restoration: +0.25** [TUNABLE]
- **Diminishing returns:** Each subsequent family meeting in the same session multiplies restoration by **0.6x**
  - Meeting 1: +0.25
  - Meeting 2: +0.15
  - Meeting 3: +0.09
  - Meeting 4+: negligible
- **Time cost:** Service paused for **8 seconds** [TUNABLE] — customers in queue continue losing patience
- **Telemetry:** Log `family_meeting_called → { morale_before, morale_after, meeting_count_this_session }`
- **Red flag:** Player never calls family meeting → morale system not landing

### Layer 5 — Bob's Yips
*(Architecture unchanged, numeric values now defined)*

- **Trigger:** Stress-triggered with random variance. Base probability per tick [TUNABLE — suggest checked every 10 seconds]:
  - Base probability: **5%** per check [TUNABLE]
  - Fischoeder present: **+15%** [TUNABLE]
  - Family morale below 0.35: **+10%** [TUNABLE]
  - Multiple simultaneous stressors: **+5% per additional active stressor** [TUNABLE]
- **Effect:** Quality score multiplier drops to **0.65x** while yips are active [TUNABLE]
- **Additional yips effects on crafting:**
  - Heat Zone Bar speed **increases** (bar moves faster, harder to time)
  - Heat Zone green zone **shrinks** (smaller target)
  - Both effects compound — yips make the core mechanic harder on two axes simultaneously
- **Recovery:** Accumulative encouragement threshold (float accumulator, not discrete counter)
  - Recovery threshold: **1.0** [TUNABLE]
  - Encouragement weights:

| Source | Weight | Notes |
|--------|--------|-------|
| Linda direct encouragement | 0.40 | Strongest single source — she should feel essential |
| Family member accidental encouragement | 0.30 | Any family member, context-dependent trigger |
| Teddy pep talk | 0.20 | Requires Teddy present in restaurant |
| Regular compliment | 0.20 | From any regular (Teddy or future regulars) |
| Customer compliment | 0.12 | Triggered by high-quality burger served |
| Successful burger streak | 0.05 per burger | Stackable — grinding through it is possible but slow |

- **Recovery formula:**
```
encouragement_pool += event_weight
if encouragement_pool >= RECOVERY_THRESHOLD:
    clear_yips()
    reset_encouragement_pool()
```

### Layer 6 — Teddy (Regular)
*(Unchanged from original spec, with buff clarification)*

- Relationship meter: 0.0 to 1.0
- Passive buff when present: **+10% revenue per customer served** [TUNABLE]
  - Applied as multiplier on final order revenue
  - Active only when Teddy is seated in restaurant as customer (not when serving as emergency backup)
- Prefers bar stools
- One quest type per session (simple fetch or timing task)
- Quest completion: +relationship score [TUNABLE — suggest +0.10]
- Quest missed: -relationship score [TUNABLE — suggest -0.05]

### Layer 7 — Louise Chaos Layer (Gambit System)
*(Architecture unchanged, trigger timing now defined)*

- Louise transitions **manageable → scheming** once per rush wave
- Transition timing: semi-random between **2–6 minutes** into the rush [TUNABLE]
- Player decision window: **10 seconds** [TUNABLE] to choose intervene or deploy
- If player doesn't choose within window: defaults to **no intervention** (Louise acts on her own — bad outcome probability increases)
- Gambit outcomes:
  - **Good outcome:** meaningful reward (quality bonus, relationship boost, or resource gain)
  - **Bad outcome:** service disruption + morale hit
- **Reminder:** Louise's gambit system is layered on top of her baseline 10%/30% disruption chance during service. The gambit is the player-controlled chaos. The baseline disruption is the uncontrolled chaos.

### Layer 8 — Fischoeder
*(Trigger timing changed from original spec)*

- **Trigger: Pure timer at 10 minutes.** If rush wave is still active, Fischoeder **interrupts** — customers keep arriving, timers keep running, service pressure continues during his appearance.
- Single escalation tier in MVP
- Player choice: Accept terms (short-term money/relief, long-term rent increase) or Resist (preserves autonomy, increases pressure next session)
- His arrival during an active rush is intentional design — forces split attention between his offer and active service. This is the "chaos is the point" pillar in action.
- Log: `fischoeder_appearance → { terms_accepted: bool, escalation_tier: int, rush_active: bool }`

### Layer 9 — Belcher Rating
*(Unchanged from original spec, with normalization added)*

- Composite score with configurable weights:
```
RATING_WEIGHTS = {
    burger_quality: 0.35,
    family_morale: 0.25,
    teddy_relationship: 0.20,
    revenue: 0.20
}
```
- **All inputs normalized to 0.0–1.0 before weighting:**
  - Burger quality: already 0.0–1.0 (average of session's burger quality scores)
  - Family morale: already 0.0–1.0 (end-of-session value)
  - Teddy relationship: already 0.0–1.0
  - Revenue: normalized as `actual_session_revenue / target_revenue`, capped at 1.0
    - **Target revenue** [TUNABLE]: derived from wave parameters. Suggest: `(wave_duration / avg_arrival_rate) × avg_order_value × 0.75` — i.e., 75% of theoretical max revenue is a "good" session.
- Display prominently in UI

---

## 2. STANDARD MENU (Show-Accurate)

All prices are fixed. These are the non-BotD items customers can order.

```
STANDARD_MENU = {
    regular_burger: { price: 5.00, ingredients: "common_only", craft_complexity: "standard" },
    special_burger: { price: 5.95, ingredients: "common_only", craft_complexity: "standard" },
    burger_of_day:  { price: 5.95, ingredients: "any_tier", craft_complexity: "full_timing", note: "see BotD system" },
    cheese_add_on:  { price: 0.50, note: "modifier on any burger order" },
    fries:          { price: 2.00, mechanic: "pass_fail_timer", burn_time_sec: 8 },
    side_salad:     { price: 2.50, mechanic: "pass_fail_timer", wilt_time_sec: 12 },
    soft_drink:     { price: 2.00, mechanic: "pass_fail_timer", overflow_time_sec: 5 },
    beer:           { price: 4.00, mechanic: "pass_fail_timer", overflow_time_sec: 6 }
}
```

**Menu is complete for MVP.** No additional items.

**Customer order composition:** Each customer orders 1 main item (burger type) + 0–2 sides/drinks. Booth parties order per-person. Revenue = sum of all items in the order.

**Burger of the Day Order Rate:**
- Base rate: **15%** of customers order BotD [TUNABLE]
- Maximum rate: **~40%** with both modifiers active [TUNABLE]
- **Quality modifier:** Each successfully crafted BotD with quality score > 0.7 increases the BotD order rate for subsequent customers in the same rush. Word of mouth — good burgers attract more BotD orders.
- **Service modifier:** Correctly assigned family members (good tell-reading) increase BotD order rate. Properly assigned waitstaff actively promotes the BotD to customers.
- Both modifiers stack additively toward the 40% ceiling.

**Booth Party Size:** Random 2–4 customers per booth.

---

## 3. SEATING MODEL

```
SEATING = {
    booths: {
        count: 4,
        capacity_per_booth: "2-4 customers (party)",
        revenue_model: "per-person ordering, higher total per table",
        stay_duration: "longer than stools",
        bus_time_sec: 4,       // [TUNABLE]
        customer_type: "parties"
    },
    bar_stools: {
        count: 10,
        capacity_per_stool: 1,
        revenue_model: "single customer ordering",
        stay_duration: "shorter than booths",
        bus_time_sec: 2,       // [TUNABLE]
        customer_type: "individuals, regulars prefer stools"
    }
}
```

---

## 4. INGREDIENT INVENTORY (MVP Starting Values)

```
STARTING_INVENTORY = {
    common:    Infinity,  // always available
    rare:      5,         // [TUNABLE]
    legendary: 1          // [TUNABLE]
}
```

- Common ingredients: unlimited, no cost in MVP
- Rare ingredients: consumed per use, no restock during rush
- Legendary ingredients: consumed per use, no restock during rush
- Ingredient costs for revenue calculation:
  - Common: $0 (free — baseline ingredient)
  - Rare: $2 per use [TUNABLE]
  - Legendary: $5 per use [TUNABLE]

---

## 5. CONFLICT RESOLUTIONS

| ID | Conflict | Resolution |
|----|----------|------------|
| CONFLICT-01 | Morale vs. Yips double-punishment | Two independent systems. Morale below 0.50 = 0.9x crafting speed. Yips = 0.65x quality. They can stack but are on different axes (speed vs. quality). |
| CONFLICT-02 | Fischoeder timer | Pure 10-minute timer. Interrupts active rush. Rush continues during his appearance. |
| CONFLICT-03 | Teddy buff value | +10% revenue per customer served. Applied as multiplier. Config constant. |
| CONFLICT-04 | Empty character table in design doc | Deferred to Phase 2 for full character specs. MVP character behaviors defined in this addendum (Section 1, Layer 2). |

---

## 6. REVISED TELEMETRY

All original telemetry events remain. **Add the following:**

### New Events to Log
```
order_completed → { items: [], total_revenue: float, quality_score: float, customer_satisfaction: string }
order_failed → { reason: "walkout" | "burned" | "timeout", revenue_lost: float }
family_assignment → { character: string, role: string, correct_match: bool }
family_drift → { character: string, drift_behavior: string, time_before_drift_sec: float }
louise_disruption → { task: string, disruption_type: string, mood_state: string, cascading: bool }
table_bused → { seat_type: "booth" | "stool", time_to_bus_sec: float }
customer_seated → { seat_type: "booth" | "stool", queue_wait_sec: float }
customer_left_queue → { patience_exceeded: true, queue_position: int }
teddy_backup_activated → { family_available_count: int }
teddy_backup_failure → { failure_type: string }
botd_order_rate_change → { new_rate: float, quality_modifier: float, service_modifier: float }
```

### New State Vars to Log at Session Start/End
```
seats_occupied (by type)
family_assignments (character: role mapping)
family_drift_count
louise_disruption_count
orders_completed
orders_failed
customers_served
customers_lost
```

---

## 7. REVISED RED FLAGS

All original red flags remain. **Add the following:**

- All family members always assigned to same role → assignment system not creating decisions
- Louise disruption never triggers → probability too low or system not firing
- Tables never full → arrival rate too slow or seating too generous
- Player never reassigns family mid-rush → either perfect tell-reading or drift penalty too weak
- Teddy backup never noticeably worse than family → competence penalty too mild
- Fischoeder interruption during rush causes no stress → rush pressure or Fischoeder stakes too low

---

## 8. REVISED SUCCESS METRICS

Original five metrics remain. **Revised metric #1:**

> ~~Player makes at least 3 meaningful decisions per rush wave~~
> **Player makes at least 3 meaningful decisions per MINUTE during rush wave**

Rationale: With the full restaurant operations loop (kitchen + service + busing + family assignment), decision density is much higher than the original burger-only spec. The original metric is now trivially met. Per-minute is a better measure of engagement.

---

## 9. SCOPE CHANGE ACKNOWLEDGMENT

This addendum expands the MVP scope beyond the original DGFS-1.0 spec in the following ways:

| Addition | Rationale | Build Impact |
|----------|-----------|-------------|
| Full restaurant operations loop (service, busing, seating) | A burger restaurant with only burger crafting doesn't feel like Bob's Burgers | Layer 1 build time ~doubles. Sub-layered to manage complexity. |
| Family service assignment system | Creates the attention economy that makes chaos meaningful. Also authentic to the show. | New Layer 2. Moderate build complexity. |
| Standard menu items | Necessary for restaurant to feel real. Creates baseline revenue stream alongside BotD. | Config-driven, low build complexity. |
| Family meeting mechanic | Referenced in original telemetry/red flags but never specified. Now defined. | Small addition (Layer 4.5). |
| Character-specific drift behaviors | Makes family assignment a skill-based system, not just optimization. | Moderate — requires per-character behavior pools. |

**Net assessment:** The MVP is larger than originally scoped but significantly more testable. The original spec's success metrics are now easier to validate because the decision density is higher and the systems interact more. The core question — "does the loop feel good and does pressure create tension" — is better answered by this expanded scope.

**Kyle + Jeff should confirm this scope expansion is intentional before build begins.**

---

## 10. FAMILY TELL DATA STRUCTURE

Each family member's preferred role and tell state is tracked per session:

```
character_service_state = {
    character: string,                          // "linda" | "tina" | "gene" | "louise"
    preferred_role: "orders" | "busing",        // shifts per session based on mood/context
    tell_indicators: [string],                  // visible hints, e.g. ["hovering near tables", "eyeing the door"]
    tell_visibility: float (0.0-1.0),           // how obvious the hint is [TUNABLE]
    current_assignment: "orders" | "busing" | "unassigned",
    assignment_correct: bool,                   // derived: current_assignment == preferred_role
    drift_timer_sec: float,                     // seconds until problem behavior starts if misassigned [TUNABLE: 30-60]
    drift_active: bool,
    drift_behavior: string | null,              // active drift behavior type, null if not drifting
    competence_modifier: float                  // 1.0 if correct, degrades if wrong assignment
}
```

Visual/animation specifics for tells deferred to UI/art phase. The coder implements the state machine and data structure; tell presentation is a skinning pass.

---

## 11. DEFERRED ITEMS — STATUS: ALL RESOLVED

All 6 items from the original audit deferral list have been resolved in this session:

| Item | Status | Resolution |
|------|--------|------------|
| BotD pricing | ✅ RESOLVED | Flat $5.95 all tiers. Craft play, not revenue play. |
| Standard menu completeness | ✅ RESOLVED | Menu confirmed complete for MVP. |
| Customer BotD order rate | ✅ RESOLVED | Base 15%, scaling to ~40% via quality + service modifiers. |
| Booth party size | ✅ RESOLVED | Random 2–4 per booth. |
| Family tell data structure | ✅ RESOLVED | See Section 10. Visual design deferred to UI phase. |
| Side item timing values | ✅ RESOLVED | Fries 8s, drinks 5–6s, salad 12s confirmed. |

**This addendum is now COMPLETE. No open items remain.**

---

*DGFS-1.0 Addendum | Kyle + Jeff | February 18, 2026*
*Compiled from audit session — all decisions made by Kyle, compilation by Claude*
