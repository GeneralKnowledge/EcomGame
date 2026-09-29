import { createBusiness } from "@/economy/businesses/create";
import { BUSINESS_DEFINITIONS } from "@/economy/businesses/definitions";
import type { BusinessType } from "@/economy/businesses/types";
import { recomputeManagement } from "@/organisations/management";
import type {
  GameState,
  PresentedDevelopment,
  ResponseAction,
} from "@/simulation/engine/types";
import type { SeededRng } from "@/simulation/rng/seeded-rng";
import { DEVELOPMENT_CATALOG } from "./catalog";

function playerOrgBusinesses(state: GameState, playerId: string) {
  const player = state.players[playerId];
  if (!player) return [];
  const org = state.organisations[player.organisationId];
  if (!org) return [];
  return org.businessIds
    .map((id) => state.businesses[id])
    .filter((b): b is NonNullable<typeof b> => !!b && b.status !== "failed");
}

function bumpMarket(
  state: GameState,
  resources: string[],
  supplyDelta: number,
  inventoryDelta: number,
): void {
  for (const r of resources) {
    const m = state.markets[r as keyof typeof state.markets];
    if (!m || r === "cash") continue;
    m.supply = Math.max(0, m.supply + supplyDelta);
    m.inventory = Math.max(5, m.inventory + inventoryDelta);
  }
}

function applyWorldEffect(
  state: GameState,
  development: PresentedDevelopment,
  rng: SeededRng,
): string[] {
  const notes: string[] = [];
  const template = DEVELOPMENT_CATALOG.find((t) => t.id === development.templateId);
  const tags = template?.tags ?? [];

  if (tags.includes("shortage") || tags.includes("supply_down")) {
    bumpMarket(state, development.resources, -8, -18);
    notes.push("Supply tightened in related markets.");
  }
  if (tags.includes("surplus") || tags.includes("supply_up")) {
    bumpMarket(state, development.resources, 10, 22);
    notes.push("Supply expanded in related markets.");
  }
  if (tags.includes("demand_up")) {
    for (const r of development.resources) {
      const m = state.markets[r as keyof typeof state.markets];
      if (m) m.demand += 12;
    }
    notes.push("Demand increased.");
  }
  if (tags.includes("demand_down")) {
    for (const r of development.resources) {
      const m = state.markets[r as keyof typeof state.markets];
      if (m) m.demand = Math.max(0, m.demand - 10);
    }
    notes.push("Demand softened.");
  }
  if (tags.includes("logistics") && tags.includes("capacity_down")) {
    state.logisticsCapacity = Math.max(0, state.logisticsCapacity - 4);
    notes.push("Logistics capacity fell.");
  }
  if (tags.includes("logistics") && tags.includes("capacity_up")) {
    state.logisticsCapacity += 5;
    notes.push("Logistics capacity improved.");
  }
  if (tags.includes("crisis") && development.category === "FINANCE") {
    for (const b of Object.values(state.businesses)) {
      if (b.debt > 20 && rng.chance(0.35)) {
        b.cash -= b.debt * 0.05;
        b.status = b.cash < 5 ? "struggling" : b.status;
      }
    }
    notes.push("Credit conditions worsened for leveraged firms.");
  }
  if (tags.includes("distress") || development.templateId === "supplier_distress") {
    const candidates = Object.values(state.businesses).filter(
      (b) =>
        b.ownerKind === "npc" &&
        b.status === "operating" &&
        development.resources.some((r) =>
          BUSINESS_DEFINITIONS[b.type].primaryResources.includes(r),
        ),
    );
    if (candidates.length > 0) {
      const victim = rng.pick(candidates);
      victim.cash *= 0.4;
      victim.debt += 50;
      victim.status = "struggling";
      notes.push(`${victim.name} is in financial distress.`);
    }
  }
  if (development.templateId === "competitor_collapse") {
    const candidates = Object.values(state.businesses).filter(
      (b) => b.ownerKind === "npc" && b.status !== "failed",
    );
    if (candidates.length > 0) {
      const victim = rng.pick(candidates);
      victim.status = "insolvent";
      victim.cash = -30;
      notes.push(`${victim.name} collapsed.`);
    }
  }
  if (tags.includes("technology") && tags.includes("efficiency")) {
    for (const b of Object.values(state.businesses)) {
      if (
        b.type === "smelter" &&
        development.resources.some((r) =>
          BUSINESS_DEFINITIONS[b.type].primaryResources.includes(r),
        ) &&
        rng.chance(0.4)
      ) {
        b.capacity *= 1.08;
        notes.push(`${b.name} gained efficiency.`);
      }
    }
  }

  return notes;
}

function applyPlayerResponse(
  state: GameState,
  playerId: string,
  development: PresentedDevelopment,
  response: ResponseAction,
  rng: SeededRng,
): string[] {
  const notes: string[] = [];
  const player = state.players[playerId];
  if (!player) return notes;
  const org = state.organisations[player.organisationId];
  if (!org) return notes;
  const businesses = playerOrgBusinesses(state, playerId);

  switch (response) {
    case "ignore":
      notes.push("You chose not to intervene.");
      break;

    case "stockpile": {
      const resource = development.resources[0];
      if (!resource || resource === "cash") break;
      const buyer =
        businesses.find((b) => b.type === "warehouse") ?? businesses[0];
      if (!buyer) {
        notes.push("No operating business to stockpile into.");
        break;
      }
      const market = state.markets[resource];
      const qty = Math.min(15, (buyer.cash * 0.4) / Math.max(0.01, market.price));
      const cost = qty * market.price;
      if (qty > 0.1 && buyer.cash >= cost) {
        buyer.cash -= cost;
        buyer.inventory[resource] = (buyer.inventory[resource] ?? 0) + qty;
        market.inventory = Math.max(0, market.inventory - qty);
        notes.push(`Stockpiled ${qty.toFixed(1)} ${resource} for £${cost.toFixed(0)}.`);
        player.stats.resourcesPurchased += qty;
      } else {
        notes.push("Could not stockpile — insufficient cash or availability.");
      }
      break;
    }

    case "invest": {
      const resource = development.resources[0];
      const target = businesses.find((b) =>
        BUSINESS_DEFINITIONS[b.type].primaryResources.includes(resource ?? "copper"),
      );
      if (target && org.cash >= 25) {
        org.cash -= 25;
        target.cash += 20;
        target.capacity *= 1.1;
        notes.push(`Invested in ${target.name}; capacity expanded.`);
      } else if (org.cash >= 40) {
        // Seed a related business if none
        const typeMap: Record<string, BusinessType> = {
          copper: "mine",
          iron: "mine",
          food: "farm",
          energy: "power_plant",
          components: "smelter",
          machines: "factory",
        };
        const type = typeMap[resource ?? ""] ?? "mine";
        const cost = BUSINESS_DEFINITIONS[type].foundingCost;
        if (org.cash >= cost) {
          org.cash -= cost;
          const b = createBusiness(state, {
            type,
            ownerId: playerId,
            ownerKind: "player",
            name: `New ${BUSINESS_DEFINITIONS[type].name}`,
            cash: cost * 0.25,
          });
          org.businessIds.push(b.id);
          player.stats.businessesFounded += 1;
          recomputeManagement(state, org.id);
          notes.push(`Founded ${b.name} in response to the development.`);
        } else {
          notes.push("Insufficient treasury to invest meaningfully.");
        }
      } else {
        notes.push("Insufficient funds to invest.");
      }
      break;
    }

    case "expand": {
      const target = businesses.sort((a, b) => b.profit - a.profit)[0];
      if (target && org.cash >= 30) {
        org.cash -= 30;
        target.capacity *= 1.15;
        target.employees += 1;
        target.managementLoad += 0.5;
        recomputeManagement(state, org.id);
        notes.push(`Expanded ${target.name}. Management load rose.`);
      } else {
        notes.push("Could not expand — need cash and an operating business.");
      }
      break;
    }

    case "acquire": {
      const distressed = Object.values(state.businesses).filter(
        (b) =>
          b.ownerKind === "npc" &&
          (b.status === "struggling" || b.status === "insolvent") &&
          development.resources.some((r) =>
            BUSINESS_DEFINITIONS[b.type].primaryResources.includes(r),
          ),
      );
      const target =
        distressed[0] ??
        Object.values(state.businesses).find(
          (b) =>
            b.ownerKind === "npc" &&
            b.status !== "failed" &&
            development.resources.some((r) =>
              BUSINESS_DEFINITIONS[b.type].primaryResources.includes(r),
            ),
        );
      if (!target) {
        notes.push("No suitable acquisition target found.");
        break;
      }
      const price =
        BUSINESS_DEFINITIONS[target.type].foundingCost *
        (target.status === "struggling" || target.status === "insolvent" ? 0.45 : 0.9);
      if (org.cash >= price) {
        org.cash -= price;
        target.ownerId = playerId;
        target.ownerKind = "player";
        target.status = "operating";
        target.cash = Math.max(10, target.cash);
        org.businessIds.push(target.id);
        player.stats.businessesAcquired += 1;
        recomputeManagement(state, org.id);
        notes.push(`Acquired ${target.name} for £${price.toFixed(0)}.`);
      } else {
        notes.push(`Acquisition of ${target.name} requires £${price.toFixed(0)}.`);
      }
      break;
    }

    case "contract": {
      const resource = development.resources[0] ?? "copper";
      const seller = Object.values(state.businesses).find(
        (b) =>
          b.ownerKind === "npc" &&
          b.status === "operating" &&
          BUSINESS_DEFINITIONS[b.type].primaryResources.includes(resource),
      );
      const buyer = businesses[0];
      if (!seller || !buyer) {
        notes.push("Could not form a contract — missing counterparty.");
        break;
      }
      const market = state.markets[resource];
      const id = `con_${state.nextEntityId++}`;
      state.contracts[id] = {
        id,
        buyerId: buyer.id,
        sellerId: seller.id,
        resource,
        quantityPerTick: 0.8,
        pricePerUnit: market.price * 0.95,
        remainingTicks: 120,
        kind: "long",
        status: "active",
      };
      buyer.contracts.push(id);
      seller.contracts.push(id);
      notes.push(
        `Signed long-term ${resource} contract with ${seller.name} at £${(market.price * 0.95).toFixed(1)}/unit.`,
      );
      break;
    }

    case "adapt": {
      // Diversify slightly / hire manager / cut costs
      if (org.managementLoad > org.managementCapacity && org.cash >= 40) {
        org.cash -= 40;
        org.managersHired += 1;
        recomputeManagement(state, org.id);
        notes.push("Hired management to adapt to complexity.");
      } else {
        for (const b of businesses) {
          b.maintenance *= 0.95;
          if (rng.chance(0.5)) b.capacity *= 0.95;
        }
        state.logisticsCapacity += 1;
        notes.push("Cut costs and rerouted logistics.");
      }
      break;
    }

    case "investigate": {
      const distressed = Object.values(state.businesses).filter(
        (b) => b.status === "struggling" || b.status === "insolvent",
      );
      if (distressed.length > 0) {
        const d = distressed[0]!;
        notes.push(
          `Investigation: ${d.name} has £${d.cash.toFixed(0)} cash and £${d.debt.toFixed(0)} debt.`,
        );
      } else {
        notes.push("Investigation found no acute distress — watch prices.");
      }
      // Small information edge: slight inventory move visibility via history only
      break;
    }

    case "hedge": {
      const resource = development.resources[0];
      if (resource && resource !== "cash" && org.cash >= 15) {
        org.cash -= 15;
        for (const b of businesses) {
          b.inventory[resource] = (b.inventory[resource] ?? 0) + 2;
        }
        notes.push(`Hedged with a small ${resource} buffer.`);
      }
      break;
    }

    case "shutdown_line": {
      const target = businesses.find((b) =>
        development.resources.some((r) =>
          BUSINESS_DEFINITIONS[b.type].primaryResources.includes(r),
        ),
      );
      if (target) {
        target.capacity *= 0.7;
        target.maintenance *= 0.7;
        notes.push(`Scaled back ${target.name} to conserve cash.`);
      } else {
        notes.push("No matching line to shut down.");
      }
      break;
    }

    case "borrow": {
      const amount = 50;
      org.debt += amount * 1.15;
      org.cash += amount;
      notes.push(`Borrowed £${amount} (obligation £${(amount * 1.15).toFixed(0)}).`);
      break;
    }

    case "divert": {
      state.logisticsCapacity += 2;
      notes.push("Diverted shipments through alternate routes.");
      break;
    }
  }

  return notes;
}

export function resolveEconomicRoll(
  state: GameState,
  rollId: string,
  developmentInstanceId: string,
  response: ResponseAction,
  rng: SeededRng,
): string[] {
  const roll = state.pendingRolls[rollId];
  if (!roll || roll.phase === "resolved" || roll.phase === "expired") {
    return ["Roll is no longer available."];
  }
  const development = roll.developments.find((d) => d.instanceId === developmentInstanceId);
  if (!development) return ["Unknown development."];
  if (!development.responses.includes(response)) {
    return ["That response is not available for this development."];
  }

  roll.phase = "resolved";
  roll.chosenInstanceId = developmentInstanceId;
  roll.chosenResponse = response;

  const player = state.players[roll.playerId];
  if (player) player.pendingRollId = null;

  const worldNotes = applyWorldEffect(state, development, rng);
  const playerNotes = applyPlayerResponse(
    state,
    roll.playerId,
    development,
    response,
    rng,
  );

  const allNotes = [...worldNotes, ...playerNotes];
  state.history.unshift({
    id: `hist_${state.nextEntityId++}`,
    tick: state.tick,
    timestamp: Date.now(),
    kind: "decision",
    title: `${development.title} — ${response}`,
    detail: allNotes.join(" "),
    resource: development.resources[0],
  });

  return allNotes;
}

export function revealRoll(state: GameState, rollId: string): void {
  const roll = state.pendingRolls[rollId];
  if (roll && roll.phase === "anticipating") {
    roll.phase = "revealed";
  }
}

export const RESPONSE_LABELS: Record<ResponseAction, string> = {
  invest: "Invest",
  stockpile: "Stockpile",
  ignore: "Ignore",
  investigate: "Investigate",
  expand: "Expand",
  adapt: "Adapt",
  acquire: "Acquire",
  contract: "Contract",
  hedge: "Hedge",
  shutdown_line: "Scale Back",
  borrow: "Borrow",
  divert: "Divert",
};
