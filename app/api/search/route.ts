import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";
import { getMarketDataProvider } from "@/lib/providers";
import type { SymbolHit } from "@/lib/providers/types";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const key = `search:${q.toUpperCase()}`;
  const cached = cacheGet<SymbolHit[]>(key);
  if (cached) return NextResponse.json(cached);

  try {
    const hits = await getMarketDataProvider().search(q);
    cacheSet(key, hits, 3_600_000);
    return NextResponse.json(hits);
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
