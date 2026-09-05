import { cx } from "@/lib/utils";

const TONES = {
  accent: "bg-accent-soft text-accent-ink border-accent",
  neutral: "bg-surface-2 text-ink-3 border-line-strong",
  ok: "bg-ok-soft text-ok border-ok",
  warn: "bg-warn-soft text-warn border-warn",
  delta: "bg-delta-soft text-delta border-delta",
} as const;

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <span
      className={cx(
        "inline-block rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.06em]",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}
