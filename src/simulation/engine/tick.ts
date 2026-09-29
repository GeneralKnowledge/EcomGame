import {
  clearPeriodCounters,
  processFailure,
  processFinances,
} from "@/economy/businesses/finances";
import { processProduction } from "@/economy/businesses/production";
import { BUSINESS_DEFINITIONS } from "@/economy/businesses/definitions";
import { identifyConditions } from "@/events/conditions/identify";
import { maybeOfferRoll } from "@/events/economic-rolls/generator";
import {
  applyBaselineDemand,
  resetMarketTickCounters,
  updatePrices,
} from "@/markets/pricing";
import {
  recomputeManagement,
  totalOrgAssets,
} from "@/organisations/management";
import { checkAchievements } from "@/progression/achievements";
import { rankIndexForAssets } from "@/progression/ranks";
import type { GameState } from "@/simulation/engine/types";
import type { SeededRng } from "@/simulation/rng/seeded-rng";
import type { ResourceId } from "@/economy/resources/types";

function processContracts(state: GameState, rng: SeededRng): void {
  for (const contract of Object.values(state.contracts)) {
    if (contract.status !== "active") continue;
    const seller = state.businesses[contract.sellerId];
    const buyer = state.businesses[contract.buyerId];
    if (!seller || !buyer) {
      contract.status = "breached";
      continue;
    }
    if (seller.status === "failed" || seller.status === "insolvent") {
      contract.status = "breached";
      continue;
    }

    const have = seller.inventory[contract.resource] ?? 0;
    const deliver = Math.min(contract.quantityPerTick, have);
    // Contracts do not magically guarantee supply
    if (deliver < contract.quantityPerTick * 0.5) {
      seller.reputation = Math.max(0, seller.reputation - 0.02);
      if (rng.chance(0.08)) {
        contract.status = "breached";
        continue;
      }
    }
    if (deliver > 0) {
      const cost = deliver * contract.pricePerUnit;
      if (buyer.cash >= cost) {
        buyer.cash -= cost;
        seller.cash += cost;
        seller.inventory[contract.resource] = have - deliver;
        buyer.inventory[contract.resource] =
          (buyer.inventory[contract.resource] ?? 0) + deliver;
        seller.revenue += cost;
      }
    }

    contract.remainingTicks -= 1;
    if (contract.remainingTicks <= 0) {
      contract.status = "completed";
      const buyerOwner = buyer.ownerKind === "player" ? state.players[buyer.ownerId] : null;
      if (buyerOwner) buyerOwner.stats.contractsCompleted += 1;
    }
  }
}

function processNpcDecisions(state: GameState, rng: SeededRng): void {
  for (const b of Object.values(state.businesses)) {
    if (b.ownerKind !== "npc" || b.status === "failed") continue;

    // Expand when flush and market is hot
    const primary = BUSINESS_DEFINITIONS[b.type].primaryResources[0];
    if (primary && primary !== "cash") {
      const m = state.markets[primary];
      if (m && m.trend > 0.03 && b.cash > 80 && rng.chance(0.02)) {
        b.cash -= 30;
        b.capacity *= 1.08;
      }
      if (m && m.trend < -0.04 && b.capacity > 1 && rng.chance(0.03)) {
        b.capacity *= 0.95;
      }
    }

    // Borrow when struggling
    if (b.status === "struggling" && b.debt < 80 && rng.chance(0.1)) {
      b.debt += 30;
      b.cash += 25;
    }
  }
}

function processCommons(state: GameState): void {
  for (const org of Object.values(state.organisations)) {
    if (!org.inCommons) continue;
    org.commonsTicks += 1;
    org.cash += state.config.commonsRecoveryPerTick;
    if (org.cash >= state.config.commonsMaxCash) {
      org.inCommons = false;
      org.cash = state.config.commonsMaxCash;
      state.history.unshift({
        id: `hist_${state.nextEntityId++}`,
        tick: state.tick,
        timestamp: Date.now(),
        kind: "system",
        title: "Left the Commons",
        detail:
          "Minimal recovery complete. You may rebuild — slowly, and without free fortune.",
      });
    }
  }
}

function checkOrgBankruptcy(state: GameState): void {
  for (const org of Object.values(state.organisations)) {
    if (org.inCommons) continue;
    const assets = totalOrgAssets(state, org.id);
    const living = org.businessIds.filter((id) => {
      const b = state.businesses[id];
      return b && b.status !== "failed";
    });
    if (assets < -10 && living.length === 0 && org.cash < 5) {
      org.inCommons = true;
      org.commonsTicks = 0;
      org.cash = 5;
      org.debt = 0;
      const player = state.players[org.playerId];
      if (player) {
        player.stats.bankruptcies += 1;
        player.cash = 5;
      }
      state.history.unshift({
        id: `hist_${state.nextEntityId++}`,
        tick: state.tick,
        timestamp: Date.now(),
        kind: "failure",
        title: "Bankruptcy — Commons recovery",
        detail:
          "Your organisation failed. The Commons provides a slow, minimal path back. £0 is not game over.",
      });
    }
  }
}

function updateMarketShares(state: GameState): void {
  const totals: Partial<Record<ResourceId, number>> = {};
  for (const b of Object.values(state.businesses)) {
    if (b.status === "failed") continue;
    for (const [r, qty] of Object.entries(b.inventory)) {
      const id = r as ResourceId;
      totals[id] = (totals[id] ?? 0) + (qty ?? 0) + b.capacity * 0.1;
    }
  }
  for (const b of Object.values(state.businesses)) {
    if (b.status === "failed") continue;
    b.marketShare = {};
    for (const r of BUSINESS_DEFINITIONS[b.type].primaryResources) {
      const total = totals[r] ?? 0;
      const own = (b.inventory[r] ?? 0) + b.capacity * 0.1;
      b.marketShare[r] = total > 0 ? own / total : 0;
      if (b.ownerKind === "player") {
        const p = state.players[b.ownerId];
        if (p) {
          p.stats.highestMarketShare = Math.max(
            p.stats.highestMarketShare,
            b.marketShare[r] ?? 0,
          );
        }
      }
    }
  }
}

function sweepProfits(state: GameState): void {
  for (const org of Object.values(state.organisations)) {
    for (const bid of org.businessIds) {
      const b = state.businesses[bid];
      if (!b || b.status === "failed") continue;
      // Light treasury sweep
      if (b.cash > 60 && state.tick % 10 === 0) {
        const sweep = (b.cash - 50) * 0.1;
        b.cash -= sweep;
        org.cash += sweep;
      }
      // Org debt interest
    }
    if (org.debt > 0) {
      const interest = org.debt * state.config.debtInterestPerTick * 60;
      org.cash -= interest;
      if (org.cash > org.debt + 20) {
        const repay = Math.min(org.debt, org.cash * 0.03);
        org.cash -= repay;
        org.debt -= repay;
      }
    }
    const player = state.players[org.playerId];
    if (player) {
      player.cash = org.cash;
      player.rankIndex = rankIndexForAssets(totalOrgAssets(state, org.id));
    }
  }
}

function expireRolls(state: GameState): void {
  for (const roll of Object.values(state.pendingRolls)) {
    if (roll.phase === "resolved" || roll.phase === "expired") continue;
    if (state.tick - roll.createdTick > state.config.economicRollExpiryTicks) {
      roll.phase = "expired";
      const player = state.players[roll.playerId];
      if (player && player.pendingRollId === roll.id) {
        player.pendingRollId = null;
      }
    }
  }
}

/**
 * Advance the simulation by one tick (1 simulated minute by default).
 * Modular pipeline — order matters for emergent cascades.
 */
export function tick(state: GameState, rng: SeededRng): void {
  state.tick += 1;

  for (const b of Object.values(state.businesses)) {
    clearPeriodCounters(b);
  }

  resetMarketTickCounters(state);
  state.logisticsCapacity = Math.max(1, state.logisticsCapacity * 0.92);
  applyBaselineDemand(state);

  // 1–3 production / consumption / logistics (embedded in production)
  const businesses = Object.values(state.businesses);
  for (const b of businesses) {
    processProduction(state, b, rng);
  }

  // 4 contracts / market transactions
  processContracts(state, rng);

  // 5–6 inventory implicit; pricing
  updatePrices(state);

  // 7–8 finances & debt
  for (const b of businesses) {
    processFinances(state, b, rng);
  }

  // 9 maintenance folded into finances

  // 10 NPC decisions
  processNpcDecisions(state, rng);

  // 11 failures
  for (const b of businesses) {
    processFailure(state, b, rng);
  }

  updateMarketShares(state);

  for (const org of Object.values(state.organisations)) {
    recomputeManagement(state, org.id);
  }

  sweepProfits(state);
  processCommons(state);
  checkOrgBankruptcy(state);

  // 12–13 conditions & economic roll eligibility
  identifyConditions(state);
  expireRolls(state);
  for (const player of Object.values(state.players)) {
    maybeOfferRoll(state, player.id, rng);
    checkAchievements(state, player.id);
  }

  // Trim history
  if (state.history.length > 200) {
    state.history.length = 200;
  }
}

export function tickMany(state: GameState, rng: SeededRng, count: number): void {
  for (let i = 0; i < count; i++) {
    tick(state, rng);
  }
}
