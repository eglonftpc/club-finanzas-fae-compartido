"use client";

import { useEffect, useState } from "react";
import { APP_NAME } from "@/lib/config";
import { getProviderName } from "@/lib/providers/client";
import { useTerminalStore } from "@/lib/store";

export function TopBar() {
  const status = useTerminalStore((s) => s.status);
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    const tick = () => {
      setNow(
        new Date().toLocaleTimeString("es-CL", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "America/Santiago",
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg)] px-3">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs font-semibold tracking-[0.12em] text-[var(--accent)]">
          {APP_NAME}
        </span>
        <span className="hidden font-mono text-[10px] text-[var(--muted)] md:inline">
          data:{getProviderName()}
        </span>
      </div>
      <div className="mx-3 min-w-0 flex-1 truncate font-mono text-[11px] text-[var(--muted)]">
        {status}
      </div>
      <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--text)]">
        <span className="text-[var(--muted)]">SCL</span>
        <span className="tabular-nums">{now || "--:--:--"}</span>
        <span className="text-[var(--muted)]">demo</span>
      </div>
    </header>
  );
}
