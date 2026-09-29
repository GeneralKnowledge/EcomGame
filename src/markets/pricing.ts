import { RESOURCES, TRADEABLE_RESOURCES } from "@/economy/resources/definitions";
import type { ResourceId } from "@/economy/resources/types";
import type { GameState, MarketState } from "@/simulation/engine/types";

export function createMarket(resource: ResourceId): MarketState {
  const def = RESOURCES[resource];
  return {
    resource,
    supply: 0,
    demand: 0,
    price: def.basePrice,
    inventory: 40 + def.basePrice * 0.5,
    priceHistory: Array.from({ length: 24 }, () => def.basePrice),
    transactionVolume: 0,
    participants: 0,
    trend: 0,
  };
}

export function createAllMarkets(): Record<ResourceId, MarketState> {
  const markets = {} as Record<ResourceId, MarketState>;
  for (const id of TRADEABLE_RESOURCES) {
    markets[id] = createMarket(id);
  }
  markets.cash = createMarket("cash");
  markets.cash.price = 1;
  return markets;
}

export function resetMarketTickCounters(state: GameState): void {
  for (const id of TRADEABLE_RESOURCES) {
    const m = state.markets[id];
    if (!m) continue;
    m.supply = 0;
    m.demand = 0;
    m.transactionVolume = 0;
    m.participants = 0;
  }
}

export function applyBaselineDemand(state: GameState): void {
  const baseline: Partial<Record<ResourceId, number>> = {
    copper: 6,
    iron: 5,
    energy: 5,
    food: 5,
    components: 2.5,
    machines: 1.2,
  };
  for (const [id, amount] of Object.entries(baseline)) {
    const resource = id as ResourceId;
    const m = state.markets[resource];
    if (!m || amount === undefined) continue;
    recordDemand(state, resource, amount);
    const consumed = Math.min(m.inventory * 0.1, amount);
    m.inventory = Math.max(10, m.inventory - consumed);
  }
}

export function updatePrices(state: GameState): void {
  const { priceAdjustmentRate, priceFloorMultiplier, priceCeilingMultiplier } =
    state.config;

  for (const id of TRADEABLE_RESOURCES) {
    const m = state.markets[id];
    if (!m) continue;
    const def = RESOURCES[id];
    const imbalance = m.demand - m.supply;
    const denom = Math.max(1, m.supply + m.demand);
    const pressure = imbalance / denom;
    const inventoryPressure =
      (55 - m.inventory) / 180 + (m.inventory < 15 ? 0.2 : 0);

    let next =
      m.price *
      (1 +
        (pressure * 0.7 + inventoryPressure) *
          priceAdjustmentRate *
          (1 + def.volatility));

    // Stronger mean reversion toward base so floors aren't sticky
    next = next * 0.94 + def.basePrice * 0.06;

    const floor = def.basePrice * priceFloorMultiplier;
    const ceiling = def.basePrice * priceCeilingMultiplier;
    next = Math.max(floor, Math.min(ceiling, next));

    m.trend = (next - m.price) / Math.max(0.01, m.price);
    m.price = Math.round(next * 100) / 100;
    m.priceHistory.push(m.price);
    if (m.priceHistory.length > 48) m.priceHistory.shift();

    if (m.inventory < 25) m.inventory += 0.8;
    if (m.inventory > 120) m.inventory -= 1.5;
  }
}

export function recordSupply(state: GameState, resource: ResourceId, amount: number): void {
  const m = state.markets[resource];
  if (!m || resource === "cash") return;
  m.supply += amount;
}

export function recordDemand(state: GameState, resource: ResourceId, amount: number): void {
  const m = state.markets[resource];
  if (!m || resource === "cash") return;
  m.demand += amount;
}
