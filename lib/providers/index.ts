import { finnhubProvider } from "./finnhub";
import { mockProvider } from "./mock";
import type { MarketDataProvider } from "./types";

export type ProviderName = "mock" | "finnhub";

export function getProviderName(): ProviderName {
  const raw = (process.env.MARKET_DATA_PROVIDER ?? "mock").toLowerCase();
  if (raw === "finnhub") return "finnhub";
  return "mock";
}

export function getMarketDataProvider(): MarketDataProvider {
  switch (getProviderName()) {
    case "finnhub":
      return finnhubProvider;
    default:
      return mockProvider;
  }
}

export * from "./types";
