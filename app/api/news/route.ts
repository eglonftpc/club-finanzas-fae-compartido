import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";
import { getMarketDataProvider } from "@/lib/providers";
import type { NewsItem } from "@/lib/providers/types";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.trim();
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  const key = `news:${symbol.toUpperCase()}`;
  const cached = cacheGet<NewsItem[]>(key);
  if (cached) return NextResponse.json(cached);

  try {
    const news = await getMarketDataProvider().news(symbol);
    cacheSet(key, news, 300_000);
    return NextResponse.json(news);
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    const status = message === "NOT_FOUND" ? 404 : message === "RATE_LIMIT" ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
