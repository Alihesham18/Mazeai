import type { LocalizedText } from "@/types/content";

export interface ProjectItem {
  title: LocalizedText;
  description: LocalizedText;
}

export interface ProjectLink {
  label: LocalizedText;
  href?: string;
}

export interface WebDevelopmentProject {
  slug: "smart-vision" | "nlp-assist";
  image: string;
  title: LocalizedText;
  overview: LocalizedText;
  status: LocalizedText;
  problem: LocalizedText;
  stack: readonly ProjectItem[];
  features: readonly ProjectItem[];
  architecture: readonly ProjectItem[];
  process: readonly ProjectItem[];
  deployment: readonly ProjectItem[];
  challenges: readonly ProjectItem[];
  quality: readonly ProjectItem[];
  maintenance: LocalizedText;
  roadmap: readonly ProjectItem[];
  links: readonly ProjectLink[];
}

export const projectPageCopy = {
  back: {
    en: "Back to Web Development",
    tr: "Web Geliştirme sayfasına dön",
    ar: "العودة إلى تطوير الويب"
  },
  portfolioProject: {
    en: "Portfolio case study",
    tr: "Portföy vaka çalışması",
    ar: "دراسة حالة للأعمال"
  },
  status: { en: "Project status", tr: "Proje durumu", ar: "حالة المشروع" },
  problem: { en: "Problem and goal", tr: "Sorun ve hedef", ar: "المشكلة والهدف" },
  stack: { en: "Technology stack", tr: "Teknoloji yığını", ar: "التقنيات المستخدمة" },
  features: {
    en: "Key features and user flows",
    tr: "Temel özellikler ve kullanıcı akışları",
    ar: "الميزات ومسارات المستخدم"
  },
  architecture: { en: "Architecture", tr: "Mimari", ar: "البنية التقنية" },
  process: { en: "Development process", tr: "Geliştirme süreci", ar: "عملية التطوير" },
  deployment: {
    en: "Deployment and environments",
    tr: "Dağıtım ve ortamlar",
    ar: "النشر والبيئات"
  },
  challenges: {
    en: "Challenges and resolutions",
    tr: "Zorluklar ve çözümler",
    ar: "التحديات والحلول"
  },
  quality: { en: "Quality evidence", tr: "Kalite göstergeleri", ar: "مؤشرات الجودة" },
  maintenance: {
    en: "Maintenance and extensibility",
    tr: "Bakım ve genişletilebilirlik",
    ar: "الصيانة وقابلية التوسع"
  },
  roadmap: { en: "Future roadmap", tr: "Gelecek yol haritası", ar: "خارطة الطريق" },
  links: { en: "Project links", tr: "Proje bağlantıları", ar: "روابط المشروع" },
  unavailable: { en: "Available on request", tr: "Talep üzerine paylaşılır", ar: "متاح عند الطلب" },
  viewProject: { en: "View case study", tr: "Vaka çalışmasını görüntüle", ar: "عرض دراسة الحالة" },
  projectsTitle: { en: "Selected projects", tr: "Seçili projeler", ar: "مشاريع مختارة" },
  projectsDescription: {
    en: "Applied web and AI product concepts presented as maintainable, production-oriented case studies.",
    tr: "Sürdürülebilir ve üretim odaklı vaka çalışmaları olarak sunulan uygulamalı web ve yapay zeka ürün konseptleri.",
    ar: "مفاهيم تطبيقية لمنتجات الويب والذكاء الاصطناعي مقدمة كدراسات حالة قابلة للصيانة وموجهة للإنتاج."
  }
} satisfies Record<string, LocalizedText>;

export const webDevelopmentProjects: readonly WebDevelopmentProject[] = [
  {
    slug: "smart-vision",
    image: "/images/smart-vision-project.png",
    title: { en: "Smart Vision", tr: "Smart Vision", ar: "Smart Vision" },
    overview: {
      en: "A privacy-conscious classroom engagement analytics platform that turns aggregate session signals into practical teaching insights.",
      tr: "Toplu oturum sinyallerini uygulanabilir öğretim içgörülerine dönüştüren, gizlilik odaklı sınıf etkileşim analitiği platformu.",
      ar: "منصة تراعي الخصوصية لتحليل تفاعل الصف وتحويل مؤشرات الجلسة المجمعة إلى رؤى تعليمية عملية."
    },
    status: {
      en: "Portfolio concept and technical prototype; production metrics and public deployment are not yet published.",
      tr: "Portföy konsepti ve teknik prototip; üretim metrikleri ve herkese açık dağıtım henüz yayımlanmadı.",
      ar: "مفهوم للأعمال ونموذج تقني أولي؛ لم تنشر بعد مقاييس الإنتاج أو نسخة عامة."
    },
    problem: {
      en: "Instructors often receive feedback after a course has ended. Smart Vision explores how de-identified, aggregate engagement signals can provide timely feedback without turning classroom analytics into individual surveillance.",
      tr: "Eğitmenler çoğu zaman geri bildirimi ders bittikten sonra alır. Smart Vision, sınıf analitiğini bireysel gözetim aracına dönüştürmeden kimliksiz ve toplu etkileşim sinyalleriyle zamanında geri bildirim sağlamayı araştırır.",
      ar: "غالبا ما يصل التقييم إلى المدرسين بعد انتهاء الدرس. يستكشف Smart Vision تقديم ملاحظات فورية من مؤشرات تفاعل مجمعة ومجهولة الهوية دون تحويل التحليلات إلى مراقبة فردية."
    },
    stack: [
      {
        title: {
          en: "Next.js and TypeScript",
          tr: "Next.js ve TypeScript",
          ar: "Next.js وTypeScript"
        },
        description: {
          en: "Provide a responsive dashboard, typed contracts, server rendering, and accessible routing.",
          tr: "Duyarlı pano, tip güvenli sözleşmeler, sunucu tarafı işleme ve erişilebilir yönlendirme sağlar.",
          ar: "لواجهة متجاوبة وعقود بيانات مكتوبة وعرض من الخادم وتنقل قابل للوصول."
        }
      },
      {
        title: {
          en: "Python, FastAPI, and WebSockets",
          tr: "Python, FastAPI ve WebSocket",
          ar: "Python وFastAPI وWebSocket"
        },
        description: {
          en: "Separate inference workloads from the web UI while streaming aggregate session updates.",
          tr: "Çıkarım iş yüklerini web arayüzünden ayırır ve toplu oturum güncellemelerini aktarır.",
          ar: "لفصل أعباء الاستدلال عن واجهة الويب وبث تحديثات الجلسة المجمعة."
        }
      },
      {
        title: {
          en: "PyTorch, OpenCV, and ONNX Runtime",
          tr: "PyTorch, OpenCV ve ONNX Runtime",
          ar: "PyTorch وOpenCV وONNX Runtime"
        },
        description: {
          en: "Support model experimentation, frame processing, and portable optimized inference.",
          tr: "Model denemelerini, kare işlemeyi ve taşınabilir optimize çıkarımı destekler.",
          ar: "لتجارب النماذج ومعالجة الإطارات والاستدلال المحسن القابل للنقل."
        }
      },
      {
        title: {
          en: "PostgreSQL, Docker, and GitHub Actions",
          tr: "PostgreSQL, Docker ve GitHub Actions",
          ar: "PostgreSQL وDocker وGitHub Actions"
        },
        description: {
          en: "Store structured aggregates and provide repeatable builds, tests, and deployments.",
          tr: "Yapılandırılmış toplu verileri saklar; tekrarlanabilir derleme, test ve dağıtım sağlar.",
          ar: "لتخزين البيانات المجمعة وتنفيذ عمليات بناء واختبار ونشر قابلة للتكرار."
        }
      }
    ],
    features: [
      {
        title: { en: "Session setup", tr: "Oturum kurulumu", ar: "إعداد الجلسة" },
        description: {
          en: "An instructor creates a class session, selects consent and retention settings, and starts aggregate analysis.",
          tr: "Eğitmen sınıf oturumu oluşturur, onay ve saklama ayarlarını seçer, toplu analizi başlatır.",
          ar: "ينشئ المدرس جلسة ويحدد إعدادات الموافقة والاحتفاظ ثم يبدأ التحليل المجمع."
        }
      },
      {
        title: {
          en: "Live engagement dashboard",
          tr: "Canlı etkileşim panosu",
          ar: "لوحة تفاعل مباشرة"
        },
        description: {
          en: "The dashboard displays time-series engagement, participation patterns, and interaction changes without naming students.",
          tr: "Pano, öğrencileri adlandırmadan zamana bağlı etkileşim, katılım örüntüleri ve değişimleri gösterir.",
          ar: "تعرض اللوحة اتجاهات التفاعل والمشاركة والتغيرات دون تسمية الطلاب."
        }
      },
      {
        title: { en: "Post-session report", tr: "Oturum sonrası rapor", ar: "تقرير ما بعد الجلسة" },
        description: {
          en: "After the lesson, the instructor reviews peaks, drop-offs, and suggested moments for follow-up.",
          tr: "Ders sonrasında eğitmen zirveleri, düşüşleri ve takip önerilerini inceler.",
          ar: "بعد الدرس يراجع المدرس فترات الارتفاع والانخفاض ونقاط المتابعة المقترحة."
        }
      },
      {
        title: { en: "Privacy controls", tr: "Gizlilik kontrolleri", ar: "ضوابط الخصوصية" },
        description: {
          en: "Administrators configure access, audit history, aggregation thresholds, and deletion policies.",
          tr: "Yöneticiler erişimi, denetim geçmişini, toplulaştırma eşiklerini ve silme politikalarını yönetir.",
          ar: "يضبط المسؤولون الوصول وسجل التدقيق وحدود التجميع وسياسات الحذف."
        }
      }
    ],
    architecture: [
      {
        title: { en: "Frontend", tr: "Ön yüz", ar: "الواجهة الأمامية" },
        description: {
          en: "Next.js App Router dashboard with server-rendered entry views and client-side live visualizations.",
          tr: "Sunucu tarafı giriş görünümleri ve istemci tarafı canlı görselleştirmeler içeren Next.js App Router panosu.",
          ar: "لوحة Next.js App Router بواجهات أولية من الخادم ورسوم مباشرة في العميل."
        }
      },
      {
        title: { en: "Backend and inference", tr: "Arka uç ve çıkarım", ar: "الخلفية والاستدلال" },
        description: {
          en: "FastAPI orchestrates session APIs and WebSocket updates; a separate worker runs ONNX inference and aggregation.",
          tr: "FastAPI oturum API'lerini ve WebSocket güncellemelerini yönetir; ayrı çalışan ONNX çıkarımı ve toplulaştırma yapar.",
          ar: "يدير FastAPI واجهات الجلسة وبث WebSocket بينما ينفذ عامل منفصل استدلال ONNX والتجميع."
        }
      },
      {
        title: {
          en: "Data model and APIs",
          tr: "Veri modeli ve API'ler",
          ar: "نموذج البيانات والواجهات"
        },
        description: {
          en: "Session, AggregateMetric, Insight, ConsentPolicy, and AuditEvent records are exposed through versioned REST endpoints; live metrics use WebSockets.",
          tr: "Session, AggregateMetric, Insight, ConsentPolicy ve AuditEvent kayıtları sürümlü REST uçlarıyla; canlı metrikler WebSocket ile sunulur.",
          ar: "تعرض سجلات الجلسات والمقاييس والرؤى وسياسات الموافقة والتدقيق عبر REST مع WebSocket للمقاييس المباشرة."
        }
      }
    ],
    process: [
      {
        title: { en: "Discovery and safeguards", tr: "Keşif ve koruma", ar: "الاكتشاف والضوابط" },
        description: {
          en: "Define users, consent boundaries, success criteria, and prohibited uses.",
          tr: "Kullanıcıları, onay sınırlarını, başarı ölçütlerini ve yasak kullanımları tanımlama.",
          ar: "تحديد المستخدمين وحدود الموافقة ومعايير النجاح والاستخدامات المحظورة."
        }
      },
      {
        title: { en: "Prototype and validate", tr: "Prototip ve doğrulama", ar: "النموذج والتحقق" },
        description: {
          en: "Prototype dashboard flows and validate comprehension with representative educators.",
          tr: "Pano akışlarını prototipleme ve temsili eğitmenlerle anlaşılabilirliği doğrulama.",
          ar: "إنشاء نموذج لتدفقات اللوحة والتحقق من وضوحها مع مدرسين ممثلين."
        }
      },
      {
        title: { en: "Incremental implementation", tr: "Artımlı uygulama", ar: "التنفيذ التدريجي" },
        description: {
          en: "Deliver typed API contracts, inference workers, dashboards, and reports in reviewable iterations.",
          tr: "Tip güvenli API sözleşmelerini, çıkarım çalışanlarını, panoları ve raporları incelenebilir iterasyonlarla sunma.",
          ar: "تنفيذ عقود الواجهات وعمال الاستدلال واللوحات والتقارير على مراحل قابلة للمراجعة."
        }
      },
      {
        title: { en: "Test and release", tr: "Test ve yayın", ar: "الاختبار والإصدار" },
        description: {
          en: "Use pull-request review, automated checks, staged environments, and documented release decisions.",
          tr: "Pull request incelemesi, otomatik kontroller, aşamalı ortamlar ve belgelenmiş yayın kararları kullanma.",
          ar: "استخدام مراجعة طلبات الدمج والفحوص الآلية والبيئات المرحلية وقرارات إصدار موثقة."
        }
      }
    ],
    deployment: [
      {
        title: { en: "Environment plan", tr: "Ortam planı", ar: "خطة البيئات" },
        description: {
          en: "Local development, protected staging with synthetic data, and a production environment isolated by secret and database boundaries.",
          tr: "Yerel geliştirme, sentetik verili korumalı hazırlık ve sır/veritabanı sınırlarıyla ayrılmış üretim ortamı.",
          ar: "تطوير محلي وبيئة مرحلية محمية ببيانات اصطناعية وإنتاج معزول بالأسرار وقواعد البيانات."
        }
      },
      {
        title: { en: "Hosting and CI/CD", tr: "Barındırma ve CI/CD", ar: "الاستضافة وCI/CD" },
        description: {
          en: "Planned deployment uses Vercel for the web app, container hosting for inference services, managed PostgreSQL, and GitHub Actions quality gates.",
          tr: "Planlanan dağıtım web uygulaması için Vercel, çıkarım servisleri için konteyner barındırma, yönetilen PostgreSQL ve GitHub Actions kalite kapıları kullanır.",
          ar: "تستخدم الخطة Vercel للويب وحاويات لخدمات الاستدلال وPostgreSQL مدارة وبوابات جودة عبر GitHub Actions."
        }
      }
    ],
    challenges: [
      {
        title: {
          en: "Privacy versus usefulness",
          tr: "Gizlilik ve fayda dengesi",
          ar: "الخصوصية مقابل الفائدة"
        },
        description: {
          en: "Resolved at design level through aggregate-only views, minimum cohort thresholds, short retention, and no default raw-video storage.",
          tr: "Yalnızca toplu görünümler, minimum grup eşikleri, kısa saklama ve varsayılan olarak ham video depolamama ile tasarım düzeyinde çözüldü.",
          ar: "عولجت بعروض مجمعة وحدود دنيا للمجموعات واحتفاظ قصير وعدم تخزين الفيديو الخام افتراضيا."
        }
      },
      {
        title: { en: "Real-time workload", tr: "Gerçek zamanlı iş yükü", ar: "الحمل الفوري" },
        description: {
          en: "Separated frame processing from HTTP traffic, applied sampling and batching, and used ONNX for portable optimized inference.",
          tr: "Kare işleme HTTP trafiğinden ayrıldı, örnekleme ve gruplama uygulandı, taşınabilir optimize çıkarım için ONNX kullanıldı.",
          ar: "فصلت معالجة الإطارات عن HTTP واستخدمت المعاينة والتجميع وONNX للاستدلال المحسن."
        }
      }
    ],
    quality: [
      {
        title: { en: "Automated verification", tr: "Otomatik doğrulama", ar: "التحقق الآلي" },
        description: {
          en: "Type checking, linting, unit tests for aggregation rules, API contract tests, and Playwright coverage for responsive user journeys.",
          tr: "Tip kontrolü, lint, toplulaştırma kuralları için birim testleri, API sözleşme testleri ve duyarlı akışlar için Playwright kapsamı.",
          ar: "فحص الأنواع والتحليل الساكن واختبارات وحدات التجميع وعقود API ومسارات Playwright المتجاوبة."
        }
      },
      {
        title: {
          en: "Accessibility and performance",
          tr: "Erişilebilirlik ve performans",
          ar: "الوصول والأداء"
        },
        description: {
          en: "Keyboard-operable controls, semantic chart summaries, reduced-motion support, code splitting, bounded update frequency, and optimized image delivery.",
          tr: "Klavye kontrollü öğeler, anlamsal grafik özetleri, azaltılmış hareket desteği, kod bölme, sınırlı güncelleme sıklığı ve optimize görsel sunumu.",
          ar: "تحكم بلوحة المفاتيح وملخصات نصية للرسوم ودعم تقليل الحركة وتقسيم الشيفرة وضبط التحديثات وتحسين الصور."
        }
      },
      {
        title: { en: "Measurement policy", tr: "Ölçüm politikası", ar: "سياسة القياس" },
        description: {
          en: "Production accuracy, latency, and adoption metrics will be published only after a consented pilot; no unverified result is presented as achieved.",
          tr: "Üretim doğruluğu, gecikme ve kullanım metrikleri yalnızca onaylı pilot sonrasında yayımlanacak; doğrulanmamış sonuç başarı olarak sunulmaz.",
          ar: "لن تنشر دقة الإنتاج وزمن الاستجابة والتبني إلا بعد تجربة بموافقة؛ ولا تعرض نتائج غير موثقة كإنجازات."
        }
      }
    ],
    maintenance: {
      en: "The dashboard, API, inference worker, and model artifacts remain separate deployable modules. Versioned schemas, feature flags, migration scripts, observability, and model cards allow teams to update one layer without silently changing another.",
      tr: "Pano, API, çıkarım çalışanı ve model varlıkları ayrı dağıtılabilir modüllerdir. Sürümlü şemalar, özellik bayrakları, migrasyon betikleri, gözlemlenebilirlik ve model kartları bir katmanın diğerini sessizce değiştirmeden güncellenmesini sağlar.",
      ar: "تبقى اللوحة والواجهة وعامل الاستدلال والنماذج وحدات مستقلة. تتيح المخططات المرقمة ورايات الميزات والترحيلات والمراقبة وبطاقات النماذج تحديث كل طبقة بأمان."
    },
    roadmap: [
      {
        title: { en: "Consented pilot", tr: "Onaylı pilot", ar: "تجربة بموافقة" },
        description: {
          en: "Validate usability, fairness, retention defaults, and educator value with synthetic data first and an approved pilot second.",
          tr: "Kullanılabilirlik, adalet, saklama varsayılanları ve eğitmen değerini önce sentetik veri, sonra onaylı pilotla doğrulama.",
          ar: "التحقق من سهولة الاستخدام والعدالة والاحتفاظ وقيمة المدرس ببيانات اصطناعية ثم تجربة معتمدة."
        }
      },
      {
        title: {
          en: "Explainable insights",
          tr: "Açıklanabilir içgörüler",
          ar: "رؤى قابلة للتفسير"
        },
        description: {
          en: "Attach confidence, source intervals, and limitations to every generated recommendation.",
          tr: "Her öneriye güven düzeyi, kaynak zaman aralığı ve sınırlamalar ekleme.",
          ar: "إرفاق الثقة والفترات المصدرية والقيود بكل توصية."
        }
      },
      {
        title: { en: "LMS integration", tr: "LMS entegrasyonu", ar: "تكامل أنظمة التعلم" },
        description: {
          en: "Add standards-based exports and role-aware integration with approved learning platforms.",
          tr: "Onaylı öğrenme platformlarıyla standart tabanlı dışa aktarma ve rol odaklı entegrasyon ekleme.",
          ar: "إضافة تصدير قياسي وتكامل قائم على الأدوار مع منصات تعلم معتمدة."
        }
      }
    ],
    links: [
      { label: { en: "Repository", tr: "Kod deposu", ar: "مستودع الشيفرة" } },
      { label: { en: "Live demo", tr: "Canlı demo", ar: "العرض المباشر" } },
      { label: { en: "Technical documentation", tr: "Teknik dokümantasyon", ar: "التوثيق التقني" } }
    ]
  },
  {
    slug: "nlp-assist",
    image: "/images/nlp-assist-project.png",
    title: { en: "NLP Assist", tr: "NLP Assist", ar: "NLP Assist" },
    overview: {
      en: "A de-identified lesson-insight workspace that turns classroom notes and aggregate signals into structured summaries for educators.",
      tr: "Kimliksiz sınıf notlarını ve toplu sinyalleri eğitmenler için yapılandırılmış özetlere dönüştüren ders içgörüsü çalışma alanı.",
      ar: "مساحة عمل تحول ملاحظات الدرس مجهولة الهوية والمؤشرات المجمعة إلى ملخصات منظمة للمدرسين."
    },
    status: {
      en: "Portfolio concept and technical prototype; public repository, demo, and production measurements are pending verification.",
      tr: "Portföy konsepti ve teknik prototip; herkese açık depo, demo ve üretim ölçümleri doğrulama bekliyor.",
      ar: "مفهوم للأعمال ونموذج تقني أولي؛ المستودع والعرض والمقاييس الإنتاجية بانتظار التحقق."
    },
    problem: {
      en: "Educators collect notes, survey responses, and classroom observations across disconnected formats. NLP Assist explores a governed workflow for organizing that material into traceable summaries without presenting generated text as diagnosis or fact.",
      tr: "Eğitmenler notları, anket yanıtlarını ve sınıf gözlemlerini kopuk formatlarda toplar. NLP Assist, üretilen metni tanı veya gerçek olarak sunmadan bu malzemeyi izlenebilir özetlere dönüştüren kontrollü bir iş akışını araştırır.",
      ar: "يجمع المدرسون الملاحظات والاستبيانات بصيغ متفرقة. يستكشف NLP Assist مسارا منضبطا لتحويلها إلى ملخصات قابلة للتتبع دون تقديم النص المولد كتشخيص أو حقيقة."
    },
    stack: [
      {
        title: {
          en: "Next.js, React, and TypeScript",
          tr: "Next.js, React ve TypeScript",
          ar: "Next.js وReact وTypeScript"
        },
        description: {
          en: "Deliver a responsive review workspace with typed forms, filters, and accessible report views.",
          tr: "Tip güvenli formlar, filtreler ve erişilebilir rapor görünümleriyle duyarlı inceleme alanı sağlar.",
          ar: "لواجهة مراجعة متجاوبة بنماذج وفلاتر مكتوبة وتقارير قابلة للوصول."
        }
      },
      {
        title: {
          en: "Python, FastAPI, and task workers",
          tr: "Python, FastAPI ve görev çalışanları",
          ar: "Python وFastAPI وعمال المهام"
        },
        description: {
          en: "Keep document processing asynchronous, observable, and isolated from interactive web requests.",
          tr: "Belge işlemeyi eşzamansız, gözlemlenebilir ve etkileşimli web isteklerinden ayrı tutar.",
          ar: "لجعل معالجة المستندات غير متزامنة وقابلة للمراقبة ومعزولة عن طلبات الويب."
        }
      },
      {
        title: {
          en: "PyTorch and ONNX Runtime",
          tr: "PyTorch ve ONNX Runtime",
          ar: "PyTorch وONNX Runtime"
        },
        description: {
          en: "Support controlled NLP experimentation and portable inference for classification and extraction tasks.",
          tr: "Sınıflandırma ve çıkarım görevleri için kontrollü NLP denemelerini ve taşınabilir çıkarımı destekler.",
          ar: "لتجارب NLP منضبطة واستدلال قابل للنقل للتصنيف والاستخراج."
        }
      },
      {
        title: {
          en: "PostgreSQL, object storage, Docker",
          tr: "PostgreSQL, nesne depolama, Docker",
          ar: "PostgreSQL وتخزين الكائنات وDocker"
        },
        description: {
          en: "Separate structured metadata from encrypted source files and standardize environments.",
          tr: "Yapılandırılmış üst veriyi şifreli kaynak dosyalardan ayırır ve ortamları standartlaştırır.",
          ar: "لفصل البيانات الوصفية عن الملفات المشفرة وتوحيد البيئات."
        }
      }
    ],
    features: [
      {
        title: { en: "Guided import", tr: "Yönlendirmeli içe aktarma", ar: "استيراد موجه" },
        description: {
          en: "A user uploads approved notes, selects purpose and retention, then reviews automatic redaction before processing.",
          tr: "Kullanıcı onaylı notları yükler, amaç ve saklamayı seçer, işlem öncesi otomatik maskelemeyi inceler.",
          ar: "يرفع المستخدم ملاحظات معتمدة ويحدد الغرض والاحتفاظ ثم يراجع إخفاء الهوية قبل المعالجة."
        }
      },
      {
        title: {
          en: "Structured insight generation",
          tr: "Yapılandırılmış içgörü üretimi",
          ar: "توليد رؤى منظمة"
        },
        description: {
          en: "The system proposes topics, recurring questions, lesson bottlenecks, and concise summaries with source references.",
          tr: "Sistem konuları, tekrar eden soruları, ders darboğazlarını ve kaynak referanslı kısa özetleri önerir.",
          ar: "يقترح النظام موضوعات وأسئلة متكررة ونقاط تعثر وملخصات مرتبطة بالمصادر."
        }
      },
      {
        title: {
          en: "Human review workflow",
          tr: "İnsan inceleme akışı",
          ar: "مسار المراجعة البشرية"
        },
        description: {
          en: "An educator accepts, edits, rejects, or annotates each generated insight before it can be shared.",
          tr: "Eğitmen her üretilen içgörüyü paylaşılmadan önce kabul eder, düzenler, reddeder veya not ekler.",
          ar: "يقبل المدرس كل رؤية أو يعدلها أو يرفضها قبل مشاركتها."
        }
      },
      {
        title: { en: "Export and audit", tr: "Dışa aktarma ve denetim", ar: "التصدير والتدقيق" },
        description: {
          en: "Approved reports export to accessible formats while recording source, version, reviewer, and change history.",
          tr: "Onaylı raporlar erişilebilir formatlarda dışa aktarılır; kaynak, sürüm, inceleyen ve değişiklik geçmişi kaydedilir.",
          ar: "تُصدر التقارير المعتمدة بصيغ قابلة للوصول مع تسجيل المصدر والإصدار والمراجع والتغييرات."
        }
      }
    ],
    architecture: [
      {
        title: { en: "Frontend", tr: "Ön yüz", ar: "الواجهة الأمامية" },
        description: {
          en: "Next.js review workspace with server-rendered project lists and client-side document comparison and approval states.",
          tr: "Sunucu tarafı proje listeleri ve istemci tarafı belge karşılaştırma/onay durumları içeren Next.js inceleme alanı.",
          ar: "واجهة Next.js بقوائم من الخادم ومقارنة مستندات وحالات اعتماد في العميل."
        }
      },
      {
        title: { en: "Processing services", tr: "İşleme servisleri", ar: "خدمات المعالجة" },
        description: {
          en: "FastAPI validates requests and queues jobs; workers redact, classify, extract, summarize, and attach provenance.",
          tr: "FastAPI istekleri doğrular ve görevleri kuyruğa alır; çalışanlar maskeler, sınıflandırır, çıkarır, özetler ve kaynak izi ekler.",
          ar: "يتحقق FastAPI من الطلبات ويضع المهام في طابور؛ ويخفي العمال الهوية ويصنفون ويستخرجون ويلخصون مع إثبات المصدر."
        }
      },
      {
        title: {
          en: "Data model and APIs",
          tr: "Veri modeli ve API'ler",
          ar: "نموذج البيانات والواجهات"
        },
        description: {
          en: "Workspace, Document, ProcessingJob, Insight, ReviewDecision, and AuditEvent entities use versioned REST APIs and signed object-storage access.",
          tr: "Workspace, Document, ProcessingJob, Insight, ReviewDecision ve AuditEvent varlıkları sürümlü REST API'leri ve imzalı nesne depolama erişimi kullanır.",
          ar: "تستخدم كيانات مساحة العمل والمستند والمهام والرؤى وقرارات المراجعة والتدقيق REST مرقمة ووصولا موقعا للتخزين."
        }
      }
    ],
    process: [
      {
        title: {
          en: "Content and risk discovery",
          tr: "İçerik ve risk keşfi",
          ar: "اكتشاف المحتوى والمخاطر"
        },
        description: {
          en: "Map document sources, user roles, sensitive fields, retention, and decisions the tool must never automate.",
          tr: "Belge kaynaklarını, rolleri, hassas alanları, saklamayı ve aracın asla otomatikleştirmeyeceği kararları haritalama.",
          ar: "تحديد مصادر المستندات والأدوار والحقول الحساسة والاحتفاظ والقرارات التي لا يجوز أتمتتها."
        }
      },
      {
        title: { en: "Prototype", tr: "Prototip", ar: "النموذج الأولي" },
        description: {
          en: "Test import, redaction, review, and export flows with synthetic classroom material.",
          tr: "İçe aktarma, maskeleme, inceleme ve dışa aktarma akışlarını sentetik sınıf materyaliyle test etme.",
          ar: "اختبار الاستيراد وإخفاء الهوية والمراجعة والتصدير بمواد صفية اصطناعية."
        }
      },
      {
        title: {
          en: "Build in vertical slices",
          tr: "Dikey dilimlerle geliştirme",
          ar: "البناء بشرائح مكتملة"
        },
        description: {
          en: "Deliver one secure end-to-end workflow at a time with pull requests and acceptance checks.",
          tr: "Pull request ve kabul kontrolleriyle her seferinde uçtan uca güvenli bir iş akışı sunma.",
          ar: "تنفيذ مسار آمن كامل في كل مرحلة مع مراجعات وقبول."
        }
      },
      {
        title: { en: "Evaluate and release", tr: "Değerlendirme ve yayın", ar: "التقييم والإصدار" },
        description: {
          en: "Review extraction quality, unsupported claims, accessibility, security, and rollback readiness before promotion.",
          tr: "Yayın öncesi çıkarım kalitesi, desteklenmeyen iddialar, erişilebilirlik, güvenlik ve geri dönüş hazırlığını inceleme.",
          ar: "مراجعة جودة الاستخراج والادعاءات غير المدعومة والوصول والأمان والاسترجاع قبل الإصدار."
        }
      }
    ],
    deployment: [
      {
        title: { en: "Environment plan", tr: "Ortam planı", ar: "خطة البيئات" },
        description: {
          en: "Local and CI environments use synthetic documents; staging and production use separate credentials, stores, databases, and retention rules.",
          tr: "Yerel ve CI ortamları sentetik belgeler kullanır; hazırlık ve üretim ayrı kimlik bilgileri, depolar, veritabanları ve saklama kuralları kullanır.",
          ar: "تستخدم البيئات المحلية وCI مستندات اصطناعية بينما تفصل المرحلة والإنتاج الأسرار والتخزين وقواعد البيانات والاحتفاظ."
        }
      },
      {
        title: {
          en: "Hosting and delivery",
          tr: "Barındırma ve teslimat",
          ar: "الاستضافة والتسليم"
        },
        description: {
          en: "Planned hosting uses Vercel for Next.js, managed containers for APIs and workers, encrypted object storage, managed PostgreSQL, and GitHub Actions deployment approvals.",
          tr: "Planlanan yapı Next.js için Vercel, API/çalışanlar için yönetilen konteynerler, şifreli nesne depolama, yönetilen PostgreSQL ve GitHub Actions dağıtım onayları kullanır.",
          ar: "تستخدم الخطة Vercel وبيئة حاويات للواجهات والعمال وتخزينا مشفرا وPostgreSQL مدارة وموافقات GitHub Actions."
        }
      }
    ],
    challenges: [
      {
        title: { en: "Traceable generation", tr: "İzlenebilir üretim", ar: "توليد قابل للتتبع" },
        description: {
          en: "Each insight retains source spans, model and prompt versions, confidence indicators, and mandatory reviewer state.",
          tr: "Her içgörü kaynak aralıklarını, model ve istem sürümlerini, güven göstergelerini ve zorunlu inceleyen durumunu korur.",
          ar: "تحتفظ كل رؤية بمقاطع المصدر وإصدارات النموذج والتعليمات ومؤشرات الثقة وحالة المراجعة."
        }
      },
      {
        title: {
          en: "Sensitive text handling",
          tr: "Hassas metin işleme",
          ar: "معالجة النص الحساس"
        },
        description: {
          en: "Resolve through pre-processing redaction, encryption, least-privilege access, short retention, and prohibited diagnostic output rules.",
          tr: "Ön işleme maskelemesi, şifreleme, en az ayrıcalıklı erişim, kısa saklama ve tanısal çıktı yasağıyla çözülür.",
          ar: "تعالج بإخفاء الهوية والتشفير وأقل صلاحية واحتفاظ قصير ومنع المخرجات التشخيصية."
        }
      }
    ],
    quality: [
      {
        title: { en: "Automated checks", tr: "Otomatik kontroller", ar: "الفحوص الآلية" },
        description: {
          en: "Schema validation, unit tests for redaction and permissions, API contract tests, adversarial fixtures, and Playwright user-flow coverage.",
          tr: "Şema doğrulama, maskeleme ve izin birim testleri, API sözleşme testleri, zorlayıcı örnekler ve Playwright kullanıcı akışı kapsamı.",
          ar: "تحقق المخططات واختبارات الإخفاء والصلاحيات وعقود API وحالات خصومية ومسارات Playwright."
        }
      },
      {
        title: {
          en: "Accessibility and performance",
          tr: "Erişilebilirlik ve performans",
          ar: "الوصول والأداء"
        },
        description: {
          en: "Semantic headings, keyboard review actions, visible focus, status announcements, paginated processing, background jobs, and optimized assets.",
          tr: "Anlamsal başlıklar, klavye inceleme eylemleri, görünür odak, durum bildirimleri, sayfalı işleme, arka plan görevleri ve optimize varlıklar.",
          ar: "عناوين دلالية ومراجعة بلوحة المفاتيح وتركيز واضح وإعلانات حالة ومعالجة مجزأة ومهام خلفية وأصول محسنة."
        }
      },
      {
        title: { en: "Transparent evaluation", tr: "Şeffaf değerlendirme", ar: "تقييم شفاف" },
        description: {
          en: "Precision, unsupported-claim rate, reviewer agreement, latency, and adoption remain acceptance metrics, not claimed results, until a verified pilot is complete.",
          tr: "Kesinlik, desteksiz iddia oranı, inceleyen uyumu, gecikme ve kullanım; doğrulanmış pilot tamamlanana kadar başarı iddiası değil kabul metriğidir.",
          ar: "تبقى الدقة ونسبة الادعاء غير المدعوم واتفاق المراجعين والزمن والتبني معايير قبول وليست نتائج معلنة حتى اكتمال تجربة موثقة."
        }
      }
    ],
    maintenance: {
      en: "Connectors, processing stages, model adapters, and export formats use explicit interfaces. Versioned prompts and schemas, migrations, audit logs, feature flags, and evaluation datasets support controlled extension without rewriting the review workflow.",
      tr: "Bağlayıcılar, işleme aşamaları, model adaptörleri ve dışa aktarma formatları açık arayüzler kullanır. Sürümlü istemler/şemalar, migrasyonlar, denetim günlükleri, özellik bayrakları ve değerlendirme veri setleri inceleme akışını yeniden yazmadan kontrollü genişlemeyi destekler.",
      ar: "تستخدم الموصلات ومراحل المعالجة ومحولات النماذج والتصدير واجهات واضحة. تدعم التعليمات والمخططات المرقمة والترحيلات والسجلات ورايات الميزات وبيانات التقييم التوسع المنضبط."
    },
    roadmap: [
      {
        title: { en: "Evaluation harness", tr: "Değerlendirme altyapısı", ar: "منظومة التقييم" },
        description: {
          en: "Expand representative synthetic fixtures and reviewer scoring before any real-data pilot.",
          tr: "Gerçek veri pilotundan önce temsili sentetik örnekleri ve inceleyen puanlamasını genişletme.",
          ar: "توسيع الحالات الاصطناعية وتقييم المراجعين قبل أي تجربة ببيانات حقيقية."
        }
      },
      {
        title: {
          en: "Approved data connectors",
          tr: "Onaylı veri bağlayıcıları",
          ar: "موصلات بيانات معتمدة"
        },
        description: {
          en: "Add permission-aware imports for selected learning platforms and document repositories.",
          tr: "Seçili öğrenme platformları ve belge depoları için izin odaklı içe aktarma ekleme.",
          ar: "إضافة استيراد واع بالصلاحيات لمنصات التعلم ومستودعات المستندات المعتمدة."
        }
      },
      {
        title: { en: "Multilingual review", tr: "Çok dilli inceleme", ar: "مراجعة متعددة اللغات" },
        description: {
          en: "Introduce locale-specific evaluation sets, terminology controls, and side-by-side source verification.",
          tr: "Dile özgü değerlendirme setleri, terminoloji kontrolleri ve yan yana kaynak doğrulama ekleme.",
          ar: "إضافة مجموعات تقييم حسب اللغة وضوابط المصطلحات والتحقق المتوازي من المصدر."
        }
      }
    ],
    links: [
      { label: { en: "Repository", tr: "Kod deposu", ar: "مستودع الشيفرة" } },
      { label: { en: "Live demo", tr: "Canlı demo", ar: "العرض المباشر" } },
      { label: { en: "Technical documentation", tr: "Teknik dokümantasyon", ar: "التوثيق التقني" } }
    ]
  }
];

export function getWebDevelopmentProject(slug: string) {
  return webDevelopmentProjects.find((project) => project.slug === slug);
}
