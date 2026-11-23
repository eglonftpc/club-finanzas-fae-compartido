"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTop } from "@/lib/api-client";
import { formatPercent, formatPrice } from "@/lib/format";
import { useTerminalStore } from "@/lib/store";
import { PanelError, PanelLoading } from "@/components/ui/PanelStatus";

function MoversTable({
  title,
  items,
  tone,
}: {
  title: string;
  items: { symbol: string; price: number; changePercent: number; currency: string }[];
  tone: "up" | "down";
}) {
  const applyToActive = useTerminalStore((s) => s.applyToActive);
  const setStatus = useTerminalStore((s) => s.setStatus);
  const color = tone === "up" ? "text-[var(--up)]" : "text-[var(--down)]";

  return (
    <div className="min-w-0 flex-1">
      <div className={`mb-1 font-mono text-[10px] uppercase ${color}`}>{title}</div>
      <table className="w-full">
        <tbody>
          {items.map((q) => (
            <tr
              key={q.symbol}
              className="cursor-pointer border-t border-[var(--border)] font-mono text-xs hover:bg-[#161b22]"
              onClick={() => {
                applyToActive({ fn: "DES", symbol: q.symbol });
                setStatus(`DES ${q.symbol}`);
              }}
            >
              <td className="py-1 text-[var(--text)]">{q.symbol}</td>
              <td className="py-1 text-right tabular-nums">
                {formatPrice(q.price, q.currency)}
              </td>
              <td className={`py-1 text-right tabular-nums ${color}`}>
                {formatPercent(q.changePercent)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TopPanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["top"],
    queryFn: fetchTop,
    staleTime: 30_000,
  });

  if (isLoading) return <PanelLoading />;
  if (error || !data) {
    return <PanelError message={error instanceof Error ? error.message : "ERR"} />;
  }

  return (
    <div className="flex h-full flex-col gap-3 sm:flex-row">
      <MoversTable title="Gainers" items={data.gainers} tone="up" />
      <MoversTable title="Losers" items={data.losers} tone="down" />
    </div>
  );
}
