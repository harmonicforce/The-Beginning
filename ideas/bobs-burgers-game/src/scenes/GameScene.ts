/**
 * GameScene.ts — Main gameplay scene.
 * Integrates all systems from Layers 0–9.
 * Layout: Kitchen (left) | Restaurant Floor (right) | HUD (top)
 */

import Phaser from 'phaser';
import { Telemetry } from '../systems/Telemetry';
import { HeatZoneBar } from '../systems/HeatZoneBar';
import { SideTimer } from '../systems/SideTimer';
import { SeatingManager } from '../systems/SeatingManager';
import { BusingManager } from '../systems/BusingManager';
import { RushWave } from '../systems/RushWave';
import { FamilyService } from '../systems/FamilyService';
import { BurgerOfTheDay } from '../systems/BurgerOfTheDay';
import { Morale } from '../systems/Morale';
import { Yips } from '../systems/Yips';
import { LouiseGambit } from '../systems/LouiseGambit';
import { Fischoeder } from '../systems/Fischoeder';
import { BelcherRating } from '../systems/BelcherRating';
import { Teddy } from '../entities/Teddy';
import { Customer } from '../entities/Customer';
import { Order } from '../entities/Order';
import { IngredientTier, IngredientInventory, startingInventory, hasStock } from '../entities/Ingredient';
import { generateOrder, computeOrderRevenue, hasBurgerOfDay, getSideItems } from '../systems/Menu';
import { computeQuality } from '../systems/QualityScore';
import { BotDChoice } from '../systems/BurgerOfTheDay';
import { FamilyCharacter, ServiceRole } from '../entities/FamilyMember';
import { HEAT_ZONE, RUSH } from '../config/tunables';

// ──────────────────────────────────────────────────────────────────────────────
// LAYOUT CONSTANTS
// ──────────────────────────────────────────────────────────────────────────────
const HUD_H = 55;
const KITCHEN_W = 590;
const W = 1280;
const H = 720;
const FLOOR_X = KITCHEN_W;
const FLOOR_W = W - KITCHEN_W;

// Kitchen sub-regions
const KITCHEN = {
  orderY: HUD_H + 5,
  orderH: 120,
  ingredientY: HUD_H + 130,
  heatZoneX: KITCHEN_W - 90,
  heatZoneY: HUD_H + 10,
  heatZoneW: 50,
  heatZoneH: 360,
  sideTimerY: HUD_H + 260,
  buttonY: HUD_H + 430,
};

// Floor sub-regions
const FLOOR = {
  stoolRowY: HUD_H + 10,
  stoolH: 70,
  boothY: HUD_H + 95,
  boothH: 220,
  queueY: HUD_H + 330,
  queueH: 80,
  familyY: HUD_H + 420,
  familyH: 230,
};

// ──────────────────────────────────────────────────────────────────────────────
// GAME STATE
// ──────────────────────────────────────────────────────────────────────────────
interface ActiveOrder {
  order: Order;
  customer: Customer;
  sideTimers: SideTimer[];
  craftStartTime: number;
}

interface Notification {
  text: string;
  color: string;
  expiry: number;
}

type ModalType = 'louise_gambit' | 'fischoeder' | 'family_meeting' | null;

export class GameScene extends Phaser.Scene {
  // Systems
  private heatZoneBar!: HeatZoneBar;
  private seating!: SeatingManager;
  private busing!: BusingManager;
  private rushWave!: RushWave;
  private familyService!: FamilyService;
  private botd!: BurgerOfTheDay;
  private morale!: Morale;
  private yips!: Yips;
  private louiseGambit!: LouiseGambit;
  private fischoeder!: Fischoeder;
  private belcherRating!: BelcherRating;
  private teddy!: Teddy;

  // Game state
  private seatedCustomers: Map<number, Customer> = new Map();
  private pendingOrders: Order[] = [];
  private activeOrder: ActiveOrder | null = null;
  private completedOrders: Order[] = [];
  private totalRevenue: number = 0;
  private inventory!: IngredientInventory;
  private selectedTier: IngredientTier = IngredientTier.COMMON;
  private qualityBonusFromGambit: number = 0;
  private servicePaused: boolean = false;
  private louiseDisruptionTimer: number = 15;
  private currentModal: ModalType = null;
  private notifications: Notification[] = [];
  private teddyQuestOffered: boolean = false;
  private sessionEnded: boolean = false;

  // Graphics objects (rebuilt each frame via refresh)
  private hudGroup!: Phaser.GameObjects.Group;
  private kitchenGroup!: Phaser.GameObjects.Group;
  private floorGroup!: Phaser.GameObjects.Group;
  private modalGroup!: Phaser.GameObjects.Group;
  private notifGroup!: Phaser.GameObjects.Group;

  constructor() {
    super('GameScene');
  }

  init(data: { botdChoice?: BotDChoice }): void {
    const choice = data.botdChoice ?? 'safety';
    this.botd = new BurgerOfTheDay();
    this.botd.choose(choice);
  }

  create(): void {
    this.heatZoneBar   = new HeatZoneBar();
    this.seating       = new SeatingManager();
    this.busing        = new BusingManager(this.seating);
    this.morale        = new Morale();
    this.yips          = new Yips();
    this.louiseGambit  = new LouiseGambit();
    this.fischoeder    = new Fischoeder();
    this.belcherRating = new BelcherRating();
    this.teddy         = new Teddy();
    this.familyService = new FamilyService();
    this.inventory     = startingInventory();

    this.morale.onPause(() => { this.servicePaused = true; });
    this.morale.onResume(() => { this.servicePaused = false; });

    this.familyService.onDrift((character, behavior) => {
      this.notify(`${character.toUpperCase()}: ${driftMessage(character, behavior)}`, '#ff9933', 5000);
      // Accidental encouragement from drift events (sometimes)
      if (Math.random() < 0.25) this.yips.addFamilyAccidentalEncouragement();
    });

    this.familyService.setLindaKitchenCallback(() => {
      this.heatZoneBar.setYipsActive(true);
      this.notify("Linda wandered into the kitchen. Your timing is thrown off!", '#ff6633', 4000);
      setTimeout(() => { if (!this.yips.isActive) this.heatZoneBar.setYipsActive(false); }, 4000);
    });

    this.rushWave = new RushWave(
      this.seating,
      (c) => this.onCustomerSeated(c),
      (c) => this.onCustomerLeft(c),
    );

    this.hudGroup    = this.add.group();
    this.kitchenGroup = this.add.group();
    this.floorGroup  = this.add.group();
    this.modalGroup  = this.add.group();
    this.notifGroup  = this.add.group();

    // Background
    this.add.rectangle(0, 0, KITCHEN_W, H, 0x1a0f00).setOrigin(0, 0).setDepth(0);
    this.add.rectangle(KITCHEN_W, 0, FLOOR_W, H, 0x0a0a1a).setOrigin(0, 0).setDepth(0);

    // Divider
    this.add.line(KITCHEN_W, 0, 0, 0, 0, H, 0x444444).setOrigin(0, 0).setLineWidth(2).setDepth(1);

    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-SPACE', () => this.onSpaceBar());
    this.input.keyboard?.on('keydown-T', () => Telemetry.dumpToConsole());
    this.input.keyboard?.on('keydown-M', () => this.callFamilyMeeting());

    Telemetry.snapshotState({
      belcher_rating: 0,
      family_morale: this.morale.value,
      teddy_relationship_score: this.teddy.relationshipScore,
      revenue_generated: 0,
      ingredient_levels: { ...this.inventory },
      fischoeder_escalation_tier: 1,
    }, 'session_start');

    this.rushWave.start();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // UPDATE LOOP
  // ──────────────────────────────────────────────────────────────────────────
  update(_time: number, delta: number): void {
    if (this.sessionEnded) return;
    const dt = delta / 1000;

    // Update all systems
    if (!this.servicePaused) {
      this.morale.update(dt);
      this.rushWave.update(dt);
    }

    this.heatZoneBar.setYipsActive(this.yips.isActive);
    this.heatZoneBar.update(dt);

    if (this.activeOrder) {
      for (const st of this.activeOrder.sideTimers) st.update(dt);
    }

    // Sync morale → yips
    this.yips.lowMorale = this.morale.isVeryLow;
    this.yips.fischoederPresent = this.fischoeder.isPresent;

    // Yips stressor count (number of extra stressors active)
    let stressors = 0;
    if (this.morale.isLow) stressors++;
    if (this.rushWave.doorQueue.length > 3) stressors++;
    if (this.pendingOrders.length > 2) stressors++;
    if (this.seating.dirtySeatCount > 3) stressors++;
    this.yips.extraStressorCount = Math.max(0, stressors - 1);

    const stressLevel = Math.min(1, stressors / 5);
    this.yips.update(dt, stressLevel, this.morale.value);

    // Louise gambit
    if (this.currentModal === null) {
      this.louiseGambit.update(dt, this.rushWave.elapsed);
      if (this.louiseGambit.state === 'scheming') {
        this.louiseGambit.updateDecisionWindow(dt);
        this.currentModal = 'louise_gambit';
        this.familyService.setLouiseMood(true);
      }
    }
    // Check if gambit self-resolved after timeout
    if (this.louiseGambit.state === 'resolved' && this.currentModal === 'louise_gambit') {
      this.applyGambitResult();
    }

    // Fischoeder
    this.fischoeder.update(this.rushWave.elapsed, this.rushWave.state === 'active');
    if (this.fischoeder.isPresent && this.currentModal === null) {
      this.currentModal = 'fischoeder';
    }

    // Family service drift
    if (!this.servicePaused) this.familyService.update(dt);

    // Louise disruption timer
    this.louiseDisruptionTimer -= dt;
    if (this.louiseDisruptionTimer <= 0) {
      this.louiseDisruptionTimer = 12 + Math.random() * 8;
      const louise = this.familyService.get('louise');
      if (louise && louise.currentRole !== null) {
        const msg = this.familyService.rollLouiseDisruption();
        if (msg) {
          this.notify(msg, '#ff4444', 5000);
          this.morale.value = Math.max(0, this.morale.value - 0.04);
        }
      }
    }

    // Teddy
    this.teddy.update(dt);

    // Customer patience
    for (const customer of this.seatedCustomers.values()) {
      if (customer.state === 'seated' || customer.state === 'ordered') {
        customer.patience -= dt;
        if (customer.patience <= 0) {
          this.customerWalkout(customer);
        }
      }
    }

    // Rush ended
    if (this.rushWave.state === 'ended' && !this.sessionEnded) {
      this.endSession();
    }

    // Teddy quest
    if (this.teddy.state === 'seated' && this.teddy.quest?.state === 'available' && !this.teddyQuestOffered) {
      this.teddyQuestOffered = true;
      this.notify("Teddy: 'Hey Bob, can I get my usual? You know the one.'", '#44aaff', 6000);
      this.teddy.startQuest();
    }

    // Sync rating trackers
    this.belcherRating.setEndMorale(this.morale.value);
    this.belcherRating.setTeddyRelationship(this.teddy.relationshipScore);

    // Redraw everything
    this.clearGroups();
    this.drawHUD();
    this.drawKitchen();
    this.drawFloor();
    this.drawNotifications();
    if (this.currentModal === 'louise_gambit') this.drawLouiseGambitModal();
    else if (this.currentModal === 'fischoeder') this.drawFischeoderModal();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CUSTOMER EVENTS
  // ──────────────────────────────────────────────────────────────────────────
  private onCustomerSeated(customer: Customer): void {
    this.seatedCustomers.set(customer.id, customer);

    if (customer.isTeddy) {
      const seat = this.seating.findAvailableSeat('individual', true);
      if (seat) this.teddy.seat(seat.id);
    }

    // Generate order
    const isTeddy = customer.isTeddy;
    const order = generateOrder(
      customer.id,
      customer.seatId!,
      isTeddy,
      this.botd.currentOrderRate,
    );
    customer.order = order;
    customer.state = 'ordered';
    this.pendingOrders.push(order);
  }

  private onCustomerLeft(customer: Customer): void {
    this.seatedCustomers.delete(customer.id);
    this.morale.lostCustomer();
    Telemetry.emit('order_failed', {
      reason: 'walkout',
      revenue_lost: customer.order?.basePrice ?? 0,
    });
  }

  private customerWalkout(customer: Customer): void {
    customer.state = 'leaving';
    if (customer.seatId) {
      this.busing.markDirty(customer.seatId);
    }
    this.seatedCustomers.delete(customer.id);
    this.morale.lostCustomer();
    if (customer.isTeddy) {
      this.teddy.leave();
    }
    this.notify('Customer walked out! (-morale)', '#ff4444', 3000);
    Telemetry.emit('order_failed', { reason: 'timeout', revenue_lost: customer.order?.basePrice ?? 0 });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // KITCHEN INTERACTIONS
  // ──────────────────────────────────────────────────────────────────────────
  private startCraftingNextOrder(): void {
    if (this.activeOrder !== null) return;
    const order = this.pendingOrders.shift();
    if (!order) return;
    const customer = this.seatedCustomers.get(order.customerId);
    if (!customer) {
      this.startCraftingNextOrder(); // skip ghost orders
      return;
    }

    const sideTypes = getSideItems(order);
    const sideTimers = sideTypes.map(st => new SideTimer(st));

    order.status = 'crafting';
    order.selectedTier = this.selectedTier;
    this.activeOrder = {
      order,
      customer,
      sideTimers,
      craftStartTime: performance.now(),
    };
    this.heatZoneBar.start();
  }

  private onSpaceBar(): void {
    if (this.currentModal !== null) return;
    if (this.heatZoneBar.state === 'rising') {
      this.releaseHeatZone();
    } else if (this.heatZoneBar.state === 'idle' || this.heatZoneBar.state === 'released') {
      if (this.activeOrder === null && this.pendingOrders.length > 0) {
        this.startCraftingNextOrder();
      } else if (this.activeOrder !== null && this.heatZoneBar.state === 'released') {
        this.checkOrderComplete();
      }
    }
  }

  private releaseHeatZone(): void {
    const result = this.heatZoneBar.release();
    const isBotD = this.activeOrder ? hasBurgerOfDay(this.activeOrder.order) : false;
    let timing = result.timingScore;
    if (isBotD) timing = this.botd.applyJitter(timing);

    const quality = computeQuality(
      this.selectedTier,
      timing,
      isBotD ? this.botd.ceilingMultiplier : 1.0,
      this.yips.isActive,
    );

    if (this.activeOrder) {
      this.activeOrder.order.qualityScore = quality + this.qualityBonusFromGambit;
      this.qualityBonusFromGambit = 0;
    }

    const zoneColors: Record<string, string> = { green: '#22ff44', yellow: '#ffcc22', red: '#ff4422', missed: '#ff0000' };
    this.notify(`${result.zone.toUpperCase()} zone! Quality: ${((this.activeOrder?.order.qualityScore ?? quality) * 100).toFixed(0)}%`, zoneColors[result.zone] ?? '#ffffff', 3000);

    // Start side timers when heat zone fires
    if (this.activeOrder) {
      for (const st of this.activeOrder.sideTimers) {
        if (st.state === 'idle') st.start();
      }
    }
  }

  private checkOrderComplete(): void {
    if (!this.activeOrder) return;
    const { order, sideTimers, customer } = this.activeOrder;

    if (order.qualityScore === null) return;

    // All sides must be passed (or none required)
    const allSidesDone = sideTimers.every(st => st.state === 'passed' || st.state === 'failed');
    if (!allSidesDone) {
      this.notify('Finish the sides first!', '#ff9933', 2000);
      return;
    }

    order.status = 'ready';
    this.deliverOrder(order, customer);
  }

  private deliverOrder(order: Order, customer: Customer): void {
    const quality = order.qualityScore ?? 0;
    const revenue = computeOrderRevenue(order, this.teddy.passiveBuffActive);
    this.totalRevenue += revenue;
    this.belcherRating.recordBurgerQuality(quality);
    this.belcherRating.recordRevenue(revenue);

    const craftStartTime = this.activeOrder?.craftStartTime ?? performance.now();
    customer.state = 'served';
    if (customer.seatId) this.busing.markDirty(customer.seatId);
    this.seatedCustomers.delete(customer.id);
    order.status = 'delivered';
    this.completedOrders.push(order);
    this.activeOrder = null;
    this.heatZoneBar.reset();

    if (quality > 0.7) {
      this.yips.addSuccessfulBurgerStreak();
      this.yips.addCustomerCompliment();
      if (hasBurgerOfDay(order)) {
        this.botd.recordHighQualityBotD(quality);
      }
    }

    if (customer.isTeddy) {
      this.teddy.completeQuest();
      this.notify("Teddy: 'Bob, that was outstanding. Truly. You're an artist.'", '#44aaff', 5000);
      this.yips.addTeddyPepTalk();
    }

    const timeTaken = (performance.now() - craftStartTime) / 1000;
    Telemetry.emit('burger_crafted', {
      ingredients: [order.selectedTier],
      quality_score: quality,
      time_taken: timeTaken,
    });
    Telemetry.emit('order_completed', {
      items: order.items.map(i => i.type),
      total_revenue: revenue,
      quality_score: quality,
      customer_satisfaction: quality > 0.75 ? 'high' : quality > 0.5 ? 'medium' : 'low',
    });

    this.notify(`Order delivered! $${revenue.toFixed(2)} | Quality ${(quality * 100).toFixed(0)}%`, '#44ff88', 3000);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GAMBIT / EVENTS
  // ──────────────────────────────────────────────────────────────────────────
  private applyGambitResult(): void {
    const result = this.louiseGambit.result;
    if (!result) return;
    this.morale.boost(result.moraleEffect < 0 ? 0 : result.moraleEffect);
    if (result.moraleEffect < 0) this.morale.value = Math.max(0, this.morale.value + result.moraleEffect);
    if (result.rewardType === 'quality_bonus') this.qualityBonusFromGambit = result.rewardValue;
    if (result.rewardType === 'revenue_gain') { this.totalRevenue += result.rewardValue; this.belcherRating.recordRevenue(result.rewardValue); }
    if (result.rewardType === 'relationship_boost') this.teddy.relationshipScore = Math.min(1.0, this.teddy.relationshipScore + result.rewardValue);
    this.currentModal = null;
    this.familyService.setLouiseMood(false);
  }

  private callFamilyMeeting(): void {
    if (this.morale.paused) return;
    this.morale.callMeeting();
    this.notify('Family meeting! Service paused for 8 seconds.', '#aaddff', 4000);
    this.yips.addFamilyAccidentalEncouragement();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SESSION END
  // ──────────────────────────────────────────────────────────────────────────
  private endSession(): void {
    this.sessionEnded = true;
    this.belcherRating.setEndMorale(this.morale.value);
    this.belcherRating.setTeddyRelationship(this.teddy.relationshipScore);
    this.belcherRating.snapshot('session_end');
    const finalRating = this.belcherRating.compute();
    Telemetry.snapshotState({
      belcher_rating: finalRating,
      family_morale: this.morale.value,
      teddy_relationship_score: this.teddy.relationshipScore,
      revenue_generated: this.totalRevenue,
      ingredient_levels: { ...this.inventory },
      fischoeder_escalation_tier: this.fischoeder.escalationTier,
    }, 'session_end');
    Telemetry.dumpToConsole();
    this.time.delayedCall(1500, () => {
      this.scene.start('EndScene', {
        belcherRating: finalRating,
        revenue: this.totalRevenue,
        morale: this.morale.value,
        teddyRelationship: this.teddy.relationshipScore,
        avgQuality: this.belcherRating.averageBurgerQuality,
        ordersCompleted: this.completedOrders.length,
        fischoederDecision: this.fischoeder.decision,
        botdChoice: this.botd.choice,
      });
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DRAWING — HUD
  // ──────────────────────────────────────────────────────────────────────────
  private drawHUD(): void {
    const g = this.hudGroup;
    const bg = this.add.rectangle(0, 0, W, HUD_H, 0x221100, 0.95).setOrigin(0, 0).setDepth(10);
    g.add(bg);

    const remaining = this.rushWave.remainingSec;
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    const timerStr = `RUSH: ${mins}:${secs.toString().padStart(2, '0')}`;
    const timerColor = remaining < 60 ? '#ff4444' : remaining < 120 ? '#ffaa00' : '#ffdd44';
    g.add(this.add.text(10, 8, timerStr, { fontFamily: 'monospace', fontSize: '20px', color: timerColor }).setDepth(11));

    // Morale bar
    g.add(this.add.text(240, 8, 'MORALE', { fontFamily: 'monospace', fontSize: '12px', color: '#aaaaaa' }).setDepth(11));
    const moraleBarW = 160;
    const moraleBarBg = this.add.rectangle(240, 26, moraleBarW, 18, 0x333333).setOrigin(0, 0).setDepth(11);
    const moraleColor = this.morale.value > 0.6 ? 0x22bb44 : this.morale.value > 0.35 ? 0xffaa22 : 0xff3333;
    const moraleBar = this.add.rectangle(240, 26, moraleBarW * this.morale.value, 18, moraleColor).setOrigin(0, 0).setDepth(12);
    g.add(moraleBarBg);
    g.add(moraleBar);
    g.add(this.add.text(410, 8, `${(this.morale.value * 100).toFixed(0)}%`, { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' }).setDepth(11));

    // Revenue
    g.add(this.add.text(450, 8, `$${this.totalRevenue.toFixed(2)}`, { fontFamily: 'monospace', fontSize: '20px', color: '#44ff88' }).setDepth(11));

    // Rating
    const rating = this.belcherRating.compute();
    const ratingColor = rating > 0.7 ? '#ffdd00' : rating > 0.4 ? '#ffaa44' : '#ff6666';
    g.add(this.add.text(600, 8, `BELCHER RATING: ${(rating * 100).toFixed(1)}`, { fontFamily: 'monospace', fontSize: '18px', color: ratingColor, fontStyle: 'bold' }).setDepth(11));

    // Yips status
    if (this.yips.isActive) {
      g.add(this.add.text(900, 8, '⚡ YIPS ⚡', { fontFamily: 'monospace', fontSize: '18px', color: '#ff4444', fontStyle: 'bold' }).setDepth(11));
      const poolFrac = this.yips.encouragementPool;
      const poolBar = this.add.rectangle(900, 30, 120 * poolFrac, 12, 0x4488ff).setOrigin(0, 0).setDepth(12);
      const poolBg = this.add.rectangle(900, 30, 120, 12, 0x222244).setOrigin(0, 0).setDepth(11);
      g.add(poolBg);
      g.add(poolBar);
    }

    // Service pause indicator
    if (this.morale.paused) {
      g.add(this.add.text(1050, 8, 'SERVICE PAUSED', { fontFamily: 'monospace', fontSize: '14px', color: '#aaddff', fontStyle: 'bold' }).setDepth(11));
    }

    // Ingredient inventory
    const inv = this.inventory;
    g.add(this.add.text(1060, 8, `RARE:${inv.RARE}  LEG:${inv.LEGENDARY}`, { fontFamily: 'monospace', fontSize: '12px', color: '#ccaa66' }).setDepth(11));

    // Control hint (keyboard fallback; primary input is on-screen buttons)
    g.add(this.add.text(1060, 28, 'Tap buttons or heat bar  [T]=telemetry', { fontFamily: 'monospace', fontSize: '10px', color: '#555555' }).setDepth(11));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DRAWING — KITCHEN
  // ──────────────────────────────────────────────────────────────────────────
  private drawKitchen(): void {
    const g = this.kitchenGroup;
    const y0 = HUD_H;

    // Panel label
    g.add(this.add.text(10, y0 + 5, "BOB'S KITCHEN", { fontFamily: 'monospace', fontSize: '14px', color: '#ffcc33', fontStyle: 'bold' }).setDepth(5));

    // ─ Current order display ─
    const orderY = y0 + 25;
    g.add(this.add.rectangle(5, orderY, KITCHEN_W - 110, 115, 0x221500, 0.8).setOrigin(0, 0).setDepth(4));

    if (this.activeOrder) {
      const { order } = this.activeOrder;
      g.add(this.add.text(10, orderY + 5, `CRAFTING ORDER #${order.id}`, { fontFamily: 'monospace', fontSize: '13px', color: '#ffaa33' }).setDepth(5));
      const itemStr = order.items.map(i => i.type.replace(/_/g, ' ')).join(', ');
      g.add(this.add.text(10, orderY + 22, itemStr, { fontFamily: 'monospace', fontSize: '12px', color: '#cccccc', wordWrap: { width: KITCHEN_W - 130 } }).setDepth(5));
      g.add(this.add.text(10, orderY + 40, `Tier: ${this.selectedTier}`, { fontFamily: 'monospace', fontSize: '12px', color: tierColor(this.selectedTier) }).setDepth(5));
      if (order.qualityScore !== null) {
        const qc = order.qualityScore > 0.75 ? '#22ff66' : order.qualityScore > 0.5 ? '#ffcc22' : '#ff4444';
        g.add(this.add.text(10, orderY + 56, `Quality: ${(order.qualityScore * 100).toFixed(0)}%`, { fontFamily: 'monospace', fontSize: '14px', color: qc, fontStyle: 'bold' }).setDepth(5));
      }
      // Progress hint
      const sidesReady = this.activeOrder.sideTimers.filter(st => st.state === 'passed').length;
      const totalSides = this.activeOrder.sideTimers.length;
      const hzDone = this.heatZoneBar.state === 'released' || this.heatZoneBar.state === 'missed';
      if (!hzDone) {
        g.add(this.add.text(10, orderY + 76, 'TAP heat bar → or button below to release!', { fontFamily: 'monospace', fontSize: '11px', color: '#ffdd55' }).setDepth(5));
      } else if (totalSides > sidesReady) {
        g.add(this.add.text(10, orderY + 76, `Sides: ${sidesReady}/${totalSides} done — tap each to pull`, { fontFamily: 'monospace', fontSize: '11px', color: '#aaaaff' }).setDepth(5));
      } else {
        g.add(this.add.text(10, orderY + 76, 'TAP button below to complete & deliver!', { fontFamily: 'monospace', fontSize: '11px', color: '#44ff88' }).setDepth(5));
      }
    } else if (this.pendingOrders.length > 0) {
      const next = this.pendingOrders[0];
      g.add(this.add.text(10, orderY + 5, `NEXT ORDER #${next.id}`, { fontFamily: 'monospace', fontSize: '13px', color: '#aaaaff' }).setDepth(5));
      const itemStr = next.items.map(i => i.type.replace(/_/g, ' ')).join(', ');
      g.add(this.add.text(10, orderY + 22, itemStr, { fontFamily: 'monospace', fontSize: '12px', color: '#888888', wordWrap: { width: KITCHEN_W - 130 } }).setDepth(5));
      g.add(this.add.text(10, orderY + 52, 'TAP button below to start crafting!', { fontFamily: 'monospace', fontSize: '12px', color: '#ffdd44' }).setDepth(5));
      if (this.pendingOrders.length > 1) {
        g.add(this.add.text(10, orderY + 68, `+${this.pendingOrders.length - 1} more orders waiting`, { fontFamily: 'monospace', fontSize: '11px', color: '#888888' }).setDepth(5));
      }
    } else {
      g.add(this.add.text(10, orderY + 30, 'Waiting for orders...', { fontFamily: 'monospace', fontSize: '14px', color: '#555555', fontStyle: 'italic' }).setDepth(5));
    }

    // ─ Ingredient tier selector ─
    const tierY = y0 + 150;
    g.add(this.add.text(10, tierY, 'INGREDIENT TIER:', { fontFamily: 'monospace', fontSize: '12px', color: '#888888' }).setDepth(5));
    this.drawTierButton(g, 10, tierY + 18, IngredientTier.COMMON, 'COMMON', 0x446644);
    this.drawTierButton(g, 105, tierY + 18, IngredientTier.RARE, 'RARE', 0x4444aa);
    this.drawTierButton(g, 200, tierY + 18, IngredientTier.LEGENDARY, 'LEGENDARY', 0xaa7700);

    // ─ Heat Zone Bar ─
    this.drawHeatZoneBar(g);

    // ─ Side timers ─
    this.drawSideTimers(g);

    // ─ Main Action Button (large touch target) ─
    const actionInfo = this.getKitchenAction();
    if (actionInfo) {
      const abtnW = KITCHEN_W - 120;
      const abtnH = 56;
      const abtnX = 10;
      const abtnY = KITCHEN.buttonY;
      const abtn = this.add.rectangle(abtnX, abtnY, abtnW, abtnH, actionInfo.bg, 0.95)
        .setOrigin(0, 0).setDepth(7).setStrokeStyle(3, actionInfo.border);
      abtn.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.onSpaceBar());
      const abtnTxt = this.add.text(abtnX + abtnW / 2, abtnY + abtnH / 2, actionInfo.label, {
        fontFamily: 'monospace', fontSize: '17px', color: actionInfo.color, fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(8);
      abtnTxt.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.onSpaceBar());
      g.add(abtn); g.add(abtnTxt);
    }

    // ─ Bob status ─
    const bobY = y0 + 500;
    const bobStatus = this.yips.isActive ? '⚡ YIPS ACTIVE' : 'Normal';
    const bobColor = this.yips.isActive ? '#ff4444' : '#44ff88';
    g.add(this.add.text(10, bobY, `BOB: ${bobStatus}`, { fontFamily: 'monospace', fontSize: '13px', color: bobColor, fontStyle: 'bold' }).setDepth(5));

    if (this.yips.isActive) {
      g.add(this.add.text(10, bobY + 18, `Encouragement pool: ${this.yips.encouragementPool.toFixed(2)} / 1.0`, { fontFamily: 'monospace', fontSize: '11px', color: '#aaaaff' }).setDepth(5));
      this.drawEncouragementButtons(g, bobY + 36);
    }

    // ─ Family meeting button ─
    const mtgY = y0 + 600;
    const mtgBtn = this.add.rectangle(10, mtgY, 180, 52, 0x224466, 0.9).setOrigin(0, 0).setDepth(5);
    const mtgTxt = this.add.text(100, mtgY + 26, 'Family Meeting', { fontFamily: 'monospace', fontSize: '13px', color: '#aaddff' }).setOrigin(0.5).setDepth(6);
    g.add(mtgBtn); g.add(mtgTxt);
    mtgBtn.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.callFamilyMeeting());
    mtgTxt.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.callFamilyMeeting());

    // Morale decay info
    g.add(this.add.text(200, mtgY + 8, `Meeting ${this.morale.meetingCount + 1}: +${(0.25 * Math.pow(0.6, this.morale.meetingCount) * 100).toFixed(0)}%`, { fontFamily: 'monospace', fontSize: '11px', color: '#557799' }).setDepth(5));
  }

  private getKitchenAction(): { label: string; bg: number; border: number; color: string } | null {
    if (this.currentModal !== null) return null;
    if (this.heatZoneBar.state === 'rising') {
      return { label: 'TAP TO RELEASE!', bg: 0x332200, border: 0xffee00, color: '#ffee00' };
    }
    if (this.activeOrder === null && this.pendingOrders.length > 0) {
      const n = this.pendingOrders.length;
      return { label: `START CRAFTING  (${n} order${n > 1 ? 's' : ''} waiting)`, bg: 0x001133, border: 0x4488ff, color: '#88bbff' };
    }
    if (this.activeOrder !== null && this.heatZoneBar.state === 'released') {
      const allDone = this.activeOrder.sideTimers.every(st => st.state === 'passed' || st.state === 'failed');
      if (allDone) {
        return { label: 'COMPLETE ORDER  ✓', bg: 0x003311, border: 0x44ff88, color: '#44ff88' };
      }
    }
    return null;
  }

  private drawTierButton(g: Phaser.GameObjects.Group, x: number, y: number, tier: IngredientTier, label: string, color: number): void {
    const isSelected = this.selectedTier === tier;
    const hasStock_ = hasStock(this.inventory, tier);
    const bg = this.add.rectangle(x, y, 90, 30, color, isSelected ? 1.0 : 0.4).setOrigin(0, 0).setDepth(5);
    if (isSelected) this.add.rectangle(x, y, 90, 30).setOrigin(0, 0).setStrokeStyle(2, 0xffffff).setDepth(6);
    const stockTxt = tier !== IngredientTier.COMMON ? ` (${this.inventory[tier]})` : '';
    const btnTxt = this.add.text(x + 45, y + 15, label + stockTxt, { fontFamily: 'monospace', fontSize: '10px', color: hasStock_ ? '#ffffff' : '#555555' }).setOrigin(0.5).setDepth(6);
    g.add(bg); g.add(btnTxt);
    if (hasStock_) {
      bg.setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.selectedTier = tier; });
      btnTxt.setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.selectedTier = tier; });
    }
  }

  private drawHeatZoneBar(g: Phaser.GameObjects.Group): void {
    const hx = KITCHEN.heatZoneX;
    const hy = KITCHEN.heatZoneY;
    const bw = KITCHEN.heatZoneW;
    const bh = KITCHEN.heatZoneH;

    g.add(this.add.text(hx + bw / 2, hy - 12, 'HEAT', { fontFamily: 'monospace', fontSize: '11px', color: '#ff9933' }).setOrigin(0.5).setDepth(5));
    g.add(this.add.text(hx + bw / 2, hy - 2, 'ZONE', { fontFamily: 'monospace', fontSize: '11px', color: '#ff9933' }).setOrigin(0.5).setDepth(5));

    // Background
    g.add(this.add.rectangle(hx, hy, bw, bh, 0x111111).setOrigin(0, 0).setDepth(5));

    // Red zone (bottom 0–40%)
    g.add(this.add.rectangle(hx, hy + bh * 0.6, bw, bh * 0.4, 0x442222).setOrigin(0, 0).setDepth(5));
    // Yellow zone (40–85%)
    g.add(this.add.rectangle(hx, hy + bh * 0.15, bw, bh * 0.45, 0x444422).setOrigin(0, 0).setDepth(5));
    // Green zone (top, 85–100%)
    const greenH = bh * this.heatZoneBar.effectiveGreenZoneWidth / HEAT_ZONE.baseGreenZoneWidth * 0.15;
    g.add(this.add.rectangle(hx, hy, bw, greenH, 0x224422).setOrigin(0, 0).setDepth(5));

    // Zone labels
    g.add(this.add.text(hx + bw + 4, hy + 2, 'GREEN', { fontFamily: 'monospace', fontSize: '9px', color: '#22ff44' }).setDepth(5));
    g.add(this.add.text(hx + bw + 4, hy + bh * 0.35, 'YELLOW', { fontFamily: 'monospace', fontSize: '9px', color: '#ffcc22' }).setDepth(5));
    g.add(this.add.text(hx + bw + 4, hy + bh * 0.75, 'RED', { fontFamily: 'monospace', fontSize: '9px', color: '#ff4422' }).setDepth(5));

    // Rising fill
    if (this.heatZoneBar.state === 'rising' || this.heatZoneBar.state === 'released') {
      const pos = this.heatZoneBar.position;
      const fillH = bh * pos;
      const fillY = hy + bh - fillH;
      const fillColor = pos >= this.heatZoneBar.greenZoneStart ? 0x44ff66 : pos >= 0.5 ? 0xffcc44 : 0xff5533;
      g.add(this.add.rectangle(hx + 2, fillY, bw - 4, fillH, fillColor, 0.85).setOrigin(0, 0).setDepth(6));
    }

    // Result indicator
    if (this.heatZoneBar.state === 'released') {
      const res = this.heatZoneBar.getLastResult();
      if (res) {
        const indY = hy + bh * (1 - res.position) - 2;
        g.add(this.add.rectangle(hx - 3, indY, bw + 6, 4, 0xffffff).setOrigin(0, 0).setDepth(7));
      }
    }

    // Border — highlight yellow when tap-ready
    const barBorderColor = this.heatZoneBar.state === 'rising' ? 0xffee00 : 0x666666;
    g.add(this.add.rectangle(hx, hy, bw, bh).setOrigin(0, 0).setStrokeStyle(2, barBorderColor).setDepth(7));

    // Full-bar tap target when rising (for iPad / touch)
    if (this.heatZoneBar.state === 'rising') {
      const hitArea = this.add.rectangle(hx - 10, hy, bw + 20, bh, 0x000000, 0)
        .setOrigin(0, 0).setInteractive({ useHandCursor: true }).setDepth(9);
      hitArea.on('pointerdown', () => this.releaseHeatZone());
      g.add(hitArea);
    }

    // State text under bar
    const stateStr = this.heatZoneBar.state === 'rising' ? 'TAP TO RELEASE!'
      : this.heatZoneBar.state === 'idle' ? 'Ready'
      : this.heatZoneBar.state === 'missed' ? 'MISSED!' : 'Done';
    const stateColor = this.heatZoneBar.state === 'rising' ? '#ffff00'
      : this.heatZoneBar.state === 'missed' ? '#ff4444' : '#888888';
    g.add(this.add.text(hx + bw / 2, hy + bh + 10, stateStr, { fontFamily: 'monospace', fontSize: '11px', color: stateColor }).setOrigin(0.5).setDepth(5));
  }

  private drawSideTimers(g: Phaser.GameObjects.Group): void {
    if (!this.activeOrder || this.activeOrder.sideTimers.length === 0) return;

    const baseY = KITCHEN.sideTimerY;
    g.add(this.add.text(10, baseY, 'SIDES:', { fontFamily: 'monospace', fontSize: '12px', color: '#888888' }).setDepth(5));

    this.activeOrder.sideTimers.forEach((st, i) => {
      const sy = baseY + 18 + i * 52;
      const label = st.type.replace(/_/g, ' ').toUpperCase();

      const stColor = st.state === 'passed' ? 0x224422 : st.state === 'failed' ? 0x442222 : 0x333333;
      g.add(this.add.rectangle(10, sy, 200, 44, stColor, 0.8).setOrigin(0, 0).setDepth(5));
      g.add(this.add.text(15, sy + 4, label, { fontFamily: 'monospace', fontSize: '11px', color: '#cccccc' }).setDepth(6));

      if (st.state === 'running') {
        const barW = 160;
        const frac = st.fraction;
        const barColor = frac < 0.5 ? 0x44cc44 : frac < 0.8 ? 0xffaa22 : 0xff3333;
        g.add(this.add.rectangle(15, sy + 22, barW, 10, 0x222222).setOrigin(0, 0).setDepth(5));
        g.add(this.add.rectangle(15, sy + 22, barW * frac, 10, barColor).setOrigin(0, 0).setDepth(6));
        const remSec = Math.max(0, st.deadlineSec - st.elapsed).toFixed(1);
        g.add(this.add.text(180, sy + 22, `${remSec}s`, { fontFamily: 'monospace', fontSize: '10px', color: '#ffaa44' }).setOrigin(0, 0).setDepth(6));
        g.add(this.add.text(15, sy + 32, 'Click to pull!', { fontFamily: 'monospace', fontSize: '10px', color: '#ffdd44' }).setDepth(6));
        const btn = this.add.rectangle(10, sy, 200, 44, 0x000000, 0).setOrigin(0, 0).setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => { st.pull(); });
        g.add(btn);
      } else if (st.state === 'passed') {
        g.add(this.add.text(15, sy + 18, '✓ Done', { fontFamily: 'monospace', fontSize: '12px', color: '#44ff66' }).setDepth(6));
      } else if (st.state === 'failed') {
        g.add(this.add.text(15, sy + 10, '✗ BURNED/SPILLED', { fontFamily: 'monospace', fontSize: '11px', color: '#ff4444' }).setDepth(6));
        const restartBtn = this.add.rectangle(15, sy + 26, 90, 14, 0x444444).setOrigin(0, 0).setInteractive({ useHandCursor: true });
        const restartTxt = this.add.text(60, sy + 33, 'Restart', { fontFamily: 'monospace', fontSize: '10px', color: '#ffaa44' }).setOrigin(0.5).setDepth(6);
        restartBtn.on('pointerdown', () => { st.restart(); st.start(); });
        g.add(restartBtn); g.add(restartTxt);
      } else if (st.state === 'idle') {
        g.add(this.add.text(15, sy + 14, 'Starts when heat zone releases', { fontFamily: 'monospace', fontSize: '9px', color: '#555555' }).setDepth(6));
      }
    });
  }

  private drawEncouragementButtons(g: Phaser.GameObjects.Group, baseY: number): void {
    const sources: Array<{ label: string; action: () => void; color: number }> = [
      { label: 'Linda encourages Bob', action: () => this.yips.addLindaEncouragement(), color: 0x663366 },
      { label: 'Family cheers for Bob', action: () => this.yips.addFamilyAccidentalEncouragement(), color: 0x334466 },
      { label: 'Ask Teddy pep talk', action: () => { if (this.teddy.state === 'seated') this.yips.addTeddyPepTalk(); }, color: 0x335533 },
    ];
    sources.forEach((src, i) => {
      const sy = baseY + i * 24;
      const btn = this.add.rectangle(10, sy, 240, 20, src.color, 0.8).setOrigin(0, 0).setInteractive({ useHandCursor: true }).setDepth(5);
      const txt = this.add.text(125, sy + 10, src.label, { fontFamily: 'monospace', fontSize: '10px', color: '#cccccc' }).setOrigin(0.5).setDepth(6);
      btn.on('pointerdown', src.action);
      g.add(btn); g.add(txt);
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DRAWING — FLOOR
  // ──────────────────────────────────────────────────────────────────────────
  private drawFloor(): void {
    const g = this.floorGroup;
    const fx = FLOOR_X + 5;

    g.add(this.add.text(fx, HUD_H + 5, "BOB'S BURGERS — DINING ROOM", { fontFamily: 'monospace', fontSize: '13px', color: '#aaaaff', fontStyle: 'bold' }).setDepth(5));

    this.drawStools(g, fx);
    this.drawBooths(g, fx);
    this.drawDoorQueue(g, fx);
    this.drawFamilyAssignments(g, fx);
    this.drawTeddyPanel(g, fx);
  }

  private drawStools(g: Phaser.GameObjects.Group, fx: number): void {
    const sy = FLOOR.stoolRowY + HUD_H;
    g.add(this.add.text(fx, sy, 'BAR STOOLS:', { fontFamily: 'monospace', fontSize: '11px', color: '#888888' }).setDepth(5));

    const stoolW = 56;
    const stoolsPerRow = 5;
    const stoolSeats = this.seating.getAllSeats().filter(s => s.type === 'stool');

    stoolSeats.forEach((seat, i) => {
      const row = Math.floor(i / stoolsPerRow);
      const col = i % stoolsPerRow;
      const sx = fx + col * stoolW;
      const sby = sy + 16 + row * 36;

      const seatColor = seat.status === 'empty' ? 0x223355
        : seat.status === 'occupied' ? 0x553322
        : 0x553300;
      const seatBorder = seat.status === 'dirty' ? 0xaa5500 : seat.status === 'occupied' ? 0xffaa44 : 0x334466;
      const rect = this.add.rectangle(sx, sby, stoolW - 4, 30, seatColor).setOrigin(0, 0).setDepth(5);
      rect.setStrokeStyle(1, seatBorder);
      g.add(rect);

      const customer = seat.customerId ? this.seatedCustomers.get(seat.customerId) : null;
      let label = seat.status === 'empty' ? 'EMPTY'
        : seat.status === 'dirty' ? 'DIRTY'
        : customer?.isTeddy ? 'TEDDY' : `C${seat.customerId}`;
      g.add(this.add.text(sx + stoolW / 2 - 2, sby + 15, label, { fontFamily: 'monospace', fontSize: '9px', color: '#cccccc' }).setOrigin(0.5).setDepth(6));

      if (seat.status === 'dirty') {
        const busBtn = this.add.rectangle(sx, sby, stoolW - 4, 30, 0x000000, 0).setOrigin(0, 0).setInteractive({ useHandCursor: true }).setDepth(7);
        busBtn.on('pointerdown', () => this.busing.busNow(seat.id));
        g.add(busBtn);
      }

      if (customer && (customer.state === 'seated' || customer.state === 'ordered')) {
        const patFrac = Math.max(0, customer.patience / RUSH.seatPatienceSec);
        const patColor = patFrac > 0.5 ? 0x44aa44 : patFrac > 0.25 ? 0xffaa22 : 0xff3333;
        g.add(this.add.rectangle(sx, sby + 28, (stoolW - 4) * patFrac, 3, patColor).setOrigin(0, 0).setDepth(7));
      }
    });
  }

  private drawBooths(g: Phaser.GameObjects.Group, fx: number): void {
    const by = FLOOR.boothY + HUD_H;
    g.add(this.add.text(fx, by, 'BOOTHS:', { fontFamily: 'monospace', fontSize: '11px', color: '#888888' }).setDepth(5));

    const boothSeats = this.seating.getAllSeats().filter(s => s.type === 'booth');
    const boothW = (FLOOR_W - 20) / 2 - 5;
    const boothH = 90;

    boothSeats.forEach((seat, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = fx + col * (boothW + 10);
      const bby = by + 18 + row * (boothH + 10);

      const seatColor = seat.status === 'empty' ? 0x1a1a33
        : seat.status === 'occupied' ? 0x332211
        : 0x331a00;
      const rect = this.add.rectangle(bx, bby, boothW, boothH, seatColor).setOrigin(0, 0).setDepth(5);
      rect.setStrokeStyle(2, seat.status === 'dirty' ? 0xaa5500 : seat.status === 'occupied' ? 0xffaa44 : 0x334499);
      g.add(rect);

      g.add(this.add.text(bx + 6, bby + 6, `BOOTH ${i + 1}`, { fontFamily: 'monospace', fontSize: '10px', color: '#aaaaff' }).setDepth(6));

      const customer = seat.customerId ? this.seatedCustomers.get(seat.customerId) : null;
      if (customer) {
        const partyLabel = `Party of ${customer.partySize}`;
        g.add(this.add.text(bx + 6, bby + 22, partyLabel, { fontFamily: 'monospace', fontSize: '11px', color: '#ffcc88' }).setDepth(6));
        const patFrac = Math.max(0, customer.patience / RUSH.seatPatienceSec);
        const patColor = patFrac > 0.5 ? 0x44aa44 : patFrac > 0.25 ? 0xffaa22 : 0xff3333;
        g.add(this.add.rectangle(bx, bby + boothH - 8, boothW * patFrac, 6, patColor).setOrigin(0, 0).setDepth(7));
        g.add(this.add.text(bx + 6, bby + 38, `State: ${customer.state}`, { fontFamily: 'monospace', fontSize: '10px', color: '#888888' }).setDepth(6));
        if (customer.order?.qualityScore !== null && customer.order?.status === 'crafting') {
          g.add(this.add.text(bx + 6, bby + 52, 'Kitchen working...', { fontFamily: 'monospace', fontSize: '10px', color: '#ffdd44' }).setDepth(6));
        }
      } else if (seat.status === 'empty') {
        g.add(this.add.text(bx + boothW / 2, bby + boothH / 2, 'EMPTY', { fontFamily: 'monospace', fontSize: '12px', color: '#333355' }).setOrigin(0.5).setDepth(6));
      } else {
        g.add(this.add.text(bx + boothW / 2, bby + boothH / 2, 'DIRTY', { fontFamily: 'monospace', fontSize: '12px', color: '#aa5500' }).setOrigin(0.5).setDepth(6));
        const busBtn = this.add.rectangle(bx, bby, boothW, boothH, 0x000000, 0).setOrigin(0, 0).setInteractive({ useHandCursor: true }).setDepth(7);
        busBtn.on('pointerdown', () => this.busing.busNow(seat.id));
        g.add(busBtn);
      }
    });
  }

  private drawDoorQueue(g: Phaser.GameObjects.Group, fx: number): void {
    const qy = FLOOR.queueY + HUD_H;
    const queue = this.rushWave.doorQueue;
    g.add(this.add.text(fx, qy, `DOOR QUEUE (${queue.length}):`, { fontFamily: 'monospace', fontSize: '11px', color: '#888888' }).setDepth(5));
    queue.forEach((c, i) => {
      const label = c.isTeddy ? 'TEDDY' : c.type === 'party' ? `Party(${c.partySize})` : 'C';
      const patFrac = c.patience / RUSH.doorQueuePatienceSec;
      const qcolor = patFrac > 0.5 ? 0x224422 : patFrac > 0.25 ? 0x444422 : 0x442222;
      const qrect = this.add.rectangle(fx + i * 50, qy + 16, 44, 30, qcolor).setOrigin(0, 0).setDepth(5);
      g.add(qrect);
      g.add(this.add.text(fx + i * 50 + 22, qy + 31, label, { fontFamily: 'monospace', fontSize: '9px', color: '#cccccc' }).setOrigin(0.5).setDepth(6));
    });
    if (queue.length === 0) {
      g.add(this.add.text(fx + 80, qy + 20, 'Empty', { fontFamily: 'monospace', fontSize: '11px', color: '#333344', fontStyle: 'italic' }).setDepth(5));
    }
  }

  private drawFamilyAssignments(g: Phaser.GameObjects.Group, fx: number): void {
    const fy = FLOOR.familyY + HUD_H;
    g.add(this.add.text(fx, fy, 'FAMILY ASSIGNMENTS:', { fontFamily: 'monospace', fontSize: '12px', color: '#ffcc33', fontStyle: 'bold' }).setDepth(5));

    const chars: FamilyCharacter[] = ['linda', 'tina', 'gene', 'louise'];
    chars.forEach((char, i) => {
      const member = this.familyService.get(char);
      if (!member) return;
      const my = fy + 20 + i * 48;
      const charColor = member.serviceState === 'drifting' ? '#ff6633'
        : member.serviceState === 'correct' ? '#44ff88'
        : member.serviceState === 'wrong' ? '#ffaa44' : '#888888';

      g.add(this.add.text(fx, my, char.toUpperCase(), { fontFamily: 'monospace', fontSize: '12px', color: charColor, fontStyle: 'bold' }).setDepth(5));

      // Tell hint
      if (member.tellIndicators.length > 0 && member.tellVisibility > 0.4) {
        const tell = member.tellIndicators[0];
        g.add(this.add.text(fx, my + 13, `"${tell}"`, { fontFamily: 'monospace', fontSize: '9px', color: '#666655', fontStyle: 'italic' }).setDepth(5));
      }

      // Assignment buttons
      const roles: ServiceRole[] = ['orders', 'busing'];
      roles.forEach((role, ri) => {
        const bx = fx + 110 + ri * 90;
        const isActive = member.currentRole === role;
        const isCorrect = member.preferredRole === role;
        const btnColor = isActive ? (isCorrect ? 0x224422 : 0x443311) : 0x222222;
        const btn = this.add.rectangle(bx, my + 2, 80, 26, btnColor).setOrigin(0, 0).setDepth(5);
        if (isActive) btn.setStrokeStyle(2, isCorrect ? 0x44ff88 : 0xff9933);
        g.add(btn);
        const roleLabel = `${role}${isCorrect ? '★' : ''}`;
        const roleTxt = this.add.text(bx + 40, my + 15, roleLabel, { fontFamily: 'monospace', fontSize: '10px', color: isActive ? '#ffffff' : '#666666' }).setOrigin(0.5).setDepth(6);
        g.add(roleTxt);
        btn.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          this.familyService.assignRole(char, role);
          if (this.familyService.get(char)?.serviceState === 'correct') {
            this.botd.recordCorrectFamilyAssignment();
          }
        });
        roleTxt.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          this.familyService.assignRole(char, role);
        });
      });

      // Drift status
      if (member.serviceState === 'drifting' && member.driftBehavior) {
        g.add(this.add.text(fx + 290, my + 4, `⚠ ${member.driftBehavior.replace(/_/g, ' ')}`, { fontFamily: 'monospace', fontSize: '9px', color: '#ff6633' }).setDepth(6));
      }
    });
  }

  private drawTeddyPanel(g: Phaser.GameObjects.Group, fx: number): void {
    const ty = FLOOR.familyY + HUD_H + 210;
    const teddyColor = this.teddy.state === 'seated' ? '#44aaff' : '#555566';
    g.add(this.add.text(fx, ty, `TEDDY: ${this.teddy.state.toUpperCase()}`, { fontFamily: 'monospace', fontSize: '12px', color: teddyColor, fontStyle: 'bold' }).setDepth(5));
    g.add(this.add.text(fx + 160, ty, `Relationship: ${(this.teddy.relationshipScore * 100).toFixed(0)}%`, { fontFamily: 'monospace', fontSize: '11px', color: '#888888' }).setDepth(5));

    if (this.teddy.state === 'seated') {
      g.add(this.add.text(fx, ty + 16, '+10% revenue buff ACTIVE', { fontFamily: 'monospace', fontSize: '10px', color: '#44ff88' }).setDepth(5));
      if (this.teddy.quest) {
        const qState = this.teddy.quest.state;
        const qColor = qState === 'completed' ? '#44ff88' : qState === 'missed' ? '#ff4444' : qState === 'active' ? '#ffdd44' : '#888888';
        const qRemain = qState === 'active' ? ` (${Math.max(0, this.teddy.quest.timeLimit - this.teddy.quest.elapsed).toFixed(0)}s)` : '';
        g.add(this.add.text(fx, ty + 30, `Quest: ${qState}${qRemain}`, { fontFamily: 'monospace', fontSize: '10px', color: qColor }).setDepth(5));
        g.add(this.add.text(fx, ty + 42, this.teddy.quest.description, { fontFamily: 'monospace', fontSize: '9px', color: '#555555', wordWrap: { width: FLOOR_W - 20 } }).setDepth(5));
      }
    } else if (this.teddy.state === 'absent') {
      g.add(this.add.text(fx, ty + 16, 'Not here yet. Arrives ~1 min into rush.', { fontFamily: 'monospace', fontSize: '10px', color: '#444455', fontStyle: 'italic' }).setDepth(5));
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // MODALS
  // ──────────────────────────────────────────────────────────────────────────
  private drawLouiseGambitModal(): void {
    if (this.louiseGambit.state === 'resolved') {
      const res = this.louiseGambit.result;
      if (res) this.drawResultModal(res.description, res.outcome === 'good' ? '#44ff88' : '#ff4444');
      return;
    }

    const g = this.modalGroup;
    this.drawModalBg(g, 0x220011);

    g.add(this.add.text(W / 2, H / 2 - 160, '⚠ LOUISE IS SCHEMING ⚠', { fontFamily: 'monospace', fontSize: '24px', color: '#ff4444', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20));
    g.add(this.add.text(W / 2, H / 2 - 125, '"I have a plan. Trust me."', { fontFamily: 'Georgia, serif', fontSize: '16px', color: '#cc8888', fontStyle: 'italic' }).setOrigin(0.5).setDepth(20));

    // Timer
    const frac = this.louiseGambit.decisionFraction;
    const timerColor = frac > 0.5 ? 0x44aa44 : frac > 0.25 ? 0xffaa22 : 0xff3333;
    g.add(this.add.rectangle(W / 2 - 150, H / 2 - 95, 300, 16, 0x333333).setOrigin(0, 0).setDepth(20));
    g.add(this.add.rectangle(W / 2 - 150, H / 2 - 95, 300 * frac, 16, timerColor).setOrigin(0, 0).setDepth(21));
    g.add(this.add.text(W / 2, H / 2 - 87, `${(this.louiseGambit.decisionTimer).toFixed(1)}s to decide`, { fontFamily: 'monospace', fontSize: '13px', color: '#ffffff' }).setOrigin(0.5).setDepth(22));

    g.add(this.add.text(W / 2, H / 2 - 55, 'INTERVENE — Costs attention. Defuses chaos. Small morale gain.\nNo big risk. No big reward.', { fontFamily: 'monospace', fontSize: '13px', color: '#aaddff', align: 'center' }).setOrigin(0.5).setDepth(20));
    g.add(this.add.text(W / 2, H / 2 + 5, 'DEPLOY — Let Louise run the scheme. Two branches:\n[GOOD]: Meaningful reward  [BAD]: Disruption + morale hit', { fontFamily: 'monospace', fontSize: '13px', color: '#ffcc88', align: 'center' }).setOrigin(0.5).setDepth(20));

    const intervBtn = this.add.rectangle(W / 2 - 120, H / 2 + 60, 200, 50, 0x224466).setInteractive({ useHandCursor: true }).setDepth(21);
    const deployBtn = this.add.rectangle(W / 2 + 120, H / 2 + 60, 200, 50, 0x662222).setInteractive({ useHandCursor: true }).setDepth(21);
    intervBtn.setStrokeStyle(2, 0x4488ff);
    deployBtn.setStrokeStyle(2, 0xff4444);
    g.add(intervBtn);
    g.add(deployBtn);
    g.add(this.add.text(W / 2 - 120, H / 2 + 60, 'INTERVENE', { fontFamily: 'monospace', fontSize: '14px', color: '#aaddff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(22));
    g.add(this.add.text(W / 2 + 120, H / 2 + 60, 'DEPLOY', { fontFamily: 'monospace', fontSize: '14px', color: '#ff8888', fontStyle: 'bold' }).setOrigin(0.5).setDepth(22));

    intervBtn.on('pointerdown', () => {
      this.louiseGambit.intervene();
      this.morale.boost(0.05);
      this.currentModal = null;
      this.familyService.setLouiseMood(false);
      this.notify('You pulled Louise aside. Chaos defused. +morale', '#44aaff', 4000);
    });
    deployBtn.on('pointerdown', () => {
      this.louiseGambit.deploy();
      this.applyGambitResult();
      const res = this.louiseGambit.result;
      if (res) this.notify(res.description, res.outcome === 'good' ? '#44ff88' : '#ff4444', 8000);
    });
  }

  private drawFischeoderModal(): void {
    if (this.fischoeder.state === 'resolved') {
      this.currentModal = null;
      return;
    }
    const g = this.modalGroup;
    this.drawModalBg(g, 0x111122);

    g.add(this.add.text(W / 2, H / 2 - 200, 'MR. FISCHOEDER HAS ARRIVED', { fontFamily: 'Georgia, serif', fontSize: '26px', color: '#dddd88', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20));
    g.add(this.add.text(W / 2, H / 2 - 170, '(The rush continues. Customers are losing patience.)', { fontFamily: 'monospace', fontSize: '12px', color: '#886666' }).setOrigin(0.5).setDepth(20));

    const lines = this.fischoeder.monologueLines;
    lines.forEach((line, i) => {
      g.add(this.add.text(W / 2, H / 2 - 135 + i * 26, line, { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#cccc88', fontStyle: 'italic', align: 'center', wordWrap: { width: 700 } }).setOrigin(0.5).setDepth(20));
    });

    const acceptBtn = this.add.rectangle(W / 2 - 130, H / 2 + 110, 220, 52, 0x334411).setInteractive({ useHandCursor: true }).setDepth(21);
    const resistBtn = this.add.rectangle(W / 2 + 130, H / 2 + 110, 220, 52, 0x441111).setInteractive({ useHandCursor: true }).setDepth(21);
    acceptBtn.setStrokeStyle(2, 0x88cc44);
    resistBtn.setStrokeStyle(2, 0xff4444);
    g.add(acceptBtn);
    g.add(resistBtn);
    g.add(this.add.text(W / 2 - 130, H / 2 + 103, 'ACCEPT', { fontFamily: 'monospace', fontSize: '14px', color: '#88cc44', fontStyle: 'bold' }).setOrigin(0.5).setDepth(22));
    g.add(this.add.text(W / 2 - 130, H / 2 + 120, '+$200 cash / +$50 rent next session', { fontFamily: 'monospace', fontSize: '10px', color: '#667744' }).setOrigin(0.5).setDepth(22));
    g.add(this.add.text(W / 2 + 130, H / 2 + 103, 'RESIST', { fontFamily: 'monospace', fontSize: '14px', color: '#ff6644', fontStyle: 'bold' }).setOrigin(0.5).setDepth(22));
    g.add(this.add.text(W / 2 + 130, H / 2 + 120, 'Preserves autonomy / more pressure next session', { fontFamily: 'monospace', fontSize: '10px', color: '#774444', align: 'center', wordWrap: { width: 200 } }).setOrigin(0.5).setDepth(22));

    acceptBtn.on('pointerdown', () => {
      this.fischoeder.accept();
      this.totalRevenue += this.fischoeder.shortTermReward;
      this.belcherRating.recordRevenue(this.fischoeder.shortTermReward);
      this.currentModal = null;
      this.yips.fischoederPresent = false;
      this.notify(`Fischoeder accepted. +$${this.fischoeder.shortTermReward}. He tips his hat and leaves.`, '#88cc44', 5000);
    });
    resistBtn.on('pointerdown', () => {
      this.fischoeder.resist();
      this.currentModal = null;
      this.yips.fischoederPresent = false;
      this.morale.boost(0.08);
      this.notify('"Good for you, Bob." He leaves. Tension hangs in the air. +morale.', '#ff8866', 5000);
    });
  }

  private drawResultModal(description: string, color: string): void {
    const g = this.modalGroup;
    this.drawModalBg(g, 0x111111);
    g.add(this.add.text(W / 2, H / 2 - 60, description, { fontFamily: 'Georgia, serif', fontSize: '16px', color, align: 'center', wordWrap: { width: 700 }, fontStyle: 'italic' }).setOrigin(0.5).setDepth(20));
    const closeBtn = this.add.rectangle(W / 2, H / 2 + 60, 180, 44, 0x333333).setInteractive({ useHandCursor: true }).setDepth(21);
    closeBtn.setStrokeStyle(1, 0x888888);
    g.add(closeBtn);
    g.add(this.add.text(W / 2, H / 2 + 60, 'Back to work', { fontFamily: 'monospace', fontSize: '14px', color: '#888888' }).setOrigin(0.5).setDepth(22));
    closeBtn.on('pointerdown', () => { this.currentModal = null; });
  }

  private drawModalBg(g: Phaser.GameObjects.Group, color: number): void {
    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0, 0).setDepth(18);
    const panel = this.add.rectangle(W / 2, H / 2, 800, 500, color, 0.97).setOrigin(0.5).setDepth(19);
    panel.setStrokeStyle(2, 0x555555);
    g.add(overlay); g.add(panel);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ──────────────────────────────────────────────────────────────────────────
  private notify(text: string, color: string, durationMs: number): void {
    const now = this.time.now;
    this.notifications.push({ text, color, expiry: now + durationMs });
    // Keep only most recent 5
    if (this.notifications.length > 5) this.notifications.shift();
  }

  private drawNotifications(): void {
    const now = this.time.now;
    this.notifications = this.notifications.filter(n => n.expiry > now);
    const g = this.notifGroup;
    this.notifications.forEach((n, i) => {
      const alpha = Math.min(1, (n.expiry - now) / 800);
      const txt = this.add.text(
        10, H - 20 - i * 28, n.text,
        { fontFamily: 'monospace', fontSize: '12px', color: n.color, stroke: '#000000', strokeThickness: 2, wordWrap: { width: W - 20 } },
      ).setDepth(15).setAlpha(alpha);
      g.add(txt);
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // HOUSEKEEPING
  // ──────────────────────────────────────────────────────────────────────────
  private clearGroups(): void {
    this.hudGroup.clear(true, true);
    this.kitchenGroup.clear(true, true);
    this.floorGroup.clear(true, true);
    this.modalGroup.clear(true, true);
    this.notifGroup.clear(true, true);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────
function tierColor(tier: IngredientTier): string {
  return tier === IngredientTier.LEGENDARY ? '#ffcc22'
    : tier === IngredientTier.RARE ? '#8888ff'
    : '#888888';
}

function driftMessage(character: string, behavior: string): string {
  const messages: Record<string, string> = {
    performing:         'Gene is performing instead of working. Task speed down.',
    frozen:             'Tina has frozen up. Task completely stalled.',
    chatting:           'Linda is chatting with customers too long. Service slowing.',
    singing:            'Linda is singing. Orders are being forgotten.',
    kitchen_intrusion:  'Linda just walked into the kitchen!',
    phone_call:         "Linda took a phone call. Zero output until she's done.",
    chaos_wildcard:     'Louise has gone rogue. Disruption incoming.',
  };
  return messages[behavior] ?? `${character} is drifting: ${behavior}`;
}
