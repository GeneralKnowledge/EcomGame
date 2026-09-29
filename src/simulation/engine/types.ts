import type { ResourceId } from "@/economy/resources/types";
import type { Business, Contract } from "@/economy/businesses/types";
import type { SimulationConfig } from "@/simulation/engine/config";

export type EventCategory =
  | "RESOURCE"
  | "SUPPLY"
  | "DEMAND"
  | "PRICE"
  | "FINANCE"
  | "LOGISTICS"
  | "TECHNOLOGY"
  | "INDUSTRY"
  | "COMPETITION"
  | "ACQUISITION"
  | "CONSUMPTION"
  | "INFRASTRUCTURE";

export type EventRarity =
  | "COMMON"
  | "UNCOMMON"
  | "RARE"
  | "VERY_RARE"
  | "EXCEPTIONAL";

export type ResponseAction =
  | "invest"
  | "stockpile"
  | "ignore"
  | "investigate"
  | "expand"
  | "adapt"
  | "acquire"
  | "contract"
  | "hedge"
  | "shutdown_line"
  | "borrow"
  | "divert";

export interface MarketState {
  resource: ResourceId;
  supply: number;
  demand: number;
  price: number;
  inventory: number;
  priceHistory: number[];
  transactionVolume: number;
  participants: number;
  trend: number;
}

export interface HistoryEntry {
  id: string;
  tick: number;
  timestamp: number;
  kind:
    | "market"
    | "business"
    | "roll"
    | "decision"
    | "failure"
    | "achievement"
    | "finance"
    | "system";
  title: string;
  detail: string;
  resource?: ResourceId;
  businessId?: string;
}

export interface AchievementRecord {
  id: string;
  unlockedTick: number;
  title: string;
}

export interface PlayerStats {
  totalRevenue: number;
  totalProfit: number;
  totalLoss: number;
  businessesFounded: number;
  businessesFailed: number;
  businessesAcquired: number;
  contractsCompleted: number;
  contractsFailed: number;
  resourcesProduced: number;
  resourcesPurchased: number;
  resourcesSold: number;
  largestTransaction: number;
  largestDebt: number;
  highestMarketShare: number;
  bankruptcies: number;
  economicRolls: number;
  rareEvents: number;
}

export interface EconomicCondition {
  id: string;
  resource?: ResourceId;
  severity: number;
  label: string;
}

export interface DevelopmentTemplate {
  id: string;
  title: string;
  category: EventCategory;
  rarity: EventRarity;
  description: string;
  /** Resources this development relates to (empty = global) */
  resources: ResourceId[];
  responses: ResponseAction[];
  /** Soft tags for contextual weighting */
  tags: string[];
}

export interface PresentedDevelopment {
  instanceId: string;
  templateId: string;
  title: string;
  category: EventCategory;
  rarity: EventRarity;
  description: string;
  resources: ResourceId[];
  responses: ResponseAction[];
  relevanceScore: number;
}

export interface PendingEconomicRoll {
  id: string;
  playerId: string;
  createdTick: number;
  phase: "anticipating" | "revealed" | "resolved" | "expired";
  developments: PresentedDevelopment[];
  chosenInstanceId: string | null;
  chosenResponse: ResponseAction | null;
}

export interface Organisation {
  id: string;
  playerId: string;
  name: string;
  businessIds: string[];
  managementCapacity: number;
  managementLoad: number;
  managersHired: number;
  cash: number;
  debt: number;
  inCommons: boolean;
  commonsTicks: number;
}

export interface PlayerState {
  id: string;
  name: string;
  organisationId: string;
  cash: number;
  rankIndex: number;
  lastRollTick: number;
  pendingRollId: string | null;
  stats: PlayerStats;
  achievements: AchievementRecord[];
  lastSeenTick: number;
  lastSeenRealMs: number;
}

export interface ReturnSummary {
  ticksSimulated: number;
  priceChanges: Array<{ resource: ResourceId; percent: number }>;
  revenueDelta: number;
  profitDelta: number;
  businessNotes: string[];
  marketNotes: string[];
  rollAvailable: boolean;
  highlights: string[];
}

export interface GameState {
  version: number;
  seed: number;
  tick: number;
  config: SimulationConfig;
  markets: Record<ResourceId, MarketState>;
  businesses: Record<string, Business>;
  contracts: Record<string, Contract>;
  organisations: Record<string, Organisation>;
  players: Record<string, PlayerState>;
  history: HistoryEntry[];
  pendingRolls: Record<string, PendingEconomicRoll>;
  nextEntityId: number;
  logisticsCapacity: number;
  worldConditions: EconomicCondition[];
  /** For return summary comparison */
  snapshotOnLeave: LeaveSnapshot | null;
}

export interface LeaveSnapshot {
  tick: number;
  realMs: number;
  prices: Partial<Record<ResourceId, number>>;
  playerCash: number;
  playerRevenue: number;
  playerProfit: number;
  businessStatuses: Record<string, string>;
  inventoryTotals: Partial<Record<ResourceId, number>>;
}
