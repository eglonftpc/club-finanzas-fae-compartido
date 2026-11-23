"use client";

import { COMMAND_HELP } from "@/lib/commands/registry";

export function HelpPanel() {
  return (
    <div className="space-y-2">
      <p className="font-mono text-[11px] text-[var(--muted)]">
        Club FAE Terminal — teclado primero. `/` o F1 enfoca la command bar.
      </p>
      <table className="w-full border-collapse">
        <thead>
          <tr className="font-mono text-[10px] text-[var(--muted)]">
            <th className="py-1 text-left font-normal">Cmd</th>
            <th className="py-1 text-left font-normal">Usage</th>
            <th className="py-1 text-left font-normal">Desc</th>
          </tr>
        </thead>
        <tbody>
          {COMMAND_HELP.map((cmd) => (
            <tr
              key={cmd.code}
              className="border-t border-[var(--border)] font-mono text-xs"
            >
              <td className="py-1 align-top text-[var(--accent)]">
                {cmd.code}
                {cmd.aliases?.length ? (
                  <span className="text-[var(--muted)]">
                    {" "}
                    / {cmd.aliases.join(" ")}
                  </span>
                ) : null}
              </td>
              <td className="py-1 align-top text-[var(--text)]">{cmd.usage}</td>
              <td className="py-1 align-top text-[var(--muted)]">
                {cmd.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="font-mono text-[10px] text-[var(--muted)]">
        Atajos: Tab cicla paneles · 1–4 focus panel · Esc blur · ↑↓ historial · MAX /
        GRID layout
      </p>
    </div>
  );
}
