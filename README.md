# Ledgerfield

Persistent economic MMO / idle economic simulation prototype.

You do not control a character. You control an economic operation that can grow from a one-person business into a large organisation.

## Stack

- TypeScript, React, Next.js, Tailwind CSS
- Simulation engine is React-independent under `src/simulation`, `src/economy`, `src/markets`, `src/events`

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Core loop

Build → operate → wait → Economic Roll → decision → consequences → grow or recover.

Economic Rolls create situations (not free money). Outcomes depend on your economic position.

## Prototype includes

- Deterministic seeded RNG simulation ticks
- 7 resources, live supply/demand pricing
- NPC + player businesses (shared model)
- Production, inventory, finances, insolvency, Commons recovery
- Management capacity with emergent overload failures
- 30 contextual Economic Developments (5 rarities, 12 categories)
- Offline simulation + return summary
- Ranks, achievements, history
- Desktop-first financial terminal UI

## Notes

Cadence for Economic Rolls is configurable in `src/simulation/engine/config.ts`.
Multiplayer networking is intentionally out of scope for this prototype.
