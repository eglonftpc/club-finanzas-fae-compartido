# AGENTS.md — Cursor

Instrucciones para agentes que implementan el **Terminal de Finanzas (Club FAE)**.

## Fuente de verdad

1. Leer **`SPEC.md` completo** antes de codear.
2. Implementar **solo la fase pedida** (default: Fase 0 si no se indica).
3. No agregar features fuera del spec (trading, cards, light mode, etc.).

## Orden de trabajo

```
Fase 0 (skeleton + mock) → pausa / PR
Fase 1 (market data + charts) → pausa / PR
Fase 2 (auth + DB + WEI/FAV) → …
```

Cada fase debe cumplir su **DoD** en `SPEC.md` §11.

## Reglas de código

- TypeScript strict; sin `any` innecesario
- UI densa estilo terminal (CSS variables del spec); **no** shadcn-card / gradients / Inter
- Market data **solo** vía `lib/providers` (`MarketDataProvider`)
- Default local: `MARKET_DATA_PROVIDER=mock`
- Tests del parser en cuanto exista `lib/commands/parser.ts`
- Commits chicos por fase; mensaje en español o inglés, descriptivo

## Comando de verificación (Fase 0)

```bash
pnpm install
pnpm dev
# Manual: HELP, DES AAPL, GP AAPL, N AAPL, WEI, Tab, /
pnpm test   # cuando existan tests del parser
```

## Prompt de arranque (copiar en Cursor)

```
Lee SPEC.md y AGENTS.md.
Implementá la Fase 0 del Terminal de Finanzas exactamente como está especificada.
Mock provider, shell 2×2, command bar, paneles DES/GP/N/WEI/HELP.
No pases a Fase 1 sin que el DoD de Fase 0 esté cumplido.
```

## Qué no hacer

- No inventar comandos nuevos
- No acoplar Finnhub/Yahoo en componentes React
- No priorizar mobile
- No reescribir el spec en silencio: si algo falta, anotar en el PR
