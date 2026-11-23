import { describe, expect, it } from "vitest";
import { parseCommand } from "@/lib/commands/parser";

describe("parseCommand", () => {
  it("defaults bare symbol to DES", () => {
    const r = parseCommand("aapl");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.command.fn).toBe("DES");
      expect(r.command.symbol).toBe("AAPL");
    }
  });

  it("parses GP with range", () => {
    const r = parseCommand("GP COPEC.SN 1Y");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.command.fn).toBe("GP");
      expect(r.command.symbol).toBe("COPEC.SN");
      expect(r.command.range).toBe("1Y");
    }
  });

  it("defaults GP range to 3M", () => {
    const r = parseCommand("G TSLA");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.command.fn).toBe("GP");
      expect(r.command.range).toBe("3M");
    }
  });

  it("parses NEWS alias", () => {
    const r = parseCommand("NEWS MSFT");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.command.fn).toBe("N");
      expect(r.command.symbol).toBe("MSFT");
    }
  });

  it("parses WEI without symbol", () => {
    const r = parseCommand("WATCH");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.command.fn).toBe("WEI");
  });

  it("rejects tokens that are neither function nor symbol", () => {
    const r = parseCommand("###");
    expect(r.ok).toBe(false);
  });

  it("treats unknown ticker-like token as DES", () => {
    const r = parseCommand("FOOBAR");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.command.fn).toBe("DES");
      expect(r.command.symbol).toBe("FOOBAR");
    }
  });

  it("requires symbol for DES", () => {
    const r = parseCommand("DES");
    expect(r.ok).toBe(false);
  });

  it("rejects invalid GP range", () => {
    const r = parseCommand("GP AAPL 2Y");
    expect(r.ok).toBe(false);
  });

  it("parses HELP aliases", () => {
    expect(parseCommand("?").ok).toBe(true);
    expect(parseCommand("HELP").ok).toBe(true);
  });

  it("parses FAV with optional symbol", () => {
    const r = parseCommand("FAV NVDA");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.command.fn).toBe("FAV");
      expect(r.command.symbol).toBe("NVDA");
    }
  });
});
