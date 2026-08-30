import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const fixtureImages = new Map([
  [
    "fixture-mahyar-photo",
    await readFile(path.join(projectRoot, "public/images/team/mahyar-teymournezhad.jpg"))
  ],
  [
    "fixture-ozgur-photo",
    await readFile(path.join(projectRoot, "public/images/team/ozgur-koray-sahingoz.jpg"))
  ]
]);

const translations = {
  mahyar: {
    en: [
      "Founder & CEO",
      "Mahyar Teymournezhad is the Founder and CEO of Synergy Maze AI, guiding the company's work across artificial intelligence, technology, research and development, and education.",
      ["Leadership", "Artificial Intelligence", "R&D", "Strategy"],
      "Portrait of Mahyar Teymournezhad"
    ],
    tr: [
      "Kurucu ve CEO",
      "Mahyar Teymournezhad, Synergy Maze AI'ın Kurucusu ve CEO'sudur; şirketin yapay zeka, teknoloji, araştırma-geliştirme ve eğitim alanlarındaki çalışmalarına yön verir.",
      ["Liderlik", "Yapay Zeka", "Ar-Ge", "Strateji"],
      "Mahyar Teymournezhad portresi"
    ],
    ar: [
      "المؤسس والرئيس التنفيذي",
      "مهیار تیمورنژاد هو مؤسس Synergy Maze AI ورئيسها التنفيذي، ويقود أعمال الشركة في الذكاء الاصطناعي والتكنولوجيا والبحث والتطوير والتعليم.",
      ["القيادة", "الذكاء الاصطناعي", "البحث والتطوير", "الاستراتيجية"],
      "صورة شخصية لمهیار تیمورنژاد"
    ],
    fa: [
      "بنیان‌گذار و مدیرعامل",
      "مهیار تیمورنژاد بنیان‌گذار و مدیرعامل Synergy Maze AI است و فعالیت‌های شرکت را در حوزه‌های هوش مصنوعی، فناوری، تحقیق‌وتوسعه و آموزش هدایت می‌کند.",
      ["رهبری", "هوش مصنوعی", "تحقیق و توسعه", "راهبرد"],
      "پرتره مهیار تیمورنژاد"
    ]
  },
  ozgur: {
    en: [
      "Academic Advisor",
      "Prof. Dr. Özgür Koray Şahingöz is MazeAI's Academic Advisor and a Professor of Computer Engineering at Biruni University. His academic work includes artificial intelligence, machine learning and computer engineering.",
      ["Research", "Artificial Intelligence", "Academia", "Mentorship"],
      "Portrait of Prof. Dr. Özgür Koray Şahingöz"
    ],
    tr: [
      "Akademik Danışman",
      "Prof. Dr. Özgür Koray Şahingöz, MazeAI'ın Akademik Danışmanı ve Biruni Üniversitesi Bilgisayar Mühendisliği profesörüdür. Akademik çalışmaları yapay zeka, makine öğrenmesi ve bilgisayar mühendisliğini kapsar.",
      ["Araştırma", "Yapay Zeka", "Akademi", "Mentorluk"],
      "Prof. Dr. Özgür Koray Şahingöz portresi"
    ],
    ar: [
      "المستشار الأكاديمي",
      "الأستاذ الدكتور أوزغور كوراي شاهينغوز هو المستشار الأكاديمي لـ MazeAI وأستاذ هندسة الحاسوب في جامعة بيروني. تشمل أعماله الأكاديمية الذكاء الاصطناعي وتعلّم الآلة وهندسة الحاسوب.",
      ["البحث", "الذكاء الاصطناعي", "العمل الأكاديمي", "الإرشاد"],
      "صورة شخصية للأستاذ الدكتور أوزغور كوراي شاهينغوز"
    ],
    fa: [
      "مشاور دانشگاهی",
      "پروفسور دکتر اوزگور کورای شاهین‌گوز مشاور دانشگاهی MazeAI و استاد مهندسی کامپیوتر در دانشگاه بیرونی است. فعالیت دانشگاهی او هوش مصنوعی، یادگیری ماشین و مهندسی کامپیوتر را دربر می‌گیرد.",
      ["پژوهش", "هوش مصنوعی", "دانشگاه", "راهنمایی علمی"],
      "پرتره پروفسور دکتر اوزگور کورای شاهین‌گوز"
    ]
  }
};

function memberTranslations(member) {
  return Object.entries(translations[member]).map(([language, values], index) => ({
    id: `${member}-${index + 1}`,
    language,
    job_title: values[0],
    bio: values[1],
    expertise: values[2],
    photo_alt: values[3]
  }));
}

const data = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    status: "published",
    sort: 1,
    slug: "mahyar-teymournezhad",
    full_name: "Mahyar Teymournezhad",
    photo: "fixture-mahyar-photo",
    expertise: ["Leadership", "Artificial Intelligence", "R&D", "Strategy"],
    linkedin_url: "https://www.linkedin.com/in/mahyarteymournezhad",
    category: "leadership",
    translations: memberTranslations("mahyar")
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    status: "published",
    sort: 2,
    slug: "ozgur-koray-sahingoz",
    full_name: "Prof. Dr. Özgür Koray Şahingöz",
    photo: "fixture-ozgur-photo",
    expertise: ["Research", "Artificial Intelligence", "Academia", "Mentorship"],
    linkedin_url: "https://www.linkedin.com/in/sahingoz",
    category: "research_advisory",
    translations: memberTranslations("ozgur")
  }
];

createServer((request, response) => {
  const assetId = request.url?.match(/^\/assets\/([^/?]+)/)?.[1];
  if (assetId && fixtureImages.has(assetId)) {
    response.setHeader("content-type", "image/jpeg");
    response.end(fixtureImages.get(assetId));
    return;
  }
  response.setHeader("content-type", "application/json; charset=utf-8");
  if (request.url?.startsWith("/server/health")) {
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }
  if (request.url?.startsWith("/items/team_members")) {
    response.end(JSON.stringify({ data }));
    return;
  }
  response.end(JSON.stringify({ data: [] }));
}).listen(3201, "127.0.0.1");
