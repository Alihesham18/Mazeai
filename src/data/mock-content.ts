import type { CardContent, EventContent, PublicationContent } from "@/types/content";

export const coreAreas: CardContent[] = [
  {
    slug: "artificial-intelligence",
    title: {
      en: "Artificial Intelligence",
      tr: "Yapay Zeka",
      ar: "الذكاء الاصطناعي"
    },
    description: {
      en: "Strategy, prototypes, automation, analytics, and responsible AI implementation.",
      tr: "Strateji, prototipler, otomasyon, analitik ve sorumlu yapay zeka uygulamaları.",
      ar: "استراتيجية ونماذج أولية وأتمتة وتحليلات وتطبيق مسؤول للذكاء الاصطناعي."
    }
  },
  {
    slug: "research-development",
    title: {
      en: "Research and Development",
      tr: "Araştırma ve Geliştirme",
      ar: "البحث والتطوير"
    },
    description: {
      en: "Structured exploration for new products, academic collaborations, and funded projects.",
      tr: "Yeni ürünler, akademik iş birlikleri ve destekli projeler için yapılandırılmış keşif.",
      ar: "استكشاف منظم للمنتجات الجديدة والتعاون الأكاديمي والمشاريع المدعومة."
    }
  },
  {
    slug: "education-training",
    title: {
      en: "Education and Training",
      tr: "Eğitim ve Gelişim",
      ar: "التعليم والتدريب"
    },
    description: {
      en: "Practical programs for teams, schools, universities, and innovation communities.",
      tr: "Ekipler, okullar, üniversiteler ve inovasyon toplulukları için uygulamalı programlar.",
      ar: "برامج عملية للفرق والمدارس والجامعات ومجتمعات الابتكار."
    }
  }
];

export const services: CardContent[] = [
  {
    slug: "ai-consulting",
    title: { en: "AI Consulting", tr: "Yapay Zeka Danışmanlığı", ar: "استشارات الذكاء الاصطناعي" },
    description: {
      en: "Assess use cases, risks, data readiness, and implementation roadmaps.",
      tr: "Kullanım senaryolarını, riskleri, veri hazırlığını ve uygulama yol haritalarını değerlendirin.",
      ar: "تقييم حالات الاستخدام والمخاطر وجاهزية البيانات وخطط التطبيق."
    }
  },
  {
    slug: "ai-solutions-automation",
    title: {
      en: "AI Solutions and Automation",
      tr: "Yapay Zeka Çözümleri ve Otomasyon",
      ar: "حلول وأتمتة الذكاء الاصطناعي"
    },
    description: {
      en: "Build assistants, dashboards, workflow automations, and decision-support tools.",
      tr: "Asistanlar, panolar, iş akışı otomasyonları ve karar destek araçları oluşturun.",
      ar: "بناء مساعدين ولوحات متابعة وأتمتة سير العمل وأدوات دعم القرار."
    }
  },
  {
    slug: "research-development",
    title: {
      en: "Research and Development",
      tr: "Araştırma ve Geliştirme",
      ar: "البحث والتطوير"
    },
    description: {
      en: "Move ideas from hypothesis to validated concept with technical documentation.",
      tr: "Fikirleri hipotezden doğrulanmış konsepte teknik dokümantasyonla taşıyın.",
      ar: "نقل الأفكار من الفرضية إلى مفهوم موثق ومتحقق."
    }
  },
  {
    slug: "education-training",
    title: {
      en: "Education and Training",
      tr: "Eğitim ve Gelişim",
      ar: "التعليم والتدريب"
    },
    description: {
      en: "Deliver AI literacy, Python, data science, and applied innovation programs.",
      tr: "Yapay zeka okuryazarlığı, Python, veri bilimi ve uygulamalı inovasyon programları sunun.",
      ar: "تقديم برامج محو أمية الذكاء الاصطناعي وبايثون وعلوم البيانات والابتكار العملي."
    }
  },
  {
    slug: "academic-partnerships",
    title: {
      en: "Academic Partnerships",
      tr: "Akademik İş Birlikleri",
      ar: "الشراكات الأكاديمية"
    },
    description: {
      en: "Co-design research, seminars, workshops, and student-centered innovation projects.",
      tr: "Araştırma, seminer, atölye ve öğrenci odaklı inovasyon projelerini birlikte tasarlayın.",
      ar: "تصميم الأبحاث والندوات وورش العمل ومشاريع الابتكار الطلابية بشكل مشترك."
    }
  },
  {
    slug: "custom-programs",
    title: { en: "Custom Programs", tr: "Özel Programlar", ar: "برامج مخصصة" },
    description: {
      en: "Create tailored consulting, research, and education programs for specific goals.",
      tr: "Belirli hedefler için özel danışmanlık, araştırma ve eğitim programları oluşturun.",
      ar: "إنشاء برامج استشارية وبحثية وتعليمية مخصصة لأهداف محددة."
    }
  }
];

export const researchProjects: CardContent[] = [
  {
    slug: "learning-analytics-lab",
    eyebrow: { en: "Sample project", tr: "Örnek proje", ar: "مشروع تجريبي" },
    title: {
      en: "Learning Analytics Lab",
      tr: "Öğrenme Analitiği Laboratuvarı",
      ar: "مختبر تحليلات التعلم"
    },
    description: {
      en: "A fictional dashboard concept for identifying learning patterns and support needs.",
      tr: "Öğrenme kalıplarını ve destek ihtiyaçlarını belirlemek için kurgusal bir pano konsepti.",
      ar: "مفهوم لوحة متابعة افتراضي لتحديد أنماط التعلم واحتياجات الدعم."
    }
  },
  {
    slug: "responsible-ai-checklist",
    eyebrow: { en: "Sample project", tr: "Örnek proje", ar: "مشروع تجريبي" },
    title: {
      en: "Responsible AI Checklist",
      tr: "Sorumlu Yapay Zeka Kontrol Listesi",
      ar: "قائمة تحقق للذكاء الاصطناعي المسؤول"
    },
    description: {
      en: "A placeholder research tool for safer AI product planning and review.",
      tr: "Daha güvenli yapay zeka ürün planlama ve inceleme süreçleri için örnek araştırma aracı.",
      ar: "أداة بحثية تجريبية لتخطيط ومراجعة منتجات الذكاء الاصطناعي بأمان أكبر."
    }
  },
  {
    slug: "automation-readiness-index",
    eyebrow: { en: "Sample project", tr: "Örnek proje", ar: "مشروع تجريبي" },
    title: {
      en: "Automation Readiness Index",
      tr: "Otomasyon Hazırlık Endeksi",
      ar: "مؤشر جاهزية الأتمتة"
    },
    description: {
      en: "A fictional assessment model for prioritizing workflow automation opportunities.",
      tr: "İş akışı otomasyon fırsatlarını önceliklendirmek için kurgusal değerlendirme modeli.",
      ar: "نموذج تقييم افتراضي لترتيب فرص أتمتة سير العمل."
    }
  }
];

export const events: EventContent[] = [
  {
    slug: "ai-strategy-roundtable",
    title: { en: "AI Strategy Roundtable", tr: "Yapay Zeka Strateji Yuvarlak Masası", ar: "جلسة استراتيجية الذكاء الاصطناعي" },
    description: {
      en: "A practical session for leaders exploring responsible AI roadmaps.",
      tr: "Sorumlu yapay zeka yol haritalarını keşfeden liderler için uygulamalı oturum.",
      ar: "جلسة عملية للقادة الذين يستكشفون خرائط طريق الذكاء الاصطناعي المسؤول."
    },
    date: "2026-10-08",
    format: { en: "Online", tr: "Çevrim içi", ar: "عبر الإنترنت" },
    location: { en: "Remote", tr: "Uzaktan", ar: "عن بعد" },
    type: { en: "Roundtable", tr: "Yuvarlak masa", ar: "جلسة نقاش" }
  },
  {
    slug: "research-prototype-clinic",
    title: { en: "Research Prototype Clinic", tr: "Araştırma Prototip Kliniği", ar: "عيادة النماذج البحثية" },
    description: {
      en: "Bring an idea and learn how to shape an initial research prototype.",
      tr: "Bir fikir getirin ve ilk araştırma prototipini nasıl şekillendireceğinizi öğrenin.",
      ar: "أحضر فكرة وتعلم كيفية تشكيل نموذج بحثي أولي."
    },
    date: "2026-11-12",
    format: { en: "Hybrid", tr: "Hibrit", ar: "مختلط" },
    location: { en: "Türkiye and online", tr: "Türkiye ve çevrim içi", ar: "تركيا وعبر الإنترنت" },
    type: { en: "Workshop", tr: "Atölye", ar: "ورشة عمل" }
  },
  {
    slug: "education-ai-lab",
    title: { en: "Education AI Lab", tr: "Eğitim Yapay Zeka Laboratuvarı", ar: "مختبر الذكاء الاصطناعي للتعليم" },
    description: {
      en: "A hands-on workshop for educators designing AI-supported learning activities.",
      tr: "Yapay zeka destekli öğrenme etkinlikleri tasarlayan eğitimciler için uygulamalı atölye.",
      ar: "ورشة عملية للمعلمين لتصميم أنشطة تعلم مدعومة بالذكاء الاصطناعي."
    },
    date: "2026-12-03",
    format: { en: "In person", tr: "Yüz yüze", ar: "حضوري" },
    location: { en: "Istanbul, Türkiye", tr: "İstanbul, Türkiye", ar: "إسطنبول، تركيا" },
    type: { en: "Training", tr: "Eğitim", ar: "تدريب" }
  }
];

export const caseStudies: CardContent[] = [
  {
    slug: "sample-ai-operations",
    eyebrow: { en: "Placeholder metrics", tr: "Yer tutucu metrikler", ar: "مقاييس تجريبية" },
    title: { en: "AI Operations Pilot", tr: "Yapay Zeka Operasyon Pilotu", ar: "تجربة عمليات الذكاء الاصطناعي" },
    description: {
      en: "Sample outcome: 28% faster reporting cycle in a fictional operations workflow.",
      tr: "Örnek sonuç: Kurgusal bir operasyon akışında %28 daha hızlı raporlama döngüsü.",
      ar: "نتيجة تجريبية: دورة تقارير أسرع بنسبة 28% في سير عمل افتراضي."
    }
  },
  {
    slug: "sample-training-program",
    eyebrow: { en: "Placeholder metrics", tr: "Yer tutucu metrikler", ar: "مقاييس تجريبية" },
    title: { en: "Applied AI Training", tr: "Uygulamalı Yapay Zeka Eğitimi", ar: "تدريب الذكاء الاصطناعي التطبيقي" },
    description: {
      en: "Sample outcome: 120 fictional participants completed project-based workshops.",
      tr: "Örnek sonuç: 120 kurgusal katılımcı proje tabanlı atölyeleri tamamladı.",
      ar: "نتيجة تجريبية: أكمل 120 مشاركا افتراضيا ورشا قائمة على المشاريع."
    }
  },
  {
    slug: "sample-research-roadmap",
    eyebrow: { en: "Placeholder metrics", tr: "Yer tutucu metrikler", ar: "مقاييس تجريبية" },
    title: { en: "Research Roadmap", tr: "Araştırma Yol Haritası", ar: "خارطة طريق بحثية" },
    description: {
      en: "Sample outcome: 6 fictional work packages clarified before prototype build.",
      tr: "Örnek sonuç: Prototip öncesinde 6 kurgusal iş paketi netleştirildi.",
      ar: "نتيجة تجريبية: توضيح 6 حزم عمل افتراضية قبل بناء النموذج."
    }
  }
];

export const blogPosts: CardContent[] = [
  {
    slug: "responsible-ai-starting-points",
    title: { en: "Responsible AI Starting Points", tr: "Sorumlu Yapay Zeka Başlangıçları", ar: "نقاط بداية للذكاء الاصطناعي المسؤول" },
    description: {
      en: "How teams can frame risk, value, and accountability before building.",
      tr: "Ekipler geliştirmeden önce risk, değer ve hesap verebilirliği nasıl çerçeveleyebilir.",
      ar: "كيف تؤطر الفرق المخاطر والقيمة والمساءلة قبل البناء."
    }
  },
  {
    slug: "from-research-to-prototype",
    title: { en: "From Research to Prototype", tr: "Araştırmadan Prototipe", ar: "من البحث إلى النموذج الأولي" },
    description: {
      en: "A practical path for turning early research into a usable proof of concept.",
      tr: "Erken araştırmayı kullanılabilir bir kavram kanıtına dönüştürmek için pratik yol.",
      ar: "مسار عملي لتحويل البحث المبكر إلى إثبات مفهوم قابل للاستخدام."
    }
  },
  {
    slug: "ai-literacy-for-organizations",
    title: { en: "AI Literacy for Organizations", tr: "Kurumlar İçin Yapay Zeka Okuryazarlığı", ar: "ثقافة الذكاء الاصطناعي للمؤسسات" },
    description: {
      en: "What non-technical teams need to participate in AI transformation.",
      tr: "Teknik olmayan ekiplerin yapay zeka dönüşümüne katılmak için ihtiyaç duydukları.",
      ar: "ما تحتاجه الفرق غير التقنية للمشاركة في تحول الذكاء الاصطناعي."
    }
  }
];

export const publications: PublicationContent[] = [
  {
    slug: "mock-responsible-ai-framework",
    title: { en: "Responsible AI Framework Notes", tr: "Sorumlu Yapay Zeka Çerçeve Notları", ar: "ملاحظات إطار الذكاء الاصطناعي المسؤول" },
    description: {
      en: "Mock PDF metadata for a future downloadable publication.",
      tr: "Gelecekte indirilebilir bir yayın için örnek PDF metaverisi.",
      ar: "بيانات وصفية تجريبية لملف PDF قابل للتنزيل لاحقا."
    },
    year: "2026",
    fileType: "PDF",
    fileSize: "420 KB"
  }
];
