/**
 * RushWave.ts — Layer 1D
 * Manages the 6-minute rush wave: timing, arrival rate ramp, and door queue.
 */

import { RUSH, SEATING } from '../config/tunables';
import { Customer, createCustomer, resetCustomerIds } from '../entities/Customer';
import { SeatingManager } from './SeatingManager';
import { Telemetry } from './Telemetry';

export type WaveState = 'waiting' | 'active' | 'ended';

export class RushWave {
  state: WaveState = 'waiting';
  elapsed: number = 0;
  nextArrivalIn: number = 0;
  doorQueue: Customer[] = [];
  private seating: SeatingManager;
  private onCustomerSeated: (c: Customer) => void;
  private onCustomerLeft: (c: Customer) => void;
  private teddyAppeared: boolean = false;

  constructor(
    seating: SeatingManager,
    onCustomerSeated: (c: Customer) => void,
    onCustomerLeft: (c: Customer) => void,
  ) {
    this.seating = seating;
    this.onCustomerSeated = onCustomerSeated;
    this.onCustomerLeft = onCustomerLeft;
    this.nextArrivalIn = this.rollArrivalInterval();
  }

  get remainingSec(): number {
    return Math.max(0, RUSH.waveDurationSec - this.elapsed);
  }

  get fractionComplete(): number {
    return Math.min(1, this.elapsed / RUSH.waveDurationSec);
  }

  start(): void {
    this.state = 'active';
    resetCustomerIds();
    Telemetry.emit('rush_wave_started', { wave_duration_sec: RUSH.waveDurationSec });
  }

  update(deltaSec: number): void {
    if (this.state !== 'active') return;

    this.elapsed += deltaSec;
    if (this.elapsed >= RUSH.waveDurationSec) {
      this.state = 'ended';
      Telemetry.emit('rush_wave_ended', { total_elapsed_sec: this.elapsed });
      return;
    }

    // Spawn Teddy around 1 minute into the rush (once per wave)
    if (!this.teddyAppeared && this.elapsed >= 60) {
      this.teddyAppeared = true;
      const teddy = createCustomer('individual', 1, true);
      this.doorQueue.push(teddy);
    }

    // Arrival rate
    this.nextArrivalIn -= deltaSec;
    if (this.nextArrivalIn <= 0) {
      this.spawnCustomer();
      this.nextArrivalIn = this.rollArrivalInterval();
    }

    // Update door queue patience
    for (const c of [...this.doorQueue]) {
      c.patience -= deltaSec;
      if (c.patience <= 0) {
        this.doorQueue.splice(this.doorQueue.indexOf(c), 1);
        Telemetry.emit('customer_left_queue', {
          patience_exceeded: true,
          queue_position: this.doorQueue.length,
          is_teddy: c.isTeddy,
        });
        this.onCustomerLeft(c);
      }
    }

    // Try to seat queued customers
    this.trySeatQueue();
  }

  private spawnCustomer(): void {
    const isParty = Math.random() < 0.35;
    const partySize = isParty
      ? SEATING.boothPartyMin + Math.floor(Math.random() * (SEATING.boothPartyMax - SEATING.boothPartyMin + 1))
      : 1;
    const customer = createCustomer(isParty ? 'party' : 'individual', partySize);
    this.doorQueue.push(customer);
  }

  private trySeatQueue(): void {
    const toRemove: Customer[] = [];
    for (const customer of this.doorQueue) {
      const preferStool = !customer.isTeddy ? false : true;
      const seat = this.seating.findAvailableSeat(customer.type, customer.isTeddy || preferStool);
      if (seat) {
        this.seating.assignCustomer(customer, seat);
        customer.state = 'seated';
        customer.patience = RUSH.seatPatienceSec;
        toRemove.push(customer);
        Telemetry.emit('customer_seated', {
          seat_type: seat.type,
          queue_wait_sec: RUSH.doorQueuePatienceSec - customer.patience,
          customer_id: customer.id,
          is_teddy: customer.isTeddy,
        });
        this.onCustomerSeated(customer);
      }
    }
    for (const c of toRemove) {
      this.doorQueue.splice(this.doorQueue.indexOf(c), 1);
    }
  }

  private rollArrivalInterval(): number {
    const t = this.fractionComplete;
    const minSec = lerp(RUSH.arrivalStartMinSec, RUSH.arrivalEndMinSec, t);
    const maxSec = lerp(RUSH.arrivalStartMaxSec, RUSH.arrivalEndMaxSec, t);
    return minSec + Math.random() * (maxSec - minSec);
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}
