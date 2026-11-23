import type { Range } from "@/lib/providers/types";

export type FunctionCode =
  | "DES"
  | "GP"
  | "N"
  | "WEI"
  | "FAV"
  | "TOP"
  | "HELP"
  | "MAX"
  | "GRID";

export type PanelKind = FunctionCode;

export interface ParsedCommand {
  raw: string;
  fn: FunctionCode;
  symbol?: string;
  range?: Range;
  args: string[];
}

export interface ParseError {
  error: string;
  raw: string;
}

export type ParseResult =
  | { ok: true; command: ParsedCommand }
  | { ok: false; error: ParseError };

export interface PanelState {
  id: 1 | 2 | 3 | 4;
  fn: PanelKind;
  symbol?: string;
  range?: Range;
}

export const FUNCTION_ALIASES: Record<string, FunctionCode> = {
  DES: "DES",
  GP: "GP",
  G: "GP",
  N: "N",
  NEWS: "N",
  WEI: "WEI",
  WATCH: "WEI",
  FAV: "FAV",
  TOP: "TOP",
  HELP: "HELP",
  "?": "HELP",
  MAX: "MAX",
  GRID: "GRID",
};

export const FUNCTIONS_NEEDING_SYMBOL = new Set<FunctionCode>([
  "DES",
  "GP",
  "N",
]);
