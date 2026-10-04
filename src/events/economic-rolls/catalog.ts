import type { DevelopmentTemplate } from "@/simulation/engine/types";

/** At least 25 economic developments across categories and rarities. */
export const DEVELOPMENT_CATALOG: DevelopmentTemplate[] = [
  {
    id: "copper_supply_disruption",
    title: "Copper Supply Disruption",
    category: "SUPPLY",
    rarity: "COMMON",
    description:
      "Several copper producers have reduced output. Copper prices are beginning to rise.",
    resources: ["copper"],
    responses: ["invest", "stockpile", "ignore"],
    tags: ["shortage", "supply_down", "copper"],
  },
  {
    id: "copper_surplus",
    title: "Copper Surplus",
    category: "SUPPLY",
    rarity: "COMMON",
    description:
      "Copper inventories are building faster than demand. Prices face downward pressure.",
    resources: ["copper"],
    responses: ["stockpile", "shutdown_line", "ignore"],
    tags: ["surplus", "supply_up", "copper"],
  },
  {
    id: "iron_mine_closure",
    title: "Iron Mine Closures",
    category: "SUPPLY",
    rarity: "UNCOMMON",
    description:
      "Marginal iron mines are shutting shafts. Near-term iron availability may tighten.",
    resources: ["iron"],
    responses: ["invest", "contract", "ignore"],
    tags: ["shortage", "supply_down", "iron"],
  },
  {
    id: "iron_export_opportunity",
    title: "Iron Export Opportunity",
    category: "DEMAND",
    rarity: "COMMON",
    description:
      "External buyers are seeking iron at a premium. Local surplus could find a market.",
    resources: ["iron"],
    responses: ["invest", "expand", "ignore"],
    tags: ["surplus", "demand_up", "iron"],
  },
  {
    id: "food_harvest_boom",
    title: "Regional Harvest Boom",
    category: "RESOURCE",
    rarity: "COMMON",
    description:
      "Favourable conditions have boosted food output across several farms.",
    resources: ["food"],
    responses: ["stockpile", "ignore", "expand"],
    tags: ["surplus", "supply_up", "food"],
  },
  {
    id: "food_shortage",
    title: "Food Shortage Fears",
    category: "RESOURCE",
    rarity: "UNCOMMON",
    description:
      "Poor yields and transport delays are squeezing food availability.",
    resources: ["food"],
    responses: ["stockpile", "adapt", "ignore"],
    tags: ["shortage", "supply_down", "food"],
  },
  {
    id: "energy_shortage",
    title: "Energy Shortage",
    category: "INFRASTRUCTURE",
    rarity: "RARE",
    description:
      "Generation capacity is lagging demand. Energy prices are climbing sharply.",
    resources: ["energy"],
    responses: ["invest", "adapt", "ignore"],
    tags: ["shortage", "supply_down", "energy", "crisis"],
  },
  {
    id: "energy_glut",
    title: "Energy Glut",
    category: "SUPPLY",
    rarity: "COMMON",
    description:
      "Power plants are overproducing relative to industrial draw. Energy is cheap.",
    resources: ["energy"],
    responses: ["expand", "ignore", "invest"],
    tags: ["surplus", "supply_up", "energy"],
  },
  {
    id: "component_demand_surge",
    title: "Component Demand Surge",
    category: "DEMAND",
    rarity: "COMMON",
    description:
      "Factories are scrambling for components. Order books are filling fast.",
    resources: ["components"],
    responses: ["expand", "invest", "ignore"],
    tags: ["demand_up", "components"],
  },
  {
    id: "machine_orders_fall",
    title: "Machine Orders Fall",
    category: "DEMAND",
    rarity: "COMMON",
    description:
      "Capital spending has slowed. Machine demand is cooling across retailers.",
    resources: ["machines"],
    responses: ["shutdown_line", "adapt", "ignore"],
    tags: ["demand_down", "machines"],
  },
  {
    id: "supplier_distress",
    title: "Supplier Distress",
    category: "FINANCE",
    rarity: "UNCOMMON",
    description:
      "A copper supplier is struggling financially. Continuity of supply is uncertain.",
    resources: ["copper"],
    responses: ["investigate", "acquire", "contract"],
    tags: ["distress", "copper", "acquisition"],
  },
  {
    id: "bank_tightening",
    title: "Credit Tightening",
    category: "FINANCE",
    rarity: "UNCOMMON",
    description:
      "Banks are raising lending standards. Highly leveraged operators feel the squeeze.",
    resources: ["cash"],
    responses: ["borrow", "adapt", "ignore"],
    tags: ["finance", "debt", "crisis"],
  },
  {
    id: "banking_crisis",
    title: "Banking Crisis",
    category: "FINANCE",
    rarity: "VERY_RARE",
    description:
      "A regional bank has frozen new credit. Liquidity is scarce across the board.",
    resources: ["cash"],
    responses: ["adapt", "stockpile", "ignore"],
    tags: ["finance", "crisis", "rare"],
  },
  {
    id: "logistics_disruption",
    title: "Logistics Disruption",
    category: "LOGISTICS",
    rarity: "COMMON",
    description:
      "Transport capacity has become constrained. Deliveries are slowing.",
    resources: ["energy"],
    responses: ["adapt", "invest", "ignore"],
    tags: ["logistics", "capacity_down"],
  },
  {
    id: "new_trade_route",
    title: "New Trade Route",
    category: "LOGISTICS",
    rarity: "RARE",
    description:
      "A new corridor opens cheaper movement between regions. Throughput may rise.",
    resources: ["energy", "iron", "copper"],
    responses: ["invest", "expand", "ignore"],
    tags: ["logistics", "capacity_up", "opportunity"],
  },
  {
    id: "transport_collapse",
    title: "Transport Collapse",
    category: "LOGISTICS",
    rarity: "EXCEPTIONAL",
    description:
      "A major logistics network has seized up. Goods are stranded across the chain.",
    resources: ["energy", "food", "components"],
    responses: ["adapt", "stockpile", "ignore"],
    tags: ["logistics", "crisis", "capacity_down"],
  },
  {
    id: "tech_breakthrough",
    title: "Process Breakthrough",
    category: "TECHNOLOGY",
    rarity: "RARE",
    description:
      "A refining technique promises higher yields from existing smelter capacity.",
    resources: ["components", "iron", "copper"],
    responses: ["invest", "expand", "ignore"],
    tags: ["technology", "efficiency"],
  },
  {
    id: "automation_wave",
    title: "Automation Wave",
    category: "TECHNOLOGY",
    rarity: "UNCOMMON",
    description:
      "Machine tools are improving throughput — for those who can afford them.",
    resources: ["machines"],
    responses: ["invest", "expand", "ignore"],
    tags: ["technology", "machines"],
  },
  {
    id: "industrial_boom",
    title: "Industrial Boom",
    category: "INDUSTRY",
    rarity: "RARE",
    description:
      "Industrial activity is accelerating. Inputs and energy are in heavier demand.",
    resources: ["components", "energy", "machines"],
    responses: ["expand", "invest", "ignore"],
    tags: ["demand_up", "industry", "boom"],
  },
  {
    id: "construction_slowdown",
    title: "Local Construction Slowdown",
    category: "INDUSTRY",
    rarity: "COMMON",
    description:
      "Building projects have paused. Iron and machine demand softens locally.",
    resources: ["iron", "machines"],
    responses: ["adapt", "ignore", "shutdown_line"],
    tags: ["demand_down", "iron", "machines"],
  },
  {
    id: "tourism_demand",
    title: "Tourism Demand Increase",
    category: "CONSUMPTION",
    rarity: "COMMON",
    description:
      "Visitor spending lifts retail food throughput in tourist districts.",
    resources: ["food"],
    responses: ["expand", "ignore", "invest"],
    tags: ["demand_up", "food", "peripheral"],
  },
  {
    id: "grain_surplus",
    title: "Regional Grain Surplus",
    category: "CONSUMPTION",
    rarity: "COMMON",
    description:
      "Grain stores overflow. Food prices may ease even if other markets are tight.",
    resources: ["food"],
    responses: ["stockpile", "ignore", "adapt"],
    tags: ["surplus", "food", "peripheral"],
  },
  {
    id: "competitor_expansion",
    title: "Competitor Expansion",
    category: "COMPETITION",
    rarity: "COMMON",
    description:
      "An NPC producer is adding capacity in your primary sector.",
    resources: ["copper", "iron", "components"],
    responses: ["adapt", "expand", "ignore"],
    tags: ["competition", "supply_up"],
  },
  {
    id: "competitor_collapse",
    title: "Major Competitor Collapse",
    category: "COMPETITION",
    rarity: "VERY_RARE",
    description:
      "A large rival has failed. Market share and distressed assets are up for grabs.",
    resources: ["copper", "components", "machines"],
    responses: ["acquire", "expand", "investigate"],
    tags: ["competition", "opportunity", "distress"],
  },
  {
    id: "distressed_acquisition",
    title: "Distressed Acquisition",
    category: "ACQUISITION",
    rarity: "UNCOMMON",
    description:
      "A struggling facility could be bought below replacement cost — if you can fund it.",
    resources: ["copper", "iron", "components"],
    responses: ["acquire", "investigate", "ignore"],
    tags: ["acquisition", "distress", "opportunity"],
  },
  {
    id: "major_resource_discovery",
    title: "Major Resource Discovery",
    category: "RESOURCE",
    rarity: "EXCEPTIONAL",
    description:
      "Surveyors report a significant undeveloped copper and iron deposit.",
    resources: ["copper", "iron"],
    responses: ["invest", "acquire", "ignore"],
    tags: ["discovery", "supply_up", "opportunity"],
  },
  {
    id: "price_spike_copper",
    title: "Copper Price Spike",
    category: "PRICE",
    rarity: "UNCOMMON",
    description:
      "Copper has jumped on short covering and thin inventories.",
    resources: ["copper"],
    responses: ["stockpile", "invest", "ignore"],
    tags: ["price_up", "copper"],
  },
  {
    id: "scrap_recycling",
    title: "Scrap Recycling Opportunity",
    category: "RESOURCE",
    rarity: "UNCOMMON",
    description:
      "Secondary copper recovery looks newly profitable as primary supply tightens.",
    resources: ["copper"],
    responses: ["invest", "expand", "ignore"],
    tags: ["shortage", "copper", "opportunity"],
  },
  {
    id: "copper_substitution",
    title: "Copper Substitution",
    category: "TECHNOLOGY",
    rarity: "RARE",
    description:
      "Some manufacturers are redesigning around aluminium substitutes for copper.",
    resources: ["copper", "components"],
    responses: ["adapt", "shutdown_line", "ignore"],
    tags: ["demand_down", "copper"],
  },
  {
    id: "smelter_outage",
    title: "Smelter Outage",
    category: "INDUSTRY",
    rarity: "UNCOMMON",
    description:
      "A large smelter has gone offline for repairs. Component feedstock tightens.",
    resources: ["components", "iron", "copper"],
    responses: ["stockpile", "contract", "ignore"],
    tags: ["shortage", "components"],
  },
];

export const RARITY_WEIGHT: Record<string, number> = {
  COMMON: 1,
  UNCOMMON: 0.45,
  RARE: 0.18,
  VERY_RARE: 0.07,
  EXCEPTIONAL: 0.025,
};
