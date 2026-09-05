/**
 * ชื่อและข้อความประจำเว็บทั้งหมดอยู่ในไฟล์เดียว
 * — เปลี่ยนชื่อโปรเจกต์ได้ที่นี่ที่เดียว
 */
export const SITE = {
  name: "Delta",
  nameTh: "เดลตา",
  symbol: "Δ",

  tagline:
    "เข้าใจคณิตศาสตร์ด้วยการทดลอง ไม่ใช่การท่องจำ",

  description:
    "แพลตฟอร์มเรียนคณิตศาสตร์แบบโต้ตอบ ตั้งแต่ ม.4 ถึงระดับมหาวิทยาลัย — ปรับค่าแล้วเห็นผลทันที เข้าใจที่มาของทุกสูตร",

  /** Δ คือสัญลักษณ์ของการเปลี่ยนแปลง */
  meaning:
    "Δ คือสัญลักษณ์ของการเปลี่ยนแปลง ใช้ทั้งในแคลคูลัส (Δx → 0) และฟิสิกส์ (Δv, Δt) — และคือสิ่งที่เว็บนี้ตั้งใจทำกับผู้เรียน",

  /** ผู้จัดทำเว็บไซต์ */
  author: "Delta Team",
} as const;

/**
 * short = ป้ายสำหรับจอแคบ
 * from  = เริ่มแสดงที่เบรกพอยต์ไหน
 */
export const NAV = [
  {
    href: "/courses",
    label: "หลักสูตร",
    short: "หลักสูตร",
    from: "always",
  },
  {
    href: "/progress",
    label: "ความก้าวหน้า",
    short: "ก้าวหน้า",
    from: "md",
  },
  {
    href: "/practice",
    label: "ฝึกโจทย์",
    short: "ฝึก",
    from: "always",
  },
  {
    href: "/exam",
    label: "ข้อสอบจำลอง",
    short: "ข้อสอบ",
    from: "always",
  },
  {
    href: "/playground",
    label: "ห้องทดลอง",
    short: "ทดลอง",
    from: "always",
  },
  {
    href: "/formulas",
    label: "สรุปสูตร",
    short: "สูตร",
    from: "md",
  },
  {
    href: "/about",
    label: "แนวทาง",
    short: "แนวทาง",
    from: "lg",
  },
] as const;
