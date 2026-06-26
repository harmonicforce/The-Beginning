/**
 * HeatZoneBar.ts — Layer 1A
 * Rising bar mini-game. Bar fills from 0→1 at configurable speed.
 * Player releases when bar position is in the sweet spot (green zone).
 * Yips makes the bar faster and shrinks the green zone.
 */

import { HEAT_ZONE, YIPS } from '../config/tunables';

export type HeatZoneState = 'idle' | 'rising' | 'released' | 'missed';

export interface HeatZoneResult {
  position: number;       // 0.0–1.0 where the bar was released
  timingScore: number;    // 0.0–1.0
  zone: 'green' | 'yellow' | 'red' | 'missed';
}

export class HeatZoneBar {
  state: HeatZoneState = 'idle';
  position: number = 0;
  direction: 1 | -1 = 1;
  private speedMultiplier: number = 1;
  private greenZoneMultiplier: number = 1;
  private lastResult: HeatZoneResult | null = null;

  setYipsActive(active: boolean): void {
    if (active) {
      this.speedMultiplier = Math.min(
        YIPS.barSpeedMultiplier,
        YIPS.barSpeedCapMultiplier,
      );
      this.greenZoneMultiplier = Math.max(
        YIPS.greenZoneShrinkMultiplier,
        YIPS.greenZoneFloorMultiplier,
      );
    } else {
      this.speedMultiplier = 1;
      this.greenZoneMultiplier = 1;
    }
  }

  get effectiveGreenZoneWidth(): number {
    return HEAT_ZONE.baseGreenZoneWidth * this.greenZoneMultiplier;
  }

  get greenZoneStart(): number {
    // Green zone sits at the top of the bar
    return 1.0 - this.effectiveGreenZoneWidth;
  }

  start(): void {
    if (this.state === 'idle' || this.state === 'released' || this.state === 'missed') {
      this.state = 'rising';
      this.position = 0;
      this.direction = 1;
      this.lastResult = null;
    }
  }

  release(): HeatZoneResult {
    if (this.state !== 'rising') {
      return { position: this.position, timingScore: 0, zone: 'missed' };
    }
    this.state = 'released';
    const result = this.scorePosition(this.position);
    this.lastResult = result;
    return result;
  }

  getLastResult(): HeatZoneResult | null {
    return this.lastResult;
  }

  update(deltaSec: number): void {
    if (this.state !== 'rising') return;
    this.position += HEAT_ZONE.baseBarSpeed * this.speedMultiplier * deltaSec * this.direction;
    if (this.position >= 1.0) {
      this.position = 1.0;
      this.direction = -1;
    } else if (this.position <= 0.0) {
      this.position = 0.0;
      this.direction = 1;
    }
  }

  reset(): void {
    this.state = 'idle';
    this.position = 0;
    this.direction = 1;
    this.lastResult = null;
  }

  private scorePosition(pos: number): HeatZoneResult {
    let timingScore: number;
    let zone: HeatZoneResult['zone'];

    if (pos >= HEAT_ZONE.greenScoreMin) {
      timingScore = HEAT_ZONE.greenScoreMin + (pos - HEAT_ZONE.greenScoreMin) * (HEAT_ZONE.greenScoreMax - HEAT_ZONE.greenScoreMin);
      timingScore = lerp(HEAT_ZONE.greenScoreMin, HEAT_ZONE.greenScoreMax, (pos - HEAT_ZONE.greenScoreMin) / this.effectiveGreenZoneWidth);
      zone = 'green';
    } else if (pos >= HEAT_ZONE.yellowScoreMin / HEAT_ZONE.yellowScoreMax) {
      timingScore = lerp(HEAT_ZONE.yellowScoreMin, HEAT_ZONE.yellowScoreMax, (pos - 0.25) / 0.6);
      zone = 'yellow';
    } else {
      timingScore = lerp(HEAT_ZONE.redScoreMin, HEAT_ZONE.redScoreMax, pos / 0.25);
      zone = 'red';
    }

    // Clamp
    timingScore = Math.min(HEAT_ZONE.greenScoreMax, Math.max(HEAT_ZONE.redScoreMin, timingScore));
    return { position: pos, timingScore, zone };
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}
