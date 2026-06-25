/**
 * BelcherRating.ts — Layer 9
 * Composite score: burger quality (35%) + family morale (25%) + teddy relationship (20%) + revenue (20%).
 * All inputs normalized to 0.0–1.0 before weighting.
 */

import { RATING_WEIGHTS, RATING, RUSH } from '../config/tunables';
import { Telemetry } from './Telemetry';

function targetRevenue(): number {
  const avgArrivalRate = (RUSH.arrivalStartMinSec + RUSH.arrivalStartMaxSec +
    RUSH.arrivalEndMinSec + RUSH.arrivalEndMaxSec) / 4;
  const avgOrderValue = 8.0; // rough average: burger ($5.50) + 1 side ($2.25) + cheese rounding
  return (RUSH.waveDurationSec / avgArrivalRate) * avgOrderValue * RATING.revenueTargetFraction;
}

export class BelcherRating {
  private qualityScores: number[] = [];
  private sessionRevenue: number = 0;
  private endMorale: number = 0.75;
  private teddyRelationship: number = 0.5;
  private readonly revenueTarget: number;

  constructor() {
    this.revenueTarget = targetRevenue();
  }

  recordBurgerQuality(score: number): void {
    this.qualityScores.push(score);
  }

  recordRevenue(amount: number): void {
    this.sessionRevenue += amount;
  }

  setEndMorale(morale: number): void {
    this.endMorale = morale;
  }

  setTeddyRelationship(score: number): void {
    this.teddyRelationship = score;
  }

  compute(): number {
    const avgQuality = this.qualityScores.length > 0
      ? this.qualityScores.reduce((a, b) => a + b, 0) / this.qualityScores.length
      : 0;

    const normalizedRevenue = Math.min(1.0, this.sessionRevenue / this.revenueTarget);

    const rating =
      avgQuality          * RATING_WEIGHTS.burger_quality +
      this.endMorale      * RATING_WEIGHTS.family_morale +
      this.teddyRelationship * RATING_WEIGHTS.teddy_relationship +
      normalizedRevenue   * RATING_WEIGHTS.revenue;

    return Math.min(1.0, Math.max(0.0, rating));
  }

  snapshot(label: 'session_start' | 'session_end'): void {
    const rating = this.compute();
    Telemetry.snapshotState({
      belcher_rating: rating,
      family_morale: this.endMorale,
      teddy_relationship_score: this.teddyRelationship,
      revenue_generated: this.sessionRevenue,
      fischoeder_escalation_tier: 1,
    }, label);
  }

  get averageBurgerQuality(): number {
    if (this.qualityScores.length === 0) return 0;
    return this.qualityScores.reduce((a, b) => a + b, 0) / this.qualityScores.length;
  }

  get totalRevenue(): number {
    return this.sessionRevenue;
  }
}
