"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/hooks/use-game";
import { RESPONSE_LABELS } from "@/events/economic-rolls/resolution";
import type { PresentedDevelopment, ResponseAction } from "@/simulation/engine/types";

type Phase = "idle" | "anticipating" | "revealed" | "aftermath";

export function EconomicRollView() {
  const { state, reveal, decide, requestRoll, tickVersion } = useGame();
  const [phase, setPhase] = useState<Phase>("idle");
  const [selected, setSelected] = useState<PresentedDevelopment | null>(null);
  const [aftermath, setAftermath] = useState<string[]>([]);
  const [spinKey, setSpinKey] = useState(0);

  void tickVersion;

  const player = state?.players.player_1;
  const rollId = player?.pendingRollId ?? null;
  const roll = rollId && state ? state.pendingRolls[rollId] ?? null : null;
  const rollPhase = roll?.phase ?? null;

  useEffect(() => {
    if (!rollId || !rollPhase) {
      queueMicrotask(() => {
        setPhase((p) => (p === "aftermath" ? p : "idle"));
        setSelected(null);
      });
      return;
    }

    if (rollPhase === "anticipating") {
      queueMicrotask(() => {
        setPhase("anticipating");
        setSpinKey((k) => k + 1);
      });
      const t = window.setTimeout(() => {
        reveal(rollId);
        setPhase("revealed");
      }, 2200);
      return () => window.clearTimeout(t);
    }

    if (rollPhase === "revealed") {
      queueMicrotask(() => setPhase("revealed"));
    }
  }, [rollId, rollPhase, reveal]);

  if (!state || !player) {
    return <p className="empty-note">Initialising…</p>;
  }

  const onChoose = (dev: PresentedDevelopment, response: ResponseAction) => {
    if (!roll) return;
    const notes = decide(roll.id, dev.instanceId, response);
    setAftermath(notes);
    setSelected(dev);
    setPhase("aftermath");
  };

  return (
    <div className="view roll-view">
      <section className="hero-strip">
        <div>
          <p className="eyebrow">Market developing</p>
          <h1 className="view-title">Economic Roll</h1>
          <p className="lede">
            Anticipation → reveal → decision → consequence. Not a wager — a situation.
          </p>
        </div>
      </section>

      {phase === "idle" && !roll ? (
        <section className="panel roll-idle">
          <div className="terminal-frame">
            <p className="terminal-line">No pending development.</p>
            <p className="terminal-line muted">
              Operate your businesses. The economy scans periodically.
            </p>
            <button type="button" className="btn primary" onClick={() => requestRoll()}>
              Request market scan
            </button>
          </div>
        </section>
      ) : null}

      {phase === "anticipating" ? (
        <section className="panel anticipation" key={spinKey}>
          <div className="terminal-frame anticipate">
            <p className="terminal-title">MARKET DEVELOPING</p>
            <div className="reel-row" aria-hidden>
              <span className="reel-cell spinning">▣</span>
              <span className="reel-cell spinning delay-1">▣</span>
              <span className="reel-cell spinning delay-2">▣</span>
            </div>
            <p className="processing">PROCESSING…</p>
            <div className="scan-bar">
              <div className="scan-fill" />
            </div>
          </div>
        </section>
      ) : null}

      {phase === "revealed" && roll ? (
        <section className="reveal-grid">
          <p className="reveal-heading">THREE DEVELOPMENTS</p>
          {roll.developments.map((dev, i) => (
            <article
              key={dev.instanceId}
              className={`dev-card rarity-${dev.rarity} reveal-in`}
              style={{ animationDelay: `${i * 0.18}s` }}
            >
              <header>
                <span className="cat">{dev.category}</span>
                <span className="rar">{dev.rarity.replace("_", " ")}</span>
              </header>
              <h2>{dev.title}</h2>
              <p>{dev.description}</p>
              {dev.relevanceScore <= 0 ? (
                <p className="relevance muted">May be peripheral to your operation.</p>
              ) : (
                <p className="relevance">Touches your current exposure.</p>
              )}
              <div className="response-row">
                {dev.responses.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className="btn secondary compact"
                    onClick={() => onChoose(dev, r)}
                  >
                    {RESPONSE_LABELS[r]}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {phase === "aftermath" ? (
        <section className="panel aftermath">
          <p className="terminal-title">CONSEQUENCES</p>
          {selected ? <h2>{selected.title}</h2> : null}
          <ul>
            {aftermath.map((n, i) => (
              <li key={`${i}-${n}`}>{n}</li>
            ))}
          </ul>
          <p className="muted">
            Watch the markets and businesses — the simulation continues.
          </p>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              setPhase("idle");
              setAftermath([]);
              setSelected(null);
            }}
          >
            Return to operations
          </button>
        </section>
      ) : null}
    </div>
  );
}
