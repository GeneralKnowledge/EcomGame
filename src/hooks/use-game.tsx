"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { GameSession } from "@/simulation/engine/session";
import type { GameState, ReturnSummary } from "@/simulation/engine/types";
import type { BusinessType } from "@/economy/businesses/types";
import type { ResponseAction } from "@/simulation/engine/types";

type TabId =
  | "dashboard"
  | "businesses"
  | "markets"
  | "organisation"
  | "roll"
  | "history";

interface GameStore {
  session: GameSession | null;
  state: GameState | null;
  returnSummary: ReturnSummary | null;
  tab: TabId;
  paused: boolean;
  tickVersion: number;
  setTab: (tab: TabId) => void;
  setPaused: (paused: boolean) => void;
  found: (type: BusinessType, name?: string) => { ok: boolean; message: string };
  hireManager: () => { ok: boolean; message: string };
  requestRoll: () => void;
  reveal: (rollId: string) => void;
  decide: (
    rollId: string,
    developmentId: string,
    response: ResponseAction,
  ) => string[];
  dismissReturnSummary: () => void;
  reset: () => void;
  advance: (n?: number) => void;
}

const GameContext = createContext<GameStore | null>(null);

function subscribeNoop() {
  return () => {};
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [tickVersion, setTickVersion] = useState(0);
  const [tab, setTab] = useState<TabId>("dashboard");
  const [paused, setPaused] = useState(false);
  const [returnSummary, setReturnSummary] = useState<ReturnSummary | null>(null);

  const ready = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!ready || session) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const next = GameSession.boot();
      setSession(next);
      setReturnSummary(next.returnSummary);
      setTickVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, session]);

  useEffect(() => {
    if (!session) return;
    const id = window.setInterval(() => {
      if (paused) return;
      session.stepOne();
      setTickVersion((v) => v + 1);
    }, session.state.config.liveTickMs);
    return () => window.clearInterval(id);
  }, [session, paused]);

  useEffect(() => {
    if (!session) return;
    const onHide = () => {
      session.persist();
    };
    window.addEventListener("beforeunload", onHide);
    const onVis = () => {
      if (document.visibilityState === "hidden") onHide();
    };
    document.addEventListener("visibilitychange", onVis);
    const saveId = window.setInterval(() => session.persist(), 15000);
    return () => {
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(saveId);
    };
  }, [session]);

  const bump = useCallback(() => setTickVersion((v) => v + 1), []);

  const store: GameStore = {
    session,
    state: session?.state ?? null,
    returnSummary,
    tab,
    paused,
    tickVersion,
    setTab,
    setPaused,
    found: (type, name) => {
      const r = session?.found(type, name) ?? { ok: false, message: "Not ready" };
      bump();
      return r;
    },
    hireManager: () => {
      const r = session?.hireManager() ?? { ok: false, message: "Not ready" };
      bump();
      return r;
    },
    requestRoll: () => {
      session?.requestRoll();
      setTab("roll");
      bump();
    },
    reveal: (rollId) => {
      session?.reveal(rollId);
      bump();
    },
    decide: (rollId, developmentId, response) => {
      const notes = session?.decide(rollId, developmentId, response) ?? [];
      bump();
      return notes;
    },
    dismissReturnSummary: () => {
      session?.dismissReturnSummary();
      setReturnSummary(null);
    },
    reset: () => {
      session?.reset();
      setReturnSummary(null);
      setTab("dashboard");
      bump();
    },
    advance: (n = 1) => {
      session?.step(n);
      bump();
    },
  };

  return <GameContext.Provider value={store}>{children}</GameContext.Provider>;
}

export function useGame(): GameStore {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
