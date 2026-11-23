"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { fetchCandles } from "@/lib/api-client";
import { RANGES, type Range } from "@/lib/providers/types";
import { useTerminalStore } from "@/lib/store";
import { PanelEmpty, PanelError, PanelLoading } from "@/components/ui/PanelStatus";

export function GpPanel({
  panelId,
  symbol,
  range = "3M",
}: {
  panelId: 1 | 2 | 3 | 4;
  symbol?: string;
  range?: Range;
}) {
  const updatePanel = useTerminalStore((s) => s.updatePanel);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["candles", symbol, range],
    queryFn: () => fetchCandles(symbol!, range),
    enabled: Boolean(symbol),
    staleTime: range === "1D" ? 60_000 : 300_000,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#11151a" },
        textColor: "#8b98a8",
        fontFamily: "IBM Plex Mono, ui-monospace, monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1e2630" },
        horzLines: { color: "#1e2630" },
      },
      rightPriceScale: { borderColor: "#1e2630" },
      timeScale: { borderColor: "#1e2630" },
      crosshair: {
        vertLine: { color: "#f5a623", labelBackgroundColor: "#f5a623" },
        horzLine: { color: "#f5a623", labelBackgroundColor: "#f5a623" },
      },
    });

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: "#3dd68c",
      downColor: "#f07178",
      borderUpColor: "#3dd68c",
      borderDownColor: "#f07178",
      wickUpColor: "#3dd68c",
      wickDownColor: "#f07178",
    });

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    chart.priceScale("vol").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candles;
    volumeSeriesRef.current = volume;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!data || !candleSeriesRef.current || !volumeSeriesRef.current) return;

    candleSeriesRef.current.setData(
      data.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );

    volumeSeriesRef.current.setData(
      data.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume ?? 0,
        color:
          c.close >= c.open
            ? "rgba(61,214,140,0.4)"
            : "rgba(240,113,120,0.4)",
      })),
    );

    chartRef.current?.timeScale().fitContent();
  }, [data]);

  if (!symbol) return <PanelEmpty message="GP — enter SYMBOL" />;

  return (
    <div className="flex h-full min-h-[180px] flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => updatePanel(panelId, { fn: "GP", symbol, range: r })}
            className={`border px-1.5 py-0.5 font-mono text-[10px] ${
              r === range
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="relative min-h-0 flex-1">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-[var(--bg-panel)]">
            <PanelLoading />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-10 bg-[var(--bg-panel)]">
            <PanelError
              message={error instanceof Error ? error.message : "ERR"}
            />
          </div>
        )}
        <div ref={containerRef} className="h-full min-h-[160px] w-full" />
      </div>
    </div>
  );
}
