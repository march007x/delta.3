import type { Metadata } from "next";
import Link from "next/link";
import { getChapters, getCourses, getLessons, getTopics, isTopicReady } from "@/lib/repo/content";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "หลักสูตร",
  description: "แผนบทเรียนทั้งหมดตั้งแต่ ม.4 ถึง ม.6 พร้อมสถานะว่าบทไหนเปิดให้เรียนแล้ว",
};

export default function CoursesPage() {
  const courses = getCourses();

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <header className="mb-10 border-b border-line pb-6">
        <p className="m-0 mb-2 font-mono text-[11.5px] uppercase tracking-[0.15em] text-accent-ink">
          แผนเนื้อหา
        </p>
        <h1 className="m-0 mb-3 font-display text-[clamp(26px,4vw,38px)] font-bold tracking-tight text-ink">
          หลักสูตรทั้งหมด
        </h1>
        <p className="m-0 max-w-[62ch] text-[16px] text-ink-2">
          นี่คือแผนเนื้อหาทั้งหมดที่วางไว้ หัวข้อที่ยังไม่มีป้าย “เปิดแล้ว” คือหัวข้อที่กำลังเขียนอยู่ —
          เราแสดงทั้งหมดตั้งแต่ต้นเพื่อให้คุณเห็นภาพรวมว่าเรื่องที่กำลังเรียนอยู่ตรงไหนของเส้นทาง
        </p>
      </header>

      <div className="flex flex-col gap-12">
        {courses.map((course) => (
          <section key={course.id} id={course.slug} className="scroll-mt-20">
            <div className="mb-5 flex items-baseline gap-3 border-b-2 border-ink pb-2">
              <h2 className="m-0 font-display text-[22px] font-semibold text-ink">{course.title}</h2>
              <p className="m-0 text-[14px] text-ink-3">{course.description}</p>
            </div>

            <div className="flex flex-col gap-5">
              {getChapters(course.id).map((chapter) => {
                const chapterTopics = getTopics(chapter.id);
                return (
                  <div key={chapter.id}>
                    <h3 className="m-0 mb-2 font-display text-[16px] font-semibold text-ink-2">
                      <span className="mr-2 font-mono text-[12px] text-ink-3">
                        {String(chapter.order).padStart(2, "0")}
                      </span>
                      {chapter.title}
                    </h3>

                    {chapterTopics.length === 0 ? (
                      <p className="m-0 rounded-lg border border-dashed border-line px-4 py-2.5 text-[14px] text-ink-3">
                        อยู่ในแผน · ยังไม่เริ่มเขียนเนื้อหา
                      </p>
                    ) : (
                      <ul className="m-0 flex list-none flex-col gap-2 p-0">
                        {chapterTopics.map((topic) => {
                          const ready = isTopicReady(topic.id);
                          const lesson = getLessons(topic.id)[0];
                          const inner = (
                            <>
                              <div className="min-w-0">
                                <p className="m-0 font-display text-[15.5px] font-semibold text-ink">
                                  {topic.title}
                                </p>
                                <p className="m-0 text-[14px] leading-snug text-ink-3">
                                  {topic.summary}
                                </p>
                              </div>
                              <span className="shrink-0">
                                {ready ? (
                                  <Badge tone="ok">เปิดแล้ว</Badge>
                                ) : (
                                  <Badge tone="neutral">กำลังเขียน</Badge>
                                )}
                              </span>
                            </>
                          );

                          return (
                            <li key={topic.id}>
                              {ready && lesson ? (
                                <Link
                                  href={`/lesson/${lesson.slug}`}
                                  className="flex items-start justify-between gap-4 rounded-[10px] border border-line bg-surface px-4 py-3 no-underline hover:border-accent"
                                >
                                  {inner}
                                </Link>
                              ) : (
                                <div className="flex items-start justify-between gap-4 rounded-[10px] border border-line bg-surface px-4 py-3 opacity-70">
                                  {inner}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
