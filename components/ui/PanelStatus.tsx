export function PanelLoading({ label = "LOADING…" }: { label?: string }) {
  return (
    <div className="flex h-full items-center justify-center font-mono text-xs text-[var(--muted)]">
      {label}
    </div>
  );
}

export function PanelError({ message }: { message: string }) {
  return (
    <div className="flex h-full items-start font-mono text-xs text-[var(--down)]">
      ERR — {message}
    </div>
  );
}

export function PanelEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center font-mono text-xs text-[var(--muted)]">
      {message}
    </div>
  );
}
