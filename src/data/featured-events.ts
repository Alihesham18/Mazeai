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
    type: { en: "Conference", tr: "Konferans", ar: "مؤتمر" },
    date: { en: "March 2, 2026", tr: "2 Mart 2026", ar: "2 مارس 2026" },
    dateTime: "2026-03-02",
    description: {
      en: "A scientific gathering bringing together academia and industry, with sessions on artificial intelligence, data science, and engineering.",
      tr: "Akademi ile sektörü bir araya getiren; yapay zeka, veri bilimi ve mühendislik oturumlarından oluşan bilimsel bir buluşma.",
      ar: "ملتقى علمي يجمع الأوساط الأكاديمية والصناعية، ويضم جلسات حول الذكاء الاصطناعي وعلوم البيانات والهندسة."
    },
    location: { en: "Istanbul", tr: "İstanbul", ar: "إسطنبول" },
    tone: "violet",
    overview: {
      en: "Synergy Science 2026 is a one-day interdisciplinary forum connecting researchers, engineers, educators, and industry leaders. The program focuses on responsible artificial intelligence, modern data practices, and the path from research findings to dependable real-world systems.",
      tr: "Synergy Science 2026; araştırmacıları, mühendisleri, eğitimcileri ve sektör liderlerini buluşturan bir günlük disiplinler arası bir forumdur. Program; sorumlu yapay zeka, modern veri uygulamaları ve araştırma sonuçlarının güvenilir gerçek dünya sistemlerine dönüştürülmesine odaklanır.",
      ar: "Synergy Science 2026 منتدى متعدد التخصصات ليوم واحد يجمع الباحثين والمهندسين والمعلمين وقادة الصناعة. يركز البرنامج على الذكاء الاصطناعي المسؤول وممارسات البيانات الحديثة وتحويل نتائج الأبحاث إلى أنظمة موثوقة في العالم الحقيقي."
    },
    program: [
      {
        en: "Opening keynote on responsible and applied AI",
        tr: "Sorumlu ve uygulamalı yapay zeka açılış konuşması",
        ar: "كلمة افتتاحية حول الذكاء الاصطناعي المسؤول والتطبيقي"
      },
      {
        en: "Research talks in artificial intelligence and data science",
        tr: "Yapay zeka ve veri bilimi araştırma konuşmaları",
        ar: "محاضرات بحثية في الذكاء الاصطناعي وعلوم البيانات"
      },
      {
        en: "Engineering panel on building dependable systems",
        tr: "Güvenilir sistemler geliştirme üzerine mühendislik paneli",
        ar: "جلسة هندسية حول بناء أنظمة موثوقة"
      },
      {
        en: "Project showcase and guided networking",
        tr: "Proje gösterimi ve yönlendirilmiş tanışma oturumu",
        ar: "عرض للمشاريع وجلسة تواصل موجهة"
      }
    ],
    audience: [
      { en: "Researchers", tr: "Araştırmacılar", ar: "الباحثون" },
      { en: "Engineers", tr: "Mühendisler", ar: "المهندسون" },
      { en: "Graduate students", tr: "Lisansüstü öğrenciler", ar: "طلاب الدراسات العليا" },
      { en: "Innovation leaders", tr: "İnovasyon liderleri", ar: "قادة الابتكار" }
    ],
    formatDetails: [
      {
        en: "One-day, in-person forum",
        tr: "Bir günlük yüz yüze forum",
        ar: "منتدى حضوري ليوم واحد"
      },
      {
        en: "Language: English and Turkish",
        tr: "Dil: İngilizce ve Türkçe",
        ar: "اللغة: الإنجليزية والتركية"
      },
      {
        en: "Exact venue will be announced",
        tr: "Kesin mekan duyurulacaktır",
        ar: "سيتم الإعلان عن المكان المحدد"
      }
    ]
  },
  {
    slug: "bootcamp-demo-day",
    title: "Bootcamp Demo Day",
    type: { en: "Bootcamp event", tr: "Bootcamp etkinliği", ar: "فعالية المعسكر" },
    date: {
      en: "To be announced soon",
      tr: "Yakında duyurulacak",
      ar: "سيتم الإعلان قريبا"
    },
    description: {
      en: "The closing event includes graduate project presentations and networking opportunities with industry mentors and business partners.",
      tr: "Kapanış etkinliği, mezuniyet projelerinin sunumlarını ve sektör mentorları ile iş ortaklarıyla ağ kurma fırsatlarını içerir.",
      ar: "تتضمن الفعالية الختامية عروضا لمشاريع الخريجين وفرصا للتواصل مع مرشدي القطاع وشركاء الأعمال."
    },
    location: { en: "Istanbul", tr: "İstanbul", ar: "إسطنبول" },
    tone: "cyan",
    overview: {
      en: "Bootcamp Demo Day is the closing showcase for project teams completing an intensive learning program. Participants present working prototypes, explain the problems they addressed, and receive practical feedback from mentors and invited industry reviewers.",
      tr: "Bootcamp Demo Day, yoğun bir öğrenme programını tamamlayan proje ekiplerinin kapanış gösterimidir. Katılımcılar çalışan prototiplerini sunar, ele aldıkları problemleri açıklar ve mentorlar ile davetli sektör değerlendiricilerinden pratik geri bildirim alır.",
      ar: "Bootcamp Demo Day هو العرض الختامي لفرق المشاريع التي أكملت برنامجا تعليميا مكثفا. يقدم المشاركون نماذج أولية عملية ويشرحون المشكلات التي عالجوها ويتلقون ملاحظات من المرشدين وخبراء الصناعة المدعوين."
    },
    program: [
      {
        en: "Welcome and cohort introduction",
        tr: "Karşılama ve grup tanıtımı",
        ar: "الترحيب والتعريف بالمجموعة"
      },
      {
        en: "Team prototype demonstrations",
        tr: "Ekip prototip gösterimleri",
        ar: "عروض النماذج الأولية للفرق"
      },
      {
        en: "Mentor and reviewer feedback",
        tr: "Mentor ve değerlendirici geri bildirimi",
        ar: "ملاحظات المرشدين والمراجعين"
      },
      {
        en: "Industry networking session",
        tr: "Sektör tanışma oturumu",
        ar: "جلسة تواصل مع قطاع الأعمال"
      }
    ],
    audience: [
      { en: "Bootcamp participants", tr: "Bootcamp katılımcıları", ar: "مشاركو المعسكر" },
      { en: "Hiring teams", tr: "İşe alım ekipleri", ar: "فرق التوظيف" },
      { en: "Founders and mentors", tr: "Kurucular ve mentorlar", ar: "المؤسسون والمرشدون" },
      { en: "Education partners", tr: "Eğitim ortakları", ar: "شركاء التعليم" }
    ],
    formatDetails: [
      { en: "In-person showcase", tr: "Yüz yüze gösterim", ar: "عرض حضوري" },
      {
        en: "Date and time will be announced",
        tr: "Tarih ve saat duyurulacaktır",
        ar: "سيتم الإعلان عن التاريخ والوقت"
      },
      {
        en: "Registration details coming soon",
        tr: "Kayıt bilgileri yakında",
        ar: "تفاصيل التسجيل قريبا"
      }
    ]
  },
  {
    slug: "corporate-ai-workshop",
    title: "Corporate AI Workshop",
    type: { en: "Workshop", tr: "Atölye", ar: "ورشة عمل" },
    date: { en: "Periodic", tr: "Dönemsel", ar: "دورية" },
    description: {
      en: "A workshop on practical artificial intelligence strategy and curriculum planning for school and institution administrators.",
      tr: "Okul ve kurum yöneticileri için uygulamalı yapay zeka stratejisi ve müfredat planlaması atölyesi.",
      ar: "ورشة عمل حول استراتيجية الذكاء الاصطناعي العملية وتخطيط المناهج لمديري المدارس والمؤسسات."
    },
    location: { en: "Hybrid", tr: "Hibrit", ar: "هجين" },
    tone: "gold",
    overview: {
      en: "The Corporate AI Workshop is a practical working session for leaders planning responsible AI adoption. Participants identify useful opportunities, assess organizational readiness, and leave with a focused 90-day action plan suited to their institution.",
      tr: "Kurumsal Yapay Zeka Atölyesi, sorumlu yapay zeka kullanımını planlayan liderler için uygulamalı bir çalışma oturumudur. Katılımcılar faydalı fırsatları belirler, kurumsal hazırlığı değerlendirir ve kurumlarına uygun 90 günlük odaklı bir eylem planıyla ayrılır.",
      ar: "ورشة الذكاء الاصطناعي المؤسسية جلسة عملية للقادة الذين يخططون لاعتماد مسؤول للذكاء الاصطناعي. يحدد المشاركون الفرص المفيدة ويقيمون جاهزية المؤسسة ويضعون خطة عمل مركزة لمدة 90 يوما."
    },
    program: [
      {
        en: "AI opportunity and readiness mapping",
        tr: "Yapay zeka fırsat ve hazırlık haritalama",
        ar: "رسم فرص الذكاء الاصطناعي والجاهزية"
      },
      {
        en: "Responsible-use and governance principles",
        tr: "Sorumlu kullanım ve yönetişim ilkeleri",
        ar: "مبادئ الاستخدام المسؤول والحوكمة"
      },
      {
        en: "Use-case prioritization exercise",
        tr: "Kullanım senaryosu önceliklendirme çalışması",
        ar: "تمرين ترتيب حالات الاستخدام حسب الأولوية"
      },
      {
        en: "A practical 90-day roadmap",
        tr: "Uygulanabilir 90 günlük yol haritası",
        ar: "خارطة طريق عملية لمدة 90 يوما"
      }
    ],
    audience: [
      { en: "School leaders", tr: "Okul yöneticileri", ar: "قادة المدارس" },
      { en: "Institution administrators", tr: "Kurum yöneticileri", ar: "مديرو المؤسسات" },
      { en: "Curriculum teams", tr: "Müfredat ekipleri", ar: "فرق المناهج" },
      { en: "Transformation teams", tr: "Dönüşüm ekipleri", ar: "فرق التحول" }
    ],
    formatDetails: [
      { en: "Hybrid delivery", tr: "Hibrit katılım", ar: "تقديم هجين" },
      {
        en: "Periodic small-group sessions",
        tr: "Dönemsel küçük grup oturumları",
        ar: "جلسات دورية لمجموعات صغيرة"
      },
      {
        en: "Materials and planning templates included",
        tr: "Materyaller ve planlama şablonları dahildir",
        ar: "تشمل المواد وقوالب التخطيط"
      }
    ]
  }
];

export const eventsPageCopy = {
  eyebrow: { en: "Events", tr: "Etkinlikler", ar: "الفعاليات" },
  title: {
    en: "Conferences and meetings",
    tr: "Konferanslar ve buluşmalar",
    ar: "المؤتمرات واللقاءات"
  },
  description: {
    en: "Synergy Maze AI brings together conferences, workshops, and closing events designed for meaningful exchange.",
    tr: "Synergy Maze AI, anlamlı paylaşım için konferansları, atölyeleri ve kapanış etkinliklerini bir araya getirir.",
    ar: "تجمع Synergy Maze AI بين المؤتمرات وورش العمل والفعاليات الختامية المصممة للتبادل الهادف."
  },
  listingEyebrow: { en: "Program", tr: "Program", ar: "البرنامج" },
  listingTitle: {
    en: "Explore our events",
    tr: "Etkinliklerimizi keşfedin",
    ar: "استكشف فعالياتنا"
  },
  details: { en: "Detailed information", tr: "Detaylı bilgi", ar: "معلومات تفصيلية" }
} satisfies Record<string, LocalizedText>;

export const eventDetailCopy = {
  back: { en: "Back to events", tr: "Etkinliklere dön", ar: "العودة إلى الفعاليات" },
  overview: { en: "Event overview", tr: "Etkinlik özeti", ar: "نظرة عامة على الفعالية" },
  program: { en: "Program highlights", tr: "Program başlıkları", ar: "أبرز فقرات البرنامج" },
  audience: { en: "Who should attend", tr: "Kimler katılmalı", ar: "الفئة المناسبة للحضور" },
  logistics: { en: "Format and logistics", tr: "Format ve organizasyon", ar: "التنسيق والترتيبات" },
  date: { en: "Date", tr: "Tarih", ar: "التاريخ" },
  location: { en: "Location", tr: "Konum", ar: "الموقع" },
  type: { en: "Event type", tr: "Etkinlik türü", ar: "نوع الفعالية" },
  note: {
    en: "Final timing and participation details will be published here when confirmed.",
    tr: "Kesin saat ve katılım bilgileri onaylandığında burada yayınlanacaktır.",
    ar: "سيتم نشر التوقيت النهائي وتفاصيل المشاركة هنا بعد تأكيدها."
  }
} satisfies Record<string, LocalizedText>;

export function getFeaturedEvent(slug: string): FeaturedEvent | undefined {
  return featuredEvents.find((event) => event.slug === slug);
}
