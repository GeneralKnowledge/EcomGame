import { TRADEABLE_RESOURCES } from "@/economy/resources/definitions";
import type { ResourceId } from "@/economy/resources/types";
import { tickMany } from "@/simulation/engine/tick";
import type {
  GameState,
  LeaveSnapshot,
  ReturnSummary,
} from "@/simulation/engine/types";
import { SeededRng } from "@/simulation/rng/seeded-rng";

export function captureLeaveSnapshot(
  state: GameState,
  playerId: string,
): LeaveSnapshot {
  const player = state.players[playerId]!;
  const org = state.organisations[player.organisationId]!;
  const prices: Partial<Record<ResourceId, number>> = {};
  for (const r of TRADEABLE_RESOURCES) {
    prices[r] = state.markets[r]?.price ?? 0;
  }
  const businessStatuses: Record<string, string> = {};
  const inventoryTotals: Partial<Record<ResourceId, number>> = {};
  for (const bid of org.businessIds) {
    const b = state.businesses[bid];
    if (!b) continue;
    businessStatuses[bid] = b.status;
    for (const [r, q] of Object.entries(b.inventory)) {
      const id = r as ResourceId;
      inventoryTotals[id] = (inventoryTotals[id] ?? 0) + (q ?? 0);
    }
  }
  return {
    tick: state.tick,
    realMs: Date.now(),
    prices,
    playerCash: org.cash,
    playerRevenue: player.stats.totalRevenue,
    playerProfit: player.stats.totalProfit,
    businessStatuses,
    inventoryTotals,
  };
}

export function buildReturnSummary(
  state: GameState,
  playerId: string,
  before: LeaveSnapshot,
): ReturnSummary {
  const player = state.players[playerId]!;
  const org = state.organisations[player.organisationId]!;

  const priceChanges = TRADEABLE_RESOURCES.map((r) => {
    const prev = before.prices[r] ?? 0;
    const now = state.markets[r]?.price ?? 0;
    const percent = prev > 0 ? ((now - prev) / prev) * 100 : 0;
    return { resource: r, percent };
  }).filter((p) => Math.abs(p.percent) >= 1);

  const businessNotes: string[] = [];
  for (const bid of org.businessIds) {
    const b = state.businesses[bid];
    if (!b) continue;
    const prev = before.businessStatuses[bid];
    if (prev && prev !== b.status) {
      businessNotes.push(`${b.name}: ${prev} → ${b.status}`);
    }
  }

  const marketNotes: string[] = [];
  const failedNpcs = Object.values(state.businesses).filter(
    (b) =>
      b.ownerKind === "npc" &&
      b.status === "failed" &&
      (b.failedTick ?? 0) > before.tick,
  );
  for (const f of failedNpcs.slice(0, 3)) {
    marketNotes.push(`NPC competitor bankrupt: ${f.name}`);
  }

  for (const r of TRADEABLE_RESOURCES) {
    const prevInv = before.inventoryTotals[r] ?? 0;
    let nowInv = 0;
    for (const bid of org.businessIds) {
      nowInv += state.businesses[bid]?.inventory[r] ?? 0;
    }
    if (prevInv > 0.5) {
      const pct = ((nowInv - prevInv) / prevInv) * 100;
      if (Math.abs(pct) >= 10) {
        marketNotes.push(`${r} inventory ${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`);
      }
    }
  }

  const highlights: string[] = [];
  if (priceChanges[0]) {
    const top = [...priceChanges].sort(
      (a, b) => Math.abs(b.percent) - Math.abs(a.percent),
    )[0]!;
    highlights.push(
      `${top.resource} price ${top.percent >= 0 ? "+" : ""}${top.percent.toFixed(0)}%`,
    );
  }
  const revenueDelta = player.stats.totalRevenue - before.playerRevenue;
  if (revenueDelta !== 0) {
    highlights.push(`Revenue ${revenueDelta >= 0 ? "+" : ""}£${revenueDelta.toFixed(0)}`);
  }

  return {
    ticksSimulated: state.tick - before.tick,
    priceChanges,
    revenueDelta,
    profitDelta: player.stats.totalProfit - before.playerProfit,
    businessNotes,
    marketNotes,
    rollAvailable: !!player.pendingRollId,
    highlights,
  };
}

/**
 * Simulate the living economy for elapsed real time.
 * NOT incomePerSecond × elapsedTime — full tick pipeline.
 */
export function simulateOffline(
  state: GameState,
  rng: SeededRng,
  playerId: string,
  elapsedRealMs: number,
  liveTickMs: number,
): ReturnSummary | null {
  const snapshot = state.snapshotOnLeave ?? captureLeaveSnapshot(state, playerId);
  const ticks = Math.min(5000, Math.floor(elapsedRealMs / liveTickMs));
  if (ticks <= 0) {
    state.snapshotOnLeave = null;
    return null;
  }
  tickMany(state, rng, ticks);
  const summary = buildReturnSummary(state, playerId, snapshot);
  state.snapshotOnLeave = null;
  const player = state.players[playerId];
  if (player) {
    player.lastSeenTick = state.tick;
    player.lastSeenRealMs = Date.now();
  }
  return summary;
}
