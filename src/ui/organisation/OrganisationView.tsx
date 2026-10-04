"use client";

import { useState } from "react";
import { useGame } from "@/hooks/use-game";
import { BUSINESS_DEFINITIONS } from "@/economy/businesses/definitions";
import { formatMoney, formatNum } from "@/lib/format";
import { totalOrgAssets } from "@/organisations/management";
import { ACHIEVEMENTS } from "@/progression/achievements";
import { rankName } from "@/progression/ranks";

export function OrganisationView() {
  const { state, hireManager, tickVersion } = useGame();
  const [msg, setMsg] = useState("");
  void tickVersion;
  if (!state) return null;

  const player = state.players.player_1!;
  const org = state.organisations[player.organisationId]!;
  const businesses = org.businessIds
    .map((id) => state.businesses[id])
    .filter((b) => b && b.status !== "failed");
  const loadPct =
    org.managementCapacity > 0
      ? (org.managementLoad / org.managementCapacity) * 100
      : 0;
  const assets = totalOrgAssets(state, org.id);
  const unlocked = new Set(player.achievements.map((a) => a.id));

  // Simple supply-chain view by sector order
  const chainOrder = [
    "mine",
    "farm",
    "power_plant",
    "smelter",
    "factory",
    "logistics",
    "warehouse",
    "retailer",
    "bank",
  ] as const;

  return (
    <div className="view">
      <section className="hero-strip">
        <div>
          <p className="eyebrow">Structure</p>
          <h1 className="view-title">{org.name}</h1>
          <p className="lede">
            {rankName(player.rankIndex)} · complexity is an economic problem, not a hard
            cap.
          </p>
        </div>
      </section>

      <section className="stat-grid">
        <div className="stat">
          <span className="stat-label">Treasury</span>
          <span className="stat-value">{formatMoney(org.cash)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Assets</span>
          <span className="stat-value">{formatMoney(assets)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Org debt</span>
          <span className="stat-value">{formatMoney(org.debt)}</span>
        </div>
        <div className={`stat ${loadPct > 100 ? "warn" : ""}`}>
          <span className="stat-label">Management load</span>
          <span className="stat-value">
            {formatNum(org.managementLoad, 1)} / {org.managementCapacity} (
            {formatNum(loadPct, 0)}%)
          </span>
        </div>
      </section>

      {loadPct > 100 ? (
        <div className="warn-banner">
          Management overloaded. Expect purchasing mistakes, maintenance delays, and
          inefficient production — not a flat percentage penalty.
        </div>
      ) : null}

      <section className="panel">
        <header className="panel-head">
          <h2>Management</h2>
          <button
            type="button"
            className="btn secondary"
            onClick={() => setMsg(hireManager().message)}
          >
            Hire manager (+4 capacity)
          </button>
        </header>
        <p className="muted">
          Managers hired: {org.managersHired}. {msg}
        </p>
      </section>

      <section className="panel">
        <header className="panel-head">
          <h2>Supply chain footprint</h2>
        </header>
        <div className="chain">
          {chainOrder.map((type, i) => {
            const owned = businesses.filter((b) => b?.type === type);
            return (
              <div key={type} className="chain-node">
                {i > 0 ? <span className="chain-arrow">→</span> : null}
                <div className={`chain-box ${owned.length ? "owned" : ""}`}>
                  <strong>{BUSINESS_DEFINITIONS[type].name}</strong>
                  <span>{owned.length ? `${owned.length} owned` : "—"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <header className="panel-head">
          <h2>Statistics</h2>
        </header>
        <dl className="stats-dl">
          {Object.entries(player.stats).map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd className="mono">
                {typeof v === "number" && k.toLowerCase().includes("share")
                  ? `${(v * 100).toFixed(1)}%`
                  : typeof v === "number" && v > 20 && !k.includes("Roll") && !k.includes("Event") && !k.includes("business") && !k.includes("contract") && !k.includes("bankrupt")
                    ? formatMoney(v)
                    : typeof v === "number"
                      ? formatNum(v, v < 10 ? 2 : 0)
                      : String(v)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="panel">
        <header className="panel-head">
          <h2>Achievements</h2>
        </header>
        <ul className="ach-list">
          {ACHIEVEMENTS.map((a) => (
            <li key={a.id} className={unlocked.has(a.id) ? "unlocked" : ""}>
              <strong>{a.title}</strong>
              <span className="muted">{a.description}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
