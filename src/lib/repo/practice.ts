import { chapters, courses, topics } from "@/content";
import { renderRich } from "@/lib/math/render";
import {
  SECTION_LABEL,
  type Lesson,
} from "@/content/schema";
import { shuffleWithSeed } from "@/lib/quiz";
import { getPublishedLessons } from "./content";

export interface PracticeChoice {
  html: string;
  correct: boolean;
}

interface PracticeQuestionBase {
  id: string;

  /**
   * ขั้นที่โจทย์ข้อนี้มาจาก
   * เช่น ฝึกด้วยตัวเอง / โจทย์ท้าทาย
   */
  origin: string;

  promptHtml: string;

  explainHtml: string;

  /**
   * คำใบ้ทั้งหมด
   */
  hintsHtml: string[];
}

export interface ChoiceQuestion extends PracticeQuestionBase {
  kind: "choice";

  choices: PracticeChoice[];
}

export interface NumericQuestion extends PracticeQuestionBase {
  kind: "numeric";

  /**
   * คำตอบตัวเลขจริง
   */
  answer: number;

  /**
   * ค่าคลาดเคลื่อนที่ยอมรับได้
   */
  tolerance?: number;

  /**
   * คำตอบสำหรับแสดงผลแบบ rich text / LaTeX
   */
  exactHtml?: string;

  /**
   * หน่วย เช่น m, s, N, Hz
   */
  unit?: string;
}

export type PracticeQuestion =
  | ChoiceQuestion
  | NumericQuestion;

export interface PracticeSet {
  slug: string;
  title: string;
  questions: PracticeQuestion[];
}

/**
 * ขั้นที่ถือเป็น "โจทย์ฝึก" จริง ๆ
 *
 * ขั้นอื่นที่มีควิซ เช่น example หรือ definition
 * ไม่ถูกดึงเข้าชุดฝึกหลัก
 */
const PRACTICE_SECTIONS = new Set([
  "guided",
  "practice",
  "challenge",
]);

/**
 * ดึงคำใบ้จาก Quiz
 *
 * รองรับข้อมูลเก่า:
 *   hint: string
 *
 * และข้อมูลใหม่:
 *   hints: string[]
 */
function getQuizHints(
  block: Extract<
    import("@/content/schema").Block,
    { kind: "quiz" }
  >,
): string[] {
  if (block.hints && block.hints.length > 0) {
    return block.hints.map((hint) => renderRich(hint));
  }

  if (block.hint) {
    return [renderRich(block.hint)];
  }

  return [];
}

/**
 * ดึงคำใบ้จาก Numeric
 */
function getNumericHints(
  block: Extract<
    import("@/content/schema").Block,
    { kind: "numeric" }
  >,
): string[] {
  if (!block.hints || block.hints.length === 0) {
    return [];
  }

  return block.hints.map((hint) => renderRich(hint));
}

/**
 * ดึงชุดโจทย์ของบทหนึ่งออกมาเป็น HTML ที่เรนเดอร์เสร็จแล้ว
 *
 * รองรับ:
 * - Multiple choice
 * - Numeric
 *
 * เรนเดอร์ตอน build ทั้งหมด เพราะ KaTeX หนักเกินกว่าจะส่งไปทำงาน
 * ในเบราว์เซอร์ และทำให้หน้าโหลดครั้งแรกเร็วขึ้น
 */
export function getPracticeSet(
  lesson: Lesson,
): PracticeSet {
  const questions: PracticeQuestion[] = [];

  for (const section of lesson.sections) {
    if (!PRACTICE_SECTIONS.has(section.type)) {
      continue;
    }

    section.blocks.forEach((block, i) => {
      const id = `${lesson.slug}:${section.id}:${i}`;

      /**
       * Multiple choice
       */
      if (block.kind === "quiz") {
        questions.push({
          kind: "choice",
          id,
          origin: SECTION_LABEL[section.type],

          promptHtml: renderRich(block.prompt),

          choices: shuffleWithSeed(
            block.choices,
            id,
          ).map((choice) => ({
            html: renderRich(choice.text),
            correct: Boolean(choice.correct),
          })),

          explainHtml: renderRich(block.explain),

          hintsHtml: getQuizHints(block),
        });

        return;
      }

      /**
       * Numeric question
       */
      if (block.kind === "numeric") {
        questions.push({
          kind: "numeric",
          id,
          origin: SECTION_LABEL[section.type],

          promptHtml: renderRich(block.prompt),

          answer: block.answer,

          ...(block.tolerance !== undefined
            ? {
                tolerance: block.tolerance,
              }
            : {}),

          ...(block.exact
            ? {
                exactHtml: renderRich(block.exact),
              }
            : {}),

          ...(block.unit
            ? {
                unit: block.unit,
              }
            : {}),

          explainHtml: renderRich(block.explain),

          hintsHtml: getNumericHints(block),
        });
      }
    });
  }

  return {
    slug: lesson.slug,
    title: lesson.title,
    questions,
  };
}

export interface PracticeSummary {
  slug: string;
  title: string;
  course: string;
  chapter: string;

  /**
   * จำนวนโจทย์ทั้งหมด
   */
  count: number;

  /**
   * จำนวนโจทย์ตัวเลข
   */
  numericCount: number;
}

/**
 * รายการชุดฝึกทั้งหมดสำหรับหน้ารวม
 *
 * ไม่มีเนื้อโจทย์ จึงเบามาก
 */
export function getPracticeIndex(): PracticeSummary[] {
  const chapterOf = new Map(
    chapters.map((chapter) => [
      chapter.id,
      chapter,
    ]),
  );

  const courseOf = new Map(
    courses.map((course) => [
      course.id,
      course,
    ]),
  );

  const topicOf = new Map(
    topics.map((topic) => [
      topic.id,
      topic,
    ]),
  );

  return getPublishedLessons()
    .map((lesson) => {
      const topic = topicOf.get(lesson.topicId);

      const chapter = topic
        ? chapterOf.get(topic.chapterId)
        : undefined;

      const course = chapter
        ? courseOf.get(chapter.courseId)
        : undefined;

      let count = 0;
      let numericCount = 0;

      for (const section of lesson.sections) {
        if (
          !PRACTICE_SECTIONS.has(
            section.type,
          )
        ) {
          continue;
        }

        for (const block of section.blocks) {
          if (
            block.kind === "quiz" ||
            block.kind === "numeric"
          ) {
            count++;
          }

          if (block.kind === "numeric") {
            numericCount++;
          }
        }
      }

      return {
        slug: lesson.slug,
        title: lesson.title,
        course: course?.title ?? "",
        chapter: chapter?.title ?? "",
        count,
        numericCount,
      };
    })
    .filter(
      (summary) => summary.count > 0,
    );
}
