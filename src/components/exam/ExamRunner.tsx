"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cx } from "@/lib/utils";
import type { ExamQuestion, ExamSetMeta } from "@/lib/repo/exam";
import { useExamResults } from "@/lib/progress/exam";

type Phase = "brief" | "running" | "done";

function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * โหมดข้อสอบ — ต่างจากโหมดฝึกตรงที่ **ไม่เฉลยระหว่างทำ** และมีเวลาจำกัด
 *
 * เหตุผลคือทักษะที่ใช้ในห้องสอบไม่เหมือนตอนฝึก: ต้องตัดสินใจว่าจะข้ามข้อไหน
 * และต้องทนกับความไม่แน่ใจจนจบชุด ซึ่งฝึกไม่ได้เลยถ้าเฉลยเด้งขึ้นทุกข้อ
 */
export function ExamRunner({ meta, questions }: { meta: ExamSetMeta; questions: ExamQuestion[] }) {
  const [phase, setPhase] = useState<Phase>("brief");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [left, setLeft] = useState(meta.minutes * 60);
  const { save, map, ready } = useExamResults();
  const submittedRef = useRef(false);

  const previous = ready ? map[meta.id] : undefined;
  const current = questions[index];
  const answeredCount = Object.keys(picked).length;

  const result = useMemo(() => {
    let correct = 0;
    const missed: ExamQuestion[] = [];
    const byChapter = new Map<string, { correct: number; total: number }>();
    for (const q of questions) {
      const p = picked[q.id];
      const ok = p !== undefined && Boolean(q.choices[p]?.correct);
      if (ok) correct++;
      else missed.push(q);
      const cur = byChapter.get(q.chapter) ?? { correct: 0, total: 0 };
      cur.total++;
      if (ok) cur.correct++;
      byChapter.set(q.chapter, cur);
    }
    return { correct, missed, byChapter: [...byChapter.entries()] };
  }, [questions, picked]);

  const submit = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    let correct = 0;
    const weak = new Map<string, { correct: number; total: number }>();
    for (const q of questions) {
      const p = picked[q.id];
      const ok = p !== undefined && Boolean(q.choices[p]?.correct);
      if (ok) correct++;
      const cur = weak.get(q.chapter) ?? { correct: 0, total: 0 };
      cur.total++;
      if (ok) cur.correct++;
      weak.set(q.chapter, cur);
    }
    save(meta.id, {
      correct,
      total: questions.length,
      spentSeconds: meta.minutes * 60 - left,
      weakChapters: [...weak.entries()]
        .filter(([, v]) => v.correct / v.total < 0.7)
        .map(([k]) => k),
    });
    setPhase("done");
  }, [questions, picked, save, meta.id, meta.minutes, left]);

  useEffect(() => {
    if (phase !== "running") return;
    const t = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(t);
          submit();
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, submit]);

  if (phase === "brief") {
    return (
      <div className="rounded-[10px] border border-line bg-surface p-5 sm:p-6">
        <p className="m-0 mb-1 font-display text-[18px] font-semibold text-ink">
          {meta.count} ข้อ · {meta.minutes} นาที
        </p>
        <ul className="m-0 mb-4 max-w-[58ch] list-disc pl-5 text-[15px] leading-[1.9] text-ink-2">
          <li>โจทย์กระจายทุกบทของ{meta.courseTitle} ไม่กระจุกอยู่บทเดียว</li>
          <li>
            <strong className="font-semibold text-ink">ไม่มีเฉลยระหว่างทำ</strong> —
            เฉลยทั้งหมดขึ้นตอนส่งคำตอบ
          </li>
          <li>ข้ามข้อได้ และปักธงข้อที่ไม่มั่นใจไว้กลับมาดูทีหลังได้</li>
          <li>หมดเวลาแล้วระบบส่งคำตอบให้อัตโนมัติ</li>
        </ul>

        {previous ? (
          <p className="m-0 mb-4 rounded-lg border border-line bg-surface-2 px-4 py-2.5 font-mono text-[13px] text-ink-2">
            รอบที่แล้ว {previous.correct}/{previous.total} ข้อ · ใช้เวลา{" "}
            {clock(previous.spentSeconds)}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              submittedRef.current = false;
              setPicked({});
              setFlagged({});
              setIndex(0);
              setLeft(meta.minutes * 60);
              setPhase("running");
            }}
            className="rounded-lg bg-accent px-4 py-2 text-[15px] font-medium text-white hover:opacity-90"
          >
            เริ่มจับเวลา
          </button>
          <Link
            href="/exam"
            className="rounded-lg border border-line bg-surface px-4 py-2 text-[15px] text-ink-2 no-underline hover:border-line-strong hover:text-ink"
          >
            เลือกชุดอื่น
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const pct = Math.round((result.correct / questions.length) * 100);
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-[10px] border border-line bg-surface p-5 sm:p-6">
          <p className="m-0 font-mono text-[11.5px] uppercase tracking-[0.13em] text-ink-3">
            ผลสอบ
          </p>
          <p className="m-0 my-1 font-display text-[32px] font-bold tracking-tight text-ink">
            {result.correct} / {questions.length}
            <span className="ml-2 font-mono text-[16px] font-normal text-ink-3">({pct}%)</span>
          </p>
          <p className="m-0 font-mono text-[13px] text-ink-3">
            ใช้เวลา {clock(meta.minutes * 60 - left)} จาก {meta.minutes} นาที · ตอบ{" "}
            {answeredCount} ข้อ
          </p>
        </div>

        <div>
          <h2 className="m-0 mb-3 font-display text-[18px] font-semibold text-ink">
            แยกตามบท — ใช้ตัดสินใจว่าจะทบทวนอะไรก่อน
          </h2>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {result.byChapter
              .slice()
              .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
              .map(([chapter, v]) => {
                const ratio = v.correct / v.total;
                return (
                  <li
                    key={chapter}
                    className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3.5 py-2"
                  >
                    <span className="min-w-0 flex-1 text-[15px] text-ink">{chapter}</span>
                    <span className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-surface-3">
                      <span
                        className={cx(
                          "block h-full rounded-full",
                          ratio < 0.7 ? "bg-danger" : "bg-ok",
                        )}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </span>
                    <span className="w-12 shrink-0 text-right font-mono text-[12.5px] text-ink-2">
                      {v.correct}/{v.total}
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>

        {result.missed.length > 0 ? (
          <div>
            <h2 className="m-0 mb-3 font-display text-[18px] font-semibold text-ink">
              ข้อที่ยังไม่ได้ {result.missed.length} ข้อ
            </h2>
            <div className="flex flex-col gap-3">
              {result.missed.map((q) => (
                <div key={q.id} className="rounded-[10px] border border-line bg-surface p-4">
                  <p className="m-0 mb-1.5 font-mono text-[11.5px] text-ink-3">
                    {q.chapter} ·{" "}
                    <Link href={`/lesson/${q.lessonSlug}`} className="text-accent-ink">
                      {q.lessonTitle}
                    </Link>
                  </p>
                  <p
                    className="m-0 mb-2 text-[15.5px] font-medium text-ink"
                    dangerouslySetInnerHTML={{ __html: q.promptHtml }}
                  />
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
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPhase("brief")}
            className="rounded-lg bg-accent px-4 py-2 text-[15px] font-medium text-white hover:opacity-90"
          >
            ทำใหม่
          </button>
          <Link
            href="/exam"
            className="rounded-lg border border-line bg-surface px-4 py-2 text-[15px] text-ink-2 no-underline hover:border-line-strong hover:text-ink"
          >
            ชุดอื่น
          </Link>
          <Link
            href="/practice"
            className="rounded-lg border border-line bg-surface px-4 py-2 text-[15px] text-ink-2 no-underline hover:border-line-strong hover:text-ink"
          >
            ไปฝึกบทที่อ่อน
          </Link>
        </div>
      </div>
    );
  }

  if (!current) return null;
  const chosen = picked[current.id];
  const low = left <= 300;

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-5 mb-4 border-b border-line bg-bg/90 px-5 py-2.5 backdrop-blur">
        <div className="flex items-center gap-3">
          <span
            className={cx(
              "font-mono text-[15px] tabular-nums",
              low ? "font-semibold text-danger" : "text-ink-2",
            )}
            role="timer"
            aria-live="off"
          >
            {clock(left)}
          </span>
          <span className="font-mono text-[12.5px] text-ink-3">
            ตอบแล้ว {answeredCount}/{questions.length}
          </span>
          <button
            type="button"
            onClick={() => {
              if (confirm(`ส่งคำตอบเลยไหม (ตอบแล้ว ${answeredCount} จาก ${questions.length} ข้อ)`))
                submit();
            }}
            className="ml-auto rounded-lg border border-line bg-surface px-3 py-1.5 text-[13.5px] text-ink-2 hover:border-line-strong hover:text-ink"
          >
            ส่งคำตอบ
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`ไปข้อ ${i + 1}`}
              aria-current={i === index}
              className={cx(
                "h-6 w-6 rounded font-mono text-[11px]",
                i === index && "ring-2 ring-accent",
                flagged[q.id]
                  ? "bg-warn-soft text-ink"
                  : picked[q.id] !== undefined
                    ? "bg-accent text-white"
                    : "border border-line bg-surface text-ink-3",
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[10px] border border-line bg-surface p-4 sm:p-5">
        <div className="mb-2 flex items-baseline justify-between font-mono text-[12px] text-ink-3">
          <span>
            ข้อ {index + 1} / {questions.length} · {current.chapter}
          </span>
          <button
            type="button"
            onClick={() => setFlagged((f) => ({ ...f, [current.id]: !f[current.id] }))}
            className={cx(
              "rounded px-2 py-0.5 text-[11.5px]",
              flagged[current.id]
                ? "bg-warn-soft text-ink"
                : "border border-line text-ink-3 hover:text-ink",
            )}
          >
            {flagged[current.id] ? "ปักธงไว้แล้ว" : "ปักธงไว้ดูทีหลัง"}
          </button>
        </div>

        <p
          className="m-0 mb-3 text-[16px] font-medium text-ink"
          dangerouslySetInnerHTML={{ __html: current.promptHtml }}
        />

        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {current.choices.map((c, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setPicked((p) => ({ ...p, [current.id]: i }))}
                aria-pressed={chosen === i}
                className={cx(
                  "flex w-full items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-[15px]",
                  chosen === i
                    ? "border-accent bg-accent-soft"
                    : "border-line bg-surface-2 hover:border-accent",
                )}
              >
                <span aria-hidden className="mt-0.5 font-mono text-[12px] text-ink-3">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-ink" dangerouslySetInnerHTML={{ __html: c.html }} />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="rounded-lg border border-line bg-surface px-3.5 py-2 text-[14.5px] text-ink-2 disabled:opacity-40 hover:border-line-strong hover:text-ink"
          >
            ← ข้อก่อน
          </button>
          {index + 1 < questions.length ? (
            <button
              type="button"
              onClick={() => setIndex((i) => i + 1)}
              className="rounded-lg bg-accent px-4 py-2 text-[14.5px] font-medium text-white hover:opacity-90"
            >
              ข้อถัดไป →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(`ส่งคำตอบเลยไหม (ตอบแล้ว ${answeredCount} จาก ${questions.length} ข้อ)`)
                )
                  submit();
              }}
              className="rounded-lg bg-accent px-4 py-2 text-[14.5px] font-medium text-white hover:opacity-90"
            >
              ส่งคำตอบ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
