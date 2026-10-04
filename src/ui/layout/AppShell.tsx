"use client";

import { useGame } from "@/hooks/use-game";
import { formatMoney, formatTickClock } from "@/lib/format";
import { rankName } from "@/progression/ranks";
import { totalOrgAssets } from "@/organisations/management";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "businesses", label: "Businesses" },
  { id: "markets", label: "Markets" },
  { id: "organisation", label: "Organisation" },
  { id: "roll", label: "Economic Roll" },
  { id: "history", label: "History" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, tab, setTab, paused, setPaused, advance, reset, tickVersion } =
    useGame();

  void tickVersion;

  const player = state?.players.player_1;
  const org = player ? state?.organisations[player.organisationId] : null;
  const assets = state && org ? totalOrgAssets(state, org.id) : 0;
  const pending = player?.pendingRollId;

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden />
          <div>
            <p className="brand-name">LEDGERFIELD</p>
            <p className="brand-sub">Persistent Economic Simulation</p>
          </div>
        </div>
        <div className="top-metrics">
          <Metric label="Cash" value={formatMoney(org?.cash ?? 0)} />
          <Metric label="Assets" value={formatMoney(assets)} />
          <Metric
            label="Rank"
            value={rankName(player?.rankIndex ?? 0)}
          />
          <Metric
            label="Clock"
            value={formatTickClock(state?.tick ?? 0)}
            mono
          />
        </div>
        <div className="top-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => setPaused(!paused)}
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <button type="button" className="btn ghost" onClick={() => advance(60)}>
            +1h
          </button>
          <button type="button" className="btn ghost" onClick={() => advance(1440)}>
            +1d
          </button>
          <button type="button" className="btn ghost danger" onClick={() => reset()}>
            New Game
          </button>
        </div>
      </header>

      <nav className="tab-nav" aria-label="Primary">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${tab === t.id ? "active" : ""} ${t.id === "roll" && pending ? "pulse" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === "roll" && pending ? <span className="badge">NEW</span> : null}
          </button>
        ))}
      </nav>

      <main className="main-stage">{children}</main>
    </div>
  );
}

function Metric({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="metric">
      <span className="metric-label">{label}</span>
      <span className={`metric-value ${mono ? "mono" : ""}`}>{value}</span>
    </div>
  );
}
