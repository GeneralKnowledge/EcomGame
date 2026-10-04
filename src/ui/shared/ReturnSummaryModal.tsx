"use client";

import { useGame } from "@/hooks/use-game";
import { RESOURCES } from "@/economy/resources/definitions";
import { formatMoney } from "@/lib/format";

export function ReturnSummaryModal() {
  const { returnSummary, dismissReturnSummary, setTab } = useGame();
  if (!returnSummary) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal panel return-modal">
        <p className="terminal-title">WHILE AWAY</p>
        <p className="muted">
          {returnSummary.ticksSimulated} simulated minutes elapsed. The economy kept moving.
        </p>
        <ul className="return-list">
          {returnSummary.priceChanges.slice(0, 6).map((p) => (
            <li key={p.resource}>
              <span>{RESOURCES[p.resource].name} price</span>
              <span className={p.percent >= 0 ? "up" : "down"}>
                {p.percent >= 0 ? "+" : ""}
                {p.percent.toFixed(0)}%
              </span>
            </li>
          ))}
          <li>
            <span>Revenue</span>
            <span className={returnSummary.revenueDelta >= 0 ? "up" : "down"}>
              {returnSummary.revenueDelta >= 0 ? "+" : ""}
              {formatMoney(returnSummary.revenueDelta)}
            </span>
          </li>
          {returnSummary.businessNotes.map((n) => (
            <li key={n}>
              <span>{n}</span>
            </li>
          ))}
          {returnSummary.marketNotes.map((n) => (
            <li key={n}>
              <span>{n}</span>
            </li>
          ))}
        </ul>
        {returnSummary.rollAvailable ? (
          <p className="roll-alert">NEW ECONOMIC ROLL AVAILABLE</p>
        ) : null}
        <div className="modal-actions">
          {returnSummary.rollAvailable ? (
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                dismissReturnSummary();
                setTab("roll");
              }}
            >
              View Roll
            </button>
          ) : null}
          <button type="button" className="btn secondary" onClick={dismissReturnSummary}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
