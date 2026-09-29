import { BUSINESS_DEFINITIONS } from "./definitions";
import type { Business, BusinessType, OwnerKind } from "./types";
import type { GameState } from "@/simulation/engine/types";

export function createBusiness(
  state: GameState,
  opts: {
    type: BusinessType;
    ownerId: string;
    ownerKind: OwnerKind;
    name?: string;
    cash?: number;
    region?: string;
    capacityScale?: number;
  },
): Business {
  const def = BUSINESS_DEFINITIONS[opts.type];
  const scale = opts.capacityScale ?? 1;
  const id = `biz_${state.nextEntityId++}`;
  const business: Business = {
    id,
    type: opts.type,
    name: opts.name ?? `${def.name} ${state.nextEntityId}`,
    ownerId: opts.ownerId,
    ownerKind: opts.ownerKind,
    cash: opts.cash ?? def.foundingCost * 0.3,
    inventory: {},
    capacity: def.baseCapacity * scale,
    utilisation: 0,
    revenue: 0,
    expenses: 0,
    profit: 0,
    debt: 0,
    interestAccrued: 0,
    maintenance: def.maintenancePerTick,
    employees: def.employeeBase,
    managementLoad: def.managementLoad,
    contracts: [],
    reputation: 0.5,
    marketShare: {},
    status: "operating",
    foundedTick: state.tick,
    failedTick: null,
    lifetimeRevenue: 0,
    lifetimeProfit: 0,
    ticksSinceSale: 0,
    reliability: 0.85 + scale * 0.05,
    region: opts.region ?? "Central",
  };
  state.businesses[id] = business;
  return business;
}

export function foundingCost(type: BusinessType): number {
  return BUSINESS_DEFINITIONS[type].foundingCost;
}
