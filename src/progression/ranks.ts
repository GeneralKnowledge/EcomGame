/** Economic scale ranks — not classes. Many intermediate levels. */
export const RANKS: string[] = [
  "Kid",
  "Street Seller",
  "Peddler",
  "Hustler",
  "Dealer",
  "Junior Trader",
  "Trader",
  "Senior Trader",
  "Merchant",
  "Established Merchant",
  "Shopkeeper",
  "Proprietor",
  "Small Employer",
  "Employer",
  "Supervisor",
  "Manager",
  "Senior Manager",
  "Director",
  "Managing Director",
  "Executive",
  "Vice President",
  "President",
  "CEO",
  "Industrialist",
  "Regional Magnate",
  "Magnate",
  "Tycoon",
  "Oligarch",
  "Governor",
  "Chancellor",
  "Sovereign",
  "King",
  "Emperor",
];

/** Net worth / asset thresholds for each rank (approximate). */
export function rankIndexForAssets(assets: number): number {
  const thresholds = [
    0, 50, 100, 180, 300, 450, 700, 1000, 1600, 2500, 4000, 6000, 9000, 14000,
    22000, 35000, 55000, 85000, 130000, 200000, 320000, 500000, 800000, 1_300_000,
    2_100_000, 3_500_000, 6_000_000, 10_000_000, 18_000_000, 35_000_000,
    70_000_000, 150_000_000, 400_000_000,
  ];
  let idx = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (assets >= thresholds[i]!) idx = i;
  }
  return Math.min(idx, RANKS.length - 1);
}

export function rankName(index: number): string {
  return RANKS[Math.max(0, Math.min(index, RANKS.length - 1))] ?? "Kid";
}
