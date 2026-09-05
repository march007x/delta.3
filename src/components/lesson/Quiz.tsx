"use client";

import { useState } from "react";
import { cx } from "@/lib/utils";

export interface QuizChoiceHtml {
  html: string;
  correct?: boolean;
}

/**
 * คำถามตรวจความเข้าใจระหว่างเรียน — ตรวจในเบราว์เซอร์ ไม่เก็บคะแนน ไม่มีการตัดสิน
 * ข้อความทั้งหมดถูกแปลงเป็น HTML มาจากฝั่งเซิร์ฟเวอร์แล้ว component นี้จึงเบามาก
 */
export function Quiz({
  promptHtml,
  choices,
  explainHtml,
  hintHtml,
}: {
  promptHtml: string;
  choices: QuizChoiceHtml[];
  explainHtml: string;
  hintHtml?: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const answered = picked !== null;
  const isCorrect = answered && Boolean(choices[picked]?.correct);

  return (
    <div className="my-5 rounded-[10px] border border-line bg-surface-2 p-4 sm:p-5">
      <p
        className="m-0 mb-3 text-[15.5px] font-medium text-ink"
        dangerouslySetInnerHTML={{ __html: promptHtml }}
      />

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {choices.map((c, i) => {
          const chosen = picked === i;
          const reveal = answered && c.correct;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={answered}
                onClick={() => setPicked(i)}
                aria-pressed={chosen}
                className={cx(
                  "flex w-full items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-[15px]",
                  !answered && "border-line bg-surface hover:border-accent",
                  reveal && "border-ok bg-ok-soft",
                  answered && chosen && !c.correct && "border-danger bg-danger-soft",
                  answered && !chosen && !c.correct && "border-line bg-surface opacity-60",
                )}
              >
                <span aria-hidden className="mt-0.5 font-mono text-[12px] text-ink-3">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-ink" dangerouslySetInnerHTML={{ __html: c.html }} />
              </button>
            </li>
          );
        })}
      </ul>

      {!answered && hintHtml ? (
        <div className="mt-3">
          {showHint ? (
            <p
              className="m-0 rounded-lg border-l-[3px] border-l-warn bg-warn-soft px-3.5 py-2 text-[14px] text-ink"
              dangerouslySetInnerHTML={{ __html: hintHtml }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-[11.5px] text-ink-2 hover:text-ink"
            >
              ขอคำใบ้
            </button>
          )}
        </div>
      ) : null}

      {answered ? (
        <div
          className={cx(
            "mt-3 rounded-lg border-l-[3px] px-4 py-3",
            isCorrect ? "border-l-ok bg-ok-soft" : "border-l-danger bg-danger-soft",
          )}
        >
          <p className="m-0 mb-1 font-display text-[14px] font-semibold text-ink">
            {isCorrect ? "ถูกต้อง" : "ยังไม่ใช่ — ลองอ่านเหตุผลนี้"}
          </p>
          <p
            className="m-0 text-[14.5px] leading-relaxed text-ink-2"
            dangerouslySetInnerHTML={{ __html: explainHtml }}
          />
          <button
            type="button"
            onClick={() => {
              setPicked(null);
              setShowHint(false);
            }}
            className="mt-2.5 rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-[11.5px] text-ink-2 hover:text-ink"
          >
            ลองใหม่
          </button>
        </div>
      ) : null}
    </div>
  );
}
