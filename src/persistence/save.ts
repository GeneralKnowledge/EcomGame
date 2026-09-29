import type { GameState } from "@/simulation/engine/types";
import { createInitialState } from "@/simulation/engine/initial-state";

const STORAGE_KEY = "ecomgame_save_v1";

export function saveGame(state: GameState): void {
  if (typeof window === "undefined") return;
  try {
    const payload = JSON.stringify({
      state,
      savedAt: Date.now(),
    });
    localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    // ignore quota errors in prototype
  }
}

export function loadGame(): { state: GameState; savedAt: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state: GameState; savedAt: number };
    if (!parsed.state || parsed.state.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function newGame(seed?: number): GameState {
  clearSave();
  return createInitialState(seed ?? (Date.now() % 1_000_000));
}
