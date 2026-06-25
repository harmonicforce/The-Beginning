/**
 * Menu.ts — Layer 1A
 * Generates customer orders and computes prices.
 * BotD order rate influenced by BurgerOfTheDay system.
 */

import { STANDARD_MENU, RUSH, BOTD } from '../config/tunables';
import { tierCost } from '../entities/Ingredient';
import { Order, OrderItem, BurgerType, SideType, createOrder } from '../entities/Order';

const SIDE_TYPES: SideType[] = ['fries', 'side_salad', 'soft_drink', 'beer'];

function randomSide(): SideType {
  return SIDE_TYPES[Math.floor(Math.random() * SIDE_TYPES.length)];
}

function menuPriceForItem(item: OrderItem): number {
  switch (item.type) {
    case 'regular_burger': return STANDARD_MENU.regular_burger.price;
    case 'special_burger': return STANDARD_MENU.special_burger.price;
    case 'burger_of_day':  return BOTD.price;
    case 'cheese_add_on':  return STANDARD_MENU.cheese_add_on.price;
    case 'fries':          return STANDARD_MENU.fries.price;
    case 'side_salad':     return STANDARD_MENU.side_salad.price;
    case 'soft_drink':     return STANDARD_MENU.soft_drink.price;
    case 'beer':           return STANDARD_MENU.beer.price;
    default: return 0;
  }
}

export function generateOrder(
  customerId: number,
  seatId: string,
  _isTeddy: boolean,
  botdOrderRate: number,
): Order {
  const botdRoll = Math.random();
  const burgerType: BurgerType =
    botdRoll < botdOrderRate
      ? 'burger_of_day'
      : Math.random() < 0.5
        ? 'regular_burger'
        : 'special_burger';

  const items: OrderItem[] = [{ type: burgerType }];

  // Chance of cheese add-on
  if (Math.random() < 0.3) {
    items.push({ type: 'cheese_add_on' });
  }

  // 0–2 sides/drinks
  const sideCount = RUSH.orderSidesMin + Math.floor(
    Math.random() * (RUSH.orderSidesMax - RUSH.orderSidesMin + 1)
  );
  const pickedSides = new Set<SideType>();
  for (let i = 0; i < sideCount; i++) {
    let side = randomSide();
    let attempts = 0;
    while (pickedSides.has(side) && attempts < 10) {
      side = randomSide();
      attempts++;
    }
    pickedSides.add(side);
    items.push({ type: side });
  }

  const basePrice = items.reduce((sum, item) => sum + menuPriceForItem(item), 0);
  return createOrder(customerId, seatId, items, basePrice);
}

export function computeOrderRevenue(order: Order, teddyPresent: boolean): number {
  const ingredientCost = order.selectedTier ? tierCost(order.selectedTier) : 0;
  const teddyMultiplier = teddyPresent ? 1.1 : 1.0; // +10% per Teddy config
  return Math.max(0, (order.basePrice - ingredientCost) * teddyMultiplier);
}

export function hasBurgerOfDay(order: Order): boolean {
  return order.items.some(i => i.type === 'burger_of_day');
}

export function getSideItems(order: Order): SideType[] {
  return order.items
    .map(i => i.type)
    .filter((t): t is SideType => ['fries', 'side_salad', 'soft_drink', 'beer'].includes(t as string));
}
