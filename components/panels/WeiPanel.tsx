"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWatchlist } from "@/lib/api-client";
import {
  changeTone,
  formatPercent,
  formatPrice,
  formatVolume,
} from "@/lib/format";
import { useTerminalStore } from "@/lib/store";
import { PanelError, PanelLoading } from "@/components/ui/PanelStatus";

export function WeiPanel() {
  const applyToActive = useTerminalStore((s) => s.applyToActive);
  const setStatus = useTerminalStore((s) => s.setStatus);

  const { data, isLoading, error } = useQuery({
    queryKey: ["watchlist"],
    queryFn: fetchWatchlist,
    staleTime: 15_000,
    refetchInterval: 20_000,
  });

  if (isLoading) return <PanelLoading />;
  if (error || !data) {
    return <PanelError message={error instanceof Error ? error.message : "ERR"} />;
  }

  return (
    <div className="h-full overflow-auto">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wide text-[var(--muted)]">
        {data.name} · {data.items.length} names
      </div>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="font-mono text-[10px] text-[var(--muted)]">
            <th className="py-1 font-normal">Symbol</th>
            <th className="py-1 font-normal text-right">Last</th>
            <th className="py-1 font-normal text-right">Chg%</th>
            <th className="py-1 font-normal text-right">Vol</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((q) => {
            const tone = changeTone(q.changePercent);
            const toneClass =
              tone === "up"
                ? "text-[var(--up)]"
                : tone === "down"
                  ? "text-[var(--down)]"
                  : "text-[var(--text)]";
            return (
              <tr
                key={q.symbol}
                tabIndex={0}
                className="cursor-pointer border-t border-[var(--border)] font-mono text-xs hover:bg-[#161b22]"
                onClick={() => {
                  applyToActive({ fn: "DES", symbol: q.symbol });
                  setStatus(`DES ${q.symbol}`);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    applyToActive({ fn: "DES", symbol: q.symbol });
                    setStatus(`DES ${q.symbol}`);
                  }
                }}
              >
                <td className="py-1 text-[var(--text)]">{q.symbol}</td>
                <td className="py-1 text-right tabular-nums text-[var(--text)]">
                  {formatPrice(q.price, q.currency)}
                </td>
                <td className={`py-1 text-right tabular-nums ${toneClass}`}>
                  {formatPercent(q.changePercent)}
                </td>
                <td className="py-1 text-right tabular-nums text-[var(--muted)]">
                  {formatVolume(q.volume)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
