import type { GameState, PlayerState } from "@/simulation/engine/types";
import { TRADEABLE_RESOURCES } from "@/economy/resources/definitions";

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  check: (state: GameState, player: PlayerState) => boolean;
}

function playerBusinesses(state: GameState, playerId: string) {
  return Object.values(state.businesses).filter(
    (b) => b.ownerId === playerId && b.status !== "failed",
  );
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_1000",
    title: "First £1,000",
    description: "Accumulate £1,000 in organisation cash.",
    check: (s, p) => (s.organisations[p.organisationId]?.cash ?? 0) >= 1000,
  },
  {
    id: "first_business",
    title: "First Business",
    description: "Found your first business.",
    check: (_s, p) => p.stats.businessesFounded >= 1,
  },
  {
    id: "first_employee",
    title: "First Employee",
    description: "Employ at least one worker.",
    check: (s, p) =>
      playerBusinesses(s, p.id).some((b) => b.employees >= 1),
  },
  {
    id: "first_million",
    title: "First Million",
    description: "Reach £1,000,000 cash.",
    check: (s, p) => (s.organisations[p.organisationId]?.cash ?? 0) >= 1_000_000,
  },
  {
    id: "first_acquisition",
    title: "First Acquisition",
    description: "Acquire another business.",
    check: (_s, p) => p.stats.businessesAcquired >= 1,
  },
  {
    id: "first_bankruptcy",
    title: "First Bankruptcy",
    description: "Experience organisational bankruptcy.",
    check: (_s, p) => p.stats.bankruptcies >= 1,
  },
  {
    id: "recovered_bankruptcy",
    title: "Recovered From Bankruptcy",
    description: "Leave the Commons after bankruptcy.",
    check: (s, p) =>
      p.stats.bankruptcies >= 1 &&
      !(s.organisations[p.organisationId]?.inCommons ?? false) &&
      (s.organisations[p.organisationId]?.cash ?? 0) >= 100,
  },
  {
    id: "first_major_contract",
    title: "First Major Contract",
    description: "Complete a long-term contract.",
    check: (_s, p) => p.stats.contractsCompleted >= 1,
  },
  {
    id: "first_supplier_failure",
    title: "First Supplier Failure",
    description: "Witness a business failure in the economy.",
    check: (s) =>
      Object.values(s.businesses).some((b) => b.status === "failed"),
  },
  {
    id: "first_market_crisis",
    title: "First Market Crisis",
    description: "Live through extreme price volatility.",
    check: (s) =>
      TRADEABLE_RESOURCES.some((r) => {
        const m = s.markets[r];
        if (!m) return false;
        return m.price > m.priceHistory[0]! * 2 || m.price < m.priceHistory[0]! * 0.4;
      }),
  },
  {
    id: "control_10_market",
    title: "Control 10% Of A Market",
    description: "Hold significant market share in a resource.",
    check: (s, p) =>
      playerBusinesses(s, p.id).some((b) =>
        Object.values(b.marketShare).some((v) => (v ?? 0) >= 0.1),
      ),
  },
  {
    id: "complete_supply_chain",
    title: "Own A Complete Supply Chain",
    description: "Own mine, smelter, factory, warehouse, and retailer.",
    check: (s, p) => {
      const types = new Set(playerBusinesses(s, p.id).map((b) => b.type));
      return (
        types.has("mine") &&
        types.has("smelter") &&
        types.has("factory") &&
        types.has("warehouse") &&
        types.has("retailer")
      );
    },
  },
  {
    id: "operate_10",
    title: "Operate 10 Businesses",
    description: "Run ten businesses at once.",
    check: (s, p) => playerBusinesses(s, p.id).length >= 10,
  },
  {
    id: "operate_100",
    title: "Operate 100 Businesses",
    description: "Run one hundred businesses at once.",
    check: (s, p) => playerBusinesses(s, p.id).length >= 100,
  },
  {
    id: "survive_shortage",
    title: "Survive A Major Shortage",
    description: "Keep operating through severe supply stress.",
    check: (s, p) =>
      s.worldConditions.some((c) => c.id.includes("shortage") && c.severity > 0.6) &&
      playerBusinesses(s, p.id).some((b) => b.status === "operating"),
  },
  {
    id: "cause_shortage",
    title: "Cause A Market Shortage",
    description: "Become large enough to constrain supply.",
    check: (_s, p) => p.stats.highestMarketShare >= 0.35,
  },
  {
    id: "major_supplier",
    title: "Become A Major Supplier",
    description: "Hold 25% market share in a resource.",
    check: (_s, p) => p.stats.highestMarketShare >= 0.25,
  },
];

export function checkAchievements(state: GameState, playerId: string): void {
  const player = state.players[playerId];
  if (!player) return;
  const owned = new Set(player.achievements.map((a) => a.id));
  for (const def of ACHIEVEMENTS) {
    if (owned.has(def.id)) continue;
    if (def.check(state, player)) {
      player.achievements.push({
        id: def.id,
        unlockedTick: state.tick,
        title: def.title,
      });
      state.history.unshift({
        id: `hist_${state.nextEntityId++}`,
        tick: state.tick,
        timestamp: Date.now(),
        kind: "achievement",
        title: def.title,
        detail: def.description,
      });
    }
  }
}
