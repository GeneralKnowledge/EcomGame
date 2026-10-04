/**
 * Determinism smoke test for the simulation engine.
 * Run: npx tsx scripts/sim-smoke.ts
 */
import { createInitialState } from "../src/simulation/engine/initial-state";
import { tickMany } from "../src/simulation/engine/tick";
import { SeededRng } from "../src/simulation/rng/seeded-rng";
import { foundBusiness } from "../src/players/actions";
import { generateEconomicRoll } from "../src/events/economic-rolls/generator";
import { resolveEconomicRoll } from "../src/events/economic-rolls/resolution";

function fingerprint(state: ReturnType<typeof createInitialState>): string {
  const prices = Object.values(state.markets)
    .map((m) => `${m.resource}:${m.price.toFixed(3)}`)
    .join("|");
  const biz = Object.values(state.businesses)
    .map((b) => `${b.id}:${b.cash.toFixed(2)}:${b.status}:${b.capacity.toFixed(2)}`)
    .join("|");
  return `t${state.tick}#${prices}#${biz}`;
}

function run(seed: number) {
  const state = createInitialState(seed);
  const rng = new SeededRng(seed);
  foundBusiness(state, "player_1", "mine", "Test Mine");
  tickMany(state, rng, 120);
  generateEconomicRoll(state, "player_1", rng);
  const player = state.players.player_1!;
  const roll = state.pendingRolls[player.pendingRollId!]!;
  const dev = roll.developments[0]!;
  resolveEconomicRoll(state, roll.id, dev.instanceId, dev.responses[0]!, rng);
  tickMany(state, rng, 60);
  return fingerprint(state);
}

const a = run(12345);
const b = run(12345);
const c = run(99999);

if (a !== b) {
  console.error("FAIL: same seed produced different results");
  console.error(a);
  console.error(b);
  process.exit(1);
}

if (a === c) {
  console.error("FAIL: different seeds produced identical results (suspicious)");
  process.exit(1);
}

console.log("OK: deterministic simulation");
console.log(a.slice(0, 120) + "…");
