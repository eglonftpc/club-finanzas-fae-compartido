"use client";

import type { ReactNode } from "react";
import { useTerminalStore } from "@/lib/store";
import type { PanelState } from "@/lib/commands/types";

interface PanelProps {
  panel: PanelState;
  children: ReactNode;
}

export function Panel({ panel, children }: PanelProps) {
  const activePanelId = useTerminalStore((s) => s.activePanelId);
  const maximized = useTerminalStore((s) => s.maximized);
  const setActivePanel = useTerminalStore((s) => s.setActivePanel);
  const setMaximized = useTerminalStore((s) => s.setMaximized);
  const active = activePanelId === panel.id;

  const showSymbol = panel.fn === "DES" || panel.fn === "GP" || panel.fn === "N";
  const title = [
    panel.fn,
    showSymbol ? panel.symbol : null,
    panel.fn === "GP" ? panel.range : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      role="region"
      aria-label={`Panel ${panel.id} ${title}`}
      onMouseDown={() => setActivePanel(panel.id)}
      className={`flex min-h-0 flex-col border bg-[var(--bg-panel)] ${
        active ? "border-[var(--accent)]" : "border-[var(--border)]"
      } ${maximized && !active ? "hidden" : ""} ${
        maximized && active ? "col-span-2 row-span-2" : ""
      }`}
    >
      <header
        className="flex h-7 shrink-0 items-center justify-between border-b border-[var(--border)] px-2"
        onDoubleClick={() => setMaximized(!maximized)}
      >
        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-[10px] ${
              active ? "text-[var(--accent)]" : "text-[var(--muted)]"
            }`}
          >
            {panel.id}
          </span>
          <span className="font-mono text-[11px] tracking-wide text-[var(--text)]">
            {title}
          </span>
        </div>
        <span className="font-mono text-[10px] text-[var(--muted)]">
          {active ? "ACTIVE" : ""}
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-2">{children}</div>
    </section>
  );
}
