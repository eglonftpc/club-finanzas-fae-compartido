"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchQuote } from "@/lib/api-client";
import {
  changeTone,
  formatChange,
  formatCompact,
  formatPercent,
  formatPrice,
  formatTime,
  formatVolume,
} from "@/lib/format";
import { PanelEmpty, PanelError, PanelLoading } from "@/components/ui/PanelStatus";

export function DesPanel({ symbol }: { symbol?: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["quote", symbol],
    queryFn: () => fetchQuote(symbol!),
    enabled: Boolean(symbol),
    staleTime: 15_000,
    refetchInterval: 20_000,
  });

  if (!symbol) return <PanelEmpty message="DES — enter SYMBOL" />;
  if (isLoading) return <PanelLoading />;
  if (error || !data) {
    return <PanelError message={error instanceof Error ? error.message : "NOT_FOUND"} />;
  }

  const tone = changeTone(data.changePercent);
  const toneClass =
    tone === "up"
      ? "text-[var(--up)]"
      : tone === "down"
        ? "text-[var(--down)]"
        : "text-[var(--text)]";

  const stats: [string, string][] = [
    ["Open", formatPrice(data.open, data.currency)],
    ["High", formatPrice(data.high, data.currency)],
    ["Low", formatPrice(data.low, data.currency)],
    ["Prev", formatPrice(data.prevClose, data.currency)],
    ["Vol", formatVolume(data.volume)],
    ["Avg Vol", formatVolume(data.avgVolume)],
    ["Mkt Cap", formatCompact(data.marketCap)],
    ["P/E", data.pe?.toFixed(1) ?? "—"],
    ["EPS", data.eps?.toFixed(2) ?? "—"],
    ["52W H", formatPrice(data.week52High, data.currency)],
    ["52W L", formatPrice(data.week52Low, data.currency)],
    ["Sector", data.sector ?? "—"],
  ];

  return (
    <div className="flex h-full flex-col gap-3">
      <div>
        <div className="flex items-baseline gap-2">
          <h2 className="font-mono text-lg font-semibold tracking-tight text-[var(--text)]">
            {data.symbol}
          </h2>
          <span className="text-xs text-[var(--muted)]">
            {data.name}
            {data.exchange ? ` · ${data.exchange}` : ""}
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-3 font-mono">
          <span className="text-2xl tabular-nums text-[var(--text)]">
            {formatPrice(data.price, data.currency)}
          </span>
          <span className={`text-sm tabular-nums ${toneClass}`}>
            {formatChange(data.change)} ({formatPercent(data.changePercent)})
          </span>
          <span className="text-[10px] text-[var(--muted)]">
            as of {formatTime(data.asOf)}
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline justify-between border-b border-[var(--border)] py-0.5"
          >
            <dt className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
              {label}
            </dt>
            <dd className="font-mono text-xs tabular-nums text-[var(--text)]">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
