import type { LocalizedText } from "@/types/content";

export interface TrainingModule {
  title: LocalizedText;
}

export interface TrainingWeek {
  title: LocalizedText;
}

export interface ScholarshipQuestion {
  prompt: LocalizedText;
  options: readonly LocalizedText[];
  answer: number;
}

export interface TrainingProgram {
  slug: string;
  category: "bootcamp" | "short-course";
  title: LocalizedText;
  shortDescription: LocalizedText;
  description: LocalizedText;
  image: string;
  imageAlt: LocalizedText;
  duration: LocalizedText;
  location: LocalizedText;
  format: LocalizedText;
  instructor: string;
  instructorRole: LocalizedText;
  fee: number;
  certificate: boolean;
  hoursBreakdown: LocalizedText;
  curriculum: readonly TrainingModule[];
  weeks: readonly TrainingWeek[];
  scholarshipQuestions: readonly ScholarshipQuestion[];
}

const option = (en: string, tr: string, ar: string, fa: string): LocalizedText => ({
  en,
  tr,
  ar,
  fa
});

export const trainingPrograms: readonly TrainingProgram[] = [
  {
    slug: "data-science-machine-learning",
    category: "bootcamp",
    title: {
      en: "Data Science and Machine Learning",
      tr: "Veri Bilimi ve Makine Öğrenmesi",
      ar: "علوم البيانات وتعلم الآلة",
      fa: "علم داده و یادگیری ماشین"
    },
    shortDescription: {
      en: "End-to-end machine learning, from data analysis to model development and deployment through Docker and APIs.",
      tr: "Veri analizinden model geliştirmeye, Docker ve API ile canlıya almaya kadar uçtan uca makine öğrenmesi.",
      ar: "تعلم آلة متكامل من تحليل البيانات إلى تطوير النماذج ونشرها باستخدام Docker وواجهات API.",
      fa: "یادگیری ماشین سرتاسری، از تحلیل داده و توسعه مدل تا استقرار با Docker و APIها."
    },
    description: {
      en: "To make a difference in AI, it is not enough to build models; you need to be able to deploy them. This intensive bootcamp provides an end-to-end machine learning experience, from data analysis and model development to deployment with Docker and APIs. Online weekday classes, in-person weekend practice sessions, and career-focused masterclasses help participants finish with a strong portfolio of developed and deployed work.",
      tr: "Yapay zeka dünyasında fark yaratmak için yalnızca model geliştirmek yeterli değildir; bu modelleri canlıya alabilmek gerekir. Bu yoğun bootcamp, veri analizi ve model geliştirmeden Docker ve API ile yayına almaya kadar uçtan uca makine öğrenmesi deneyimi sunar. Hafta içi çevrim içi dersler, hafta sonu yüz yüze uygulamalar ve kariyer odaklı masterclass oturumlarıyla katılımcılar güçlü bir portföy oluşturur.",
      ar: "لإحداث فرق في عالم الذكاء الاصطناعي لا يكفي بناء النماذج، بل يجب القدرة على نشرها. يقدم هذا المعسكر المكثف تجربة متكاملة في تعلم الآلة من تحليل البيانات وتطوير النماذج إلى النشر باستخدام Docker وواجهات API، مع دروس عبر الإنترنت وتطبيقات حضورية وجلسات مهنية.",
      fa: "برای اثرگذاری در حوزه هوش مصنوعی، ساخت مدل به‌تنهایی کافی نیست؛ باید بتوان آن را مستقر کرد. این بوت‌کمپ فشرده تجربه‌ای سرتاسری در یادگیری ماشین ارائه می‌دهد؛ از تحلیل داده و توسعه مدل تا استقرار با Docker و APIها. کلاس‌های آنلاین در روزهای هفته، جلسات تمرین حضوری در پایان هفته و مسترکلاس‌های حرفه‌ای به شرکت‌کنندگان کمک می‌کنند دوره را با مجموعه‌ای قوی از کارهای توسعه‌یافته و مستقرشده به پایان برسانند."
    },
    image: "/images/data-science-machine-learning-bootcamp.png",
    imageAlt: {
      en: "Data Science and Machine Learning bootcamp with instructor Dr. Mahyar Teymournezhad",
      tr: "Dr. Mahyar Teymournezhad ile Veri Bilimi ve Makine Öğrenmesi bootcamp programı",
      ar: "معسكر علوم البيانات وتعلم الآلة مع الدكتور مهيار تيمور نجاد",
      fa: "بوت‌کمپ علم داده و یادگیری ماشین با تدریس Dr. Mahyar Teymournezhad"
    },
    duration: { en: "120 hours", tr: "120 saat", ar: "120 ساعة", fa: "۱۲۰ ساعت" },
    location: {
      en: "Istanbul + Online",
      tr: "İstanbul + Çevrim içi",
      ar: "إسطنبول + عبر الإنترنت",
      fa: "استانبول + آنلاین"
    },
    format: { en: "Hybrid", tr: "Hibrit", ar: "هجين", fa: "ترکیبی" },
    instructor: "Dr. Mahyar Teymournezhad",
    instructorRole: {
      en: "Founder / CEO",
      tr: "Kurucu / CEO",
      ar: "المؤسس / الرئيس التنفيذي",
      fa: "بنیان‌گذار / مدیرعامل"
    },
    fee: 90000,
    certificate: true,
    hoursBreakdown: {
      en: "54 hours of theoretical training + 45 hours of practical training + 20 hours of industry activities",
      tr: "54 saat teorik eğitim + 45 saat uygulamalı eğitim + 20 saat sektör etkinliği",
      ar: "54 ساعة تدريب نظري + 45 ساعة تدريب عملي + 20 ساعة أنشطة مهنية",
      fa: "۵۴ ساعت آموزش نظری + ۴۵ ساعت آموزش عملی + ۲۰ ساعت فعالیت حرفه‌ای"
    },
    curriculum: [
      {
        title: option(
          "Data science ecosystem and Python",
          "Veri bilimi ekosistemi ve Python",
          "منظومة علوم البيانات وPython",
          "زیست‌بوم علم داده و Python"
        )
      },
      {
        title: option(
          "Data exploration and visualization",
          "Veri keşfi ve görselleştirme",
          "استكشاف البيانات وتصورها",
          "کاوش و مصورسازی داده‌ها"
        )
      },
      {
        title: option(
          "Feature engineering",
          "Özellik mühendisliği",
          "هندسة الخصائص",
          "مهندسی ویژگی"
        )
      },
      {
        title: option(
          "Supervised learning models",
          "Denetimli öğrenme modelleri",
          "نماذج التعلم الخاضع للإشراف",
          "مدل‌های یادگیری نظارت‌شده"
        )
      },
      {
        title: option(
          "Model evaluation and optimization",
          "Model değerlendirme ve optimizasyon",
          "تقييم النماذج وتحسينها",
          "ارزیابی و بهینه‌سازی مدل"
        )
      },
      {
        title: option(
          "Deployment with MLOps, API and Docker",
          "MLOps, API ve Docker ile canlıya alma",
          "النشر باستخدام MLOps وAPI وDocker",
          "استقرار با MLOps، API و Docker"
        )
      }
    ],
    weeks: [
      {
        title: option(
          "Data Science Ecosystem",
          "Veri Bilimi Ekosistemi",
          "منظومة علوم البيانات",
          "زیست‌بوم علم داده"
        )
      },
      {
        title: option(
          "Mathematical Foundations for Machine Learning",
          "Makine Öğrenmesi için Matematiksel Temeller",
          "الأسس الرياضية لتعلم الآلة",
          "مبانی ریاضی یادگیری ماشین"
        )
      },
      {
        title: option(
          "Data and Feature Engineering",
          "Veri ve Özellik Mühendisliği",
          "هندسة البيانات والخصائص",
          "مهندسی داده و ویژگی"
        )
      },
      { title: option("Regression", "Regresyon", "الانحدار", "رگرسیون") },
      { title: option("Classification", "Sınıflandırma", "التصنيف", "طبقه‌بندی") },
      {
        title: option(
          "Trees and Community Learning",
          "Ağaçlar ve Topluluk Öğrenmesi",
          "الأشجار والتعلم التجميعي",
          "درخت‌ها و یادگیری گروهی"
        )
      },
      {
        title: option(
          "Model Validation and Optimization",
          "Model Doğrulama ve Optimizasyon",
          "التحقق من النماذج وتحسينها",
          "اعتبارسنجی و بهینه‌سازی مدل"
        )
      },
      {
        title: option(
          "Unsupervised Learning",
          "Denetimsiz Öğrenme",
          "التعلم غير الخاضع للإشراف",
          "یادگیری بدون نظارت"
        )
      },
      {
        title: option(
          "Fundamentals of Artificial Neural Networks",
          "Yapay Sinir Ağlarının Temelleri",
          "أساسيات الشبكات العصبية الاصطناعية",
          "مبانی شبکه‌های عصبی مصنوعی"
        )
      },
      {
        title: option(
          "Deep Learning Engineering",
          "Derin Öğrenme Mühendisliği",
          "هندسة التعلم العميق",
          "مهندسی یادگیری عمیق"
        )
      },
      { title: option("Special Topics", "Özel Konular", "موضوعات خاصة", "موضوعات ویژه") },
      {
        title: option(
          "ML System Architecture",
          "ML Sistem Mimarisi",
          "معمارية أنظمة تعلم الآلة",
          "معماری سامانه‌های ML"
        )
      },
      {
        title: option(
          "Deployment and MLOps",
          "Canlıya Alma ve MLOps",
          "النشر وMLOps",
          "استقرار و MLOps"
        )
      },
      { title: option("Final Project", "Final Projesi", "المشروع النهائي", "پروژه نهایی") }
    ],
    scholarshipQuestions: [
      {
        prompt: option(
          "Which Python library is designed for tabular data analysis?",
          "Tablolu veri analizi için tasarlanan Python kütüphanesi hangisidir?",
          "أي مكتبة Python مصممة لتحليل البيانات الجدولية؟",
          "کدام کتابخانه Python برای تحلیل داده‌های جدولی طراحی شده است؟"
        ),
        options: [
          option("pandas", "pandas", "pandas", "pandas"),
          option("Flask", "Flask", "Flask", "Flask"),
          option("Beautiful Soup", "Beautiful Soup", "Beautiful Soup", "Beautiful Soup"),
          option("Pygame", "Pygame", "Pygame", "Pygame")
        ],
        answer: 0
      },
      {
        prompt: option(
          "What is it called when a model performs well on training data but poorly on new data?",
          "Bir model eğitim verisinde iyi, yeni veride kötü sonuç verdiğinde buna ne denir?",
          "ماذا يسمى أداء النموذج الجيد على بيانات التدريب والضعيف على البيانات الجديدة؟",
          "به حالتی که مدل روی داده‌های آموزشی خوب و روی داده‌های جدید ضعیف عمل کند چه می‌گویند؟"
        ),
        options: [
          option("Underfitting", "Eksik öğrenme", "نقص الملاءمة", "کم‌برازش"),
          option("Overfitting", "Aşırı öğrenme", "فرط الملاءمة", "بیش‌برازش"),
          option("Normalization", "Normalizasyon", "التطبيع", "نرمال‌سازی"),
          option("Clustering", "Kümeleme", "التجميع", "خوشه‌بندی")
        ],
        answer: 1
      },
      {
        prompt: option(
          "Which metric is commonly used to evaluate a regression model?",
          "Bir regresyon modelini değerlendirmek için hangi metrik yaygın olarak kullanılır?",
          "أي مقياس يستخدم عادة لتقييم نموذج الانحدار؟",
          "کدام معیار معمولاً برای ارزیابی مدل رگرسیون استفاده می‌شود؟"
        ),
        options: [
          option(
            "Mean Absolute Error",
            "Ortalama Mutlak Hata",
            "متوسط الخطأ المطلق",
            "میانگین خطای مطلق"
          ),
          option("Class label", "Sınıf etiketi", "تسمية الفئة", "برچسب کلاس"),
          option("Confusion color", "Karmaşıklık rengi", "لون الالتباس", "رنگ سردرگمی"),
          option("Token count", "Token sayısı", "عدد الرموز", "تعداد توکن‌ها")
        ],
        answer: 0
      },
      {
        prompt: option(
          "What is the purpose of a test dataset?",
          "Test veri setinin amacı nedir?",
          "ما الغرض من مجموعة بيانات الاختبار؟",
          "هدف از مجموعه داده آزمون چیست؟"
        ),
        options: [
          option(
            "Train the model repeatedly",
            "Modeli tekrar tekrar eğitmek",
            "تدريب النموذج مرارا",
            "آموزش مکرر مدل"
          ),
          option(
            "Evaluate performance on unseen data",
            "Görülmemiş veride performansı değerlendirmek",
            "تقييم الأداء على بيانات غير مسبوقة",
            "ارزیابی عملکرد روی داده‌های دیده‌نشده"
          ),
          option(
            "Store application logs",
            "Uygulama günlüklerini saklamak",
            "تخزين سجلات التطبيق",
            "ذخیره گزارش‌های برنامه"
          ),
          option(
            "Replace feature engineering",
            "Özellik mühendisliğinin yerini almak",
            "استبدال هندسة الخصائص",
            "جایگزین کردن مهندسی ویژگی"
          )
        ],
        answer: 1
      },
      {
        prompt: option(
          "Which tool can package a machine learning application into a portable container?",
          "Bir makine öğrenmesi uygulamasını taşınabilir bir konteynere hangi araç paketleyebilir?",
          "أي أداة تحزم تطبيق تعلم الآلة في حاوية قابلة للنقل؟",
          "کدام ابزار می‌تواند یک برنامه یادگیری ماشین را در یک کانتینر قابل حمل بسته‌بندی کند؟"
        ),
        options: [
          option("Docker", "Docker", "Docker", "Docker"),
          option("Jupyter Markdown", "Jupyter Markdown", "Jupyter Markdown", "Jupyter Markdown"),
          option("CSS Grid", "CSS Grid", "CSS Grid", "CSS Grid"),
          option("Excel Chart", "Excel Grafiği", "مخطط Excel", "نمودار Excel")
        ],
        answer: 0
      }
    ]
  }
];

export const trainingCopy = {
  academy: option("Synergy Academy", "Synergy Academy", "أكاديمية Synergy", "Synergy Academy"),
  title: option(
    "Professional training programs",
    "Profesyonel eğitim programları",
    "برامج تدريب احترافية",
    "برنامه‌های آموزش حرفه‌ای"
  ),
  description: option(
    "Build practical, future-ready skills through intensive bootcamps and focused short courses.",
    "Yoğun bootcamp programları ve odaklı kısa kurslarla uygulamalı, geleceğe hazır beceriler kazanın.",
    "اكتسب مهارات عملية للمستقبل عبر معسكرات مكثفة ودورات قصيرة مركزة.",
    "با بوت‌کمپ‌های فشرده و دوره‌های کوتاه متمرکز، مهارت‌های عملی و آماده آینده کسب کنید."
  ),
  bootcamps: option("Bootcamps", "Bootcamp", "المعسكرات", "بوت‌کمپ‌ها"),
  shortCourses: option("Short courses", "Kısa kurslar", "الدورات القصيرة", "دوره‌های کوتاه"),
  shortCoursesEmpty: option(
    "Short courses will be added here soon.",
    "Kısa kurslar yakında burada yayınlanacak.",
    "ستضاف الدورات القصيرة هنا قريبا.",
    "دوره‌های کوتاه به‌زودی در این بخش افزوده می‌شوند."
  ),
  review: option(
    "Review training details",
    "Eğitim detaylarını incele",
    "عرض تفاصيل التدريب",
    "مشاهده جزئیات دوره"
  ),
  preregister: option("Pre-register", "Ön kayıt", "التسجيل المسبق", "پیش‌ثبت‌نام"),
  scholarship: option(
    "Take the scholarship exam",
    "Bursluluk sınavına gir",
    "ابدأ اختبار المنحة",
    "شرکت در آزمون بورسیه"
  ),
  tuition: option("Tuition fee", "Eğitim ücreti", "رسوم التدريب", "شهریه دوره"),
  allPrograms: option("All programs", "Tüm programlar", "جميع البرامج", "همه برنامه‌ها"),
  duration: option("Duration", "Süre", "المدة", "مدت"),
  location: option("Location", "Konum", "الموقع", "مکان"),
  format: option("Format", "Format", "التنسيق", "شیوه برگزاری"),
  instructor: option("Instructor", "Eğitmen", "المدرب", "مدرس"),
  fee: option("Fee", "Ücret", "الرسوم", "هزینه"),
  certificate: option("Certificate", "Sertifika", "الشهادة", "گواهی‌نامه"),
  certificateYes: option("Included", "Dahil", "متاحة", "ارائه می‌شود"),
  apply: option("Apply for training", "Eğitime başvur", "قدم للتدريب", "درخواست شرکت در دوره"),
  getInfo: option("Get information", "Bilgi al", "احصل على معلومات", "دریافت اطلاعات"),
  explanation: option("Explanation", "Açıklama", "شرح", "توضیحات"),
  about: option("About the program", "Program hakkında", "حول البرنامج", "درباره برنامه"),
  curriculum: option("Curriculum", "Müfredat", "المنهج", "سرفصل‌ها"),
  learn: option("What will you learn?", "Neler öğreneceksiniz?", "ماذا ستتعلم؟", "چه خواهید آموخت؟"),
  weeklyPlan: option("Weekly plan", "Haftalık plan", "الخطة الأسبوعية", "برنامه هفتگی"),
  weeklyProgress: option(
    "Weekly progress",
    "Haftalık ilerleme",
    "التقدم الأسبوعي",
    "روند هفتگی"
  ),
  week: option("Week", "Hafta", "الأسبوع", "هفته"),
  application: option("Application", "Başvuru", "التقديم", "درخواست ثبت‌نام"),
  preRegisterTitle: option(
    "Pre-register for this program",
    "Bu programa ön kayıt yapın",
    "سجل مسبقا في هذا البرنامج",
    "پیش‌ثبت‌نام در این برنامه"
  ),
  preRegisterDescription: option(
    "Complete the form to continue to the temporary confirmation page. No data will be transmitted.",
    "Geçici onay sayfasına devam etmek için formu doldurun. Hiçbir veri gönderilmeyecektir.",
    "أكمل النموذج للانتقال إلى صفحة التأكيد المؤقتة. لن يتم إرسال أي بيانات.",
    "برای ادامه و مشاهده صفحه تأیید موقت، فرم را تکمیل کنید. هیچ داده‌ای ارسال نخواهد شد."
  ),
  fullName: option("Full name", "Ad soyad", "الاسم الكامل", "نام و نام خانوادگی"),
  email: option("Email", "E-posta", "البريد الإلكتروني", "ایمیل"),
  phone: option("Telephone", "Telefon", "الهاتف", "تلفن"),
  program: option("Program", "Program", "البرنامج", "برنامه"),
  message: option("Your message", "Mesajınız", "رسالتك", "پیام شما"),
  scholarshipCode: option(
    "Scholarship code (optional)",
    "Burs kodu (isteğe bağlı)",
    "رمز المنحة (اختياري)",
    "کد بورسیه (اختیاری)"
  ),
  submit: option(
    "Complete pre-registration",
    "Ön kaydı tamamla",
    "أكمل التسجيل المسبق",
    "تکمیل پیش‌ثبت‌نام"
  ),
  successTitle: option(
    "Pre-registration form completed",
    "Ön kayıt formu tamamlandı",
    "اكتمل نموذج التسجيل المسبق",
    "فرم پیش‌ثبت‌نام تکمیل شد"
  ),
  successDescription: option(
    "This temporary flow did not transmit or store your information.",
    "Bu geçici akış bilgilerinizi göndermedi veya saklamadı.",
    "لم يرسل هذا المسار المؤقت معلوماتك أو يخزنها.",
    "در این فرایند موقت، اطلاعات شما ارسال یا ذخیره نشد."
  ),
  returnCourse: option("Return to the course", "Kursa dön", "العودة إلى الدورة", "بازگشت به دوره")
} satisfies Record<string, LocalizedText>;

export function getTrainingProgram(slug: string): TrainingProgram | undefined {
  return trainingPrograms.find((program) => program.slug === slug);
}

export function formatTrainingFee(fee: number): string {
  return `₺${fee.toLocaleString("en-US")}`;
}
