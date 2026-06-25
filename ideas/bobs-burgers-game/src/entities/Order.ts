/**
 * Order.ts — Layer 1A
 * Data structures for customer orders.
 */

import { IngredientTier } from './Ingredient';
import type { SideType } from '../systems/SideTimer';
export type { SideType };

export type BurgerType = 'regular_burger' | 'special_burger' | 'burger_of_day';

export interface OrderItem {
  type: BurgerType | SideType | 'cheese_add_on';
  tier?: IngredientTier; // only for burger_of_day
}

export type OrderStatus =
  | 'pending'       // in queue, not yet crafting
  | 'crafting'      // player is working on it
  | 'ready'         // done, awaiting delivery
  | 'delivered'     // handed to customer
  | 'failed';       // customer walked out

let nextOrderId = 1;

export interface Order {
  id: number;
  customerId: number;
  seatId: string;
  items: OrderItem[];
  basePrice: number;           // sum of menu prices
  ingredientCost: number;      // tier ingredient cost
  selectedTier: IngredientTier | null;
  qualityScore: number | null; // null until crafted
  status: OrderStatus;
  createdAt: number;           // performance.now()
}

export function createOrder(
  customerId: number,
  seatId: string,
  items: OrderItem[],
  basePrice: number,
): Order {
  return {
    id: nextOrderId++,
    customerId,
    seatId,
    items,
    basePrice,
    ingredientCost: 0,
    selectedTier: null,
    qualityScore: null,
    status: 'pending',
    createdAt: performance.now(),
  };
}

export function resetOrderIds(): void {
  nextOrderId = 1;
}
