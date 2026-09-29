import { DEVELOPMENT_CATALOG, RARITY_WEIGHT } from "./catalog";
import { identifyConditions, playerResourceExposure } from "@/events/conditions/identify";
import type {
  DevelopmentTemplate,
  GameState,
  PendingEconomicRoll,
  PresentedDevelopment,
} from "@/simulation/engine/types";
import type { SeededRng } from "@/simulation/rng/seeded-rng";

function contextualWeight(
  state: GameState,
  template: DevelopmentTemplate,
  playerId: string,
): number {
  let weight = RARITY_WEIGHT[template.rarity] ?? 0.1;
  const conditions = state.worldConditions;
  const player = state.players[playerId];
  const exposure = player ? playerResourceExposure(state, player) : new Set();

  for (const tag of template.tags) {
    if (tag === "shortage") {
      for (const r of template.resources) {
        const c = conditions.find((x) => x.id === `shortage_${r}`);
        if (c) weight *= 1 + c.severity * 3;
      }
    }
    if (tag === "surplus") {
      for (const r of template.resources) {
        const c = conditions.find((x) => x.id === `surplus_${r}`);
        if (c) weight *= 1 + c.severity * 3;
      }
    }
    if (tag === "price_up") {
      for (const r of template.resources) {
        const c = conditions.find((x) => x.id === `price_up_${r}`);
        if (c) weight *= 1 + c.severity * 2;
      }
    }
    if (tag === "price_down") {
      for (const r of template.resources) {
        const c = conditions.find((x) => x.id === `price_down_${r}`);
        if (c) weight *= 1 + c.severity * 2;
      }
    }
    if (tag === "distress" || tag === "acquisition") {
      const c = conditions.find((x) => x.id === "distress" || x.id === "recent_failures");
      if (c) weight *= 1 + c.severity * 2.5;
    }
    if (tag === "logistics") {
      const c = conditions.find((x) => x.id === "logistics_tight");
      if (c) weight *= 1 + c.severity * 2;
    }
    if (tag === "capacity_down" && state.logisticsCapacity < 3) weight *= 2;
    if (tag === "capacity_up" && state.logisticsCapacity > 8) weight *= 0.4;
    if (tag === "crisis") {
      weight *= 0.9; // still rare via rarity table
    }
    if (tag === "peripheral") {
      // Intentionally sometimes irrelevant — slight boost when player NOT exposed
      const relevant = template.resources.some((r) => exposure.has(r));
      if (!relevant) weight *= 1.4;
    }
  }

  // Soft boost when player is exposed — but do NOT eliminate irrelevant events
  const overlap = template.resources.filter((r) => exposure.has(r)).length;
  if (overlap > 0) weight *= 1 + overlap * 0.35;

  // Debt-heavy players see finance events more
  const org = player ? state.organisations[player.organisationId] : null;
  if (org && org.debt + sumBusinessDebt(state, org.businessIds) > 80) {
    if (template.category === "FINANCE") weight *= 1.8;
  }

  return Math.max(0.001, weight);
}

function sumBusinessDebt(state: GameState, ids: string[]): number {
  return ids.reduce((sum, id) => sum + (state.businesses[id]?.debt ?? 0), 0);
}

function relevanceScore(
  state: GameState,
  template: DevelopmentTemplate,
  playerId: string,
): number {
  const player = state.players[playerId];
  if (!player) return 0;
  const exposure = playerResourceExposure(state, player);
  let score = 0;
  for (const r of template.resources) {
    if (exposure.has(r)) score += 1;
  }
  if (template.tags.includes("peripheral") && score === 0) score = -0.5;
  return score;
}

export function generateEconomicRoll(
  state: GameState,
  playerId: string,
  rng: SeededRng,
): PendingEconomicRoll | null {
  const player = state.players[playerId];
  if (!player) return null;
  if (player.pendingRollId) return state.pendingRolls[player.pendingRollId] ?? null;

  identifyConditions(state);

  const candidates = [...DEVELOPMENT_CATALOG];
  const weights = candidates.map((t) => contextualWeight(state, t, playerId));

  const picked: DevelopmentTemplate[] = [];
  const pickedIds = new Set<string>();
  const pool = [...candidates];
  const poolWeights = [...weights];

  const count = state.config.developmentsPerRoll;
  for (let i = 0; i < count && pool.length > 0; i++) {
    const choice = rng.weightedPick(pool, poolWeights);
    if (pickedIds.has(choice.id)) {
      // remove and retry
      const idx = pool.findIndex((p) => p.id === choice.id);
      if (idx >= 0) {
        pool.splice(idx, 1);
        poolWeights.splice(idx, 1);
      }
      i--;
      continue;
    }
    picked.push(choice);
    pickedIds.add(choice.id);
    const idx = pool.findIndex((p) => p.id === choice.id);
    if (idx >= 0) {
      pool.splice(idx, 1);
      poolWeights.splice(idx, 1);
    }
  }

  const developments: PresentedDevelopment[] = picked.map((t) => ({
    instanceId: `dev_${state.nextEntityId++}`,
    templateId: t.id,
    title: t.title,
    category: t.category,
    rarity: t.rarity,
    description: t.description,
    resources: t.resources,
    responses: t.responses,
    relevanceScore: relevanceScore(state, t, playerId),
  }));

  const roll: PendingEconomicRoll = {
    id: `roll_${state.nextEntityId++}`,
    playerId,
    createdTick: state.tick,
    phase: "anticipating",
    developments,
    chosenInstanceId: null,
    chosenResponse: null,
  };

  state.pendingRolls[roll.id] = roll;
  player.pendingRollId = roll.id;
  player.lastRollTick = state.tick;
  player.stats.economicRolls += 1;
  if (developments.some((d) => d.rarity === "RARE" || d.rarity === "VERY_RARE" || d.rarity === "EXCEPTIONAL")) {
    player.stats.rareEvents += 1;
  }

  state.history.unshift({
    id: `hist_${state.nextEntityId++}`,
    tick: state.tick,
    timestamp: Date.now(),
    kind: "roll",
    title: "Economic Roll available",
    detail: "Market developments are forming. Three situations await your review.",
  });

  return roll;
}

export function maybeOfferRoll(
  state: GameState,
  playerId: string,
  rng: SeededRng,
): void {
  const player = state.players[playerId];
  if (!player || player.pendingRollId) return;

  const cfg = state.config;
  if (state.tick - player.lastRollTick < cfg.economicRollMinCooldown) return;
  if (state.tick % cfg.economicRollCheckInterval !== 0) return;

  // Volatility increases chance
  const avgVol =
    Object.values(state.markets).reduce((s, m) => s + Math.abs(m.trend), 0) /
    Math.max(1, Object.keys(state.markets).length);
  const chance = Math.min(0.95, cfg.economicRollBaseChance + avgVol * 2);

  if (rng.chance(chance)) {
    generateEconomicRoll(state, playerId, rng);
  }
}
