/**
 * ตรวจความถูกต้องเชิงโครงสร้างของเนื้อหาทั้งหมด
 *
 * รันด้วย:  npm run check
 *
 * สคริปต์นี้ตรวจสิ่งที่เครื่องตรวจแทนคนได้ เช่น ควิซที่ลืมกำหนดคำตอบถูก
 * หรือบทเรียนที่อ้างถึงกราฟที่ยังไม่มีอยู่จริง
 * แต่ **ตรวจความถูกต้องทางคณิตศาสตร์ของเนื้อหาไม่ได้** — ส่วนนั้นยังต้องให้คนอ่าน
 */
import { lessons, topics, chapters, courses } from "../src/content";
import { SECTION_TYPES } from "../src/content/schema";
import { VIZ_KEYS } from "../src/components/viz/registry";

let errors = 0;
let warnings = 0;

const err = (msg: string) => {
  console.log(`  ✗ ${msg}`);
  errors++;
};
const warn = (msg: string) => {
  console.log(`  ! ${msg}`);
  warnings++;
};

console.log("\n=== ตรวจโครงสร้างเนื้อหา ===\n");

// 1. ไม่มี id หรือ slug ซ้ำ
const seenIds = new Set<string>();
const seenSlugs = new Set<string>();
for (const l of lessons) {
  if (seenIds.has(l.id)) err(`บทเรียน id ซ้ำ: ${l.id}`);
  if (seenSlugs.has(l.slug)) err(`บทเรียน slug ซ้ำ: ${l.slug}`);
  seenIds.add(l.id);
  seenSlugs.add(l.slug);
}

// 2. topicId ที่อ้างถึงต้องมีอยู่จริง และ chapterId ของหัวข้อก็ต้องมีอยู่จริง
const topicIds = new Set(topics.map((t) => t.id));
const chapterIds = new Set(chapters.map((c) => c.id));
const courseIds = new Set(courses.map((c) => c.id));
for (const l of lessons) {
  if (!topicIds.has(l.topicId)) err(`บทเรียน ${l.slug} อ้างถึงหัวข้อที่ไม่มีอยู่: ${l.topicId}`);
}
for (const t of topics) {
  if (!chapterIds.has(t.chapterId)) err(`หัวข้อ ${t.slug} อ้างถึงบทที่ไม่มีอยู่: ${t.chapterId}`);
  for (const p of t.prerequisites) {
    if (!topicIds.has(p)) err(`หัวข้อ ${t.slug} อ้างถึงพื้นฐานที่ไม่มีอยู่: ${p}`);
  }
}
for (const c of chapters) {
  if (!courseIds.has(c.courseId)) err(`บท ${c.title} อ้างถึงหลักสูตรที่ไม่มีอยู่: ${c.courseId}`);
}

// 3. กราฟลำดับพื้นฐานต้องไม่มีวงจร
const visiting = new Set<string>();
const done = new Set<string>();
function hasCycle(id: string, path: string[]): boolean {
  if (visiting.has(id)) {
    err(`พบวงจรในลำดับพื้นฐาน: ${[...path, id].join(" → ")}`);
    return true;
  }
  if (done.has(id)) return false;
  visiting.add(id);
  const t = topics.find((x) => x.id === id);
  for (const p of t?.prerequisites ?? []) {
    if (hasCycle(p, [...path, id])) return true;
  }
  visiting.delete(id);
  done.add(id);
  return false;
}
for (const t of topics) hasCycle(t.id, []);

// 4. ทุกบทเรียนต้องมีขั้นการสอนครบและเรียงถูก
for (const l of lessons) {
  const types = l.sections.map((s) => s.type);
  const missing = SECTION_TYPES.filter((t) => !types.includes(t));
  if (missing.length > 0) warn(`${l.slug}: ขาดขั้น ${missing.join(", ")}`);

  const order = types.map((t) => SECTION_TYPES.indexOf(t));
  for (let i = 1; i < order.length; i++) {
    if (order[i]! < order[i - 1]!) {
      warn(`${l.slug}: ลำดับขั้นสลับที่ (${types[i - 1]} มาก่อน ${types[i]})`);
      break;
    }
  }

  const ids = new Set<string>();
  for (const s of l.sections) {
    if (ids.has(s.id)) err(`${l.slug}: section id ซ้ำ (${s.id})`);
    ids.add(s.id);
  }
}

// 5. ควิซต้องมีคำตอบถูกหนึ่งข้อพอดี และมีคำอธิบาย
let quizCount = 0;
for (const l of lessons) {
  for (const s of l.sections) {
    for (const b of s.blocks) {
      if (b.kind !== "quiz") continue;
      quizCount++;
      const correct = b.choices.filter((c) => c.correct).length;
      if (correct !== 1) {
        err(`${l.slug}/${s.id}: ควิซมีคำตอบถูก ${correct} ข้อ (ต้องมี 1 ข้อพอดี) — "${b.prompt.slice(0, 40)}…"`);
      }
      if (b.choices.length < 2) err(`${l.slug}/${s.id}: ควิซมีตัวเลือกน้อยกว่า 2 ข้อ`);
      if (!b.explain || b.explain.length < 20) {
        warn(`${l.slug}/${s.id}: คำอธิบายเฉลยสั้นเกินไป`);
      }
      const texts = b.choices.map((c) => c.text);
      if (new Set(texts).size !== texts.length) {
        err(`${l.slug}/${s.id}: ควิซมีตัวเลือกซ้ำกัน`);
      }
    }
  }
}

// 6. componentKey ของกราฟต้องมีอยู่ในทะเบียนจริง
const vizKeys = new Set<string>(VIZ_KEYS);
let vizCount = 0;
for (const l of lessons) {
  for (const s of l.sections) {
    for (const b of s.blocks) {
      if (b.kind !== "viz") continue;
      vizCount++;
      if (!vizKeys.has(b.componentKey)) {
        err(`${l.slug}/${s.id}: อ้างถึงกราฟที่ไม่มีในทะเบียน (${b.componentKey})`);
      }
    }
  }
}

// 7. ตารางต้องมีจำนวนคอลัมน์ตรงกับหัวตารางทุกแถว
for (const l of lessons) {
  for (const s of l.sections) {
    for (const b of s.blocks) {
      if (b.kind !== "table") continue;
      b.rows.forEach((r, i) => {
        if (r.length !== b.headers.length) {
          err(
            `${l.slug}/${s.id}: ตารางแถวที่ ${i + 1} มี ${r.length} ช่อง แต่หัวตารางมี ${b.headers.length} ช่อง`,
          );
        }
      });
    }
  }
}

// 8. เครื่องหมาย $ ต้องเป็นคู่ มิฉะนั้นสูตรจะเรนเดอร์ผิด
function checkDollars(text: string, where: string) {
  const count = (text.match(/\$/g) ?? []).length;
  if (count % 2 !== 0) err(`${where}: เครื่องหมาย $ ไม่เป็นคู่ — "${text.slice(0, 50)}…"`);
}
for (const l of lessons) {
  for (const s of l.sections) {
    for (const b of s.blocks) {
      const where = `${l.slug}/${s.id}`;
      if (b.kind === "paragraph") checkDollars(b.text, where);
      if (b.kind === "callout") checkDollars(b.text ?? "", where);
      if (b.kind === "list") b.items.forEach((i) => checkDollars(i, where));
      if (b.kind === "quiz") {
        checkDollars(b.prompt, where);
        checkDollars(b.explain, where);
        b.choices.forEach((c) => checkDollars(c.text, where));
      }
      if (b.kind === "table") {
        b.headers.forEach((h) => checkDollars(h, where));
        b.rows.forEach((r) => r.forEach((c) => checkDollars(c, where)));
      }
    }
  }
}

// 9. ช่องที่เรนเดอร์เป็นสูตรล้วน ต้องไม่มี $ คั่น — ใส่ $ ลงไปจะทำให้ KaTeX พังทั้งก้อน
//    (ข้อความไทยในช่องพวกนี้ต้องห่อด้วย \text{...})
function checkRawLatex(latex: string, where: string, field: string) {
  if (latex.includes("$")) {
    err(`${where}: ${field} เป็นสูตรล้วนอยู่แล้ว ห้ามใส่ $ — "${latex.slice(0, 50)}…"`);
  }
}
for (const l of lessons) {
  for (const s of l.sections) {
    for (const b of s.blocks) {
      const where = `${l.slug}/${s.id}`;
      if (b.kind === "math") checkRawLatex(b.latex, where, "math.latex");
      if (b.kind === "worked") {
        checkRawLatex(b.answer, where, "worked.answer");
        b.steps.forEach((st) => {
          if (st.latex) checkRawLatex(st.latex, where, "worked.steps[].latex");
          checkDollars(st.text, where);
        });
        checkDollars(b.prompt, where);
      }
    }
  }
}

// 10. ตำแหน่งคำตอบที่ถูกต้องกระจายพอหรือไม่
//     เนื้อหาเขียนโดยวางคำตอบถูกไว้ข้อแรกเพื่อตรวจง่าย ระบบจึงสลับตัวเลือกตอนเรนเดอร์ให้
//     ตัวเลขนี้มีไว้เตือนถ้าวันหนึ่งมีคนถอดการสลับออก แล้วลืมกระจายคำตอบในข้อมูลจริง
{
  const pos = [0, 0, 0, 0, 0, 0];
  let n = 0;
  for (const l of lessons) {
    for (const s of l.sections) {
      for (const b of s.blocks) {
        if (b.kind !== "quiz") continue;
        const i = b.choices.findIndex((c) => c.correct);
        if (i >= 0) {
          pos[i] = (pos[i] ?? 0) + 1;
          n++;
        }
      }
    }
  }
  const first = pos[0] ?? 0;
  if (n > 0 && first / n > 0.5) {
    warn(
      `คำตอบที่ถูกอยู่ข้อแรก ${first}/${n} ข้อ — พึ่งการสลับตัวเลือกตอนเรนเดอร์อยู่ ` +
        `(shuffleWithSeed ใน src/lib/quiz.ts) ถ้าถอดออกเมื่อไรต้องกระจายคำตอบในข้อมูลก่อน`,
    );
  }
}

// สรุป
const totalSections = lessons.reduce((n, l) => n + l.sections.length, 0);
const totalMinutes = lessons.reduce((n, l) => n + l.estimatedMinutes, 0);
console.log(`\n--- สรุป ---`);
console.log(`หลักสูตร ${courses.length} · บท ${chapters.length} · หัวข้อ ${topics.length}`);
console.log(`บทเรียนที่เผยแพร่แล้ว ${lessons.length} บท · ${totalSections} ขั้น · รวม ${totalMinutes} นาที`);
console.log(`ควิซ ${quizCount} ข้อ · กราฟที่ฝังในบทเรียน ${vizCount} จุด · กราฟในทะเบียน ${VIZ_KEYS.length} แบบ`);

if (errors > 0) {
  console.log(`\n✗ พบข้อผิดพลาด ${errors} จุด${warnings ? ` และคำเตือน ${warnings} จุด` : ""}\n`);
  process.exit(1);
}
console.log(`\n✓ ผ่านทั้งหมด${warnings ? ` (มีคำเตือน ${warnings} จุด)` : ""}\n`);
