/**
 * Yips.ts — Layer 5
 * Bob's stress-triggered quality degradation.
 * Probability checks every 10s with situational modifiers.
 * Recovery via float accumulator (not discrete counter).
 */

import { YIPS, ENCOURAGEMENT_WEIGHTS } from '../config/tunables';
import { Telemetry } from './Telemetry';

export type BobState = 'normal' | 'yips';

export type EncouragementSource = keyof typeof ENCOURAGEMENT_WEIGHTS;

export class Yips {
  state: BobState = 'normal';
  encouragementPool: number = 0;
  private checkTimer: number = YIPS.checkIntervalSec;
  private encouragementEvents: Array<{ source: string; weight: number }> = [];

  // Stressor flags
  fischoederPresent: boolean = false;
  lowMorale: boolean = false;
  extraStressorCount: number = 0;

  get isActive(): boolean { return this.state === 'yips'; }

  private get triggerProbability(): number {
    let p = YIPS.baseProbability;
    if (this.fischoederPresent) p += YIPS.fischoederPresentBonus;
    if (this.lowMorale) p += YIPS.lowMoraleBonus;
    p += YIPS.perExtraStressorBonus * this.extraStressorCount;
    return Math.min(1, p);
  }

  addEncouragement(source: EncouragementSource, weight: number): void {
    if (this.state !== 'yips') return;
    this.encouragementPool += weight;
    this.encouragementEvents.push({ source, weight });
    if (this.encouragementPool >= YIPS.recoveryThreshold) {
      const events = [...this.encouragementEvents];
      const total = this.encouragementPool;
      this.clearYips();
      Telemetry.emit('yips_cleared', {
        encouragement_events: events,
        total_weight: total,
      });
    }
  }

  update(deltaSec: number, stressLevel: number, currentMorale: number): void {
    if (this.state === 'yips') return; // already in yips, wait for recovery
    this.checkTimer -= deltaSec;
    if (this.checkTimer <= 0) {
      this.checkTimer = YIPS.checkIntervalSec;
      if (Math.random() < this.triggerProbability) {
        this.triggerYips(stressLevel, currentMorale);
      }
    }
  }

  private triggerYips(stressLevel: number, moraleAtTrigger: number): void {
    this.state = 'yips';
    this.encouragementPool = 0;
    this.encouragementEvents = [];
    Telemetry.emit('yips_triggered', {
      stress_level: stressLevel,
      morale_at_trigger: moraleAtTrigger,
    });
  }

  private clearYips(): void {
    this.state = 'normal';
    this.encouragementPool = 0;
    this.encouragementEvents = [];
  }

  addSuccessfulBurgerStreak(): void {
    this.addEncouragement('successful_burger_streak', ENCOURAGEMENT_WEIGHTS.successful_burger_streak);
  }

  addLindaEncouragement(): void {
    this.addEncouragement('linda_direct', ENCOURAGEMENT_WEIGHTS.linda_direct);
    Telemetry.emit('linda_encouragement', { pool_after: this.encouragementPool });
  }

  addFamilyAccidentalEncouragement(): void {
    this.addEncouragement('family_accidental', ENCOURAGEMENT_WEIGHTS.family_accidental);
  }

  addTeddyPepTalk(): void {
    this.addEncouragement('teddy_pep_talk', ENCOURAGEMENT_WEIGHTS.teddy_pep_talk);
  }

  addCustomerCompliment(): void {
    this.addEncouragement('customer_compliment', ENCOURAGEMENT_WEIGHTS.customer_compliment);
  }
}
