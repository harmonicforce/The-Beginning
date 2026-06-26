/**
 * BusingManager.ts — Layer 1C
 * Tracks dirty seats and auto-buses them after their bus time.
 * Player can also click a dirty seat to bus it immediately.
 * Uncleared seats block new customer seating — creates urgency.
 */

import { SeatingManager } from './SeatingManager';
import { Telemetry } from './Telemetry';

export class BusingManager {
  private seating: SeatingManager;
  private dirtyTimers: Map<string, number> = new Map(); // seatId → elapsed dirty seconds

  constructor(seating: SeatingManager) {
    this.seating = seating;
  }

  markDirty(seatId: string): void {
    this.seating.markDirty(seatId);
    this.dirtyTimers.set(seatId, 0);
  }

  busNow(seatId: string): void {
    const seat = this.seating.getSeat(seatId);
    if (!seat || seat.status !== 'dirty') return;
    const timeElapsed = this.dirtyTimers.get(seatId) ?? 0;
    this.seating.bus(seatId);
    this.dirtyTimers.delete(seatId);
    Telemetry.emit('table_bused', {
      seat_type: seat.type,
      time_to_bus_sec: timeElapsed,
    });
  }

  update(deltaSec: number, familyOnBusing = false): void {
    for (const [seatId, elapsed] of this.dirtyTimers) {
      const seat = this.seating.getSeat(seatId);
      if (!seat || seat.status !== 'dirty') {
        this.dirtyTimers.delete(seatId);
        continue;
      }
      const newElapsed = elapsed + deltaSec;
      this.dirtyTimers.set(seatId, newElapsed);
      if (familyOnBusing && newElapsed >= seat.busTimeSec) {
        // Family correctly assigned to busing: auto-bus at spec speed
        this.busNow(seatId);
      } else if (!familyOnBusing && newElapsed >= seat.busTimeSec * 3) {
        // No family on busing: very slow fallback so game can't fully deadlock
        this.busNow(seatId);
      }
    }
  }

  getDirtySeats(): string[] {
    return Array.from(this.dirtyTimers.keys());
  }
}
