/**
 * Customer.ts — Layer 1B
 * Customer entity with full state machine.
 * States: queued → seated → ordered → served → leaving → (seat dirty) → bused
 */

import { RUSH } from '../config/tunables';
import { Order } from './Order';

export type CustomerState =
  | 'queued'
  | 'seated'
  | 'ordered'
  | 'served'
  | 'leaving';

export type CustomerType = 'individual' | 'party';

let nextCustomerId = 1;

export interface Customer {
  id: number;
  type: CustomerType;
  partySize: number;     // 1 for individuals, 2–4 for parties
  state: CustomerState;
  seatId: string | null;
  order: Order | null;
  patience: number;      // seconds remaining before walkout
  isTeddy: boolean;
  satisfactionScore: number | null; // null until leaving
}

export function createCustomer(type: CustomerType, partySize: number, isTeddy = false): Customer {
  return {
    id: nextCustomerId++,
    type,
    partySize,
    state: 'queued',
    seatId: null,
    order: null,
    patience: RUSH.doorQueuePatienceSec,
    isTeddy,
    satisfactionScore: null,
  };
}

export function resetCustomerIds(): void {
  nextCustomerId = 1;
}

export function transitionTo(customer: Customer, state: CustomerState): void {
  customer.state = state;
  // Reset patience on seating — now they wait for food
  if (state === 'seated') {
    customer.patience = RUSH.seatPatienceSec;
  }
}

export function updatePatience(customer: Customer, deltaSec: number): boolean {
  if (customer.state === 'served' || customer.state === 'leaving') return false;
  customer.patience -= deltaSec;
  return customer.patience <= 0;
}

export function computeSatisfaction(_customer: Customer, qualityScore: number): number {
  return Math.max(0, Math.min(1, qualityScore));
}
