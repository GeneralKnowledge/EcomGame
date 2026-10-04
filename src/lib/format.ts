export function formatMoney(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}£${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}£${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `${sign}£${(abs / 1_000).toFixed(1)}k`;
  return `${sign}£${abs.toFixed(0)}`;
}

export function formatNum(n: number, digits = 1): string {
  if (Math.abs(n) >= 1000) return n.toFixed(0);
  return n.toFixed(digits);
}

export function formatPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${(n * 100).toFixed(1)}%`;
}

export function formatTickClock(tick: number): string {
  const days = Math.floor(tick / (60 * 24));
  const hours = Math.floor((tick % (60 * 24)) / 60);
  const mins = tick % 60;
  return `D${days} ${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}
