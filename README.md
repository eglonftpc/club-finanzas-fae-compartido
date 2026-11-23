# Club Finanzas FAE — Terminal

Terminal de research estilo Bloomberg para el Club de Finanzas.

## Docs

- [SPEC.md](./SPEC.md) — producto y fases
- [AGENTS.md](./AGENTS.md) — reglas para Cursor

## Quick start

```bash
pnpm install
pnpm dev
```

Abrí [http://localhost:3000](http://localhost:3000).

Command bar (`/` o `F1`):

```
HELP
DES AAPL
GP COPEC.SN 1Y
N TSLA
WEI
TOP
FAV
```

## Datos

Por defecto usa **mock** (sin API keys).

```bash
cp .env.example .env.local
# MARKET_DATA_PROVIDER=finnhub
# FINNHUB_API_KEY=...
```

## Scripts

```bash
pnpm dev
pnpm test
pnpm lint
pnpm build
```

## Estado

Fase 0 + Fase 1 (API routes, charts, mock/finnhub). Auth/DB = Fase 2.
