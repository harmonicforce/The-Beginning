/**
 * SeatingManager.ts — Layer 1B
 * Manages 4 booths (party seating) and 10 bar stools (individual/regular).
 * Tracks seat state: empty | occupied | dirty
 */

import { SEATING } from '../config/tunables';
import { Customer, CustomerType } from '../entities/Customer';

export type SeatStatus = 'empty' | 'occupied' | 'dirty';

export interface Seat {
  id: string;
  type: 'booth' | 'stool';
  boothIndex?: number;   // for booths
  stoolIndex?: number;   // for stools
  status: SeatStatus;
  customerId: number | null;
  busTimeSec: number;    // time to bus when dirty
  busElapsed: number;
}

export class SeatingManager {
  seats: Map<string, Seat> = new Map();

  constructor() {
    for (let i = 0; i < SEATING.boothCount; i++) {
      const id = `booth_${i}`;
      this.seats.set(id, {
        id,
        type: 'booth',
        boothIndex: i,
        status: 'empty',
        customerId: null,
        busTimeSec: SEATING.boothBusTimeSec,
        busElapsed: 0,
      });
    }
    for (let i = 0; i < SEATING.stoolCount; i++) {
      const id = `stool_${i}`;
      this.seats.set(id, {
        id,
        type: 'stool',
        stoolIndex: i,
        status: 'empty',
        customerId: null,
        busTimeSec: SEATING.stoolBusTimeSec,
        busElapsed: 0,
      });
    }
  }

  findAvailableSeat(customerType: CustomerType, preferStool = false): Seat | null {
    if (customerType === 'party') {
      for (const seat of this.seats.values()) {
        if (seat.type === 'booth' && seat.status === 'empty') return seat;
      }
      return null;
    }
    // individual — prefer stools
    if (preferStool) {
      for (const seat of this.seats.values()) {
        if (seat.type === 'stool' && seat.status === 'empty') return seat;
      }
    }
    for (const seat of this.seats.values()) {
      if (seat.status === 'empty') return seat;
    }
    return null;
  }

  assignCustomer(customer: Customer, seat: Seat): void {
    seat.status = 'occupied';
    seat.customerId = customer.id;
    customer.seatId = seat.id;
  }

  markDirty(seatId: string): void {
    const seat = this.seats.get(seatId);
    if (!seat) return;
    seat.status = 'dirty';
    seat.customerId = null;
    seat.busElapsed = 0;
  }

  bus(seatId: string): void {
    const seat = this.seats.get(seatId);
    if (!seat || seat.status !== 'dirty') return;
    seat.status = 'empty';
    seat.busElapsed = 0;
  }

  update(_deltaSec: number): void {
    // Busing is player-initiated in MVP (or via BusingManager auto-bus).
  }

  get emptySeatCount(): number {
    let count = 0;
    for (const seat of this.seats.values()) {
      if (seat.status === 'empty') count++;
    }
    return count;
  }

  get dirtySeatCount(): number {
    let count = 0;
    for (const seat of this.seats.values()) {
      if (seat.status === 'dirty') count++;
    }
    return count;
  }

  get occupiedSeatCount(): number {
    let count = 0;
    for (const seat of this.seats.values()) {
      if (seat.status === 'occupied') count++;
    }
    return count;
  }

  getSeat(id: string): Seat | undefined {
    return this.seats.get(id);
  }

  getAllSeats(): Seat[] {
    return Array.from(this.seats.values());
  }
}
