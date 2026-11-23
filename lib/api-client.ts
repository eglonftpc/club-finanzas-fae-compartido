import type { Candle, NewsItem, Quote, Range, SymbolHit } from "@/lib/providers/types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchQuote(symbol: string) {
  return getJson<Quote>(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
}

export function fetchCandles(symbol: string, range: Range) {
  return getJson<Candle[]>(
    `/api/candles?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`,
  );
}

export function fetchNews(symbol: string) {
  return getJson<NewsItem[]>(`/api/news?symbol=${encodeURIComponent(symbol)}`);
}

export function fetchWatchlist() {
  return getJson<{ name: string; items: Quote[] }>("/api/watchlist");
}

export function fetchTop() {
  return getJson<{ gainers: Quote[]; losers: Quote[] }>("/api/top");
}

export function fetchSearch(q: string) {
  return getJson<SymbolHit[]>(`/api/search?q=${encodeURIComponent(q)}`);
}

export function fetchQuotes(symbols: string[]) {
  return Promise.all(symbols.map((s) => fetchQuote(s)));
}
