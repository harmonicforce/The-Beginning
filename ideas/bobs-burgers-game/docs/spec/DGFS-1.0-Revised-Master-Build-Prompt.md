# DGFS-1.0 MASTER BUILD PROMPT — REVISED
## Bob's Burgers Game — MVP Prototype Build
### February 18, 2026 | Kyle + Jeff

---

## ATTACHED DOCUMENTS — READ ALL BEFORE WRITING ANY CODE

You have been given **five documents**. Read them in this order:

1. **This prompt** — Your instructions, constraints, and build order. Start here.
2. **DGFS-1.0-Spec-Addendum.md** — The authoritative resolution document. **This supersedes the original spec and design doc wherever they conflict.** All numeric values, mechanic definitions, and system specs finalized in the addendum are the source of truth. Read this second.
3. **DGFS-1.0-spec.json** — The original machine-readable spec. Provides system architecture, compounding mechanisms, and design philosophy. Still authoritative for anything the addendum does not override.
4. **DGFS-1.0-Design-Document.docx** — The human-readable design document. Read Section 13 (AI Coding Context) for architectural reasoning. Read Section 2 (Design Pillars) to understand tone and intent.
5. **DGFS-1.0-Spec-Audit.md** — Reference document showing what gaps and conflicts were found and how they were resolved. You do not need to act on this — it explains *why* the addendum exists.

### Document Hierarchy (Conflict Resolution)

```
ADDENDUM > THIS PROMPT > JSON SPEC > DESIGN DOC
```

If the addendum says something different from the JSON or design doc, the addendum wins. This prompt provides build constraints; the addendum provides system specifications. The JSON and design doc provide architectural context and design philosophy.

---

## YOUR ROLE

You are a senior game developer building a Bob's Burgers-themed 2D restaurant game prototype. Your job is to build the MVP as defined in the addendum's revised build order (Addendum Section 1) and the prototype scope in the JSON spec, as modified by the addendum's scope expansion (Addendum Section 9).

**Extract, do not invent.** Every mechanic, value, formula, and system interaction is defined across these documents. If you cannot find a specification for something, flag it with `[SPEC GAP: description]` before proceeding. Do not improvise systems. Do not add scope.

---

## CONSTRAINTS

### What to Build
Build ONLY what is specified in the addendum's revised build order (Layers 1 through 9, including all sub-layers). The addendum expanded the original MVP scope intentionally. The full scope is:

- **Layer 1: Restaurant Operations Core**
  - 1A: Kitchen — burger crafting with Heat Zone Bar timing mechanic + parallel side/drink pass/fail timers
  - 1B: Dining Floor — 4 booths (2–4 customers each) + 10 bar stools, wait service, customer patience
  - 1C: Busing — table clearing, uncleared seats block new customers
  - 1D: Customer Rush Wave — 6 min wave, ramping arrival rate, door queue with patience timer
- **Layer 2: Family Service System** — assignment, tells, drift behaviors, Louise baseline disruption, Teddy emergency backup
- **Layer 3: Burger of the Day** — creativity/safety choice, ceiling multiplier, ±0.15 variance jitter on creativity
- **Layer 4: Family Morale Tracker** — decay rate, low-morale debuffs, lost customer morale hit
- **Layer 4.5: Family Meeting** — pause service, restore morale, diminishing returns
- **Layer 5: Bob's Yips** — stress-triggered, probability modifiers, 0.65x quality degradation, bar speed increase + green zone shrink, float accumulator recovery
- **Layer 6: Teddy** — relationship meter, passive +10% revenue buff, one quest type
- **Layer 7: Louise Chaos Layer (Gambit)** — scheming transition, 10-sec decision window, intervene/deploy, two outcome branches (layered on top of her baseline disruption from Layer 2)
- **Layer 8: Fischoeder** — pure 10-minute timer, interrupts active rush, accept/resist choice
- **Layer 9: Belcher Rating** — weighted composite, all inputs normalized 0.0–1.0, configurable weights

### What NOT to Build
Everything in `prototype.explicitly_out_of_scope` in the JSON spec remains out of scope:
- Adventure Mode / split party
- Gene and Tina chaos *gambit* systems (their drift behaviors in Layer 2 ARE in scope)
- Full collectible economy
- Neighborhood events
- Ken mechanic
- Misinformation layer
- Health inspection
- Multiple regulars (Teddy only)
- Meta-progression unlocks
- Linda distraction *gambit* system (her drift behaviors in Layer 2 ARE in scope)
- Recipe book persistence

If a feature feels obviously missing, it is probably out of scope on purpose. Flag it, do not build it.

### Platform Target
PC + Mobile cross-platform. Side-scrolling 2D. Real-time (not turn-based). Mixed input: touch and mouse/keyboard must both work.

### Tone
The game must feel like an episode of Bob's Burgers — warm, chaotic, slightly stressful, never mean. Characters must feel like themselves.

- Bob's love of cooking must always be visible
- The family is always simultaneously an asset and a liability
- Louise is dangerous and brilliant — her disruptions should feel like *her*, not generic randomness
- Teddy is loyal and a disaster — his failures should be endearing
- Linda is chaotic and loving — even her worst drift behaviors come from a good place
- Fischoeder is charming and predatory — his appearance should feel inevitable, not random

**If the code works but the characters don't feel right, the prototype has failed.**

---

## BUILD ORDER — FOLLOW THIS EXACTLY

Build one layer at a time. Each layer must feel correct before the next is added. Do not skip ahead. The addendum (Section 1) contains full specifications for every layer. Below is the sequence with critical implementation notes.

### Layer 1A — Kitchen: Burger Crafting

The heartbeat. Get this feeling good first.

**Heat Zone Bar:**
- Rising bar, player releases to score
- Green zone: timing_score = 0.85–1.0
- Yellow zone: timing_score = 0.50–0.84
- Red zone: timing_score = 0.10–0.49
- Bar speed and green zone width are [TUNABLE] config constants — they must be adjustable because yips modify both

**Parallel Side/Drink Timers:**
- Fries: pass/fail, 8-second burn timer
- Soft drink: pass/fail, 5-second overflow timer
- Beer: pass/fail, 6-second overflow timer
- Side salad: pass/fail, 12-second wilt timer
- Player manages these simultaneously with the burger bar — attention splitting is the core tension

**Ingredient System:**
```
INGREDIENT_TIERS = {
    COMMON:    { base_quality_modifier: 0.6, cost: 0, starting_stock: Infinity },
    RARE:      { base_quality_modifier: 0.85, cost: 2.00, starting_stock: 5 },
    LEGENDARY: { base_quality_modifier: 1.0, cost: 5.00, starting_stock: 1 }
}
```
Implement tier as enum. Rare and legendary are consumed per use, no restock during rush.

**Quality Score Formula:**
```
final_quality = tier_modifier × timing_execution_score × burger_of_day_ceiling_multiplier
```

**Standard Menu — show-accurate prices:**
```
STANDARD_MENU = {
    regular_burger: { price: 5.00, ingredients: "common_only" },
    special_burger: { price: 5.95, ingredients: "common_only" },
    burger_of_day:  { price: 5.95, ingredients: "any_tier" },
    cheese_add_on:  { price: 0.50 },
    fries:          { price: 2.00 },
    side_salad:     { price: 2.50 },
    soft_drink:     { price: 2.00 },
    beer:           { price: 4.00 }
}
```

All burgers (standard and BotD) use the same crafting mechanic. Standard burgers use common ingredients only. BotD uses the full tier system. Customer orders 1 main + 0–2 sides/drinks.

### Layer 1B — Dining Floor: Seating & Service

**Seating:**
- 4 booths: parties of 2–4 (random), higher total revenue, longer stay, 4-sec bus time
- 10 bar stools: individuals, faster turnover, regulars prefer stools, 2-sec bus time

**Service:**
- Completed orders must be delivered to seated customers
- Customer patience: 20 seconds from seating to food delivery — walkout if exceeded
- Lost customer: lose that order's revenue + 0.05 morale hit

### Layer 1C — Busing

- Uncleared seats block new customers — this is the urgency driver
- Booth bus time: 4 seconds [TUNABLE]
- Stool bus time: 2 seconds [TUNABLE]

### Layer 1D — Customer Rush Wave

- Wave duration: 6 minutes [TUNABLE]
- Arrival rate: 1 customer every 8–12 seconds, ramping to 1 every 5–8 seconds [TUNABLE]
- Door queue: customers wait if no seats available. Door queue patience: 15 seconds [TUNABLE]
- Customer leaves entirely if queue patience exceeded

### Layer 2 — Family Service System

**Do not build this until Layer 1 works with Bob alone.** The restaurant must function as a solo operation first. Family members are an upgrade layer.

**2A — Assignment:**
- Linda, Tina, Gene, Louise assignable to: orders or busing
- Player assigns directly
- Each character has partially visible tells indicating preferred role (see addendum Section 10 for data structure)
- Correct assignment = ~1.0x competence
- Wrong assignment = character-specific problems after 30–60 sec delay [TUNABLE]
- Reassignment costs player attention/time

**2B — Drift Behaviors (wrong assignment):**

| Character | Drift Behavior | Effect |
|-----------|---------------|--------|
| Gene | Singing/performing | Task slowdown + customer distraction |
| Tina | Freezing up | Task stalls, queue backs up |
| Louise | Wildcard pool | Cascading disruption (see 2C) |
| Linda | Random from pool: (1) chatting customers — slow + slight satisfaction boost, (2) singing — orders forgotten, (3) enters kitchen — interferes with Bob's timing bar, (4) phone with Ginger — fully off-task | Variable per event |

**2C — Louise Baseline Disruption:**
- Fires on every task she performs, regardless of assignment correctness
- Manageable mood: 10% chance per task [TUNABLE]
- Scheming mood: 30% chance per task [TUNABLE]
- Effects pool: makes up stories to customers (satisfaction tank/walkout), insults customers (satisfaction hit), creates mess (another family member must clean → cascading delay), abandons task for nonsense (must reassign)
- **This is separate from her gambit system in Layer 7.** Baseline disruption is uncontrolled chaos. The gambit is controlled chaos.

**2D — Teddy Emergency Backup:**
- Fills service roles when family unavailable
- Competence: 0.4x [TUNABLE]
- Signature failure: jalapeño juice in eyes → temporarily blind → task failure + recovery time
- Provides slight relationship boost despite bad service (he's trying)
- When working, his passive customer buff (Layer 6) is inactive

**Character State Machine — implement for all family members:**
```
character_service_state = {
    character: string,
    preferred_role: "orders" | "busing",
    tell_indicators: [string],
    tell_visibility: float,
    current_assignment: "orders" | "busing" | "unassigned",
    assignment_correct: bool,
    drift_timer_sec: float,
    drift_active: bool,
    drift_behavior: string | null,
    competence_modifier: float
}
```

### Layer 3 — Burger of the Day

- Session start choice: Creativity or Safety
- Creativity: ceiling_multiplier = 1.0, adds ±0.15 random jitter to timing_execution_score
- Safety: ceiling_multiplier = 0.75, no jitter (consistent execution)
- BotD price: flat $5.95 regardless of ingredient tier. Bob wouldn't upcharge.
- BotD order rate: base 15%, scales to ~40% max via quality modifier (good BotD burgers → word of mouth) + service modifier (correct family assignments → staff promotes BotD)

```
BOTD_PRICING = {
    price: 5.95,
    ingredient_cost: { common: 0, rare: 2.00, legendary: 5.00 }
}
```

### Layer 4 — Family Morale Tracker

- Float: 0.0 to 1.0. Starting value: 0.75 [TUNABLE]
- Decay: -0.002/sec during active service [TUNABLE]
- Below 0.50: 0.9x crafting speed (independent of yips)
- Below 0.35: increases yips probability
- Lower morale = faster family drift to problem behaviors
- Lost customer: -0.05 morale per walkout [TUNABLE]

### Layer 4.5 — Family Meeting

- Player-initiated. Pauses incoming orders (active timers continue).
- Base restoration: +0.25 morale [TUNABLE]
- Diminishing returns: 0.6x multiplier per subsequent use in same session
  - Meeting 1: +0.25, Meeting 2: +0.15, Meeting 3: +0.09, Meeting 4+: negligible
- Service paused 8 seconds [TUNABLE] — queued customers still losing patience

### Layer 5 — Bob's Yips

- Probability checked every 10 seconds [TUNABLE]:
  - Base: 5% per check
  - Fischoeder present: +15%
  - Morale below 0.35: +10%
  - Per additional active stressor: +5%
- Effects while active:
  - Quality multiplier: 0.65x [TUNABLE]
  - Heat Zone Bar speed increases (harder to time)
  - Heat Zone green zone shrinks (smaller target)
- Recovery: float accumulator, threshold = 1.0 [TUNABLE]

```
ENCOURAGEMENT_WEIGHTS = {
    linda_direct:              0.40,
    family_accidental:         0.30,
    teddy_pep_talk:            0.20,
    regular_compliment:        0.20,
    customer_compliment:       0.12,
    successful_burger_streak:  0.05  // per burger, stackable
}
```
```
encouragement_pool += event_weight
if encouragement_pool >= RECOVERY_THRESHOLD:
    clear_yips()
    reset_encouragement_pool()
```

**Do not implement as a discrete counter.** Multiple small events must feel equivalent to one large event.

### Layer 6 — Teddy (Regular)

- Relationship meter: 0.0 to 1.0
- Passive buff: +10% revenue per customer served (multiplier on final order revenue) [TUNABLE]
- Active only when seated as customer (prefers bar stools), NOT when serving as backup
- One quest type per session (simple fetch or timing task)
- Quest complete: +0.10 relationship [TUNABLE]
- Quest missed: -0.05 relationship [TUNABLE]
- His presence must create a noticeable mechanical difference — validate via telemetry

### Layer 7 — Louise Chaos Layer (Gambit System)

- Louise transitions manageable → scheming once per rush: semi-random between 2–6 min in [TUNABLE]
- Player gets 10-second decision window [TUNABLE]
- No choice within window = defaults to no intervention (bad outcome probability increases)
- **Intervene:** costs attention, defuses chaos, small morale gain
- **Deploy:** triggers gambit with two outcome branches:
  - Good: meaningful reward (quality bonus, relationship boost, or resource gain)
  - Bad: service disruption + morale hit
- The gambit must feel like an opportunity with teeth, not a random interruption
- **Remember:** This is layered on top of her 10%/30% baseline disruption from Layer 2. Louise is always a risk. The gambit is the player choosing to channel that risk.

### Layer 8 — Fischoeder

- **Pure timer: 10 minutes.** If rush is active, he interrupts. Rush continues.
- Customers keep arriving, timers keep running, service pressure continues during his appearance
- Single escalation tier in MVP
- Accept: short-term money/relief, long-term rent increase next session
- Resist: preserves autonomy, increases pressure next session
- His arrival during active rush is intentional — split attention is the design
- Log whether rush was active at time of appearance

### Layer 9 — Belcher Rating

- Weighted composite, configurable:
```
RATING_WEIGHTS = {
    burger_quality:      0.35,
    family_morale:       0.25,
    teddy_relationship:  0.20,
    revenue:             0.20
}
```
- **Normalize all inputs to 0.0–1.0 before weighting:**
  - Burger quality: average of session's quality scores (already 0–1)
  - Family morale: end-of-session value (already 0–1)
  - Teddy relationship: already 0–1
  - Revenue: `actual_session_revenue / target_revenue`, capped at 1.0
    - Target revenue = `(wave_duration / avg_arrival_rate) × avg_order_value × 0.75` [TUNABLE]
- Display prominently. This is the number the player is always trying to improve.
- Tune weights after playtesting. Keep them accessible.

---

## SYSTEM ARCHITECTURE NOTES

### Character State Machines
All character mood states (Louise scheming/manageable, Bob yips/normal, Teddy present/absent, family member drift states) must be implemented as state machines with clean transitions. No ambiguous intermediate states.

### Config-Driven Values
Every value marked [TUNABLE] in the addendum must be implemented as a config constant, not hardcoded. Collect all tunables into a single config object or file. The first thing we do after the prototype works is tune these — they must be easy to change.

### Save Architecture
The MVP does not require persistence. However: stub the save system now. Define what would persist (relationship scores, Fischoeder escalation tier, recipe book, Belcher Rating history) as a save schema even if it doesn't write to disk. Do not make it structurally hard to add later.

### Revenue Model
```
order_revenue = sum(item_prices) × teddy_buff_multiplier(if present)
net_revenue = order_revenue - ingredient_costs
session_revenue += net_revenue per completed order
```

### BotD Order Rate Scaling
```
botd_rate = BASE_RATE                                          // 0.15
           + quality_modifier(successful_botd_count)           // scales toward cap
           + service_modifier(correct_family_assignments)      // scales toward cap
botd_rate = min(botd_rate, MAX_BOTD_RATE)                      // 0.40 cap
```

---

## TELEMETRY — LOG EVERYTHING IN THESE LISTS

### Original Events (from coding prompt)
```
burger_crafted → { ingredients: [], quality_score: float, time_taken: float }
chaos_intercept → { intervened: bool, outcome: string }
louise_gambit_triggered → { player_response: string, result: string }
fischoeder_appearance → { terms_accepted: bool, escalation_tier: int, rush_active: bool }
family_meeting_called → { morale_before: float, morale_after: float, meeting_count: int }
burger_of_day_choice → { choice: "creativity" | "safety" }
yips_triggered → { stress_level: float, morale_at_trigger: float }
yips_cleared → { encouragement_events: [], total_weight: float }
```

### New Events (from addendum)
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

### State Vars — Log at Session Start and End
```
belcher_rating
family_morale
teddy_relationship_score
revenue_generated
ingredient_levels (by tier)
fischoeder_escalation_tier
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

## SUCCESS METRICS — THE PROTOTYPE PASSES WHEN

1. **Player makes at least 3 meaningful decisions per MINUTE during rush wave** *(revised from original — decision density is higher with full restaurant ops)*
2. Teddy's presence creates a noticeable mechanical difference (validate via telemetry)
3. Louise's chaos event creates genuine tension at least once per session
4. Fischoeder's appearance feels like earned pressure, not random punishment
5. Burger of the Day choice feels consequential by end of rush

---

## RED FLAGS — STOP AND FLAG IMMEDIATELY

### Original Red Flags
- Player never calls family meeting → morale system not landing
- Louise gambit always ignored → chaos layer not compelling
- Burger of the Day always safety choice → creativity risk not worth taking
- Fischoeder always accepted → resistance option not viable
- Session length under 3 minutes consistently → loop not engaging

### New Red Flags (from addendum)
- All family members always assigned to same role → assignment system not creating decisions
- Louise disruption never triggers → probability too low or system broken
- Tables never full → arrival rate too slow or seating too generous
- Player never reassigns family mid-rush → tell-reading not working or drift too weak
- Teddy backup never noticeably worse than family → competence penalty too mild
- Fischoeder interruption during rush causes no stress → stakes too low

If any of these appear during playtesting, **stop building and report.** Do not continue adding layers on a broken foundation.

---

## WHAT TO ASK IF UNCERTAIN

If a mechanic is ambiguous, ask before building. Do not invent solutions. The spec is intentional.

Flag ambiguities with: `[SPEC GAP: description]`

Flag technical trade-offs with: `[TRADE-OFF: option A vs option B — design consequences are X]`

The addendum resolved all known gaps. If you find a new one, it's real — surface it.

---

## FINAL NOTE

This is a passion project built in the Bob's Burgers universe by Kyle and Jeff. The DGFS-1.0 spec went through a full audit and resolution process before reaching you. Every value has been discussed. Every mechanic has been decided intentionally. Your job is to execute faithfully, not to redesign.

The characters must feel authentic. The restaurant must feel alive. The chaos must feel like the show.

Bob cares about his craft. Linda is chaotic and loving. Louise is dangerous and brilliant. Gene lives in his own world. Tina is earnest to a fault. Teddy is loyal and a disaster. Fischoeder is charming and predatory.

Build it right.

---

*DGFS-1.0 Revised Master Build Prompt | Kyle + Jeff | February 18, 2026*
