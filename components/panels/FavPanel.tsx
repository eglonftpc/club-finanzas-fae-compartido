"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchQuotes } from "@/lib/api-client";
import { changeTone, formatPercent, formatPrice } from "@/lib/format";
import { useTerminalStore } from "@/lib/store";
import { PanelEmpty, PanelError, PanelLoading } from "@/components/ui/PanelStatus";

export function FavPanel() {
  const favorites = useTerminalStore((s) => s.favorites);
  const applyToActive = useTerminalStore((s) => s.applyToActive);
  const toggleFavorite = useTerminalStore((s) => s.toggleFavorite);
  const setStatus = useTerminalStore((s) => s.setStatus);

  const { data, isLoading, error } = useQuery({
    queryKey: ["favorites", favorites],
    queryFn: () => fetchQuotes(favorites),
    enabled: favorites.length > 0,
    staleTime: 15_000,
  });

  if (!favorites.length) {
    return <PanelEmpty message="FAV vacío — usá DES y agregá luego" />;
  }
  if (isLoading) return <PanelLoading />;
  if (error) {
    return <PanelError message={error instanceof Error ? error.message : "ERR"} />;
  }

  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="font-mono text-[10px] text-[var(--muted)]">
          <th className="py-1 font-normal">Symbol</th>
          <th className="py-1 font-normal text-right">Last</th>
          <th className="py-1 font-normal text-right">Chg%</th>
          <th className="py-1 font-normal text-right"> </th>
        </tr>
      </thead>
      <tbody>
        {data?.map((q) => {
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
              className="border-t border-[var(--border)] font-mono text-xs hover:bg-[#161b22]"
            >
              <td
                className="cursor-pointer py-1 text-[var(--text)]"
                onClick={() => {
                  applyToActive({ fn: "DES", symbol: q.symbol });
                  setStatus(`DES ${q.symbol}`);
                }}
              >
                {q.symbol}
              </td>
              <td className="py-1 text-right tabular-nums">
                {formatPrice(q.price, q.currency)}
              </td>
              <td className={`py-1 text-right tabular-nums ${toneClass}`}>
                {formatPercent(q.changePercent)}
              </td>
              <td className="py-1 text-right">
                <button
                  type="button"
                  className="text-[10px] text-[var(--muted)] hover:text-[var(--accent)]"
                  onClick={() => toggleFavorite(q.symbol)}
                >
                  RM
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
