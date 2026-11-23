import { isRange } from "@/lib/providers/types";
import {
  FUNCTION_ALIASES,
  FUNCTIONS_NEEDING_SYMBOL,
  type FunctionCode,
  type ParseResult,
} from "./types";

function looksLikeSymbol(token: string): boolean {
  if (!token) return false;
  if (FUNCTION_ALIASES[token]) return false;
  if (isRange(token)) return false;
  // Tickers: AAPL, BRK.B, COPEC.SN, SQM-B.SN
  return /^[A-Z][A-Z0-9.%-]{0,15}$/.test(token);
}

export function parseCommand(input: string): ParseResult {
  const raw = input.trim();
  if (!raw) {
    return {
      ok: false,
      error: { raw, error: "EMPTY — type HELP" },
    };
  }

  const tokens = raw.toUpperCase().split(/\s+/).filter(Boolean);
  const first = tokens[0];

  let fn: FunctionCode;
  let rest: string[];

  if (FUNCTION_ALIASES[first]) {
    fn = FUNCTION_ALIASES[first];
    rest = tokens.slice(1);
  } else if (looksLikeSymbol(first)) {
    fn = "DES";
    rest = tokens;
  } else {
    return {
      ok: false,
      error: {
        raw,
        error: `UNKNOWN FUNCTION "${first}" — type HELP`,
      },
    };
  }

  let symbol: string | undefined;
  let range: import("@/lib/providers/types").Range | undefined;
  const args = [...rest];

  if (FUNCTIONS_NEEDING_SYMBOL.has(fn)) {
    if (!rest[0] || !looksLikeSymbol(rest[0])) {
      return {
        ok: false,
        error: {
          raw,
          error: `${fn} requires SYMBOL — e.g. ${fn} AAPL`,
        },
      };
    }
    symbol = rest[0];
    if (fn === "GP" && rest[1]) {
      if (!isRange(rest[1])) {
        return {
          ok: false,
          error: {
            raw,
            error: `Invalid range "${rest[1]}" — use 1D 5D 1M 3M 6M YTD 1Y 5Y`,
          },
        };
      }
      range = rest[1];
    }
  } else if (fn === "FAV" && rest[0]) {
    if (!looksLikeSymbol(rest[0])) {
      return {
        ok: false,
        error: { raw, error: "FAV [SYMBOL] — símbolo inválido" },
      };
    }
    symbol = rest[0];
  } else if (fn === "GP" && rest[0] && isRange(rest[0])) {
    return {
      ok: false,
      error: {
        raw,
        error: "GP requires SYMBOL — e.g. GP AAPL 3M",
      },
    };
  }

  return {
    ok: true,
    command: {
      raw,
      fn,
      symbol,
      range: range ?? (fn === "GP" ? "3M" : undefined),
      args,
    },
  };
}
