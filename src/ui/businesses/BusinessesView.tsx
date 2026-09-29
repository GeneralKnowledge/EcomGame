"use client";

import { useState } from "react";
import { useGame } from "@/hooks/use-game";
import {
  BUSINESS_DEFINITIONS,
  FOUNDABLE_TYPES,
} from "@/economy/businesses/definitions";
import type { BusinessType } from "@/economy/businesses/types";
import { formatMoney, formatNum } from "@/lib/format";
import { RESOURCES } from "@/economy/resources/definitions";

export function BusinessesView() {
  const { state, found, tickVersion } = useGame();
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<BusinessType>("mine");
  void tickVersion;
  if (!state) return null;

  const player = state.players.player_1!;
  const org = state.organisations[player.organisationId]!;
  const businesses = Object.values(state.businesses).sort((a, b) => {
    if (a.ownerKind !== b.ownerKind) return a.ownerKind === "player" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const onFound = () => {
    const r = found(selected);
    setMessage(r.message);
  };

  return (
    <div className="view">
      <section className="hero-strip">
        <div>
          <p className="eyebrow">Entities</p>
          <h1 className="view-title">Businesses</h1>
          <p className="lede">
            NPC and player firms share the same economic model. Found something small;
            let it run.
          </p>
        </div>
      </section>

      <section className="panel found-panel">
        <header className="panel-head">
          <h2>Found a business</h2>
          <span className="muted">Treasury {formatMoney(org.cash)}</span>
        </header>
        <div className="found-row">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as BusinessType)}
            className="select"
          >
            {FOUNDABLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {BUSINESS_DEFINITIONS[t].name} — £
                {BUSINESS_DEFINITIONS[t].foundingCost} · load{" "}
                {BUSINESS_DEFINITIONS[t].managementLoad}
              </option>
            ))}
          </select>
          <button type="button" className="btn primary" onClick={onFound}>
            Found
          </button>
        </div>
        {message ? <p className="inline-msg">{message}</p> : null}
      </section>

      <section className="biz-table-wrap panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Cash</th>
              <th>Rev</th>
              <th>Exp</th>
              <th>Util</th>
              <th>Debt</th>
              <th>Inventory</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((b) => (
              <tr
                key={b.id}
                className={b.ownerKind === "player" ? "mine" : undefined}
              >
                <td>{b.name}</td>
                <td>{BUSINESS_DEFINITIONS[b.type].name}</td>
                <td>{b.ownerKind === "player" ? "You" : "NPC"}</td>
                <td>
                  <span className={`status-pill ${b.status}`}>{b.status}</span>
                </td>
                <td className="mono">{formatMoney(b.cash)}</td>
                <td className="mono">{formatMoney(b.revenue)}</td>
                <td className="mono">{formatMoney(b.expenses)}</td>
                <td className="mono">{formatNum(b.utilisation * 100, 0)}%</td>
                <td className="mono">{formatMoney(b.debt)}</td>
                <td className="inv-cell">
                  {Object.entries(b.inventory)
                    .filter(([, q]) => (q ?? 0) > 0.05)
                    .slice(0, 4)
                    .map(([r, q]) => `${RESOURCES[r as keyof typeof RESOURCES]?.name ?? r} ${formatNum(q ?? 0)}`)
                    .join(" · ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
