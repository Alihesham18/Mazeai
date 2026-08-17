import type { LocalizedText } from "@/types/content";

export const eventsPageCopy = {
  eyebrow: { en: "Events", tr: "Etkinlikler", ar: "الفعاليات", fa: "رویدادها" },
  title: {
    en: "Conferences and meetings",
    tr: "Konferanslar ve buluşmalar",
    ar: "المؤتمرات واللقاءات",
    fa: "کنفرانس‌ها و گردهمایی‌ها"
  },
  description: {
    en: "Synergy Maze AI brings together conferences, workshops, and closing events designed for meaningful exchange.",
    tr: "Synergy Maze AI, anlamlı paylaşım için konferansları, atölyeleri ve kapanış etkinliklerini bir araya getirir.",
    ar: "تجمع Synergy Maze AI بين المؤتمرات وورش العمل والفعاليات الختامية المصممة للتبادل الهادف.",
    fa: "Synergy Maze AI کنفرانس‌ها، کارگاه‌ها و رویدادهای پایانی را برای تبادل معنادار گرد هم می‌آورد."
  },
  listingEyebrow: { en: "Program", tr: "Program", ar: "البرنامج", fa: "برنامه" },
  listingTitle: {
    en: "Explore our events",
    tr: "Etkinliklerimizi keşfedin",
    ar: "استكشف فعالياتنا",
    fa: "رویدادهای ما را ببینید"
  },
  details: {
    en: "Detailed information",
    tr: "Detaylı bilgi",
    ar: "معلومات تفصيلية",
    fa: "اطلاعات بیشتر"
  }
} satisfies Record<string, LocalizedText>;

export const eventDetailCopy = {
  back: {
    en: "Back to events",
    tr: "Etkinliklere dön",
    ar: "العودة إلى الفعاليات",
    fa: "بازگشت به رویدادها"
  },
  overview: {
    en: "Event overview",
    tr: "Etkinlik özeti",
    ar: "نظرة عامة على الفعالية",
    fa: "معرفی رویداد"
  },
  date: { en: "Date", tr: "Tarih", ar: "التاريخ", fa: "تاریخ" },
  location: { en: "Location", tr: "Konum", ar: "الموقع", fa: "مکان" },
  type: {
    en: "Event type",
    tr: "Etkinlik türü",
    ar: "نوع الفعالية",
    fa: "نوع رویداد"
  }
} satisfies Record<string, LocalizedText>;
