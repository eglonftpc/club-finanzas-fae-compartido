"use client";

import { create } from "zustand";
import type { FunctionCode, PanelState } from "@/lib/commands/types";
import type { Range } from "@/lib/providers/types";

const HISTORY_LIMIT = 50;

interface TerminalState {
  panels: PanelState[];
  activePanelId: 1 | 2 | 3 | 4;
  maximized: boolean;
  command: string;
  commandHistory: string[];
  historyIndex: number;
  status: string;
  favorites: string[];
  setCommand: (value: string) => void;
  setStatus: (value: string) => void;
  setActivePanel: (id: 1 | 2 | 3 | 4) => void;
  cycleActivePanel: () => void;
  pushHistory: (raw: string) => void;
  historyUp: () => void;
  historyDown: () => void;
  applyToActive: (patch: {
    fn: FunctionCode;
    symbol?: string;
    range?: Range;
  }) => void;
  updatePanel: (
    id: 1 | 2 | 3 | 4,
    patch: { fn?: FunctionCode; symbol?: string; range?: Range },
  ) => void;
  setMaximized: (value: boolean) => void;
  toggleFavorite: (symbol: string) => void;
}

const DEFAULT_PANELS: PanelState[] = [
  { id: 1, fn: "DES", symbol: "AAPL" },
  { id: 2, fn: "GP", symbol: "AAPL", range: "3M" },
  { id: 3, fn: "N", symbol: "AAPL" },
  { id: 4, fn: "WEI" },
];

function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("fae-fav");
    if (!raw) return ["AAPL", "COPEC.SN"];
    return JSON.parse(raw) as string[];
  } catch {
    return ["AAPL", "COPEC.SN"];
  }
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  panels: DEFAULT_PANELS,
  activePanelId: 1,
  maximized: false,
  command: "",
  commandHistory: [],
  historyIndex: -1,
  status: "READY — type HELP",
  favorites: typeof window === "undefined" ? ["AAPL", "COPEC.SN"] : loadFavorites(),

  setCommand: (value) => set({ command: value, historyIndex: -1 }),
  setStatus: (value) => set({ status: value }),
  setActivePanel: (id) => set({ activePanelId: id }),
  cycleActivePanel: () => {
    const current = get().activePanelId;
    const next = (current === 4 ? 1 : current + 1) as 1 | 2 | 3 | 4;
    set({ activePanelId: next });
  },
  pushHistory: (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const prev = get().commandHistory.filter((c) => c !== trimmed);
    set({
      commandHistory: [trimmed, ...prev].slice(0, HISTORY_LIMIT),
      historyIndex: -1,
    });
  },
  historyUp: () => {
    const { commandHistory, historyIndex } = get();
    if (!commandHistory.length) return;
    const next = Math.min(historyIndex + 1, commandHistory.length - 1);
    set({ historyIndex: next, command: commandHistory[next] ?? "" });
  },
  historyDown: () => {
    const { commandHistory, historyIndex } = get();
    if (historyIndex <= 0) {
      set({ historyIndex: -1, command: "" });
      return;
    }
    const next = historyIndex - 1;
    set({ historyIndex: next, command: commandHistory[next] ?? "" });
  },
  applyToActive: (patch) => {
    get().updatePanel(get().activePanelId, patch);
  },
  updatePanel: (id, patch) => {
    set({
      panels: get().panels.map((p) => {
        if (p.id !== id) return p;
        const fn = patch.fn ?? p.fn;
        const symbol = patch.symbol ?? p.symbol;
        let range = p.range;
        if (patch.range !== undefined) range = patch.range;
        else if (fn === "GP") range = p.range ?? "3M";
        else range = undefined;
        return { ...p, fn, symbol, range };
      }),
    });
  },
  setMaximized: (value) => set({ maximized: value }),
  toggleFavorite: (symbol) => {
    const upper = symbol.toUpperCase();
    const current = get().favorites;
    const next = current.includes(upper)
      ? current.filter((s) => s !== upper)
      : [...current, upper];
    set({ favorites: next });
    if (typeof window !== "undefined") {
      localStorage.setItem("fae-fav", JSON.stringify(next));
    }
  },
}));
