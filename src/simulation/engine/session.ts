import { SeededRng } from "@/simulation/rng/seeded-rng";
import { createInitialState } from "@/simulation/engine/initial-state";
import { tick, tickMany } from "@/simulation/engine/tick";
import type { GameState, ReturnSummary } from "@/simulation/engine/types";
import {
  captureLeaveSnapshot,
  simulateOffline,
} from "@/simulation/offline/offline-sim";
import { loadGame, saveGame } from "@/persistence/save";
import type { BusinessType } from "@/economy/businesses/types";
import type { ResponseAction } from "@/simulation/engine/types";
import {
  chooseDevelopment,
  forceEconomicRoll,
  foundBusiness,
  setRollRevealed,
  tryHireManager,
} from "@/players/actions";

export class GameSession {
  state: GameState;
  rng: SeededRng;
  returnSummary: ReturnSummary | null = null;

  constructor(state?: GameState, rngState?: number) {
    this.state = state ?? createInitialState(42);
    this.rng = new SeededRng(rngState ?? this.state.seed);
  }

  static boot(): GameSession {
    const loaded = loadGame();
    if (loaded) {
      const session = new GameSession(loaded.state, loaded.state.seed + loaded.state.tick);
      // Advance offline
      const elapsed = Date.now() - loaded.savedAt;
      loaded.state.snapshotOnLeave =
        loaded.state.snapshotOnLeave ??
        captureLeaveSnapshot(loaded.state, "player_1");
      session.returnSummary = simulateOffline(
        session.state,
        session.rng,
        "player_1",
        elapsed,
        session.state.config.liveTickMs,
      );
      return session;
    }
    return new GameSession();
  }

  step(n = 1): void {
    tickMany(this.state, this.rng, n);
  }

  stepOne(): void {
    tick(this.state, this.rng);
  }

  persist(): void {
    this.state.snapshotOnLeave = captureLeaveSnapshot(this.state, "player_1");
    saveGame(this.state);
  }

  found(type: BusinessType, name?: string) {
    return foundBusiness(this.state, "player_1", type, name);
  }

  hireManager() {
    return tryHireManager(this.state, "player_1");
  }

  requestRoll() {
    forceEconomicRoll(this.state, "player_1", this.rng);
  }

  reveal(rollId: string) {
    setRollRevealed(this.state, rollId);
  }

  decide(rollId: string, developmentId: string, response: ResponseAction) {
    return chooseDevelopment(
      this.state,
      rollId,
      developmentId,
      response,
      this.rng,
    );
  }

  dismissReturnSummary() {
    this.returnSummary = null;
  }

  reset(seed?: number) {
    this.state = createInitialState(seed ?? (Date.now() % 1_000_000));
    this.rng = new SeededRng(this.state.seed);
    this.returnSummary = null;
    saveGame(this.state);
  }
}
