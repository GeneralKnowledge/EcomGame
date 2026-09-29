"use client";

import { useGame } from "@/hooks/use-game";

export function HistoryView() {
  const { state, tickVersion } = useGame();
  void tickVersion;
  if (!state) return null;

  return (
    <div className="view">
      <section className="hero-strip">
        <div>
          <p className="eyebrow">Record</p>
          <h1 className="view-title">History</h1>
          <p className="lede">Decisions, failures, rolls, and market shocks.</p>
        </div>
      </section>

      <section className="panel">
        <ul className="history-full">
          {state.history.map((h) => (
            <li key={h.id} className={`kind-${h.kind}`}>
              <div className="hist-meta">
                <span className="mono">t{h.tick}</span>
                <span className="kind">{h.kind}</span>
              </div>
              <strong>{h.title}</strong>
              <p>{h.detail}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
