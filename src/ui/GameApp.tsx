"use client";

import { GameProvider, useGame } from "@/hooks/use-game";
import { AppShell } from "@/ui/layout/AppShell";
import { DashboardView } from "@/ui/dashboard/DashboardView";
import { BusinessesView } from "@/ui/businesses/BusinessesView";
import { MarketsView } from "@/ui/markets/MarketsView";
import { OrganisationView } from "@/ui/organisation/OrganisationView";
import { EconomicRollView } from "@/ui/economic-roll/EconomicRollView";
import { HistoryView } from "@/ui/history/HistoryView";
import { ReturnSummaryModal } from "@/ui/shared/ReturnSummaryModal";

function GameScreens() {
  const { tab, state } = useGame();

  if (!state) {
    return (
      <div className="boot-screen">
        <p className="brand-name">LEDGERFIELD</p>
        <p className="muted">Opening the economic ledger…</p>
      </div>
    );
  }

  return (
    <AppShell>
      {tab === "dashboard" ? <DashboardView /> : null}
      {tab === "businesses" ? <BusinessesView /> : null}
      {tab === "markets" ? <MarketsView /> : null}
      {tab === "organisation" ? <OrganisationView /> : null}
      {tab === "roll" ? <EconomicRollView /> : null}
      {tab === "history" ? <HistoryView /> : null}
      <ReturnSummaryModal />
    </AppShell>
  );
}

export function GameApp() {
  return (
    <GameProvider>
      <GameScreens />
    </GameProvider>
  );
}
