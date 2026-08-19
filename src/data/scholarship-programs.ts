import type { LocalizedText } from "@/types/content";

export interface ScholarshipProgramDefinition {
  slug: string;
  title: LocalizedText;
}

export const scholarshipPrograms = [
  {
    slug: "data-science-machine-learning",
    title: {
      en: "Data Science and Machine Learning",
      tr: "Veri Bilimi ve Makine Öğrenmesi",
      ar: "علوم البيانات وتعلم الآلة",
      fa: "علم داده و یادگیری ماشین"
    }
  },
  {
    slug: "mobile-programming",
    title: {
      en: "Mobile Programming",
      tr: "Mobil Programlama",
      ar: "برمجة تطبيقات الهاتف المحمول",
      fa: "برنامه‌نویسی موبایل"
    }
  },
  {
    slug: "web-development-dotnet",
    title: {
      en: "Web Development with .NET",
      tr: ".NET ile Web Geliştirme",
      ar: "تطوير الويب باستخدام .NET",
      fa: "توسعه وب با .NET"
    }
  },
  {
    slug: "cybersecurity",
    title: {
      en: "Cybersecurity",
      tr: "Siber Güvenlik",
      ar: "الأمن السيبراني",
      fa: "امنیت سایبری"
    }
  }
] as const satisfies readonly ScholarshipProgramDefinition[];

export function getScholarshipProgram(slug: string): ScholarshipProgramDefinition | undefined {
  return scholarshipPrograms.find((program) => program.slug === slug);
}
