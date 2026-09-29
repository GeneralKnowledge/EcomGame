import type { ResourceId } from "@/economy/resources/types";
import type { Business } from "@/economy/businesses/types";
import type { GameState } from "@/simulation/engine/types";
import { recordDemand, recordSupply } from "./pricing";

export interface TradeResult {
  filled: number;
  cost: number;
  averagePrice: number;
}

function invGet(b: Business, r: ResourceId): number {
  return b.inventory[r] ?? 0;
}

function invAdd(b: Business, r: ResourceId, amount: number): void {
  b.inventory[r] = invGet(b, r) + amount;
}

/**
 * Spot purchase from the market pool / other sellers.
 * Availability and price are driven by live market state — never fixed forever.
 */
export function spotBuy(
  state: GameState,
  buyer: Business,
  resource: ResourceId,
  quantity: number,
  maxPrice?: number,
): TradeResult {
  if (quantity <= 0 || resource === "cash") {
    return { filled: 0, cost: 0, averagePrice: 0 };
  }
  const market = state.markets[resource];
  if (!market) return { filled: 0, cost: 0, averagePrice: 0 };

  const price = market.price * (1 + Math.max(0, -market.trend) * 0.05);
  if (maxPrice !== undefined && price > maxPrice) {
    return { filled: 0, cost: 0, averagePrice: price };
  }

  const available = Math.max(0, market.inventory * 0.15 + market.supply * 0.05);
  const canAfford = buyer.cash / Math.max(0.01, price);
  const filled = Math.min(quantity, available, canAfford);
  if (filled <= 0.0001) {
    recordDemand(state, resource, quantity);
    return { filled: 0, cost: 0, averagePrice: price };
  }

  const cost = filled * price;
  buyer.cash -= cost;
  invAdd(buyer, resource, filled);
  market.inventory = Math.max(0, market.inventory - filled);
  market.transactionVolume += filled;
  market.participants += 1;
  recordDemand(state, resource, quantity);
  return { filled, cost, averagePrice: price };
}

export function spotSell(
  state: GameState,
  seller: Business,
  resource: ResourceId,
  quantity: number,
  minPrice?: number,
): TradeResult {
  if (quantity <= 0 || resource === "cash") {
    return { filled: 0, cost: 0, averagePrice: 0 };
  }
  const market = state.markets[resource];
  if (!market) return { filled: 0, cost: 0, averagePrice: 0 };

  const price = market.price * (1 - Math.max(0, market.trend) * 0.03);
  if (minPrice !== undefined && price < minPrice) {
    return { filled: 0, cost: 0, averagePrice: price };
  }

  const have = invGet(seller, resource);
  const demandRoom = Math.max(0.5, market.demand * 0.2 + 2);
  const filled = Math.min(quantity, have, demandRoom);
  if (filled <= 0.0001) {
    recordSupply(state, resource, Math.min(quantity, have));
    return { filled: 0, cost: 0, averagePrice: price };
  }

  const revenue = filled * price;
  seller.cash += revenue;
  invAdd(seller, resource, -filled);
  market.inventory += filled * 0.45;
  market.transactionVolume += filled;
  market.participants += 1;
  recordSupply(state, resource, filled);
  seller.ticksSinceSale = 0;
  seller.revenue += revenue;
  return { filled, cost: revenue, averagePrice: price };
}

/** Attempt to buy inputs needed for production from market. */
export function buyInputs(
  state: GameState,
  business: Business,
  needed: Partial<Record<ResourceId, number>>,
): void {
  for (const [key, amount] of Object.entries(needed)) {
    const r = key as ResourceId;
    const have = invGet(business, r);
    const want = (amount ?? 0) - have;
    if (want > 0.01) {
      spotBuy(state, business, r, want);
    }
  }
}
