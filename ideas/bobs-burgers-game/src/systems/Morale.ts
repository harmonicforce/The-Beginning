/**
 * Morale.ts — Layer 4 + 4.5
 * Family morale float (0.0–1.0), passive decay, lost-customer hits.
 * Family meeting: service pause + morale restoration + diminishing returns.
 */

import { MORALE, FAMILY_MEETING } from '../config/tunables';
import { Telemetry } from './Telemetry';

export class Morale {
  value: number = MORALE.start;
  meetingCount: number = 0;
  paused: boolean = false;          // true during service pause (family meeting)
  pauseTimer: number = 0;

  private pauseCallback: (() => void) | null = null;
  private resumeCallback: (() => void) | null = null;

  onPause(cb: () => void): void  { this.pauseCallback = cb; }
  onResume(cb: () => void): void { this.resumeCallback = cb; }

  get isLow(): boolean { return this.value < MORALE.lowSpeedThreshold; }
  get isVeryLow(): boolean { return this.value < MORALE.yipsThreshold; }

  get craftingSpeedMultiplier(): number {
    return this.isLow ? MORALE.lowSpeedMultiplier : 1.0;
  }

  update(deltaSec: number): void {
    if (this.paused) {
      this.pauseTimer -= deltaSec;
      if (this.pauseTimer <= 0) {
        this.paused = false;
        this.resumeCallback?.();
      }
      return;
    }
    this.value = Math.max(0, this.value - MORALE.decayPerSec * deltaSec);
  }

  lostCustomer(): void {
    this.value = Math.max(0, this.value - MORALE.lostCustomerHit);
  }

  callMeeting(): void {
    const before = this.value;
    const restoration = FAMILY_MEETING.baseRestoration *
      Math.pow(FAMILY_MEETING.diminishingMultiplier, this.meetingCount);
    this.value = Math.min(1.0, this.value + restoration);
    this.meetingCount++;
    this.paused = true;
    this.pauseTimer = FAMILY_MEETING.servicePauseSec;
    this.pauseCallback?.();
    Telemetry.emit('family_meeting_called', {
      morale_before: before,
      morale_after: this.value,
      meeting_count_this_session: this.meetingCount,
    });
  }

  boost(amount: number): void {
    this.value = Math.min(1.0, this.value + amount);
  }
}
