import { createBusiness } from "@/economy/businesses/create";
import type { BusinessType } from "@/economy/businesses/types";
import { createAllMarkets } from "@/markets/pricing";
import { DEFAULT_CONFIG } from "@/simulation/engine/config";
import type { GameState, PlayerStats } from "@/simulation/engine/types";

function emptyStats(): PlayerStats {
  return {
    totalRevenue: 0,
    totalProfit: 0,
    totalLoss: 0,
    businessesFounded: 0,
    businessesFailed: 0,
    businessesAcquired: 0,
    contractsCompleted: 0,
    contractsFailed: 0,
    resourcesProduced: 0,
    resourcesPurchased: 0,
    resourcesSold: 0,
    largestTransaction: 0,
    largestDebt: 0,
    highestMarketShare: 0,
    bankruptcies: 0,
    economicRolls: 0,
    rareEvents: 0,
  };
}

const NPC_SEED: Array<{ type: BusinessType; name: string; scale: number; cash: number }> = [
  { type: "mine", name: "Northridge Copper Mine", scale: 1.0, cash: 80 },
  { type: "mine", name: "Red Vein Iron Works", scale: 0.9, cash: 70 },
  { type: "farm", name: "Greenfield Collective", scale: 1.2, cash: 40 },
  { type: "farm", name: "Riverbend Orchards", scale: 1.0, cash: 35 },
  { type: "power_plant", name: "Cascade Energy", scale: 1.4, cash: 100 },
  { type: "power_plant", name: "Harbour Turbines", scale: 1.0, cash: 70 },
  { type: "smelter", name: "Alloy Gate Smelter", scale: 1.5, cash: 90 },
  { type: "factory", name: "Precision Machine Co.", scale: 1.4, cash: 110 },
  { type: "warehouse", name: "Central Bonded Stores", scale: 1.0, cash: 50 },
  { type: "warehouse", name: "Dockside Holdings", scale: 1.0, cash: 45 },
  { type: "retailer", name: "Mercantile Hall", scale: 1.5, cash: 55 },
  { type: "retailer", name: "Corner Provisions", scale: 1.0, cash: 30 },
  { type: "bank", name: "Municipal Credit Bank", scale: 1.0, cash: 300 },
  { type: "logistics", name: "Overland Freight", scale: 1.2, cash: 60 },
  { type: "logistics", name: "Coastal Haulage", scale: 1.0, cash: 50 },
  { type: "smelter", name: "Eastworks Refining", scale: 1.2, cash: 85 },
  { type: "factory", name: "Harbour Assembly", scale: 1.1, cash: 95 },
];

export function createInitialState(seed = 42): GameState {
  const state: GameState = {
    version: 1,
    seed,
    tick: 0,
    config: { ...DEFAULT_CONFIG },
    markets: createAllMarkets(),
    businesses: {},
    contracts: {},
    organisations: {},
    players: {},
    history: [],
    pendingRolls: {},
    nextEntityId: 1,
    logisticsCapacity: 6,
    worldConditions: [],
    snapshotOnLeave: null,
  };

  // NPC world exists before the player
  for (const npc of NPC_SEED) {
    createBusiness(state, {
      type: npc.type,
      ownerId: "npc_world",
      ownerKind: "npc",
      name: npc.name,
      cash: npc.cash,
      capacityScale: npc.scale,
      region: "Central",
    });
  }

  // Player organisation
  const playerId = "player_1";
  const orgId = "org_1";
  state.organisations[orgId] = {
    id: orgId,
    playerId,
    name: "Your Concern",
    businessIds: [],
    managementCapacity: state.config.baseManagementCapacity,
    managementLoad: 0,
    managersHired: 0,
    cash: state.config.startingCash,
    debt: 0,
    inCommons: false,
    commonsTicks: 0,
  };

  state.players[playerId] = {
    id: playerId,
    name: "Founder",
    organisationId: orgId,
    cash: state.config.startingCash,
    rankIndex: 0,
    lastRollTick: -999,
    pendingRollId: null,
    stats: emptyStats(),
    achievements: [],
    lastSeenTick: 0,
    lastSeenRealMs: Date.now(),
  };

  state.history.unshift({
    id: `hist_${state.nextEntityId++}`,
    tick: 0,
    timestamp: Date.now(),
    kind: "system",
    title: "Economy online",
    detail:
      "NPC infrastructure is operating. You begin with £100 and no businesses.",
  });

  return state;
}
