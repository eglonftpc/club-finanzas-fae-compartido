import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";
import { getMarketDataProvider, isRange } from "@/lib/providers";
import type { Candle, Range } from "@/lib/providers/types";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.trim();
  const rangeParam = (req.nextUrl.searchParams.get("range") ?? "3M").toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }
  if (!isRange(rangeParam)) {
    return NextResponse.json({ error: "invalid range" }, { status: 400 });
  }

  const range = rangeParam as Range;
  const key = `candles:${symbol.toUpperCase()}:${range}`;
  const cached = cacheGet<Candle[]>(key);
  if (cached) return NextResponse.json(cached);

  try {
    const candles = await getMarketDataProvider().candles(symbol, range);
    const ttl = range === "1D" ? 60_000 : 300_000;
    cacheSet(key, candles, ttl);
    return NextResponse.json(candles);
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    const status = message === "NOT_FOUND" ? 404 : message === "RATE_LIMIT" ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
