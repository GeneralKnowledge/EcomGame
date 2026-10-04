import type { ResourceDefinition, ResourceId } from "./types";

export const RESOURCES: Record<ResourceId, ResourceDefinition> = {
  iron: {
    id: "iron",
    name: "Iron",
    unit: "t",
    basePrice: 12,
    volatility: 0.08,
    category: "raw",
  },
  copper: {
    id: "copper",
    name: "Copper",
    unit: "t",
    basePrice: 28,
    volatility: 0.12,
    category: "raw",
  },
  food: {
    id: "food",
    name: "Food",
    unit: "crate",
    basePrice: 4,
    volatility: 0.06,
    category: "raw",
  },
  energy: {
    id: "energy",
    name: "Energy",
    unit: "MWh",
    basePrice: 8,
    volatility: 0.1,
    category: "energy",
  },
  components: {
    id: "components",
    name: "Components",
    unit: "unit",
    basePrice: 45,
    volatility: 0.09,
    category: "processed",
  },
  machines: {
    id: "machines",
    name: "Machines",
    unit: "unit",
    basePrice: 180,
    volatility: 0.07,
    category: "finished",
  },
  cash: {
    id: "cash",
    name: "Cash",
    unit: "£",
    basePrice: 1,
    volatility: 0,
    category: "currency",
  },
};

export const TRADEABLE_RESOURCES: ResourceId[] = [
  "iron",
  "copper",
  "food",
  "energy",
  "components",
  "machines",
];
