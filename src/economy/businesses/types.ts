import type { Inventory, ResourceId } from "@/economy/resources/types";

export type BusinessType =
  | "mine"
  | "farm"
  | "power_plant"
  | "smelter"
  | "factory"
  | "warehouse"
  | "retailer"
  | "bank"
  | "logistics";

export type BusinessStatus =
  | "operating"
  | "struggling"
  | "insolvent"
  | "failed"
  | "expanding"
  | "shutdown";

export type OwnerKind = "npc" | "player";

export interface ProductionRecipe {
  inputs: Inventory;
  outputs: Inventory;
  /** Units of production capacity consumed per cycle */
  capacityCost: number;
  /** Energy optional overhead beyond inputs */
  energyHint?: number;
}

export interface BusinessDefinition {
  type: BusinessType;
  name: string;
  sector:
    | "mining"
    | "agriculture"
    | "energy"
    | "processing"
    | "manufacturing"
    | "transport"
    | "warehousing"
    | "retail"
    | "banking";
  managementLoad: number;
  baseCapacity: number;
  foundingCost: number;
  maintenancePerTick: number;
  employeeBase: number;
  recipe: ProductionRecipe | null;
  /** Primary resource this business deals in (for market affinity) */
  primaryResources: ResourceId[];
  /** Warehouse capacity if applicable */
  storageCapacity?: number;
}

export interface Contract {
  id: string;
  buyerId: string;
  sellerId: string;
  resource: ResourceId;
  quantityPerTick: number;
  pricePerUnit: number;
  remainingTicks: number;
  kind: "spot" | "short" | "long";
  status: "active" | "breached" | "completed" | "cancelled";
}

export interface Business {
  id: string;
  type: BusinessType;
  name: string;
  ownerId: string;
  ownerKind: OwnerKind;
  cash: number;
  inventory: Inventory;
  capacity: number;
  /** Current utilised production this tick */
  utilisation: number;
  revenue: number;
  expenses: number;
  profit: number;
  debt: number;
  interestAccrued: number;
  maintenance: number;
  employees: number;
  managementLoad: number;
  contracts: string[];
  reputation: number;
  marketShare: Partial<Record<ResourceId, number>>;
  status: BusinessStatus;
  foundedTick: number;
  failedTick: number | null;
  lifetimeRevenue: number;
  lifetimeProfit: number;
  ticksSinceSale: number;
  reliability: number;
  region: string;
}
