import { BUSINESS_DEFINITIONS } from "./definitions";
import type { Business } from "./types";
import type { ResourceId } from "@/economy/resources/types";
import type { GameState } from "@/simulation/engine/types";
import { buyInputs, spotBuy, spotSell } from "@/markets/transactions";
import { recordDemand } from "@/markets/pricing";
import type { SeededRng } from "@/simulation/rng/seeded-rng";

function invGet(b: Business, r: ResourceId): number {
  return b.inventory[r] ?? 0;
}

function invAdd(b: Business, r: ResourceId, amount: number): void {
  b.inventory[r] = Math.max(0, invGet(b, r) + amount);
}

function managementStress(state: GameState, business: Business): number {
  if (business.ownerKind !== "player") return 0;
  const org = Object.values(state.organisations).find(
    (o) => o.playerId === business.ownerId,
  );
  if (!org || org.managementCapacity <= 0) return 0;
  const ratio = org.managementLoad / org.managementCapacity;
  return Math.max(0, ratio - 1);
}

/**
 * Run one production cycle. Failures emerge from missing inputs,
 * cash, management overload, and logistics — not arbitrary % penalties alone.
 */
export function processProduction(
  state: GameState,
  business: Business,
  rng: SeededRng,
): void {
  if (business.status === "failed" || business.status === "shutdown") return;

  const def = BUSINESS_DEFINITIONS[business.type];
  business.utilisation = 0;

  // Retailer: sell finished goods / food to consumers
  if (business.type === "retailer") {
    processRetail(state, business, rng);
    return;
  }

  // Warehouse: hold inventory, occasional arbitrage sales
  if (business.type === "warehouse") {
    processWarehouse(state, business, rng);
    return;
  }

  // Bank: earn interest on float, lend to struggling NPCs lightly
  if (business.type === "bank") {
    processBank(state, business, rng);
    return;
  }

  // Logistics: contributes capacity to world logistics pool
  if (business.type === "logistics") {
    processLogistics(state, business);
    return;
  }

  if (!def.recipe) return;

  const stress = managementStress(state, business);
  // Overload creates real failure modes: missed purchases, wasted batches
  if (stress > 0 && rng.chance(Math.min(0.45, stress * 0.25))) {
    // Purchasing mistake — pay for nothing / wrong allocation
    const waste = business.cash * 0.01 * stress;
    business.cash -= waste;
    business.expenses += waste;
    state.history.unshift({
      id: `hist_${state.nextEntityId++}`,
      tick: state.tick,
      timestamp: Date.now(),
      kind: "business",
      title: "Purchasing mistake",
      detail: `${business.name} mis-ordered supplies under management strain.`,
      businessId: business.id,
    });
  }

  // Scale recipe by capacity (fractional OK)
  let cycles = business.capacity;
  if (stress > 0.2 && rng.chance(0.15 + stress * 0.2)) {
    cycles *= 0.5; // inefficient production
  }
  if (state.logisticsCapacity < 2 && rng.chance(0.2)) {
    cycles *= 0.7; // logistics constrained
  }

  const needed: Partial<Record<ResourceId, number>> = {};
  for (const [k, v] of Object.entries(def.recipe.inputs)) {
    needed[k as ResourceId] = (v ?? 0) * cycles;
  }

  buyInputs(state, business, needed);

  // Check if we can run full or partial cycles
  let runnable = cycles;
  for (const [k, v] of Object.entries(def.recipe.inputs)) {
    const per = v ?? 0;
    if (per <= 0) continue;
    runnable = Math.min(runnable, invGet(business, k as ResourceId) / per);
  }
  if (runnable < 0.05) {
    if (business.cash < business.maintenance * 5) {
      business.status = "struggling";
    }
    return;
  }

  for (const [k, v] of Object.entries(def.recipe.inputs)) {
    invAdd(business, k as ResourceId, -(v ?? 0) * runnable);
  }
  for (const [k, v] of Object.entries(def.recipe.outputs)) {
    const produced = (v ?? 0) * runnable;
    invAdd(business, k as ResourceId, produced);
    if (business.ownerKind === "player") {
      const player = state.players[business.ownerId];
      if (player) player.stats.resourcesProduced += produced;
    }
  }
  business.utilisation = runnable / Math.max(0.01, business.capacity);
  business.status = "operating";

  // Auto-sell surplus outputs (idle automation)
  for (const [k] of Object.entries(def.recipe.outputs)) {
    const resource = k as ResourceId;
    const keep = business.type === "mine" ? 2 : 1;
    const surplus = invGet(business, resource) - keep;
    if (surplus > 0.1) {
      const result = spotSell(state, business, resource, surplus);
      if (business.ownerKind === "player" && result.filled > 0) {
        const player = state.players[business.ownerId];
        if (player) {
          player.stats.resourcesSold += result.filled;
          player.stats.largestTransaction = Math.max(
            player.stats.largestTransaction,
            result.cost,
          );
        }
      }
    }
  }
}

function processRetail(state: GameState, business: Business, rng: SeededRng): void {
  const def = BUSINESS_DEFINITIONS.retailer;
  if (!def.recipe) return;
  const demandFood = 1.5 * business.capacity * (0.8 + rng.next() * 0.4);
  const demandMachines = 0.05 * business.capacity;
  const demandComponents = 0.1 * business.capacity;

  buyInputs(state, business, {
    food: demandFood,
    machines: demandMachines,
    components: demandComponents,
  });

  const sellFood = Math.min(invGet(business, "food"), demandFood);
  const sellMachines = Math.min(invGet(business, "machines"), demandMachines);
  const sellComponents = Math.min(invGet(business, "components"), demandComponents);

  const foodPrice = state.markets.food.price * 1.25;
  const machinePrice = state.markets.machines.price * 1.2;
  const componentPrice = state.markets.components.price * 1.15;

  const revenue =
    sellFood * foodPrice +
    sellMachines * machinePrice +
    sellComponents * componentPrice;

  invAdd(business, "food", -sellFood);
  invAdd(business, "machines", -sellMachines);
  invAdd(business, "components", -sellComponents);
  business.cash += revenue;
  business.revenue += revenue;
  business.utilisation = sellFood > 0 ? 1 : 0.2;
  if (sellFood > 0) business.ticksSinceSale = 0;

  // Consumer demand pressure
  recordDemand(state, "food", demandFood);
  recordDemand(state, "machines", demandMachines);
}

function processWarehouse(state: GameState, business: Business, rng: SeededRng): void {
  // Occasionally buy undervalued goods / sell overvalued
  const resources: ResourceId[] = ["copper", "iron", "food", "components"];
  const pick = resources[Math.floor(rng.next() * resources.length)]!;
  const market = state.markets[pick];
  if (!market) return;

  if (market.trend < -0.02 && business.cash > 20) {
    const qty = Math.min(5, business.cash / market.price);
    spotBuy(state, business, pick, qty);
  } else if (market.trend > 0.03 && invGet(business, pick) > 1) {
    spotSell(state, business, pick, invGet(business, pick) * 0.4);
  }
  business.utilisation = 0.5;
}

function processBank(state: GameState, business: Business, rng: SeededRng): void {
  // Interest income on cash float
  const income = business.cash * 0.0008;
  business.cash += income;
  business.revenue += income;

  // Occasional small loan to struggling NPC
  if (rng.chance(0.05)) {
    const struggling = Object.values(state.businesses).find(
      (b) =>
        b.status === "struggling" &&
        b.ownerKind === "npc" &&
        b.id !== business.id &&
        b.debt < 200,
    );
    if (struggling && business.cash > 40) {
      const loan = 25;
      business.cash -= loan;
      struggling.cash += loan;
      struggling.debt += loan * 1.1;
    }
  }
  business.utilisation = 0.6;
}

function processLogistics(state: GameState, business: Business): void {
  const energyNeed = 0.8 * business.capacity;
  buyInputs(state, business, { energy: energyNeed });
  const have = invGet(business, "energy");
  const used = Math.min(have, energyNeed);
  invAdd(business, "energy", -used);
  const contribution = (used / Math.max(0.01, energyNeed)) * business.capacity;
  state.logisticsCapacity += contribution;
  // Logistics earns fees from world activity
  const fee = contribution * 0.4;
  business.cash += fee;
  business.revenue += fee;
  business.utilisation = contribution / Math.max(0.01, business.capacity);
}
