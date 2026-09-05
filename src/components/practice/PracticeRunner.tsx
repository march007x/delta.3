"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cx } from "@/lib/utils";
import { shuffle } from "@/lib/quiz";
import { usePracticeResults } from "@/lib/progress/practice";
import type { PracticeQuestion } from "@/lib/repo/practice";

type Phase = "idle" | "running" | "done";

interface Answered {
  id: string;
  picked: number;
  correct: boolean;
}

/** สับทั้งลำดับข้อและลำดับตัวเลือก — ทำซ้ำแล้วต้องคิดใหม่ ไม่ใช่จำว่าเคยกดข้อไหน */
function makeRound(questions: PracticeQuestion[]): PracticeQuestion[] {
  return shuffle(questions).map((q) => ({ ...q, choices: shuffle(q.choices) }));
}

export function PracticeRunner({
  slug,
  title,
  questions,
}: {
  slug: string;
  title: string;
  questions: PracticeQuestion[];
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [order, setOrder] = useState<PracticeQuestion[]>(questions);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [answers, setAnswers] = useState<Answered[]>([]);
  const { save, map, ready } = usePracticeResults();

  const previous = ready ? map[slug] : undefined;
  const current = order[index];
  const answered = picked !== null;
  const isCorrect = answered && Boolean(current?.choices[picked]?.correct);
  const score = useMemo(() => answers.filter((a) => a.correct).length, [answers]);

  function start() {
    setOrder(makeRound(questions));
    setIndex(0);
    setPicked(null);
    setShowHint(false);
    setAnswers([]);
    setPhase("running");
  }

  function pick(i: number) {
    if (answered || !current) return;
    setPicked(i);
    setAnswers((prev) => [
      ...prev,
      { id: current.id, picked: i, correct: Boolean(current.choices[i]?.correct) },
    ]);
  }

  function next() {
    if (index + 1 >= order.length) {
      const finished = answers;
      save(slug, {
        correct: finished.filter((a) => a.correct).length,
        total: order.length,
        missed: finished.filter((a) => !a.correct).map((a) => a.id),
      });
      setPhase("done");
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
    setShowHint(false);
  }

  if (phase === "idle") {
    return (
      <div className="rounded-[10px] border border-line bg-surface p-5 sm:p-6">
        <p className="m-0 mb-1 font-display text-[18px] font-semibold text-ink">
          ชุดฝึก {questions.length} ข้อ
        </p>
        <p className="m-0 mb-4 text-[15px] leading-relaxed text-ink-2">
          โจทย์สับลำดับใหม่ทุกครั้ง · ทำทีละข้อ เฉลยขึ้นทันทีหลังตอบ
          และเมื่อจบชุดจะสรุปให้ว่าพลาดข้อไหนบ้าง ผลเก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น
        </p>

        {previous ? (
          <p className="m-0 mb-4 rounded-lg border border-line bg-surface-2 px-4 py-2.5 font-mono text-[13px] text-ink-2">
            รอบที่แล้ว {previous.correct}/{previous.total} ข้อ
            {previous.correct / previous.total < 0.7 ? " — ควรทบทวนบทนี้ก่อน" : ""}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={start}
            className="rounded-lg bg-accent px-4 py-2 text-[15px] font-medium text-white hover:opacity-90"
          >
            เริ่มทำ
          </button>
          <Link
            href={`/lesson/${slug}`}
            className="rounded-lg border border-line bg-surface px-4 py-2 text-[15px] text-ink-2 no-underline hover:border-line-strong hover:text-ink"
          >
            อ่านบท {title} ก่อน
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const missedIds = new Set(answers.filter((a) => !a.correct).map((a) => a.id));
    const missed = order.filter((q) => missedIds.has(q.id));
    const pct = Math.round((score / order.length) * 100);

    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-[10px] border border-line bg-surface p-5 sm:p-6">
          <p className="m-0 font-mono text-[11.5px] uppercase tracking-[0.13em] text-ink-3">
            ผลรอบนี้
          </p>
          <p className="m-0 my-1 font-display text-[32px] font-bold tracking-tight text-ink">
            {score} / {order.length}
            <span className="ml-2 font-mono text-[16px] font-normal text-ink-3">({pct}%)</span>
          </p>
          <p className="m-0 text-[15px] leading-relaxed text-ink-2">
            {pct >= 90
              ? "แม่นแล้ว — ข้ามไปบทถัดไปได้เลย"
              : pct >= 70
                ? "ใช้ได้ แต่ยังมีจุดที่พลาด ลองอ่านเฉลยข้างล่างให้ครบก่อนไปต่อ"
                : "ยังไม่แน่น — แนะนำให้กลับไปอ่านบทเรียนอีกรอบ แล้วค่อยมาทำใหม่"}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={start}
              className="rounded-lg bg-accent px-4 py-2 text-[15px] font-medium text-white hover:opacity-90"
            >
              ทำใหม่อีกรอบ
            </button>
            <Link
              href={`/lesson/${slug}`}
              className="rounded-lg border border-line bg-surface px-4 py-2 text-[15px] text-ink-2 no-underline hover:border-line-strong hover:text-ink"
            >
              กลับไปอ่านบทเรียน
            </Link>
            <Link
              href="/practice"
              className="rounded-lg border border-line bg-surface px-4 py-2 text-[15px] text-ink-2 no-underline hover:border-line-strong hover:text-ink"
            >
              เลือกชุดอื่น
            </Link>
          </div>
        </div>

        {missed.length > 0 ? (
          <div>
            <h2 className="m-0 mb-3 font-display text-[18px] font-semibold text-ink">
              ข้อที่พลาด {missed.length} ข้อ
            </h2>
            <div className="flex flex-col gap-3">
              {missed.map((q) => (
                <div key={q.id} className="rounded-[10px] border border-line bg-surface p-4">
                  <p
                    className="m-0 mb-2 text-[15.5px] font-medium text-ink"
                    dangerouslySetInnerHTML={{ __html: q.promptHtml }}
                  />
                  <p className="m-0 mb-1.5 font-mono text-[12px] text-ink-3">คำตอบที่ถูก</p>
                  <p
                    className="m-0 mb-2.5 rounded-lg border border-ok bg-ok-soft px-3 py-1.5 text-[15px] text-ink"
                    dangerouslySetInnerHTML={{
                      __html: q.choices.find((c) => c.correct)?.html ?? "",
                    }}
                  />
                  <p
                    className="m-0 text-[14.5px] leading-relaxed text-ink-2"
                    dangerouslySetInnerHTML={{ __html: q.explainHtml }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="m-0 rounded-[10px] border border-ok bg-ok-soft px-4 py-3 text-[15px] text-ink">
            ถูกทุกข้อ — ไม่มีอะไรต้องทบทวนในบทนี้
          </p>
        )}
      </div>
    );
  }

  if (!current) return null;

  return (
    <div>
      <div className="mb-4">
        <div className="mb-1.5 flex items-baseline justify-between font-mono text-[12px] text-ink-3">
          <span>
            ข้อ {index + 1} จาก {order.length} · {current.origin}
          </span>
          <span>ถูกแล้ว {score}</span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={order.length}
          aria-label="ความคืบหน้าของชุดฝึก"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${((index + (answered ? 1 : 0)) / order.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-[10px] border border-line bg-surface p-4 sm:p-5">
        <p
          className="m-0 mb-3 text-[16px] font-medium text-ink"
          dangerouslySetInnerHTML={{ __html: current.promptHtml }}
        />

        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {current.choices.map((c, i) => {
            const chosen = picked === i;
            const reveal = answered && c.correct;
            return (
              <li key={i}>
                <button
                  type="button"
                  disabled={answered}
                  onClick={() => pick(i)}
                  aria-pressed={chosen}
                  className={cx(
                    "flex w-full items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-[15px]",
                    !answered && "border-line bg-surface-2 hover:border-accent",
                    reveal && "border-ok bg-ok-soft",
                    answered && chosen && !c.correct && "border-danger bg-danger-soft",
                    answered && !chosen && !c.correct && "border-line bg-surface-2 opacity-60",
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

        {!answered && current.hintHtml ? (
          <div className="mt-3">
            {showHint ? (
              <p
                className="m-0 rounded-lg border-l-[3px] border-l-warn bg-warn-soft px-3.5 py-2 text-[14px] text-ink"
                dangerouslySetInnerHTML={{ __html: current.hintHtml }}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 font-mono text-[11.5px] text-ink-2 hover:text-ink"
              >
                ขอคำใบ้
              </button>
            )}
          </div>
        ) : null}

        {answered ? (
          <>
            <div
              className={cx(
                "mt-3 rounded-lg border-l-[3px] px-4 py-3",
                isCorrect ? "border-l-ok bg-ok-soft" : "border-l-danger bg-danger-soft",
              )}
            >
              <p className="m-0 mb-1 font-display text-[14px] font-semibold text-ink">
                {isCorrect ? "ถูกต้อง" : "ยังไม่ใช่"}
              </p>
              <p
                className="m-0 text-[14.5px] leading-relaxed text-ink-2"
                dangerouslySetInnerHTML={{ __html: current.explainHtml }}
              />
            </div>
            <button
              type="button"
              onClick={next}
              autoFocus
              className="mt-3 rounded-lg bg-accent px-4 py-2 text-[15px] font-medium text-white hover:opacity-90"
            >
              {index + 1 >= order.length ? "ดูผลสรุป" : "ข้อถัดไป"}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
