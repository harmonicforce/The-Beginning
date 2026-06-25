/**
 * LouiseGambit.ts — Layer 7
 * Louise's scheming transition and player-controlled gambit mechanic.
 * Fires once per rush wave, between 2–6 minutes in.
 * Player has 10 seconds to choose: intervene or deploy.
 */

import { LOUISE } from '../config/tunables';
import { Telemetry } from './Telemetry';

export type GambitState =
  | 'dormant'        // gambit hasn't triggered yet
  | 'scheming'       // Louise has gone scheming, player must decide
  | 'intervening'    // player chose to intervene
  | 'deploying'      // player chose to deploy
  | 'resolved';      // gambit finished

export type GambitOutcome = 'good' | 'bad' | 'default_bad';

interface GambitResult {
  outcome: GambitOutcome;
  description: string;
  moraleEffect: number;
  rewardType: 'quality_bonus' | 'relationship_boost' | 'revenue_gain' | 'none';
  rewardValue: number;
}

export class LouiseGambit {
  state: GambitState = 'dormant';
  decisionTimer: number = 0;
  result: GambitResult | null = null;
  transitionTimer: number;
  private hasTriggered: boolean = false;

  constructor() {
    // Roll when Louise will go scheming (2–6 minutes into rush)
    this.transitionTimer = LOUISE.gambitWindowMin +
      Math.random() * (LOUISE.gambitWindowMax - LOUISE.gambitWindowMin);
  }

  update(_deltaSec: number, rushElapsed: number): void {
    if (this.hasTriggered) return;
    if (rushElapsed >= this.transitionTimer) {
      this.goScheming();
    }
  }

  updateDecisionWindow(deltaSec: number): void {
    if (this.state !== 'scheming') return;
    this.decisionTimer -= deltaSec;
    if (this.decisionTimer <= 0) {
      // Player didn't choose — default to no intervention (worse bad outcome odds)
      this.resolveDefault();
    }
  }

  get decisionFraction(): number {
    return Math.max(0, this.decisionTimer / LOUISE.gambitDecisionWindowSec);
  }

  intervene(): void {
    if (this.state !== 'scheming') return;
    this.state = 'intervening';
    this.result = {
      outcome: 'good',
      description: "You pull Louise aside. 'I'm watching you.' She rolls her eyes but backs down. Morale tick.",
      moraleEffect: 0.05,
      rewardType: 'none',
      rewardValue: 0,
    };
    this.state = 'resolved';
    Telemetry.emit('chaos_intercept', { intervened: true, outcome: 'defused' });
    Telemetry.emit('louise_gambit_triggered', { player_response: 'intervene', result: 'defused' });
  }

  deploy(): void {
    if (this.state !== 'scheming') return;
    this.state = 'deploying';
    const good = Math.random() < 0.55; // slightly favor good outcome when player deploys
    this.result = good ? this.goodOutcome() : this.badOutcome();
    this.state = 'resolved';
    Telemetry.emit('chaos_intercept', { intervened: false, outcome: good ? 'gambit_good' : 'gambit_bad' });
    Telemetry.emit('louise_gambit_triggered', {
      player_response: 'deploy',
      result: this.result.outcome,
    });
  }

  private resolveDefault(): void {
    this.state = 'deploying';
    const good = Math.random() < 0.30; // worse odds without player decision
    this.result = good ? this.goodOutcome() : this.badOutcome();
    this.state = 'resolved';
    Telemetry.emit('chaos_intercept', { intervened: false, outcome: 'no_decision_taken' });
    Telemetry.emit('louise_gambit_triggered', {
      player_response: 'ignored',
      result: this.result.outcome === 'good' ? 'default_lucky' : 'default_bad',
    });
  }

  private goScheming(): void {
    this.hasTriggered = true;
    this.state = 'scheming';
    this.decisionTimer = LOUISE.gambitDecisionWindowSec;
    Telemetry.emit('louise_scheming_started', { decision_window_sec: LOUISE.gambitDecisionWindowSec });
  }

  private goodOutcome(): GambitResult {
    const outcomes: GambitResult[] = [
      {
        outcome: 'good',
        description: "Louise's scheme worked. The table she was 'entertaining' left a massive tip and specifically asked for the Burger of the Day. Quality bonus incoming.",
        moraleEffect: 0.08,
        rewardType: 'quality_bonus',
        rewardValue: 0.15,
      },
      {
        outcome: 'good',
        description: "Louise convinced the health inspector (who happened to be dining) that she was actually grading the restaurant on THEIR behalf. He left a glowing Yelp review. Revenue boost!",
        moraleEffect: 0.06,
        rewardType: 'revenue_gain',
        rewardValue: 15.0,
      },
      {
        outcome: 'good',
        description: "Louise's \"scheme\" was secretly fixing the broken booth seat she'd been complaining about. Teddy notices and gives Bob a thumbs up. Relationship boost.",
        moraleEffect: 0.10,
        rewardType: 'relationship_boost',
        rewardValue: 0.10,
      },
    ];
    return outcomes[Math.floor(Math.random() * outcomes.length)];
  }

  private badOutcome(): GambitResult {
    const outcomes: GambitResult[] = [
      {
        outcome: 'bad',
        description: "Louise's scheme backfired spectacularly. She convinced a booth of customers they were getting a \"secret menu\" item. They're demanding refunds. Service disruption.",
        moraleEffect: -0.12,
        rewardType: 'none',
        rewardValue: 0,
      },
      {
        outcome: 'bad',
        description: "Louise started a small grease fire as a \"distraction.\" Nobody's hurt but the kitchen's a mess. Bob's timing is thrown off.",
        moraleEffect: -0.10,
        rewardType: 'none',
        rewardValue: 0,
      },
      {
        outcome: 'bad',
        description: "Louise told customers the restaurant was \"under new management\" and the old menu was cancelled. Now everyone's confused and three tables are trying to leave.",
        moraleEffect: -0.15,
        rewardType: 'none',
        rewardValue: 0,
      },
    ];
    return outcomes[Math.floor(Math.random() * outcomes.length)];
  }
}
