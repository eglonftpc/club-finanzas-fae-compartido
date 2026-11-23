"use client";

import { useEffect, useRef } from "react";
import { parseCommand } from "@/lib/commands/parser";
import { useTerminalStore } from "@/lib/store";

export function CommandBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const command = useTerminalStore((s) => s.command);
  const setCommand = useTerminalStore((s) => s.setCommand);
  const setStatus = useTerminalStore((s) => s.setStatus);
  const pushHistory = useTerminalStore((s) => s.pushHistory);
  const historyUp = useTerminalStore((s) => s.historyUp);
  const historyDown = useTerminalStore((s) => s.historyDown);
  const applyToActive = useTerminalStore((s) => s.applyToActive);
  const setMaximized = useTerminalStore((s) => s.setMaximized);
  const cycleActivePanel = useTerminalStore((s) => s.cycleActivePanel);
  const setActivePanel = useTerminalStore((s) => s.setActivePanel);
  const toggleFavorite = useTerminalStore((s) => s.toggleFavorite);
  const activePanelId = useTerminalStore((s) => s.activePanelId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (e.key === "/" || e.key === "F1") {
        if (!typing || e.key === "F1") {
          e.preventDefault();
          inputRef.current?.focus();
          return;
        }
      }

      if (e.key === "Escape") {
        inputRef.current?.blur();
        setMaximized(false);
        return;
      }

      if (typing) return;

      if (e.key === "Tab") {
        e.preventDefault();
        cycleActivePanel();
        return;
      }

      if (["1", "2", "3", "4"].includes(e.key)) {
        setActivePanel(Number(e.key) as 1 | 2 | 3 | 4);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycleActivePanel, setActivePanel, setMaximized]);

  function execute() {
    const raw = command.trim();
    if (!raw) return;

    const result = parseCommand(raw);
    pushHistory(raw);
    setCommand("");

    if (!result.ok) {
      setStatus(result.error.error);
      return;
    }

    const { fn, symbol, range } = result.command;

    if (fn === "MAX") {
      setMaximized(true);
      setStatus(`MAX panel ${activePanelId}`);
      return;
    }
    if (fn === "GRID") {
      setMaximized(false);
      setStatus("GRID 2×2");
      return;
    }

    if (fn === "FAV" && symbol) {
      toggleFavorite(symbol);
      applyToActive({ fn: "FAV" });
      setStatus(`FAV toggled ${symbol}`);
      return;
    }

    applyToActive({ fn, symbol, range });
    setStatus(
      [fn, symbol, range].filter(Boolean).join(" ") + ` → panel ${activePanelId}`,
    );
  }

  return (
    <div className="flex h-10 shrink-0 items-center gap-2 border-t border-[var(--border)] bg-[var(--bg)] px-2">
      <span className="font-mono text-xs text-[var(--accent)]">CMD</span>
      <span className="font-mono text-[var(--accent)]">▌</span>
      <input
        ref={inputRef}
        value={command}
        onChange={(e) => setCommand(e.target.value.toUpperCase())}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            execute();
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            historyUp();
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            historyDown();
          }
        }}
        spellCheck={false}
        autoComplete="off"
        placeholder="DES AAPL · GP COPEC.SN 1Y · N TSLA · WEI · HELP"
        className="min-w-0 flex-1 bg-transparent font-mono text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
        aria-label="Command bar"
      />
      <span className="hidden font-mono text-[10px] text-[var(--muted)] sm:inline">
        Enter ↵
      </span>
    </div>
  );
}
