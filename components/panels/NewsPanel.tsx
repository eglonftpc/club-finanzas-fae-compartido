"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchNews } from "@/lib/api-client";
import { formatTime } from "@/lib/format";
import { PanelEmpty, PanelError, PanelLoading } from "@/components/ui/PanelStatus";

export function NewsPanel({ symbol }: { symbol?: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["news", symbol],
    queryFn: () => fetchNews(symbol!),
    enabled: Boolean(symbol),
    staleTime: 300_000,
  });

  if (!symbol) return <PanelEmpty message="N — enter SYMBOL" />;
  if (isLoading) return <PanelLoading />;
  if (error) {
    return <PanelError message={error instanceof Error ? error.message : "ERR"} />;
  }
  if (!data?.length) return <PanelEmpty message={`No news for ${symbol}`} />;

  return (
    <ul className="space-y-1">
      {data.map((item) => (
        <li key={item.id} className="border-b border-[var(--border)] py-1">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="block hover:text-[var(--accent)]"
          >
            <div className="flex gap-2 font-mono text-[10px] text-[var(--muted)]">
              <span className="tabular-nums">{formatTime(item.publishedAt)}</span>
              <span>{item.source}</span>
            </div>
            <div className="text-xs leading-snug text-[var(--text)]">
              {item.headline}
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
