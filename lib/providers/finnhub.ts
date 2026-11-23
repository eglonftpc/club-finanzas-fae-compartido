import type {
  Candle,
  MarketDataProvider,
  NewsItem,
  Quote,
  Range,
  SymbolHit,
} from "./types";

const BASE = "https://finnhub.io/api/v1";

function apiKey(): string {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY no configurada");
  return key;
}

async function finnhub<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("token", apiKey());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (res.status === 429) {
    throw new Error("RATE_LIMIT");
  }
  if (!res.ok) {
    throw new Error(`Finnhub error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function rangeToUnix(range: Range): { from: number; to: number; resolution: string } {
  const to = Math.floor(Date.now() / 1000);
  const day = 86_400;
  switch (range) {
    case "1D":
      return { from: to - day, to, resolution: "5" };
    case "5D":
      return { from: to - 5 * day, to, resolution: "15" };
    case "1M":
      return { from: to - 30 * day, to, resolution: "60" };
    case "3M":
      return { from: to - 90 * day, to, resolution: "D" };
    case "6M":
      return { from: to - 180 * day, to, resolution: "D" };
    case "YTD": {
      const start = new Date(new Date().getFullYear(), 0, 1);
      return { from: Math.floor(start.getTime() / 1000), to, resolution: "D" };
    }
    case "1Y":
      return { from: to - 365 * day, to, resolution: "D" };
    case "5Y":
      return { from: to - 5 * 365 * day, to, resolution: "W" };
    default:
      return { from: to - 90 * day, to, resolution: "D" };
  }
}

type FinnhubQuote = {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
};

type FinnhubProfile = {
  name?: string;
  exchange?: string;
  currency?: string;
  finnhubIndustry?: string;
  marketCapitalization?: number;
};

type FinnhubCandle = {
  s: string;
  t?: number[];
  o?: number[];
  h?: number[];
  l?: number[];
  c?: number[];
  v?: number[];
};

type FinnhubNews = {
  id: number;
  headline: string;
  source: string;
  url: string;
  datetime: number;
  related?: string;
}[];

type FinnhubSearch = {
  count: number;
  result: { symbol: string; description: string; displaySymbol: string; type: string }[];
};

type FinnhubMetric = {
  metric?: {
    peNormalizedAnnual?: number;
    epsNormalizedAnnual?: number;
    "52WeekHigh"?: number;
    "52WeekLow"?: number;
  };
};

export const finnhubProvider: MarketDataProvider = {
  async quote(symbol: string): Promise<Quote> {
    const sym = symbol.toUpperCase();
    const [q, profile, metric] = await Promise.all([
      finnhub<FinnhubQuote>("/quote", { symbol: sym }),
      finnhub<FinnhubProfile>("/stock/profile2", { symbol: sym }),
      finnhub<FinnhubMetric>("/stock/metric", { symbol: sym, metric: "all" }),
    ]);

    if (!q || q.c === 0) {
      throw new Error("NOT_FOUND");
    }

    return {
      symbol: sym,
      name: profile.name ?? sym,
      exchange: profile.exchange,
      currency: profile.currency ?? "USD",
      price: q.c,
      change: q.d,
      changePercent: q.dp,
      open: q.o,
      high: q.h,
      low: q.l,
      prevClose: q.pc,
      marketCap: profile.marketCapitalization
        ? profile.marketCapitalization * 1_000_000
        : undefined,
      pe: metric.metric?.peNormalizedAnnual,
      eps: metric.metric?.epsNormalizedAnnual,
      week52High: metric.metric?.["52WeekHigh"],
      week52Low: metric.metric?.["52WeekLow"],
      industry: profile.finnhubIndustry,
      sector: profile.finnhubIndustry,
      asOf: new Date((q.t || Date.now() / 1000) * 1000).toISOString(),
    };
  },

  async candles(symbol: string, range: Range): Promise<Candle[]> {
    const { from, to, resolution } = rangeToUnix(range);
    const data = await finnhub<FinnhubCandle>("/stock/candle", {
      symbol: symbol.toUpperCase(),
      resolution,
      from: String(from),
      to: String(to),
    });

    if (data.s !== "ok" || !data.t?.length) {
      throw new Error("NOT_FOUND");
    }

    return data.t.map((t, i) => ({
      time: t,
      open: data.o![i],
      high: data.h![i],
      low: data.l![i],
      close: data.c![i],
      volume: data.v?.[i],
    }));
  },

  async news(symbol: string): Promise<NewsItem[]> {
    const to = new Date();
    const from = new Date(Date.now() - 7 * 86_400_000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const items = await finnhub<FinnhubNews>("/company-news", {
      symbol: symbol.toUpperCase(),
      from: fmt(from),
      to: fmt(to),
    });

    return (items ?? []).slice(0, 30).map((n) => ({
      id: String(n.id),
      headline: n.headline,
      source: n.source,
      url: n.url,
      publishedAt: new Date(n.datetime * 1000).toISOString(),
      symbol: symbol.toUpperCase(),
    }));
  },

  async search(q: string): Promise<SymbolHit[]> {
    const data = await finnhub<FinnhubSearch>("/search", { q });
    return (data.result ?? []).slice(0, 12).map((r) => ({
      symbol: r.symbol,
      name: r.description,
      type: r.type,
    }));
  },
};
