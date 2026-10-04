"use client";

import { useGame } from "@/hooks/use-game";
import { TRADEABLE_RESOURCES, RESOURCES } from "@/economy/resources/definitions";
import { formatMoney, formatNum, formatPct } from "@/lib/format";

export function MarketsView() {
  const { state, tickVersion } = useGame();
  void tickVersion;
  if (!state) return null;

  return (
    <div className="view">
      <section className="hero-strip">
        <div>
          <p className="eyebrow">Exchange</p>
          <h1 className="view-title">Markets</h1>
          <p className="lede">
            Prices move from supply, demand, and inventory — not fixed tables.
          </p>
        </div>
      </section>

      <div className="market-cards">
        {TRADEABLE_RESOURCES.map((id) => {
          const m = state.markets[id]!;
          const def = RESOURCES[id];
          const history = m.priceHistory;
          return (
            <article key={id} className="market-card panel">
              <header>
                <h2>{def.name}</h2>
                <span className={`trend ${m.trend >= 0 ? "up" : "down"}`}>
                  {formatPct(m.trend)}
                </span>
              </header>
              <p className="price mono">{formatMoney(m.price)}</p>
              <Sparkline values={history} positive={m.trend >= 0} />
              <dl className="market-dl">
                <div>
                  <dt>Supply</dt>
                  <dd className="mono">{formatNum(m.supply)}</dd>
                </div>
                <div>
                  <dt>Demand</dt>
                  <dd className="mono">{formatNum(m.demand)}</dd>
                </div>
                <div>
                  <dt>Inventory</dt>
                  <dd className="mono">{formatNum(m.inventory, 0)}</dd>
                </div>
                <div>
                  <dt>Volume</dt>
                  <dd className="mono">{formatNum(m.transactionVolume)}</dd>
                </div>
                <div>
                  <dt>Participants</dt>
                  <dd className="mono">{m.participants}</dd>
                </div>
                <div>
                  <dt>Unit</dt>
                  <dd>{def.unit}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>

      <section className="panel">
        <header className="panel-head">
          <h2>World conditions</h2>
        </header>
        {state.worldConditions.length === 0 ? (
          <p className="empty-note">Markets are relatively balanced.</p>
        ) : (
          <ul className="condition-list">
            {state.worldConditions.map((c) => (
              <li key={c.id}>
                <strong>{c.label}</strong>
                <span className="mono muted">
                  severity {formatNum(c.severity, 2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Sparkline({
  values,
  positive,
}: {
  values: number[];
  positive: boolean;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.01, max - min);
  const w = 200;
  const h = 40;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      className={`spark ${positive ? "up" : "down"}`}
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height="40"
      aria-hidden
    >
      <polyline fill="none" strokeWidth="2" points={points} />
    </svg>
  );
}
