import { createBusiness, foundingCost } from "@/economy/businesses/create";
import { BUSINESS_DEFINITIONS } from "@/economy/businesses/definitions";
import type { BusinessType } from "@/economy/businesses/types";
import {
  revealRoll,
  resolveEconomicRoll,
} from "@/events/economic-rolls/resolution";
import { generateEconomicRoll } from "@/events/economic-rolls/generator";
import { hireManager, recomputeManagement } from "@/organisations/management";
import type { GameState, ResponseAction } from "@/simulation/engine/types";
import type { SeededRng } from "@/simulation/rng/seeded-rng";

export function foundBusiness(
  state: GameState,
  playerId: string,
  type: BusinessType,
  name?: string,
): { ok: boolean; message: string; businessId?: string } {
  const player = state.players[playerId];
  if (!player) return { ok: false, message: "No player" };
  const org = state.organisations[player.organisationId];
  if (!org) return { ok: false, message: "No organisation" };
  if (org.inCommons) {
    return { ok: false, message: "Still recovering in the Commons." };
  }

  const cost = foundingCost(type);
  if (org.cash < cost) {
    return { ok: false, message: `Need £${cost}. Have £${org.cash.toFixed(0)}.` };
  }

  org.cash -= cost;
  player.cash = org.cash;
  const def = BUSINESS_DEFINITIONS[type];
  const business = createBusiness(state, {
    type,
    ownerId: playerId,
    ownerKind: "player",
    name: name ?? `Your ${def.name}`,
    cash: cost * 0.2,
    capacityScale: 0.7,
  });
  // Tiny starter inventory for viability
  if (type === "mine") business.inventory.energy = 2;
  if (type === "farm") business.inventory.energy = 1;
  if (type === "smelter") {
    business.inventory.iron = 3;
    business.inventory.copper = 2;
    business.inventory.energy = 2;
  }
  if (type === "factory") {
    business.inventory.components = 2;
    business.inventory.energy = 2;
  }
  if (type === "retailer") {
    business.inventory.food = 5;
  }
  if (type === "power_plant") {
    business.cash += 10;
  }

  org.businessIds.push(business.id);
  player.stats.businessesFounded += 1;
  recomputeManagement(state, org.id);

  state.history.unshift({
    id: `hist_${state.nextEntityId++}`,
    tick: state.tick,
    timestamp: Date.now(),
    kind: "business",
    title: `Founded ${business.name}`,
    detail: `Spent £${cost}. Management load ${org.managementLoad}/${org.managementCapacity}.`,
    businessId: business.id,
  });

  return { ok: true, message: `Founded ${business.name}`, businessId: business.id };
}

export function tryHireManager(
  state: GameState,
  playerId: string,
): { ok: boolean; message: string } {
  const player = state.players[playerId];
  if (!player) return { ok: false, message: "No player" };
  const ok = hireManager(state, player.organisationId);
  return {
    ok,
    message: ok ? "Manager hired." : "Cannot afford a manager.",
  };
}

export function forceEconomicRoll(
  state: GameState,
  playerId: string,
  rng: SeededRng,
): void {
  const player = state.players[playerId];
  if (!player) return;
  if (player.pendingRollId) return;
  player.lastRollTick = -999;
  generateEconomicRoll(state, playerId, rng);
}

export function chooseDevelopment(
  state: GameState,
  rollId: string,
  developmentInstanceId: string,
  response: ResponseAction,
  rng: SeededRng,
): string[] {
  revealRoll(state, rollId);
  return resolveEconomicRoll(state, rollId, developmentInstanceId, response, rng);
}

export function setRollRevealed(state: GameState, rollId: string): void {
  revealRoll(state, rollId);
}
