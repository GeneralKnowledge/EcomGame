"use client";

import { useGame } from "@/hooks/use-game";
import { formatMoney, formatNum, formatPct } from "@/lib/format";
import { BUSINESS_DEFINITIONS } from "@/economy/businesses/definitions";
import { TRADEABLE_RESOURCES, RESOURCES } from "@/economy/resources/definitions";
import { rankName } from "@/progression/ranks";
import { totalOrgAssets } from "@/organisations/management";

export function DashboardView() {
  const { state, setTab, requestRoll, tickVersion } = useGame();
  void tickVersion;
  if (!state) return <Loading />;

  const player = state.players.player_1!;
  const org = state.organisations[player.organisationId]!;
  const businesses = org.businessIds
    .map((id) => state.businesses[id])
    .filter(Boolean);
  const living = businesses.filter((b) => b && b.status !== "failed");
  const revenue = living.reduce((s, b) => s + (b?.revenue ?? 0), 0);
  const expenses = living.reduce((s, b) => s + (b?.expenses ?? 0), 0);
  const profit = revenue - expenses;
  const assets = totalOrgAssets(state, org.id);
  const debt =
    org.debt + living.reduce((s, b) => s + (b?.debt ?? 0), 0);
  const loadPct =
    org.managementCapacity > 0
      ? org.managementLoad / org.managementCapacity
      : 0;

  const movers = TRADEABLE_RESOURCES.map((r) => {
    const m = state.markets[r]!;
    return { id: r, name: RESOURCES[r].name, price: m.price, trend: m.trend };
  }).sort((a, b) => Math.abs(b.trend) - Math.abs(a.trend));

  return (
    <div className="view dashboard-view">
      <section className="hero-strip">
        <div>
          <p className="eyebrow">Operating ledger</p>
          <h1 className="view-title">{org.name}</h1>
          <p className="lede">
            {rankName(player.rankIndex)} · {living.length} active{" "}
            {living.length === 1 ? "business" : "businesses"} · tick {state.tick}
          </p>
        </div>
        {org.inCommons ? (
          <div className="commons-banner">
            Commons recovery — £{org.cash.toFixed(0)} / £{state.config.commonsMaxCash}
          </div>
        ) : null}
        {player.pendingRollId ? (
          <button type="button" className="btn primary" onClick={() => setTab("roll")}>
            Economic Roll ready
          </button>
        ) : (
          <button type="button" className="btn secondary" onClick={() => requestRoll()}>
            Force market scan
          </button>
        )}
      </section>

      <section className="stat-grid">
        <Stat label="Cash" value={formatMoney(org.cash)} />
        <Stat label="Revenue / tick" value={formatMoney(revenue)} tone="up" />
        <Stat label="Expenses / tick" value={formatMoney(expenses)} tone="down" />
        <Stat
          label="Profit / tick"
          value={formatMoney(profit)}
          tone={profit >= 0 ? "up" : "down"}
        />
        <Stat label="Assets" value={formatMoney(assets)} />
        <Stat label="Debt" value={formatMoney(debt)} tone={debt > 0 ? "down" : undefined} />
        <Stat
          label="Management"
          value={`${formatNum(org.managementLoad, 1)} / ${org.managementCapacity}`}
          tone={loadPct > 1 ? "warn" : undefined}
        />
        <Stat label="Rank" value={rankName(player.rankIndex)} />
      </section>

      <div className="split-panels">
        <section className="panel">
          <header className="panel-head">
            <h2>Your businesses</h2>
            <button type="button" className="linkish" onClick={() => setTab("businesses")}>
              Manage
            </button>
          </header>
          {living.length === 0 ? (
            <p className="empty-note">
              No businesses yet. Found a tiny mine or farm — automation handles the rest.
            </p>
          ) : (
            <ul className="biz-list">
              {living.map((b) =>
                b ? (
                  <li key={b.id}>
                    <div>
                      <strong>{b.name}</strong>
                      <span className="muted">
                        {BUSINESS_DEFINITIONS[b.type].name} · {b.status}
                      </span>
                    </div>
                    <div className="biz-nums">
                      <span>{formatMoney(b.cash)}</span>
                      <span className={b.profit >= 0 ? "up" : "down"}>
                        {formatMoney(b.profit)}
                      </span>
                    </div>
                  </li>
                ) : null,
              )}
            </ul>
          )}
        </section>

        <section className="panel">
          <header className="panel-head">
            <h2>Market pulse</h2>
            <button type="button" className="linkish" onClick={() => setTab("markets")}>
              Markets
            </button>
          </header>
          <ul className="market-pulse">
            {movers.slice(0, 6).map((m) => (
              <li key={m.id}>
                <span>{m.name}</span>
                <span className="mono">{formatMoney(m.price)}</span>
                <span className={m.trend >= 0 ? "up" : "down"}>
                  {formatPct(m.trend)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel">
        <header className="panel-head">
          <h2>Recent history</h2>
          <button type="button" className="linkish" onClick={() => setTab("history")}>
            Full log
          </button>
        </header>
        <ul className="history-snip">
          {state.history.slice(0, 6).map((h) => (
            <li key={h.id}>
              <span className="mono muted">t{h.tick}</span>
              <strong>{h.title}</strong>
              <span className="muted">{h.detail}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down" | "warn";
}) {
  return (
    <div className={`stat ${tone ?? ""}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function Loading() {
  return <p className="empty-note">Initialising economy…</p>;
}
