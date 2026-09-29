/** Simulation and Economic Roll cadence — all configurable. */
export interface SimulationConfig {
  /** Simulated minutes per tick */
  minutesPerTick: number;
  /** Real ms between live ticks when running */
  liveTickMs: number;
  /** Ticks between Economic Roll eligibility checks */
  economicRollCheckInterval: number;
  /** Base chance per check that a roll becomes available */
  economicRollBaseChance: number;
  /** Minimum ticks between rolls for a player */
  economicRollMinCooldown: number;
  /** Maximum ticks a pending roll waits before auto-expiring options */
  economicRollExpiryTicks: number;
  /** Number of developments revealed per roll */
  developmentsPerRoll: number;
  /** Base management capacity */
  baseManagementCapacity: number;
  /** Interest rate per tick on debt (very small) */
  debtInterestPerTick: number;
  /** Commons recovery cash per tick while in commons */
  commonsRecoveryPerTick: number;
  /** Max commons cash balance before graduation */
  commonsMaxCash: number;
  /** Starting player cash */
  startingCash: number;
  /** Price adjustment speed (0–1) */
  priceAdjustmentRate: number;
  /** Soft floor / ceiling multipliers vs base price */
  priceFloorMultiplier: number;
  priceCeilingMultiplier: number;
}

export const DEFAULT_CONFIG: SimulationConfig = {
  minutesPerTick: 1,
  liveTickMs: 1000,
  economicRollCheckInterval: 45,
  economicRollBaseChance: 0.55,
  economicRollMinCooldown: 30,
  economicRollExpiryTicks: 120,
  developmentsPerRoll: 3,
  baseManagementCapacity: 10,
  debtInterestPerTick: 0.00002,
  commonsRecoveryPerTick: 0.15,
  commonsMaxCash: 80,
  startingCash: 100,
  priceAdjustmentRate: 0.04,
  priceFloorMultiplier: 0.4,
  priceCeilingMultiplier: 3.5,
};
