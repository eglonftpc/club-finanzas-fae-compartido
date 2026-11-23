import { NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";
import { getMarketDataProvider } from "@/lib/providers";
import type { Quote } from "@/lib/providers/types";

type TopPayload = { gainers: Quote[]; losers: Quote[] };

export async function GET() {
  const key = "top:movers";
  const cached = cacheGet<TopPayload>(key);
  if (cached) return NextResponse.json(cached);

  try {
    const provider = getMarketDataProvider();
    if (!provider.topMovers) {
      return NextResponse.json(
        { error: "TOP not supported by provider" },
        { status: 501 },
      );
    }
    const data = await provider.topMovers();
    cacheSet(key, data, 30_000);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
