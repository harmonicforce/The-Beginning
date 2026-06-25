/**
 * BurgerOfTheDay.ts — Layer 3
 * Manages the creativity/safety choice and its effects on quality + order rate.
 */

import { BOTD } from '../config/tunables';
import { Telemetry } from './Telemetry';

export type BotDChoice = 'creativity' | 'safety';

export class BurgerOfTheDay {
  choice: BotDChoice | null = null;
  orderRate: number = BOTD.baseOrderRate;

  private qualityModifier: number = 0; // from recent high-quality BotDs
  private serviceModifier: number = 0; // from correct family assignments

  choose(choice: BotDChoice): void {
    this.choice = choice;
    Telemetry.emit('burger_of_day_choice', { choice });
  }

  get ceilingMultiplier(): number {
    return this.choice === 'creativity'
      ? BOTD.creativityCeilingMultiplier
      : BOTD.safetyCeilingMultiplier;
  }

  applyJitter(timingScore: number): number {
    if (this.choice !== 'creativity') return timingScore;
    const jitter = (Math.random() * 2 - 1) * BOTD.creativityJitter;
    return Math.max(0.05, Math.min(1.0, timingScore + jitter));
  }

  recordHighQualityBotD(qualityScore: number): void {
    if (qualityScore > 0.7) {
      // Word of mouth: raise order rate
      this.qualityModifier = Math.min(0.15, this.qualityModifier + 0.03);
      this.updateOrderRate();
      Telemetry.emit('botd_order_rate_change', {
        new_rate: this.orderRate,
        quality_modifier: this.qualityModifier,
        service_modifier: this.serviceModifier,
      });
    }
  }

  recordCorrectFamilyAssignment(): void {
    this.serviceModifier = Math.min(0.10, this.serviceModifier + 0.02);
    this.updateOrderRate();
  }

  private updateOrderRate(): void {
    this.orderRate = Math.min(
      BOTD.maxOrderRate,
      BOTD.baseOrderRate + this.qualityModifier + this.serviceModifier,
    );
  }

  get currentOrderRate(): number {
    return this.orderRate;
  }
}
