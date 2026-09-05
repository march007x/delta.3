import { cx } from "@/lib/utils";

const TONES = {
  note: "border-l-accent bg-accent-soft",
  tip: "border-l-ok bg-ok-soft",
  warn: "border-l-warn bg-warn-soft",
  mistake: "border-l-danger bg-danger-soft",
  rule: "border-l-delta bg-delta-soft",
} as const;

export type CalloutTone = keyof typeof TONES;

export function Callout({
  tone = "note",
  title,
  children,
}: {
  tone?: CalloutTone;
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cx("my-4 rounded-r-[10px] border-l-[3px] px-5 py-4 text-ink", TONES[tone])}>
      {title ? (
        <p className="m-0 mb-1.5 font-display text-[15px] font-semibold text-ink">{title}</p>
      ) : null}
      {children}
    </div>
  );
}
