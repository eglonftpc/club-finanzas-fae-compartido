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
  avgVolume?: number;
  marketCap?: number;
  pe?: number;
  eps?: number;
  week52High?: number;
  week52Low?: number;
  sector?: string;
  industry?: string;
  asOf: string;
}

export interface Candle {
  time: number;
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

export const RANGES: Range[] = [
  "1D",
  "5D",
  "1M",
  "3M",
  "6M",
  "YTD",
  "1Y",
  "5Y",
];

export function isRange(value: string): value is Range {
  return (RANGES as string[]).includes(value);
}
