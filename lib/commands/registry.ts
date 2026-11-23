import type { FunctionCode } from "./types";

export interface CommandHelp {
  code: FunctionCode;
  aliases?: string[];
  usage: string;
  description: string;
}

export const COMMAND_HELP: CommandHelp[] = [
  {
    code: "DES",
    usage: "DES <SYMBOL> | <SYMBOL>",
    description: "Overview del ticker: precio, stats, sector",
  },
  {
    code: "GP",
    aliases: ["G"],
    usage: "GP <SYMBOL> [RANGE]",
    description: "Gráfico OHLC + volumen (RANGE: 1D 5D 1M 3M 6M YTD 1Y 5Y)",
  },
  {
    code: "N",
    aliases: ["NEWS"],
    usage: "N <SYMBOL>",
    description: "Headlines del ticker",
  },
  {
    code: "WEI",
    aliases: ["WATCH"],
    usage: "WEI",
    description: "Watchlist oficial del club",
  },
  {
    code: "FAV",
    usage: "FAV",
    description: "Favoritos personales (local en MVP)",
  },
  {
    code: "TOP",
    usage: "TOP",
    description: "Gainers / losers del día (universo club)",
  },
  {
    code: "HELP",
    aliases: ["?"],
    usage: "HELP",
    description: "Lista de comandos",
  },
  {
    code: "MAX",
    usage: "MAX",
    description: "Maximiza el panel activo",
  },
  {
    code: "GRID",
    usage: "GRID",
    description: "Vuelve al layout 2×2",
  },
];
