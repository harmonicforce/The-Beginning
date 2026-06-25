/**
 * Fischoeder.ts — Layer 8
 * Calvin Fischoeder arrives exactly 10 minutes into the rush.
 * He interrupts the active rush (customers/timers continue).
 * Player must choose: accept his terms or resist.
 */

import { FISCHOEDER } from '../config/tunables';
import { Telemetry } from './Telemetry';

export type FischeoderState = 'waiting' | 'present' | 'resolved';
export type FischeoderDecision = 'accept' | 'resist';

export interface FischeoderTerms {
  shortTermOffer: string;
  longTermConsequence: string;
  rentIncreaseAmount: number;
}

export class Fischoeder {
  state: FischeoderState = 'waiting';
  decision: FischeoderDecision | null = null;
  escalationTier: number = FISCHOEDER.escalationTierMVP;
  private rushWasActive: boolean = false;

  readonly terms: FischeoderTerms = {
    shortTermOffer: '$200 immediate cash relief and a 30-day rent freeze.',
    longTermConsequence: 'Monthly rent increases by $50 permanently starting next session.',
    rentIncreaseAmount: 50,
  };

  update(rushElapsed: number, rushActive: boolean): void {
    if (this.state !== 'waiting') return;
    if (rushElapsed >= FISCHOEDER.appearanceTimerSec) {
      this.rushWasActive = rushActive;
      this.appear(rushActive);
    }
  }

  private appear(rushActive: boolean): void {
    this.state = 'present';
    Telemetry.emit('fischoeder_appearance', {
      escalation_tier: this.escalationTier,
      rush_active: rushActive,
    });
  }

  accept(): void {
    if (this.state !== 'present') return;
    this.decision = 'accept';
    this.state = 'resolved';
    this.escalationTier++;
    Telemetry.emit('fischoeder_decision', {
      terms_accepted: true,
      escalation_tier: this.escalationTier,
      rush_active: this.rushWasActive,
    });
  }

  resist(): void {
    if (this.state !== 'present') return;
    this.decision = 'resist';
    this.state = 'resolved';
    Telemetry.emit('fischoeder_decision', {
      terms_accepted: false,
      escalation_tier: this.escalationTier,
      rush_active: this.rushWasActive,
    });
  }

  get isPresent(): boolean { return this.state === 'present'; }

  get shortTermReward(): number {
    return this.decision === 'accept' ? 200 : 0;
  }

  get nextSessionPressureIncrease(): boolean {
    return this.decision === 'resist';
  }

  get monologueLines(): string[] {
    return [
      `"Ah, Bob. Hard at work as always. I admire that."`,
      `"I've been thinking about our arrangement. The neighborhood is... evolving."`,
      `"I'm a reasonable man. That's why I'm giving you a choice."`,
      `"${this.terms.shortTermOffer}"`,
      `"Of course, ${this.terms.longTermConsequence}"`,
      `"Take your time. But not too much time — you do have a restaurant to run."`,
    ];
  }
}
