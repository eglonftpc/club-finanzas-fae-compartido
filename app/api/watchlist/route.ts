import { NextResponse } from "next/server";
import { CLUB_WATCHLIST } from "@/lib/config";
import { cacheGet, cacheSet } from "@/lib/cache";
import { getMarketDataProvider } from "@/lib/providers";
import type { Quote } from "@/lib/providers/types";

export async function GET() {
  const key = "watchlist:club";
  const cached = cacheGet<Quote[]>(key);
  if (cached) return NextResponse.json({ name: "Club FAE", items: cached });

  try {
    const provider = getMarketDataProvider();
    const items = await Promise.all(
      CLUB_WATCHLIST.map((symbol) => provider.quote(symbol)),
    );
    cacheSet(key, items, 20_000);
    return NextResponse.json({ name: "Club FAE", items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
