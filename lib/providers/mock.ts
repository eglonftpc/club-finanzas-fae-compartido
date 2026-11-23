import { CLUB_WATCHLIST } from "@/lib/config";
import type {
  Candle,
  MarketDataProvider,
  NewsItem,
  Quote,
  Range,
  SymbolHit,
} from "./types";

type Seed = {
  name: string;
  exchange: string;
  currency: string;
  price: number;
  sector: string;
  industry: string;
  marketCap: number;
  pe: number;
  eps: number;
};

const SEEDS: Record<string, Seed> = {
  AAPL: {
    name: "Apple Inc",
    exchange: "NASDAQ",
    currency: "USD",
    price: 227.52,
    sector: "Technology",
    industry: "Consumer Electronics",
    marketCap: 3.45e12,
    pe: 35.2,
    eps: 6.46,
  },
  MSFT: {
    name: "Microsoft Corp",
    exchange: "NASDAQ",
    currency: "USD",
    price: 428.15,
    sector: "Technology",
    industry: "Software",
    marketCap: 3.18e12,
    pe: 36.1,
    eps: 11.86,
  },
  NVDA: {
    name: "NVIDIA Corp",
    exchange: "NASDAQ",
    currency: "USD",
    price: 138.45,
    sector: "Technology",
    industry: "Semiconductors",
    marketCap: 3.4e12,
    pe: 62.4,
    eps: 2.22,
  },
  AMZN: {
    name: "Amazon.com Inc",
    exchange: "NASDAQ",
    currency: "USD",
    price: 198.72,
    sector: "Consumer Cyclical",
    industry: "Internet Retail",
    marketCap: 2.08e12,
    pe: 42.8,
    eps: 4.64,
  },
  GOOGL: {
    name: "Alphabet Inc Class A",
    exchange: "NASDAQ",
    currency: "USD",
    price: 176.38,
    sector: "Communication Services",
    industry: "Internet Content",
    marketCap: 2.15e12,
    pe: 24.5,
    eps: 7.2,
  },
  META: {
    name: "Meta Platforms Inc",
    exchange: "NASDAQ",
    currency: "USD",
    price: 582.91,
    sector: "Communication Services",
    industry: "Internet Content",
    marketCap: 1.48e12,
    pe: 28.3,
    eps: 20.6,
  },
  TSLA: {
    name: "Tesla Inc",
    exchange: "NASDAQ",
    currency: "USD",
    price: 248.5,
    sector: "Consumer Cyclical",
    industry: "Auto Manufacturers",
    marketCap: 7.9e11,
    pe: 68.2,
    eps: 3.64,
  },
  "COPEC.SN": {
    name: "Empresas Copec SA",
    exchange: "BCS",
    currency: "CLP",
    price: 6850,
    sector: "Energy",
    industry: "Oil & Gas",
    marketCap: 8.9e12,
    pe: 12.4,
    eps: 552,
  },
  "SQM-B.SN": {
    name: "Sociedad Quimica y Minera de Chile",
    exchange: "BCS",
    currency: "CLP",
    price: 38250,
    sector: "Basic Materials",
    industry: "Specialty Chemicals",
    marketCap: 1.1e13,
    pe: 18.2,
    eps: 2100,
  },
  "CHILE.SN": {
    name: "Banco de Chile",
    exchange: "BCS",
    currency: "CLP",
    price: 118.5,
    sector: "Financials",
    industry: "Banks",
    marketCap: 1.2e13,
    pe: 11.1,
    eps: 10.7,
  },
  "BSANTANDER.SN": {
    name: "Banco Santander Chile",
    exchange: "BCS",
    currency: "CLP",
    price: 48.2,
    sector: "Financials",
    industry: "Banks",
    marketCap: 9.1e12,
    pe: 10.4,
    eps: 4.63,
  },
  "FALABELLA.SN": {
    name: "Falabella SA",
    exchange: "BCS",
    currency: "CLP",
    price: 3120,
    sector: "Consumer Cyclical",
    industry: "Department Stores",
    marketCap: 7.8e12,
    pe: 22.5,
    eps: 138.7,
  },
};

function hashSymbol(symbol: string): number {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) {
    h = (h * 31 + symbol.charCodeAt(i)) >>> 0;
  }
  return h;
}

function resolveSymbol(raw: string): string {
  const upper = raw.trim().toUpperCase();
  if (SEEDS[upper]) return upper;
  if (!upper.includes(".") && SEEDS[`${upper}.SN`]) return `${upper}.SN`;
  return upper;
}

function seededQuote(symbol: string): Quote {
  const key = resolveSymbol(symbol);
  const seed = SEEDS[key];
  const h = hashSymbol(key);
  const drift = ((h % 200) - 100) / 10000;
  const base = seed?.price ?? 100 + (h % 400);

  const changePercent = Number((((h % 700) - 350) / 100 + drift * 100).toFixed(2));
  const change = Number(((base * changePercent) / 100).toFixed(seed?.currency === "CLP" ? 0 : 2));
  const price = Number((base + change).toFixed(seed?.currency === "CLP" ? 0 : 2));
  const prevClose = base;
  const open = Number((prevClose * (1 + ((h % 40) - 20) / 10000)).toFixed(2));
  const high = Math.max(price, open, prevClose) * (1 + (h % 15) / 10000);
  const low = Math.min(price, open, prevClose) * (1 - (h % 15) / 10000);

  return {
    symbol: key,
    name: seed?.name ?? `${key} Holdings`,
    exchange: seed?.exchange ?? "OTC",
    currency: seed?.currency ?? "USD",
    price,
    change,
    changePercent,
    open: Number(open.toFixed(2)),
    high: Number(high.toFixed(2)),
    low: Number(low.toFixed(2)),
    prevClose,
    volume: 1_000_000 + (h % 9_000_000),
    avgVolume: 5_000_000 + (h % 20_000_000),
    marketCap: seed?.marketCap ?? 1e10 + h * 1e5,
    pe: seed?.pe ?? 15 + (h % 40),
    eps: seed?.eps ?? Number((price / (15 + (h % 40))).toFixed(2)),
    week52High: Number((price * 1.28).toFixed(2)),
    week52Low: Number((price * 0.72).toFixed(2)),
    sector: seed?.sector ?? "Unknown",
    industry: seed?.industry ?? "Unknown",
    asOf: new Date().toISOString(),
  };
}

function daysForRange(range: Range): number {
  switch (range) {
    case "1D":
      return 1;
    case "5D":
      return 5;
    case "1M":
      return 22;
    case "3M":
      return 66;
    case "6M":
      return 132;
    case "YTD": {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      return Math.max(1, Math.floor((now.getTime() - start.getTime()) / 86_400_000));
    }
    case "1Y":
      return 252;
    case "5Y":
      return 252 * 5;
    default:
      return 66;
  }
}

function buildCandles(symbol: string, range: Range): Candle[] {
  const quote = seededQuote(symbol);
  const days = daysForRange(range);
  const h = hashSymbol(quote.symbol);
  const now = Math.floor(Date.now() / 1000);
  const step = range === "1D" ? 300 : 86_400;
  const points = range === "1D" ? 78 : days;

  // Build path ending exactly at quote.price so DES/WEI/GP stay consistent.
  const candles: Candle[] = [];
  let price = quote.price * 0.88;
  for (let i = points; i >= 1; i--) {
    const t = (points - i) / points;
    const target = quote.price * (0.88 + 0.12 * t);
    const wave = Math.sin((points - i + h) / 9) * (quote.price * 0.008);
    const open = price;
    const close = Math.max(0.01, target + wave);
    const high = Math.max(open, close) * (1 + ((h + i) % 8) / 1000);
    const low = Math.min(open, close) * (1 - ((h + i) % 8) / 1000);
    candles.push({
      time: now - i * step,
      open: Number(open.toFixed(4)),
      high: Number(high.toFixed(4)),
      low: Number(low.toFixed(4)),
      close: Number(close.toFixed(4)),
      volume: 500_000 + ((h + i * 13) % 2_000_000),
    });
    price = close;
  }

  const lastOpen = price;
  const lastClose = quote.price;
  candles.push({
    time: now,
    open: Number(lastOpen.toFixed(4)),
    high: Number(Math.max(lastOpen, lastClose).toFixed(4)),
    low: Number(Math.min(lastOpen, lastClose).toFixed(4)),
    close: lastClose,
    volume: quote.volume,
  });

  return candles;
}

const HEADLINES = [
  "Analysts raise target ahead of earnings",
  "Volume spikes on institutional flows",
  "Sector peers move after macro print",
  "Club FAE research note: positioning update",
  "Options market shows elevated implied vol",
  "Management comments on guidance outlook",
];

function buildNews(symbol: string): NewsItem[] {
  const key = resolveSymbol(symbol);
  const h = hashSymbol(key);
  return Array.from({ length: 8 }, (_, i) => {
    const published = new Date(Date.now() - (i * 3 + (h % 5)) * 3_600_000);
    return {
      id: `${key}-${i}`,
      headline: `${key}: ${HEADLINES[(h + i) % HEADLINES.length]}`,
      source: ["Reuters", "Bloomberg", "DF", "Club FAE"][(h + i) % 4],
      url: `https://example.com/news/${key.toLowerCase()}/${i}`,
      publishedAt: published.toISOString(),
      symbol: key,
    };
  });
}

const UNIVERSE: SymbolHit[] = Object.entries(SEEDS).map(([symbol, seed]) => ({
  symbol,
  name: seed.name,
  exchange: seed.exchange,
  type: "Equity",
}));

export const mockProvider: MarketDataProvider = {
  async quote(symbol) {
    const key = resolveSymbol(symbol);
    if (!key) throw new Error("Symbol required");
    return seededQuote(key);
  },

  async candles(symbol, range) {
    return buildCandles(symbol, range);
  },

  async news(symbol) {
    return buildNews(symbol);
  },

  async search(q) {
    const query = q.trim().toUpperCase();
    if (!query) return UNIVERSE.slice(0, 12);
    return UNIVERSE.filter(
      (s) =>
        s.symbol.includes(query) ||
        s.name.toUpperCase().includes(query) ||
        s.symbol.replace(".SN", "") === query,
    ).slice(0, 12);
  },

  async topMovers() {
    const quotes = await Promise.all(
      CLUB_WATCHLIST.map((s) => seededQuote(s)),
    );
    const sorted = [...quotes].sort(
      (a, b) => b.changePercent - a.changePercent,
    );
    return {
      gainers: sorted.filter((q) => q.changePercent > 0).slice(0, 5),
      losers: [...sorted]
        .filter((q) => q.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 5),
    };
  },
};
