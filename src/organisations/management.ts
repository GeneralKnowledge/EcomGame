import { BUSINESS_DEFINITIONS } from "@/economy/businesses/definitions";
import type { GameState } from "@/simulation/engine/types";

export function recomputeManagement(state: GameState, orgId: string): void {
  const org = state.organisations[orgId];
  if (!org) return;

  let load = 0;
  for (const bid of org.businessIds) {
    const b = state.businesses[bid];
    if (!b || b.status === "failed") continue;
    load += b.managementLoad;
  }
  org.managementLoad = Math.round(load * 100) / 100;
  org.managementCapacity =
    state.config.baseManagementCapacity + org.managersHired * 4;
}

export function hireManager(state: GameState, orgId: string): boolean {
  const org = state.organisations[orgId];
  if (!org) return false;
  const cost = 40 + org.managersHired * 25;
  if (org.cash < cost) return false;
  org.cash -= cost;
  org.managersHired += 1;
  recomputeManagement(state, orgId);
  state.history.unshift({
    id: `hist_${state.nextEntityId++}`,
    tick: state.tick,
    timestamp: Date.now(),
    kind: "system",
    title: "Manager hired",
    detail: `Hired a manager. Capacity now ${org.managementCapacity}. Cost £${cost}.`,
  });
  return true;
}

export function syncOrgCashFromBusinesses(state: GameState, orgId: string): void {
  const org = state.organisations[orgId];
  if (!org) return;
  // Organisation cash is the treasury; businesses hold operating cash.
  // Pull slim profits upward periodically via dividend-like sweep in tick.
}

export function totalOrgAssets(state: GameState, orgId: string): number {
  const org = state.organisations[orgId];
  if (!org) return 0;
  let assets = org.cash;
  for (const bid of org.businessIds) {
    const b = state.businesses[bid];
    if (!b || b.status === "failed") continue;
    assets += b.cash;
    const def = BUSINESS_DEFINITIONS[b.type];
    assets += def.foundingCost * 0.5;
    for (const [res, qty] of Object.entries(b.inventory)) {
      const market = state.markets[res as keyof typeof state.markets];
      if (market) assets += (qty ?? 0) * market.price;
    }
    assets -= b.debt;
  }
  assets -= org.debt;
  return assets;
}
