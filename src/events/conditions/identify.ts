import { TRADEABLE_RESOURCES } from "@/economy/resources/definitions";
import { BUSINESS_DEFINITIONS } from "@/economy/businesses/definitions";
import type { ResourceId } from "@/economy/resources/types";
import type {
  EconomicCondition,
  GameState,
  PlayerState,
} from "@/simulation/engine/types";

export function identifyConditions(state: GameState): EconomicCondition[] {
  const conditions: EconomicCondition[] = [];

  for (const id of TRADEABLE_RESOURCES) {
    const m = state.markets[id];
    if (!m) continue;
    const imbalance = (m.demand - m.supply) / Math.max(1, m.demand + m.supply);
    if (imbalance > 0.25 || m.inventory < 25) {
      conditions.push({
        id: `shortage_${id}`,
        resource: id,
        severity: Math.min(1, Math.abs(imbalance) + (m.inventory < 25 ? 0.3 : 0)),
        label: `${id} shortage pressure`,
      });
    }
    if (imbalance < -0.25 || m.inventory > 160) {
      conditions.push({
        id: `surplus_${id}`,
        resource: id,
        severity: Math.min(1, Math.abs(imbalance) + (m.inventory > 160 ? 0.2 : 0)),
        label: `${id} surplus pressure`,
      });
    }
    if (m.trend > 0.05) {
      conditions.push({
        id: `price_up_${id}`,
        resource: id,
        severity: Math.min(1, m.trend * 8),
        label: `${id} rising`,
      });
    }
    if (m.trend < -0.05) {
      conditions.push({
        id: `price_down_${id}`,
        resource: id,
        severity: Math.min(1, Math.abs(m.trend) * 8),
        label: `${id} falling`,
      });
    }
  }

  const failed = Object.values(state.businesses).filter((b) => b.status === "failed");
  if (failed.length > 0) {
    conditions.push({
      id: "recent_failures",
      severity: Math.min(1, failed.length / 5),
      label: "business failures",
    });
  }

  const struggling = Object.values(state.businesses).filter(
    (b) => b.status === "struggling" || b.status === "insolvent",
  );
  if (struggling.length > 0) {
    conditions.push({
      id: "distress",
      severity: Math.min(1, struggling.length / 4),
      label: "financial distress",
    });
  }

  if (state.logisticsCapacity < 3) {
    conditions.push({
      id: "logistics_tight",
      severity: 0.7,
      label: "logistics constrained",
    });
  }

  state.worldConditions = conditions;
  return conditions;
}

export function playerResourceExposure(
  state: GameState,
  player: PlayerState,
): Set<ResourceId> {
  const exposure = new Set<ResourceId>();
  const org = state.organisations[player.organisationId];
  if (!org) return exposure;
  for (const bid of org.businessIds) {
    const b = state.businesses[bid];
    if (!b || b.status === "failed") continue;
    for (const r of Object.keys(b.inventory) as ResourceId[]) {
      if ((b.inventory[r] ?? 0) > 0.5) exposure.add(r);
    }
    for (const r of BUSINESS_DEFINITIONS[b.type].primaryResources) {
      exposure.add(r);
    }
  }
  return exposure;
}
