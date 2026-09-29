import { BUSINESS_DEFINITIONS } from "./definitions";
import type { Business } from "./types";
import type { GameState } from "@/simulation/engine/types";
import type { SeededRng } from "@/simulation/rng/seeded-rng";

export function processFinances(
  state: GameState,
  business: Business,
  rng: SeededRng,
): void {
  if (business.status === "failed") return;

  const def = BUSINESS_DEFINITIONS[business.type];
  const wage = business.employees * 0.15;
  let maintenance = def.maintenancePerTick * (0.9 + business.capacity * 0.05);

  // Management overload → maintenance delays (real deferred cost buildup)
  if (business.ownerKind === "player") {
    const org = Object.values(state.organisations).find(
      (o) => o.playerId === business.ownerId,
    );
    if (org && org.managementLoad > org.managementCapacity) {
      const stress =
        org.managementLoad / Math.max(1, org.managementCapacity) - 1;
      if (rng.chance(Math.min(0.4, stress * 0.2))) {
        // Delay: skip this tick but accumulate backlog as higher future cost
        business.maintenance += maintenance * 0.5;
        maintenance = 0;
      } else {
        maintenance += business.maintenance * 0.1;
        business.maintenance = def.maintenancePerTick;
      }
    }
  }

  const interest = business.debt * state.config.debtInterestPerTick * 60;
  business.interestAccrued += interest;

  const expenses = wage + maintenance + interest;
  business.expenses += expenses;
  business.cash -= expenses;

  // Auto debt repayment when flush
  if (business.debt > 0 && business.cash > business.debt + 30) {
    const repay = Math.min(business.debt, business.cash * 0.05);
    business.cash -= repay;
    business.debt -= repay;
  }

  business.profit = business.revenue - business.expenses;
  business.lifetimeRevenue += business.revenue;
  business.lifetimeProfit += business.profit;
  business.ticksSinceSale += 1;

  if (business.ownerKind === "player") {
    const player = state.players[business.ownerId];
    if (player) {
      player.stats.totalRevenue += business.revenue;
      if (business.profit >= 0) player.stats.totalProfit += business.profit;
      else player.stats.totalLoss += -business.profit;
      player.stats.largestDebt = Math.max(player.stats.largestDebt, business.debt);
    }
  }

  // Reset period counters after finance pass (revenue/expenses are per-tick accumulators)
  // Keep them for UI until next tick start clears them in tick.ts
}

export function clearPeriodCounters(business: Business): void {
  business.revenue = 0;
  business.expenses = 0;
  business.profit = 0;
}

export function processFailure(
  state: GameState,
  business: Business,
  rng: SeededRng,
): void {
  if (business.status === "failed") return;

  if (business.cash < -20 || (business.cash < 0 && business.debt > 150)) {
    business.status = "insolvent";
  }

  if (business.status === "insolvent") {
    // Attempt restructuring: sell inventory, take emergency debt once
    if (business.debt < 100 && rng.chance(0.3)) {
      business.debt += 40;
      business.cash += 35;
      business.status = "struggling";
      return;
    }

    business.status = "failed";
    business.failedTick = state.tick;
    business.capacity = 0;

    state.history.unshift({
      id: `hist_${state.nextEntityId++}`,
      tick: state.tick,
      timestamp: Date.now(),
      kind: "failure",
      title: `${business.name} failed`,
      detail: `${business.name} became insolvent and ceased operations.`,
      businessId: business.id,
    });

    if (business.ownerKind === "player") {
      const player = state.players[business.ownerId];
      if (player) player.stats.businessesFailed += 1;
    }

    // Breach contracts
    for (const cid of business.contracts) {
      const c = state.contracts[cid];
      if (c && c.status === "active") {
        c.status = "breached";
        if (c.buyerId.startsWith("player") || state.players[c.buyerId]) {
          const p = state.players[c.buyerId];
          if (p) p.stats.contractsFailed += 1;
        }
      }
    }
  }

  if (
    business.status === "struggling" &&
    business.cash > 20 &&
    business.ticksSinceSale < 30
  ) {
    business.status = "operating";
  }
}
