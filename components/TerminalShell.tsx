"use client";

import { CommandBar } from "@/components/CommandBar";
import { Panel } from "@/components/Panel";
import { PanelRouter } from "@/components/PanelRouter";
import { TopBar } from "@/components/TopBar";
import { useTerminalStore } from "@/lib/store";

export function TerminalShell() {
  const panels = useTerminalStore((s) => s.panels);
  const maximized = useTerminalStore((s) => s.maximized);
  const activePanelId = useTerminalStore((s) => s.activePanelId);

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-[var(--bg)] text-[var(--text)]">
      <TopBar />
      <main
        className={`min-h-0 flex-1 gap-1 p-1 ${
          maximized
            ? "grid grid-cols-1 grid-rows-1"
            : "grid grid-cols-1 grid-rows-4 md:grid-cols-2 md:grid-rows-2"
        }`}
      >
        {panels.map((panel) => {
          if (maximized && panel.id !== activePanelId) return null;
          return (
            <Panel key={panel.id} panel={panel}>
              <PanelRouter panel={panel} />
            </Panel>
          );
        })}
      </main>
      <CommandBar />
    </div>
  );
}
