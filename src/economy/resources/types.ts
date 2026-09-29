export type ResourceId =
  | "iron"
  | "copper"
  | "food"
  | "energy"
  | "components"
  | "machines"
  | "cash";

export interface ResourceDefinition {
  id: ResourceId;
  name: string;
  unit: string;
  basePrice: number;
  volatility: number;
  category: "raw" | "processed" | "energy" | "finished" | "currency";
}

export type Inventory = Partial<Record<ResourceId, number>>;
