import type { LocalizedText } from "@/types/content";

export type ResearchProjectIcon = "dna" | "traffic" | "marine" | "navigation" | "code";
export type ResearchProjectTone = "cyan" | "green" | "blue" | "violet" | "gold";

export interface ActiveResearchProject {
  slug: string;
  name: string;
  icon: ResearchProjectIcon;
  tone: ResearchProjectTone;
  category: LocalizedText;
  type: string;
  description: LocalizedText;
  objectives: readonly LocalizedText[];
  technologies: readonly string[];
  teamSlots: number;
}

const machineLearning: LocalizedText = {
  en: "Machine Learning",
  tr: "Makine Öğrenmesi",
  ar: "تعلم الآلة",
  fa: "یادگیری ماشین"
};

export const activeResearchProjects: readonly ActiveResearchProject[] = [
  {
    slug: "biopredict",
    name: "BioPredict",
    icon: "dna",
    tone: "cyan",
    category: machineLearning,
    type: "TÜBİTAK",
    description: {
      en: "BioPredict is a platform that provides rapid biological activity prediction, confidence scores, and visual analysis from molecular structures, accelerating pre-laboratory candidate screening.",
      tr: "BioPredict, moleküler yapılardan hızlı biyolojik aktivite tahmini, güven puanları ve görsel analiz sunarak laboratuvar öncesi aday taramasını hızlandıran bir platformdur.",
      ar: "BioPredict منصة تقدم تنبؤا سريعا بالنشاط البيولوجي ودرجات ثقة وتحليلا مرئيا انطلاقا من البنى الجزيئية، مما يسرع فحص المركبات المرشحة قبل المختبر.",
      fa: "BioPredict پلتفرمی است که بر پایه ساختارهای مولکولی، پیش‌بینی سریع فعالیت زیستی، امتیازهای اطمینان و تحلیل بصری ارائه می‌دهد و غربالگری ترکیبات نامزد را پیش از مرحله آزمایشگاهی تسریع می‌کند."
    },
    objectives: [
      {
        en: "Accelerate biological activity prediction in drug discovery.",
        tr: "İlaç keşfinde biyolojik aktivite tahminini hızlandırmak.",
        ar: "تسريع التنبؤ بالنشاط البيولوجي في اكتشاف الأدوية.",
        fa: "تسریع پیش‌بینی فعالیت زیستی در فرایند کشف دارو."
      },
      {
        en: "Reduce the cost and time of early research and development.",
        tr: "Erken Ar-Ge aşamalarının maliyetini ve süresini azaltmak.",
        ar: "تقليل تكلفة ومدة مراحل البحث والتطوير المبكرة.",
        fa: "کاهش هزینه و زمان مراحل اولیه تحقیق و توسعه."
      },
      {
        en: "Help researchers prioritize promising compounds.",
        tr: "Araştırmacıların umut vadeden bileşikleri önceliklendirmesini sağlamak.",
        ar: "مساعدة الباحثين على ترتيب المركبات الواعدة حسب الأولوية.",
        fa: "کمک به پژوهشگران برای اولویت‌بندی ترکیبات امیدبخش."
      }
    ],
    technologies: [
      "Machine learning algorithms",
      "QSAR models",
      "Graph Neural Networks (GNN)",
      "Web application",
      "Confidence and uncertainty scoring",
      "Data visualization"
    ],
    teamSlots: 3
  },
  {
    slug: "urbanflow-rl",
    name: "UrbanFlow-RL",
    icon: "traffic",
    tone: "green",
    category: machineLearning,
    type: "TÜBİTAK",
    description: {
      en: "UrbanFlow-RL compares multiple reinforcement-learning agents that learn intersection signal control in a simulation environment, aiming for smoother, scalable, and energy-efficient traffic management.",
      tr: "UrbanFlow-RL, simülasyon ortamında kavşak sinyal kontrolünü öğrenen birden çok pekiştirmeli öğrenme ajanını karşılaştırarak daha akıcı, ölçeklenebilir ve enerji verimli trafik yönetimini hedefler.",
      ar: "يقارن UrbanFlow-RL بين عدة وكلاء للتعلم المعزز يتعلمون التحكم بإشارات التقاطعات في بيئة محاكاة بهدف إدارة مرور أكثر سلاسة وقابلية للتوسع وكفاءة في الطاقة.",
      fa: "UrbanFlow-RL چندین عامل یادگیری تقویتی را که کنترل چراغ تقاطع را در محیط شبیه‌سازی می‌آموزند مقایسه می‌کند تا مدیریت ترافیکی روان‌تر، مقیاس‌پذیرتر و کم‌مصرف‌تر فراهم شود."
    },
    objectives: [
      {
        en: "Reduce waiting times and queues at intersections.",
        tr: "Kavşaklardaki bekleme sürelerini ve kuyrukları azaltmak.",
        ar: "تقليل أوقات الانتظار والازدحام عند التقاطعات.",
        fa: "کاهش زمان انتظار و صف‌ها در تقاطع‌ها."
      },
      {
        en: "Improve traffic flow and reduce fuel consumption.",
        tr: "Trafik akışını iyileştirmek ve yakıt tüketimini azaltmak.",
        ar: "تحسين تدفق المرور وتقليل استهلاك الوقود.",
        fa: "بهبود جریان ترافیک و کاهش مصرف سوخت."
      },
      {
        en: "Develop control policies that generalize to different network topologies.",
        tr: "Farklı ağ topolojilerine genellenebilen kontrol politikaları geliştirmek.",
        ar: "تطوير سياسات تحكم قابلة للتعميم على بنيات شبكية مختلفة.",
        fa: "توسعه سیاست‌های کنترلی قابل تعمیم به توپولوژی‌های مختلف شبکه."
      }
    ],
    technologies: [
      "Reinforcement learning (DQN, IDQN, MDQN, MPLight)",
      "SUMO traffic simulator",
      "Python",
      "PyTorch",
      "Automated training and monitoring",
      "CSV and JSON analysis outputs"
    ],
    teamSlots: 3
  },
  {
    slug: "poseidon",
    name: "Poseidon",
    icon: "marine",
    tone: "blue",
    category: machineLearning,
    type: "TÜBİTAK",
    description: {
      en: "Poseidon detects traces of pollution on the water surface using visual models, correlates them with nearby vessels using AIS data, and generates evidence-driven reports for relevant authorities.",
      tr: "Poseidon, görsel modellerle su yüzeyindeki kirlilik izlerini tespit eder, AIS verileriyle yakındaki gemilerle ilişkilendirir ve ilgili makamlar için kanıta dayalı raporlar üretir.",
      ar: "يكتشف Poseidon آثار التلوث على سطح المياه باستخدام نماذج بصرية، ويربطها بالسفن القريبة عبر بيانات AIS، وينشئ تقارير قائمة على الأدلة للجهات المختصة.",
      fa: "Poseidon با استفاده از مدل‌های بصری، آثار آلودگی را روی سطح آب شناسایی می‌کند، آن‌ها را با داده‌های AIS به شناورهای نزدیک مرتبط می‌سازد و برای نهادهای مسئول گزارش‌های مبتنی بر شواهد تولید می‌کند."
    },
    objectives: [
      {
        en: "Protect marine ecosystems.",
        tr: "Deniz ekosistemlerini korumak.",
        ar: "حماية النظم البيئية البحرية.",
        fa: "حفاظت از اکوسیستم‌های دریایی."
      },
      {
        en: "Detect illegal discharges from ships.",
        tr: "Gemilerden yapılan yasa dışı deşarjları tespit etmek.",
        ar: "اكتشاف التصريفات غير القانونية من السفن.",
        fa: "شناسایی تخلیه‌های غیرقانونی از کشتی‌ها."
      },
      {
        en: "Strengthen environmental-law enforcement and produce evidence for authorities.",
        tr: "Çevre hukuku uygulamasını güçlendirmek ve makamlar için kanıt üretmek.",
        ar: "تعزيز إنفاذ القوانين البيئية وإنتاج أدلة للجهات المختصة.",
        fa: "تقویت اجرای قوانین زیست‌محیطی و تولید شواهد برای نهادهای مسئول."
      }
    ],
    technologies: [
      "AI and computer vision",
      "High-resolution aerial and satellite imagery",
      "AIS ship tracking data",
      "Event-source matching",
      "Evidence analysis and reporting"
    ],
    teamSlots: 3
  },
  {
    slug: "navai",
    name: "NavAI",
    icon: "navigation",
    tone: "violet",
    category: machineLearning,
    type: "TÜBİTAK",
    description: {
      en: "NavAI is a flight-control approach that processes UAV sensor data in real time to make autonomous route and mission decisions, increasing reliability in surveillance and data-collection missions.",
      tr: "NavAI, İHA sensör verilerini gerçek zamanlı işleyerek otonom rota ve görev kararları veren, gözetim ve veri toplama görevlerinde güvenilirliği artırmayı hedefleyen bir uçuş kontrol yaklaşımıdır.",
      ar: "NavAI نهج للتحكم بالطيران يعالج بيانات مستشعرات الطائرات المسيرة لحظيا لاتخاذ قرارات مستقلة بشأن المسار والمهمة وزيادة الموثوقية في مهام المراقبة وجمع البيانات.",
      fa: "NavAI رویکردی برای کنترل پرواز است که داده‌های حسگر پهپاد را به‌صورت بلادرنگ پردازش می‌کند تا درباره مسیر و مأموریت به‌طور خودکار تصمیم بگیرد و قابلیت اطمینان مأموریت‌های پایش و جمع‌آوری داده را افزایش دهد."
    },
    objectives: [
      {
        en: "Provide UAVs with high operational autonomy.",
        tr: "İHA'lara yüksek operasyonel otonomi kazandırmak.",
        ar: "منح الطائرات المسيرة استقلالية تشغيلية عالية.",
        fa: "فراهم کردن سطح بالایی از خودمختاری عملیاتی برای پهپادها."
      },
      {
        en: "Ensure safe and efficient flight in complex environments.",
        tr: "Karmaşık ortamlarda güvenli ve verimli uçuş sağlamak.",
        ar: "ضمان طيران آمن وفعال في البيئات المعقدة.",
        fa: "تضمین پرواز ایمن و کارآمد در محیط‌های پیچیده."
      },
      {
        en: "Reduce human intervention in surveillance and analysis missions.",
        tr: "Gözetim ve analiz görevlerinde insan müdahalesini azaltmak.",
        ar: "تقليل التدخل البشري في مهام المراقبة والتحليل.",
        fa: "کاهش مداخله انسانی در مأموریت‌های پایش و تحلیل."
      }
    ],
    technologies: [
      "Custom AI flight model",
      "Real-time sensor processing",
      "Dynamic terrain navigation",
      "ROS 2",
      "Gazebo",
      "ArduPilot SITL",
      "Multimodal sensor fusion"
    ],
    teamSlots: 3
  },
  {
    slug: "codeai",
    name: "CodeAI",
    icon: "code",
    tone: "gold",
    category: machineLearning,
    type: "TÜBİTAK",
    description: {
      en: "CodeAI is an AI-powered education platform that provides real-time feedback on students' code, generates personalized exercises, and adapts content to their learning level.",
      tr: "CodeAI, öğrencilerin kodlarına gerçek zamanlı geri bildirim veren, kişiselleştirilmiş alıştırmalar üreten ve içeriği öğrenme seviyelerine uyarlayan yapay zeka destekli bir eğitim platformudur.",
      ar: "CodeAI منصة تعليمية مدعومة بالذكاء الاصطناعي تقدم ملاحظات فورية على شيفرة الطلاب، وتنشئ تمارين مخصصة، وتكيف المحتوى مع مستوى تعلمهم.",
      fa: "CodeAI یک پلتفرم آموزشی مبتنی بر هوش مصنوعی است که درباره کد دانشجویان بازخورد بلادرنگ ارائه می‌دهد، تمرین‌های شخصی‌سازی‌شده تولید می‌کند و محتوا را با سطح یادگیری آن‌ها تطبیق می‌دهد."
    },
    objectives: [
      {
        en: "Personalize programming education with instant feedback and adaptive learning paths.",
        tr: "Anlık geri bildirim ve uyarlanabilir yollarla programlama eğitimini kişiselleştirmek.",
        ar: "تخصيص تعليم البرمجة من خلال ملاحظات فورية ومسارات تعلم تكيفية.",
        fa: "شخصی‌سازی آموزش برنامه‌نویسی با بازخورد فوری و مسیرهای یادگیری تطبیقی."
      },
      {
        en: "Reduce instructor workload.",
        tr: "Eğitmen iş yükünü azaltmak.",
        ar: "تقليل عبء العمل على المدرسين.",
        fa: "کاهش حجم کار مدرسان."
      },
      {
        en: "Make programming education more accessible and efficient.",
        tr: "Programlama eğitimini daha erişilebilir ve verimli hale getirmek.",
        ar: "جعل تعليم البرمجة أكثر سهولة وكفاءة.",
        fa: "دسترس‌پذیرتر و کارآمدتر کردن آموزش برنامه‌نویسی."
      }
    ],
    technologies: [
      "Large Language Models (LLM)",
      "Natural Language Processing (NLP)",
      "Adaptive learning algorithms",
      "Code analysis and feedback",
      "VS Code integration",
      "Training-platform integration"
    ],
    teamSlots: 3
  }
];

export const researchPageCopy = {
  back: {
    en: "Back to R&D",
    tr: "Ar-Ge'ye dön",
    ar: "العودة إلى البحث والتطوير",
    fa: "بازگشت به تحقیق و توسعه"
  },
  eyebrow: {
    en: "Active R&D portfolio",
    tr: "Aktif Ar-Ge portföyü",
    ar: "محفظة البحث والتطوير النشطة",
    fa: "مجموعه فعال تحقیق و توسعه"
  },
  title: {
    en: "Research projects in progress",
    tr: "Devam eden Ar-Ge projeleri",
    ar: "مشاريع البحث والتطوير قيد العمل",
    fa: "پروژه‌های تحقیق و توسعه در حال اجرا"
  },
  description: {
    en: "Five applied research tracks exploring responsible uses of machine learning across health, cities, marine protection, autonomous systems, and education.",
    tr: "Sağlık, şehirler, deniz koruma, otonom sistemler ve eğitim alanlarında makine öğrenmesinin sorumlu kullanımını araştıran beş uygulamalı çalışma.",
    ar: "خمسة مسارات بحثية تطبيقية تستكشف الاستخدام المسؤول لتعلم الآلة في الصحة والمدن وحماية البحار والأنظمة المستقلة والتعليم.",
    fa: "پنج مسیر پژوهشی کاربردی که استفاده مسئولانه از یادگیری ماشین را در حوزه‌های سلامت، شهرها، حفاظت از محیط زیست دریایی، سامانه‌های خودمختار و آموزش بررسی می‌کنند."
  },
  directoryEyebrow: {
    en: "Project directory",
    tr: "Proje dizini",
    ar: "دليل المشاريع",
    fa: "فهرست پروژه‌ها"
  },
  directoryTitle: {
    en: "Explore the active portfolio",
    tr: "Aktif portföyü inceleyin",
    ar: "استكشف المحفظة النشطة",
    fa: "مجموعه پروژه‌های فعال را ببینید"
  },
  active: { en: "Active R&D", tr: "Aktif Ar-Ge", ar: "بحث وتطوير نشط", fa: "تحقیق و توسعه فعال" },
  viewDetails: { en: "View project", tr: "Projeyi görüntüle", ar: "عرض المشروع", fa: "مشاهده پروژه" },
  category: { en: "Category", tr: "Kategori", ar: "الفئة", fa: "دسته‌بندی" },
  type: { en: "Program", tr: "Program", ar: "البرنامج", fa: "برنامه" },
  descriptionTitle: {
    en: "Project description",
    tr: "Proje açıklaması",
    ar: "وصف المشروع",
    fa: "شرح پروژه"
  },
  objectivesTitle: {
    en: "Research objectives",
    tr: "Araştırma hedefleri",
    ar: "أهداف البحث",
    fa: "اهداف پژوهش"
  },
  technologiesTitle: { en: "Technologies", tr: "Teknolojiler", ar: "التقنيات", fa: "فناوری‌ها" },
  teamEyebrow: { en: "Project team", tr: "Proje ekibi", ar: "فريق المشروع", fa: "تیم پروژه" },
  teamTitle: {
    en: "Team slots ready to assign",
    tr: "Atamaya hazır ekip alanları",
    ar: "أماكن فريق جاهزة للتعيين",
    fa: "جایگاه‌های آماده برای اعضای تیم"
  },
  teamDescription: {
    en: "Names, roles, and profile photos can be added when the project team is confirmed.",
    tr: "Proje ekibi netleştiğinde isimler, roller ve profil fotoğrafları eklenebilir.",
    ar: "يمكن إضافة الأسماء والأدوار والصور الشخصية عند تأكيد فريق المشروع.",
    fa: "پس از نهایی شدن تیم پروژه، نام‌ها، نقش‌ها و تصاویر پروفایل قابل افزودن خواهند بود."
  },
  unassigned: {
    en: "Unassigned team member",
    tr: "Atanmamış ekip üyesi",
    ar: "عضو فريق غير معين",
    fa: "عضو تعیین‌نشده تیم"
  },
  projectLabel: { en: "Project", tr: "Proje", ar: "المشروع", fa: "پروژه" }
} satisfies Record<string, LocalizedText>;

export function getActiveResearchProject(slug: string): ActiveResearchProject | undefined {
  return activeResearchProjects.find((project) => project.slug === slug);
}
