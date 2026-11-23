# Spec — Terminal de Finanzas (Club FAE)

> Documento de producto + ingeniería para construir en Cursor un terminal estilo Bloomberg, **educativo y de club**, no un clon comercial.

**Repo:** `club-finanzas-fae-compartido`  
**Producto:** Terminal de research para el Club de Finanzas  
**Versión del spec:** 1.0  
**Estado:** listo para implementar MVP

---

## 1. Objetivo

Construir una app web densa, oscura y orientada a teclado donde un miembro del club pueda:

1. Escribir un comando (`GP AAPL`, `DES COPEC`)
2. Ver en paneles fijos: overview, gráfico, news y watchlist
3. Compartir watchlists del club
4. Investigar tickers USA + Chile (`.SN`) sin salir del terminal

**Éxito:** un miembro escribe `GP COPEC` y en &lt;2s ve gráfico + precio, sin mouse.

---

## 2. No-objetivos (v1)

- Trading real, órdenes, broker, paper trading
- Clonar las ~30k funciones de Bloomberg
- Mobile-first / app nativa
- Microservicios
- Scraping agresivo de sitios propietarios
- UI “marketing” con cards, gradients o dashboards bonitos

---

## 3. Personas

| Persona | Necesidad |
|---------|-----------|
| Miembro del club | Research rápido de tickers, watchlist compartida |
| Comité / admin | Mantener watchlist oficial del club, invitaciones |
| Facilitador Cursor | Implementar por fases con criterios de aceptación claros |

---

## 4. Principios de UX

1. **Teclado primero** — command bar global; mouse es secundario
2. **Densidad** — tipografía tabular, poco whitespace, alto contraste
3. **Funciones = códigos cortos** — `DES`, `GP`, `N`, `WEI`, `HELP`
4. **Panel activo** — el comando afecta el panel enfocado (borde accent)
5. **Misma gramática** en todas las funciones: `FN [SYMBOL] [ARGS]`
6. **Look terminal** — fondo casi negro, texto ámbar/verde/blanco, monospace en números

### Paleta (CSS variables)

```css
--bg: #0a0c0f;
--bg-panel: #11151a;
--border: #1e2630;
--text: #e8eef4;
--muted: #8b98a8;
--accent: #f5a623;      /* ámbar comando */
--up: #3dd68c;
--down: #f07178;
--mono: "IBM Plex Mono", "JetBrains Mono", ui-monospace, monospace;
--sans: "IBM Plex Sans", system-ui, sans-serif;
```

**Tipografía:** no Inter/Roboto/Arial. Usar IBM Plex (Sans + Mono).

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ TOPBAR: logo club | clock | user | status feed          │
├─────────────────────────────────────────────────────────┤
│ ┌─ PANEL 1 (DES) ──┐  ┌─ PANEL 2 (GP) ───────────────┐ │
│ │                  │  │                               │ │
│ └──────────────────┘  └───────────────────────────────┘ │
│ ┌─ PANEL 3 (N) ────┐  ┌─ PANEL 4 (WEI) ──────────────┐ │
│ │                  │  │                               │ │
│ └──────────────────┘  └───────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ COMMAND BAR: ▌ GP AAPL_                                 │
└─────────────────────────────────────────────────────────┘
```

- Desktop: grid 2×2; un panel puede maximizarse (`MAX` / doble click título)
- El command bar siempre visible (abajo o overlay con `/`)
- Sin cards con sombra; paneles = bordes 1px + título de función

---

## 5. MVP — Funciones

| Código | Alias | Descripción | Input |
|--------|-------|-------------|-------|
| `DES` | (default al tipear solo símbolo) | Description / overview | `SYMBOL` |
| `GP` | `G` | Graph — OHLC + volumen | `SYMBOL` `[RANGE]` |
| `N` | `NEWS` | News del ticker | `SYMBOL` |
| `WEI` | `WATCH` | Watchlist del club | — |
| `FAV` | — | Favoritos del usuario | — |
| `TOP` | — | Gainers / losers del día | — |
| `HELP` | `?` | Lista de comandos | — |
| `MAX` | — | Maximiza panel activo | — |
| `GRID` | — | Vuelve a 2×2 | — |

### Rangos de `GP`

`1D` | `5D` | `1M` | `3M` | `6M` | `YTD` | `1Y` | `5Y`  
Default: `3M`

### Ejemplos de comandos válidos

```
AAPL
DES AAPL
GP AAPL
GP COPEC.SN 1Y
N TSLA
WEI
FAV
TOP
HELP
```

### Parser

```
comando = trim(input).toUpperCase()
tokens  = split por whitespace

si tokens[0] es función conocida:
  fn = tokens[0]; args = tokens[1..]
si no y tokens[0] parece símbolo:
  fn = DES; args = tokens
si no:
  error "UNKNOWN FUNCTION — type HELP"
```

Normalización de símbolos: `COPEC` → intentar `COPEC.SN` si el club está en modo Chile-first (flag de config); USA queda sin sufijo.

---

## 6. Pantallas — detalle

### 6.1 DES — Description

**Muestra:**
- Header: símbolo, nombre, exchange, moneda
- Precio last, change $, change %, timestamp
- Stats en grilla densa: Open, High, Low, Prev Close, Volume, Avg Vol, Market Cap, PE, EPS, 52W High/Low, Sector, Industry
- Mini sparkline 1M (opcional en MVP+)
- Botones teclado: `G` abre GP del mismo símbolo en panel hermano

**Estados:** loading skeleton denso | error provider | not found

### 6.2 GP — Graph

**Muestra:**
- Lightweight Charts (TradingView) candlestick + volumen
- Toolbar de rangos (también acepta rango en el comando)
- Crosshair con O/H/L/C
- Título: `SYMBOL · RANGE · last`

**Performance:** no re-renderizar todo el layout al actualizar velas; actualizar serie in-place.

### 6.3 N — News

**Muestra:**
- Lista cronológica: hora | fuente | headline
- Click abre URL externa en tab nueva
- Máx 30 items; vacíos → “No news for SYMBOL”

### 6.4 WEI — Watchlist club

**Muestra:**
- Tabla: Symbol | Last | Chg% | Volume | Sector
- Chg% coloreado up/down
- Enter sobre fila → `DES` de ese símbolo en panel activo
- Admin puede editar miembros de la lista (Fase 2)

### 6.5 TOP

Tabla gainers / losers (tabs o dos columnas). Click → DES.

### 6.6 HELP

Lista estática de comandos del spec + atajos.

---

## 7. Atajos de teclado

| Tecla | Acción |
|-------|--------|
| `/` o `F1` | Focus command bar |
| `Esc` | Blur command bar / cierra maximizado |
| `Tab` | Cicla panel activo |
| `1`–`4` | Focus panel 1–4 (si command bar no focused) |
| `Enter` | Ejecuta comando |
| `↑` / `↓` | Historial de comandos |

---

## 8. Stack

| Capa | Tecnología | Notas |
|------|------------|-------|
| App | Next.js 15 (App Router) + TypeScript | Un solo deploy |
| UI | Tailwind CSS v4 + CSS variables | Densidad custom, no shadcn “cardy” |
| Charts | `lightweight-charts` | Obligatorio para GP |
| Data fetching | TanStack Query | staleTime por tipo de dato |
| Estado UI | Zustand | layout, panel activo, historial cmds |
| Auth | NextAuth (Google/GitHub) o Clerk | Solo miembros del club |
| DB | Postgres (Neon / Supabase) | users, watchlists, favorites |
| Cache | Redis o Map en memoria (dev) | TTL quotes 15–30s |
| Hosting | Vercel | Preview PRs |

### Estructura de carpetas

```
/
├── SPEC.md                 # este documento
├── AGENTS.md               # instrucciones para Cursor
├── README.md
├── package.json
├── app/
│   ├── layout.tsx
│   ├── page.tsx            # shell del terminal
│   ├── globals.css
│   └── api/
│       ├── quote/route.ts
│       ├── candles/route.ts
│       ├── news/route.ts
│       ├── search/route.ts
│       └── watchlist/route.ts
├── components/
│   ├── TerminalShell.tsx
│   ├── CommandBar.tsx
│   ├── Panel.tsx
│   ├── panels/
│   │   ├── DesPanel.tsx
│   │   ├── GpPanel.tsx
│   │   ├── NewsPanel.tsx
│   │   ├── WeiPanel.tsx
│   │   ├── TopPanel.tsx
│   │   └── HelpPanel.tsx
│   └── ui/                 # primitives mínimas (no card library)
├── lib/
│   ├── commands/
│   │   ├── parser.ts
│   │   ├── registry.ts
│   │   └── types.ts
│   ├── providers/
│   │   ├── types.ts        # MarketDataProvider interface
│   │   ├── mock.ts         # datos fake para UI sin API keys
│   │   ├── yahoo.ts        # o finnhub.ts
│   │   └── index.ts        # factory por env
│   ├── db/                 # schema + queries
│   └── format.ts           # precios, % , market cap
└── public/
```

---

## 9. Capa de datos

### Interface (obligatoria)

```ts
export type Range = "1D" | "5D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y";

export interface Quote {
  symbol: string;
  name: string;
  exchange?: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  open?: number;
  high?: number;
  low?: number;
  prevClose?: number;
  volume?: number;
  marketCap?: number;
  pe?: number;
  eps?: number;
  week52High?: number;
  week52Low?: number;
  sector?: string;
  industry?: string;
  asOf: string; // ISO
}

export interface Candle {
  time: number; // unix sec
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  url: string;
  publishedAt: string;
  symbol?: string;
}

export interface SymbolHit {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
}

export interface MarketDataProvider {
  quote(symbol: string): Promise<Quote>;
  candles(symbol: string, range: Range): Promise<Candle[]>;
  news(symbol: string): Promise<NewsItem[]>;
  search(q: string): Promise<SymbolHit[]>;
  topMovers?(): Promise<{ gainers: Quote[]; losers: Quote[] }>;
}
```

### Providers

| Env | Provider | Uso |
|-----|----------|-----|
| `MARKET_DATA_PROVIDER=mock` | `mock.ts` | Default local / CI / demos |
| `MARKET_DATA_PROVIDER=finnhub` | Finnhub | Quotes + news (API key) |
| `MARKET_DATA_PROVIDER=yahoo` | Yahoo unofficial | Charts/candles fallback |

**Regla:** la UI nunca importa un provider concreto; solo `lib/providers`.

### Cache TTL

| Dato | TTL |
|------|-----|
| quote | 15–30s |
| candles (intraday) | 60s |
| candles (daily+) | 5–15m |
| news | 5m |
| search | 1h |

### Modelo DB (Fase 2+)

```
User(id, email, name, role: member|admin, createdAt)
Watchlist(id, name, isClubDefault, createdBy)
WatchlistItem(id, watchlistId, symbol, sortOrder)
Favorite(userId, symbol)
CommandLog(optional, userId, raw, createdAt)  -- analytics club
```

---

## 10. Auth y permisos

| Acción | Guest (local mock) | Member | Admin |
|--------|--------------------|--------|-------|
| Usar DES/GP/N/TOP/HELP | sí (dev) | sí | sí |
| Ver WEI club | sí | sí | sí |
| Editar WEI club | no | no | sí |
| FAV personal | no | sí | sí |

En MVP sin auth: modo demo con mock provider + watchlist hardcodeada en config.

---

## 11. Fases de implementación (Cursor)

### Fase 0 — Skeleton (ship primero)

- [ ] Next.js + Tailwind + fonts IBM Plex
- [ ] `TerminalShell` 2×2 + topbar + command bar
- [ ] Parser + registry (`HELP` funciona)
- [ ] Paneles renderizan con **mock provider**
- [ ] Tab / 1–4 / `/` atajos
- [ ] Tema CSS variables aplicados

**DoD:** `pnpm dev` → se ve terminal oscuro; `HELP` y `DES AAPL` muestran mock.

### Fase 1 — Market data real

- [ ] API routes `/api/quote`, `/api/candles`, `/api/news`, `/api/search`
- [ ] Provider Finnhub o Yahoo detrás de la interface
- [ ] TanStack Query en paneles
- [ ] `GP` con Lightweight Charts
- [ ] Manejo not-found / rate-limit / errors en UI densa
- [ ] `.env.example` con keys

**DoD:** con API key, `GP AAPL 1Y` y `N AAPL` muestran datos reales.

### Fase 2 — Club

- [ ] Auth (NextAuth/Clerk)
- [ ] Postgres: users, watchlists, favorites
- [ ] `WEI` lee watchlist club; admin edita
- [ ] `FAV` por usuario
- [ ] Persistencia layout (opcional: localStorage primero)

**DoD:** dos usuarios ven la misma WEI club; FAV es personal.

### Fase 3 — Research+

- [ ] `TOP` gainers/losers
- [ ] Búsqueda fuzzy en command bar (autocomplete símbolos)
- [ ] `MAX` / `GRID`
- [ ] Soporte explícito `.SN` (IPSA watchlist seed)
- [ ] Historial de comandos persistente

### Fase 4 — Live (opcional)

- [ ] Polling quotes cada 15s en paneles visibles
- [ ] Alertas de precio (email o in-app)
- [ ] Pop-out de panel (multi-monitor)

---

## 12. Criterios de aceptación (MVP = Fase 0+1)

1. Command bar ejecuta `DES`, `GP`, `N`, `WEI`, `HELP` sin errores de UI
2. Símbolo desconocido → mensaje claro, no crash
3. Gráfico interactivo con crosshair y cambio de rango
4. News abre links externos
5. Mock mode funciona **sin** API keys
6. Lighthouse no es prioridad; densidad y latencia percibida sí
7. README explica setup en &lt;10 líneas

---

## 13. Config y secretos

```env
MARKET_DATA_PROVIDER=mock
FINNHUB_API_KEY=
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

Nunca commitear keys. `.env.example` sí.

---

## 14. Seeds iniciales (club)

Watchlist club sugerida (editable):

```
AAPL, MSFT, NVDA, AMZN, GOOGL, META, TSLA,
COPEC.SN, SQM-B.SN, CHILE.SN, BSANTANDER.SN, FALABELLA.SN
```

---

## 15. Calidad

- TypeScript strict
- ESLint + Prettier
- Tests unitarios del **parser** (`vitest`) — prioritario
- Test smoke del mock provider
- No screenshots en CI obligatorios

### Prompt sugerido para Cursor (implementación)

```
Lee SPEC.md y AGENTS.md. Implementá la Fase 0 completa del Terminal de Finanzas.
No inventes funciones fuera del spec. Usá mock provider. Cumplí el DoD de Fase 0.
Cuando termine Fase 0, pará y esperá confirmación antes de Fase 1.
```

---

## 16. Fuera de alcance explícito / deuda consciente

- Fundamentals profundos (income statement completo) → post Fase 3
- Screener tipo `EQS` → post Fase 3
- i18n completo (UI en español OK; códigos de función en inglés estilo Bloomberg)
- Dark/light toggle — solo dark terminal

---

## 17. Decisiones abiertas (defaults si no hay respuesta)

| Pregunta | Default del spec |
|----------|------------------|
| Auth provider | NextAuth + Google |
| Market data | mock → Finnhub |
| Package manager | pnpm |
| Deploy | Vercel |
| Idioma UI | Español (labels) + códigos EN |
| Monorepo | No — single Next.js app |

---

*Fin del spec v1.0 — cualquier cambio de alcance se versiona aquí antes de codear.*
