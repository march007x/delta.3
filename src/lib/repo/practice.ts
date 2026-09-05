import { chapters, courses, topics } from "@/content";
import { renderRich } from "@/lib/math/render";
import { SECTION_LABEL, type Lesson } from "@/content/schema";
import { shuffleWithSeed } from "@/lib/quiz";
import { getPublishedLessons } from "./content";

export interface PracticeChoice {
  html: string;
  correct: boolean;
}

export interface PracticeQuestion {
  id: string;
  /** ขั้นที่โจทย์ข้อนี้มาจาก — บอกระดับความยากคร่าว ๆ ให้ผู้เรียนรู้ตัว */
  origin: string;
  promptHtml: string;
  choices: PracticeChoice[];
  explainHtml: string;
  hintHtml?: string;
}

export interface PracticeSet {
  slug: string;
  title: string;
  questions: PracticeQuestion[];
}

/** ขั้นที่ถือเป็น "โจทย์ฝึก" จริง ๆ — ขั้นอื่นที่มีควิซใช้เพื่อทำความเข้าใจระหว่างอ่าน */
const PRACTICE_SECTIONS = new Set(["guided", "practice", "challenge"]);

/**
 * ดึงชุดโจทย์ของบทหนึ่งออกมาเป็น HTML ที่เรนเดอร์เสร็จแล้ว
 *
 * เรนเดอร์ตอน build ทั้งหมด เพราะ KaTeX หนักเกินกว่าจะส่งไปทำงานในเบราว์เซอร์
 * และทำให้หน้าโหลดครั้งแรกไม่ต้องรอ JavaScript ก่อนจึงจะเห็นโจทย์
 */
export function getPracticeSet(lesson: Lesson): PracticeSet {
  const questions: PracticeQuestion[] = [];

  for (const section of lesson.sections) {
    if (!PRACTICE_SECTIONS.has(section.type)) continue;
    section.blocks.forEach((b, i) => {
      if (b.kind !== "quiz") return;
      const id = `${lesson.slug}:${section.id}:${i}`;
      questions.push({
        id,
        origin: SECTION_LABEL[section.type],
        promptHtml: renderRich(b.prompt),
        choices: shuffleWithSeed(b.choices, id).map((c) => ({
          html: renderRich(c.text),
          correct: Boolean(c.correct),
        })),
        explainHtml: renderRich(b.explain),
        hintHtml: b.hint ? renderRich(b.hint) : undefined,
      });
    });
  }

  return { slug: lesson.slug, title: lesson.title, questions };
}

export interface PracticeSummary {
  slug: string;
  title: string;
  course: string;
  chapter: string;
  count: number;
}

/** รายการชุดฝึกทั้งหมดสำหรับหน้ารวม — ไม่มีเนื้อโจทย์ จึงเบามาก */
export function getPracticeIndex(): PracticeSummary[] {
  const chapterOf = new Map(chapters.map((c) => [c.id, c]));
  const courseOf = new Map(courses.map((c) => [c.id, c]));
  const topicOf = new Map(topics.map((t) => [t.id, t]));

  return getPublishedLessons()
    .map((lesson) => {
      const topic = topicOf.get(lesson.topicId);
      const chapter = topic ? chapterOf.get(topic.chapterId) : undefined;
      const course = chapter ? courseOf.get(chapter.courseId) : undefined;
      const count = lesson.sections
        .filter((s) => PRACTICE_SECTIONS.has(s.type))
        .reduce((n, s) => n + s.blocks.filter((b) => b.kind === "quiz").length, 0);
      return {
        slug: lesson.slug,
        title: lesson.title,
        course: course?.title ?? "",
        chapter: chapter?.title ?? "",
        count,
      };
    })
    .filter((s) => s.count > 0);
}
