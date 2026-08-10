import type { LocalizedText } from "@/types/content";

export type EventTone = "violet" | "cyan" | "gold";

export interface FeaturedEvent {
  slug: string;
  title: string;
  type: LocalizedText;
  date: LocalizedText;
  dateTime?: string;
  eventImage?: string;
  description: LocalizedText;
  location: LocalizedText;
  tone: EventTone;
  overview: LocalizedText;
  program: readonly LocalizedText[];
  audience: readonly LocalizedText[];
  formatDetails: readonly LocalizedText[];
}

export function getLatestCompletedEvent(referenceDate = new Date()): FeaturedEvent | undefined {
  return featuredEvents
    .filter(
      (event) => event.dateTime && new Date(event.dateTime).getTime() < referenceDate.getTime()
    )
    .sort((first, second) => Date.parse(second.dateTime!) - Date.parse(first.dateTime!))[0];
}

export const featuredEvents: readonly FeaturedEvent[] = [
  {
    slug: "synergy-science-2026",
    title: "Synergy Science 2026",
    type: { en: "Conference", tr: "Konferans", ar: "مؤتمر", fa: "کنفرانس" },
    date: { en: "March 2, 2026", tr: "2 Mart 2026", ar: "2 مارس 2026", fa: "۲ مارس ۲۰۲۶" },
    dateTime: "2026-03-02",
    description: {
      en: "A scientific gathering bringing together academia and industry, with sessions on artificial intelligence, data science, and engineering.",
      tr: "Akademi ile sektörü bir araya getiren; yapay zeka, veri bilimi ve mühendislik oturumlarından oluşan bilimsel bir buluşma.",
      ar: "ملتقى علمي يجمع الأوساط الأكاديمية والصناعية، ويضم جلسات حول الذكاء الاصطناعي وعلوم البيانات والهندسة.",
      fa: "گردهمایی علمی که دانشگاه و صنعت را در کنار هم قرار می‌دهد و شامل نشست‌هایی درباره هوش مصنوعی، علم داده و مهندسی است."
    },
    location: { en: "Istanbul", tr: "İstanbul", ar: "إسطنبول", fa: "استانبول" },
    tone: "violet",
    overview: {
      en: "Synergy Science 2026 is a one-day interdisciplinary forum connecting researchers, engineers, educators, and industry leaders. The program focuses on responsible artificial intelligence, modern data practices, and the path from research findings to dependable real-world systems.",
      tr: "Synergy Science 2026; araştırmacıları, mühendisleri, eğitimcileri ve sektör liderlerini buluşturan bir günlük disiplinler arası bir forumdur. Program; sorumlu yapay zeka, modern veri uygulamaları ve araştırma sonuçlarının güvenilir gerçek dünya sistemlerine dönüştürülmesine odaklanır.",
      ar: "Synergy Science 2026 منتدى متعدد التخصصات ليوم واحد يجمع الباحثين والمهندسين والمعلمين وقادة الصناعة. يركز البرنامج على الذكاء الاصطناعي المسؤول وممارسات البيانات الحديثة وتحويل نتائج الأبحاث إلى أنظمة موثوقة في العالم الحقيقي.",
      fa: "Synergy Science 2026 یک همایش میان‌رشته‌ای یک‌روزه است که پژوهشگران، مهندسان، مدرسان و رهبران صنعت را گرد هم می‌آورد. این برنامه بر هوش مصنوعی مسئولانه، شیوه‌های نوین کار با داده و مسیر تبدیل یافته‌های پژوهشی به سامانه‌های قابل اعتماد در دنیای واقعی تمرکز دارد."
    },
    program: [
      {
        en: "Opening keynote on responsible and applied AI",
        tr: "Sorumlu ve uygulamalı yapay zeka açılış konuşması",
        ar: "كلمة افتتاحية حول الذكاء الاصطناعي المسؤول والتطبيقي",
        fa: "سخنرانی افتتاحیه درباره هوش مصنوعی مسئولانه و کاربردی"
      },
      {
        en: "Research talks in artificial intelligence and data science",
        tr: "Yapay zeka ve veri bilimi araştırma konuşmaları",
        ar: "محاضرات بحثية في الذكاء الاصطناعي وعلوم البيانات",
        fa: "سخنرانی‌های پژوهشی در زمینه هوش مصنوعی و علم داده"
      },
      {
        en: "Engineering panel on building dependable systems",
        tr: "Güvenilir sistemler geliştirme üzerine mühendislik paneli",
        ar: "جلسة هندسية حول بناء أنظمة موثوقة",
        fa: "پنل مهندسی درباره ساخت سامانه‌های قابل اعتماد"
      },
      {
        en: "Project showcase and guided networking",
        tr: "Proje gösterimi ve yönlendirilmiş tanışma oturumu",
        ar: "عرض للمشاريع وجلسة تواصل موجهة",
        fa: "ارائه پروژه‌ها و شبکه‌سازی هدایت‌شده"
      }
    ],
    audience: [
      { en: "Researchers", tr: "Araştırmacılar", ar: "الباحثون", fa: "پژوهشگران" },
      { en: "Engineers", tr: "Mühendisler", ar: "المهندسون", fa: "مهندسان" },
      {
        en: "Graduate students",
        tr: "Lisansüstü öğrenciler",
        ar: "طلاب الدراسات العليا",
        fa: "دانشجویان تحصیلات تکمیلی"
      },
      {
        en: "Innovation leaders",
        tr: "İnovasyon liderleri",
        ar: "قادة الابتكار",
        fa: "رهبران نوآوری"
      }
    ],
    formatDetails: [
      {
        en: "One-day, in-person forum",
        tr: "Bir günlük yüz yüze forum",
        ar: "منتدى حضوري ليوم واحد",
        fa: "همایش حضوری یک‌روزه"
      },
      {
        en: "Language: English and Turkish",
        tr: "Dil: İngilizce ve Türkçe",
        ar: "اللغة: الإنجليزية والتركية",
        fa: "زبان: انگلیسی و ترکی"
      },
      {
        en: "Exact venue will be announced",
        tr: "Kesin mekan duyurulacaktır",
        ar: "سيتم الإعلان عن المكان المحدد",
        fa: "محل دقیق برگزاری اعلام خواهد شد"
      }
    ]
  },
  {
    slug: "bootcamp-demo-day",
    title: "Bootcamp Demo Day",
    type: {
      en: "Bootcamp event",
      tr: "Bootcamp etkinliği",
      ar: "فعالية المعسكر",
      fa: "رویداد بوت‌کمپ"
    },
    date: {
      en: "To be announced soon",
      tr: "Yakında duyurulacak",
      ar: "سيتم الإعلان قريبا",
      fa: "به‌زودی اعلام می‌شود"
    },
    description: {
      en: "The closing event includes graduate project presentations and networking opportunities with industry mentors and business partners.",
      tr: "Kapanış etkinliği, mezuniyet projelerinin sunumlarını ve sektör mentorları ile iş ortaklarıyla ağ kurma fırsatlarını içerir.",
      ar: "تتضمن الفعالية الختامية عروضا لمشاريع الخريجين وفرصا للتواصل مع مرشدي القطاع وشركاء الأعمال.",
      fa: "رویداد پایانی شامل ارائه پروژه‌های فارغ‌التحصیلی و فرصت‌های شبکه‌سازی با مربیان صنعت و شرکای تجاری است."
    },
    location: { en: "Istanbul", tr: "İstanbul", ar: "إسطنبول", fa: "استانبول" },
    tone: "cyan",
    overview: {
      en: "Bootcamp Demo Day is the closing showcase for project teams completing an intensive learning program. Participants present working prototypes, explain the problems they addressed, and receive practical feedback from mentors and invited industry reviewers.",
      tr: "Bootcamp Demo Day, yoğun bir öğrenme programını tamamlayan proje ekiplerinin kapanış gösterimidir. Katılımcılar çalışan prototiplerini sunar, ele aldıkları problemleri açıklar ve mentorlar ile davetli sektör değerlendiricilerinden pratik geri bildirim alır.",
      ar: "Bootcamp Demo Day هو العرض الختامي لفرق المشاريع التي أكملت برنامجا تعليميا مكثفا. يقدم المشاركون نماذج أولية عملية ويشرحون المشكلات التي عالجوها ويتلقون ملاحظات من المرشدين وخبراء الصناعة المدعوين.",
      fa: "Bootcamp Demo Day ارائه پایانی تیم‌های پروژه‌ای است که یک برنامه آموزشی فشرده را به پایان رسانده‌اند. شرکت‌کنندگان نمونه‌های اولیه عملی خود را ارائه می‌کنند، مسائل حل‌شده را توضیح می‌دهند و از مربیان و ارزیابان دعوت‌شده صنعت بازخورد کاربردی می‌گیرند."
    },
    program: [
      {
        en: "Welcome and cohort introduction",
        tr: "Karşılama ve grup tanıtımı",
        ar: "الترحيب والتعريف بالمجموعة",
        fa: "خوشامدگویی و معرفی دوره"
      },
      {
        en: "Team prototype demonstrations",
        tr: "Ekip prototip gösterimleri",
        ar: "عروض النماذج الأولية للفرق",
        fa: "نمایش نمونه‌های اولیه تیم‌ها"
      },
      {
        en: "Mentor and reviewer feedback",
        tr: "Mentor ve değerlendirici geri bildirimi",
        ar: "ملاحظات المرشدين والمراجعين",
        fa: "بازخورد مربیان و ارزیابان"
      },
      {
        en: "Industry networking session",
        tr: "Sektör tanışma oturumu",
        ar: "جلسة تواصل مع قطاع الأعمال",
        fa: "نشست شبکه‌سازی با فعالان صنعت"
      }
    ],
    audience: [
      {
        en: "Bootcamp participants",
        tr: "Bootcamp katılımcıları",
        ar: "مشاركو المعسكر",
        fa: "شرکت‌کنندگان بوت‌کمپ"
      },
      { en: "Hiring teams", tr: "İşe alım ekipleri", ar: "فرق التوظيف", fa: "تیم‌های استخدام" },
      {
        en: "Founders and mentors",
        tr: "Kurucular ve mentorlar",
        ar: "المؤسسون والمرشدون",
        fa: "بنیان‌گذاران و مربیان"
      },
      {
        en: "Education partners",
        tr: "Eğitim ortakları",
        ar: "شركاء التعليم",
        fa: "شرکای آموزشی"
      }
    ],
    formatDetails: [
      {
        en: "In-person showcase",
        tr: "Yüz yüze gösterim",
        ar: "عرض حضوري",
        fa: "ارائه حضوری"
      },
      {
        en: "Date and time will be announced",
        tr: "Tarih ve saat duyurulacaktır",
        ar: "سيتم الإعلان عن التاريخ والوقت",
        fa: "تاریخ و زمان اعلام خواهد شد"
      },
      {
        en: "Registration details coming soon",
        tr: "Kayıt bilgileri yakında",
        ar: "تفاصيل التسجيل قريبا",
        fa: "جزئیات ثبت‌نام به‌زودی اعلام می‌شود"
      }
    ]
  },
  {
    slug: "corporate-ai-workshop",
    title: "Corporate AI Workshop",
    type: { en: "Workshop", tr: "Atölye", ar: "ورشة عمل", fa: "کارگاه" },
    date: { en: "Periodic", tr: "Dönemsel", ar: "دورية", fa: "دوره‌ای" },
    description: {
      en: "A workshop on practical artificial intelligence strategy and curriculum planning for school and institution administrators.",
      tr: "Okul ve kurum yöneticileri için uygulamalı yapay zeka stratejisi ve müfredat planlaması atölyesi.",
      ar: "ورشة عمل حول استراتيجية الذكاء الاصطناعي العملية وتخطيط المناهج لمديري المدارس والمؤسسات.",
      fa: "کارگاهی درباره راهبرد عملی هوش مصنوعی و برنامه‌ریزی درسی برای مدیران مدارس و مؤسسات."
    },
    location: { en: "Hybrid", tr: "Hibrit", ar: "هجين", fa: "ترکیبی" },
    tone: "gold",
    overview: {
      en: "The Corporate AI Workshop is a practical working session for leaders planning responsible AI adoption. Participants identify useful opportunities, assess organizational readiness, and leave with a focused 90-day action plan suited to their institution.",
      tr: "Kurumsal Yapay Zeka Atölyesi, sorumlu yapay zeka kullanımını planlayan liderler için uygulamalı bir çalışma oturumudur. Katılımcılar faydalı fırsatları belirler, kurumsal hazırlığı değerlendirir ve kurumlarına uygun 90 günlük odaklı bir eylem planıyla ayrılır.",
      ar: "ورشة الذكاء الاصطناعي المؤسسية جلسة عملية للقادة الذين يخططون لاعتماد مسؤول للذكاء الاصطناعي. يحدد المشاركون الفرص المفيدة ويقيمون جاهزية المؤسسة ويضعون خطة عمل مركزة لمدة 90 يوما.",
      fa: "Corporate AI Workshop یک نشست عملی برای رهبرانی است که به دنبال پذیرش مسئولانه هوش مصنوعی هستند. شرکت‌کنندگان فرصت‌های مفید را شناسایی می‌کنند، آمادگی سازمان را می‌سنجند و با یک برنامه اقدام متمرکز ۹۰روزه متناسب با مؤسسه خود کارگاه را به پایان می‌رسانند."
    },
    program: [
      {
        en: "AI opportunity and readiness mapping",
        tr: "Yapay zeka fırsat ve hazırlık haritalama",
        ar: "رسم فرص الذكاء الاصطناعي والجاهزية",
        fa: "ترسیم فرصت‌ها و آمادگی هوش مصنوعی"
      },
      {
        en: "Responsible-use and governance principles",
        tr: "Sorumlu kullanım ve yönetişim ilkeleri",
        ar: "مبادئ الاستخدام المسؤول والحوكمة",
        fa: "اصول استفاده مسئولانه و حکمرانی"
      },
      {
        en: "Use-case prioritization exercise",
        tr: "Kullanım senaryosu önceliklendirme çalışması",
        ar: "تمرين ترتيب حالات الاستخدام حسب الأولوية",
        fa: "تمرین اولویت‌بندی موارد کاربرد"
      },
      {
        en: "A practical 90-day roadmap",
        tr: "Uygulanabilir 90 günlük yol haritası",
        ar: "خارطة طريق عملية لمدة 90 يوما",
        fa: "نقشه راه عملی ۹۰روزه"
      }
    ],
    audience: [
      { en: "School leaders", tr: "Okul yöneticileri", ar: "قادة المدارس", fa: "مدیران مدارس" },
      {
        en: "Institution administrators",
        tr: "Kurum yöneticileri",
        ar: "مديرو المؤسسات",
        fa: "مدیران مؤسسات"
      },
      { en: "Curriculum teams", tr: "Müfredat ekipleri", ar: "فرق المناهج", fa: "تیم‌های برنامه درسی" },
      {
        en: "Transformation teams",
        tr: "Dönüşüm ekipleri",
        ar: "فرق التحول",
        fa: "تیم‌های تحول"
      }
    ],
    formatDetails: [
      { en: "Hybrid delivery", tr: "Hibrit katılım", ar: "تقديم هجين", fa: "برگزاری ترکیبی" },
      {
        en: "Periodic small-group sessions",
        tr: "Dönemsel küçük grup oturumları",
        ar: "جلسات دورية لمجموعات صغيرة",
        fa: "نشست‌های دوره‌ای در گروه‌های کوچک"
      },
      {
        en: "Materials and planning templates included",
        tr: "Materyaller ve planlama şablonları dahildir",
        ar: "تشمل المواد وقوالب التخطيط",
        fa: "شامل منابع و الگوهای برنامه‌ریزی"
      }
    ]
  }
];

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
  back: { en: "Back to events", tr: "Etkinliklere dön", ar: "العودة إلى الفعاليات", fa: "بازگشت به رویدادها" },
  overview: {
    en: "Event overview",
    tr: "Etkinlik özeti",
    ar: "نظرة عامة على الفعالية",
    fa: "معرفی رویداد"
  },
  program: {
    en: "Program highlights",
    tr: "Program başlıkları",
    ar: "أبرز فقرات البرنامج",
    fa: "بخش‌های اصلی برنامه"
  },
  audience: {
    en: "Who should attend",
    tr: "Kimler katılmalı",
    ar: "الفئة المناسبة للحضور",
    fa: "مخاطبان رویداد"
  },
  logistics: {
    en: "Format and logistics",
    tr: "Format ve organizasyon",
    ar: "التنسيق والترتيبات",
    fa: "شیوه برگزاری و هماهنگی‌ها"
  },
  date: { en: "Date", tr: "Tarih", ar: "التاريخ", fa: "تاریخ" },
  location: { en: "Location", tr: "Konum", ar: "الموقع", fa: "مکان" },
  type: { en: "Event type", tr: "Etkinlik türü", ar: "نوع الفعالية", fa: "نوع رویداد" },
  note: {
    en: "Final timing and participation details will be published here when confirmed.",
    tr: "Kesin saat ve katılım bilgileri onaylandığında burada yayınlanacaktır.",
    ar: "سيتم نشر التوقيت النهائي وتفاصيل المشاركة هنا بعد تأكيدها.",
    fa: "زمان‌بندی نهایی و جزئیات شرکت در رویداد پس از تأیید در این بخش منتشر خواهد شد."
  }
} satisfies Record<string, LocalizedText>;

export function getFeaturedEvent(slug: string): FeaturedEvent | undefined {
  return featuredEvents.find((event) => event.slug === slug);
}
