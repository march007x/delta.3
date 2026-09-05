import { z } from "zod";

/**
 * โครงสร้างเนื้อหาทั้งหมด — ตรงกับ ERD ที่ออกแบบไว้ใน Phase 0
 * ตอนนี้เก็บเป็นไฟล์ข้อมูล ไม่ได้เก็บใน component ใด ๆ
 * เมื่อย้ายไป PostgreSQL ในภายหลัง แค่เปลี่ยนตัวอ่านใน src/lib/repo/content.ts
 */

export const SECTION_TYPES = [
  "motivation",
  "intuition",
  "visualization",
  "definition",
  "derivation",
  "example",
  "guided",
  "practice",
  "challenge",
  "examApplication",
  "mnemonic",
  "mistakes",
  "summary",
  "connection",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export const SECTION_LABEL: Record<SectionType, string> = {
  motivation: "ทำไมต้องเรียนเรื่องนี้",
  intuition: "ทำความเข้าใจก่อนเจอสูตร",
  visualization: "ลองเล่นดูเอง",
  definition: "นิยามอย่างเป็นทางการ",
  derivation: "สูตรนี้มาจากไหน",
  example: "ตัวอย่างพร้อมวิธีคิด",
  guided: "ฝึกแบบมีตัวช่วย",
  practice: "ฝึกด้วยตัวเอง",
  challenge: "โจทย์ท้าทาย",
  examApplication: "แนวข้อสอบ",
  mnemonic: "ทริคการจำ",
  mistakes: "จุดที่คนมักผิด",
  summary: "สรุป",
  connection: "เชื่อมกับเรื่องอื่น",
};

const paragraph = z.object({ kind: z.literal("paragraph"), text: z.string() });
const math = z.object({ kind: z.literal("math"), latex: z.string(), note: z.string().optional() });
const list = z.object({
  kind: z.literal("list"),
  ordered: z.boolean().optional(),
  items: z.array(z.string()),
});
const callout = z.object({
  kind: z.literal("callout"),
  tone: z.enum(["note", "tip", "warn", "mistake", "rule"]),
  title: z.string().optional(),
  text: z.string(),
});
const viz = z.object({
  kind: z.literal("viz"),
  componentKey: z.string(),
  config: z.record(z.unknown()).optional(),
});
const worked = z.object({
  kind: z.literal("worked"),
  prompt: z.string(),
  steps: z.array(z.object({ text: z.string(), latex: z.string().optional() })),
  answer: z.string(),
});
/** ตารางสำหรับสรุปสมบัติ ค่าที่ต้องจำ หรือเปรียบเทียบ — หัวใจของความรู้สึก "เป็นหนังสือ" */
const table = z.object({
  kind: z.literal("table"),
  caption: z.string().optional(),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

const quiz = z.object({
  kind: z.literal("quiz"),
  prompt: z.string(),
  choices: z.array(z.object({ text: z.string(), correct: z.boolean().optional() })),
  explain: z.string(),
  hint: z.string().optional(),
});

export const blockSchema = z.discriminatedUnion("kind", [
  paragraph,
  math,
  list,
  callout,
  viz,
  worked,
  quiz,
  table,
]);
export type Block = z.infer<typeof blockSchema>;

export const lessonSectionSchema = z.object({
  id: z.string(),
  type: z.enum(SECTION_TYPES),
  title: z.string().optional(),
  blocks: z.array(blockSchema),
});
export type LessonSection = z.infer<typeof lessonSectionSchema>;

export const lessonSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  estimatedMinutes: z.number().int().positive(),
  order: z.number().int(),
  status: z.enum(["draft", "published"]),
  sections: z.array(lessonSectionSchema),
});
export type Lesson = z.infer<typeof lessonSchema>;

export const topicSchema = z.object({
  id: z.string(),
  chapterId: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  order: z.number().int(),
  /** พื้นฐานที่ต้องแม่นก่อน — ใช้สร้างกราฟลำดับการเรียนใน Phase ถัดไป */
  prerequisites: z.array(z.string()),
});
export type Topic = z.infer<typeof topicSchema>;

export const chapterSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  order: z.number().int(),
});
export type Chapter = z.infer<typeof chapterSchema>;

export const courseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  level: z.enum(["foundation", "m4", "m5", "m6", "advanced", "university"]),
  description: z.string(),
  order: z.number().int(),
});
export type Course = z.infer<typeof courseSchema>;

export const LEVEL_LABEL: Record<Course["level"], string> = {
  foundation: "ปรับพื้นฐาน",
  m4: "ม.4",
  m5: "ม.5",
  m6: "ม.6",
  advanced: "ขั้นสูง",
  university: "มหาวิทยาลัย",
};
