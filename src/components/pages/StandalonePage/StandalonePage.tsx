import type { Metadata } from "next";
import { ArrowUpRight, CheckCircle2, Mail, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { blogPosts, caseStudies, publications, researchProjects } from "@/data/mock-content";
import type { Locale } from "@/i18n/routing";
import { localizedPath, localize } from "@/lib/utilities/localize";
import type { CardContent, LocalizedText } from "@/types/content";
import styles from "./StandalonePage.module.css";

export interface StandalonePageConfig {
  path: string;
  titleKey: string;
  descriptionKey: string;
  sections: readonly string[];
  legal?: boolean;
}

interface StandalonePageProps {
  locale: Locale;
  page: StandalonePageConfig;
}

interface DirectoryContent {
  items: readonly CardContent[];
  basePath: string;
}

const labels: Record<
  Locale,
  {
    eyebrow: string;
    readMore: string;
    overview: string;
    overviewText: string;
    approach: string;
    approachText: string;
    nextStep: string;
    nextStepText: string;
    contactTitle: string;
    contactText: string;
    contactButton: string;
    legalTitle: string;
    legalText: string;
    legalNotice: string;
    teamTitle: string;
    teamText: string;
    teamSlot: string;
    teamPending: string;
    directoryTitle: string;
  }
> = {
  en: {
    eyebrow: "SynergyMazeAI",
    readMore: "View details",
    overview: "Purpose and scope",
    overviewText:
      "This page explains the purpose, audience, and practical context of this part of our work.",
    approach: "How we approach it",
    approachText:
      "We begin with clear objectives, define responsibilities, and move through focused stages with review points and measurable outcomes.",
    nextStep: "Start a conversation",
    nextStepText:
      "Share your goals, constraints, or questions and we will help identify a practical next step.",
    contactTitle: "Choose the right starting point",
    contactText:
      "Contact us about consulting, research partnerships, education programs, training, events, or a new digital project.",
    contactButton: "Email SynergyMazeAI",
    legalTitle: "Information and choices",
    legalText:
      "This page summarizes how this topic is handled and where to direct questions or requests.",
    legalNotice:
      "This content is a working policy summary and should be reviewed by qualified legal counsel before public launch.",
    teamTitle: "Team structure",
    teamText:
      "The directory is prepared for confirmed leadership, research, engineering, and education profiles.",
    teamSlot: "Profile slot",
    teamPending: "Name and profile will be published after confirmation.",
    directoryTitle: "Explore the collection"
  },
  tr: {
    eyebrow: "SynergyMazeAI",
    readMore: "Detayları görüntüle",
    overview: "Amaç ve kapsam",
    overviewText:
      "Bu sayfa, çalışmalarımızın bu alanındaki amacı, hedef kitleyi ve pratik bağlamı açıklar.",
    approach: "Nasıl yaklaşıyoruz",
    approachText:
      "Net hedeflerle başlar, sorumlulukları tanımlar ve ölçülebilir sonuçlara sahip odaklı aşamalarla ilerleriz.",
    nextStep: "Bir görüşme başlatın",
    nextStepText:
      "Hedeflerinizi, kısıtlarınızı veya sorularınızı paylaşın; uygulanabilir bir sonraki adımı birlikte belirleyelim.",
    contactTitle: "Doğru başlangıç noktasını seçin",
    contactText:
      "Danışmanlık, araştırma ortaklıkları, eğitim programları, etkinlikler veya dijital projeler için bize ulaşın.",
    contactButton: "SynergyMazeAI'a e-posta gönderin",
    legalTitle: "Bilgilendirme ve tercihler",
    legalText:
      "Bu sayfa ilgili konunun nasıl ele alındığını ve taleplerin nereye iletileceğini özetler.",
    legalNotice:
      "Bu içerik çalışma amaçlı bir politika özetidir ve yayından önce yetkili hukuk uzmanları tarafından incelenmelidir.",
    teamTitle: "Ekip yapısı",
    teamText:
      "Dizin; onaylanmış liderlik, araştırma, mühendislik ve eğitim profilleri için hazırlanmıştır.",
    teamSlot: "Profil alanı",
    teamPending: "İsim ve profil onaylandıktan sonra yayınlanacaktır.",
    directoryTitle: "İçerikleri keşfedin"
  },
  ar: {
    eyebrow: "SynergyMazeAI",
    readMore: "عرض التفاصيل",
    overview: "الهدف والنطاق",
    overviewText: "توضح هذه الصفحة الهدف والجمهور والسياق العملي لهذا الجانب من عملنا.",
    approach: "منهجية العمل",
    approachText:
      "نبدأ بأهداف واضحة، ونحدد المسؤوليات، ثم نتقدم عبر مراحل مركزة تتضمن مراجعات ونتائج قابلة للقياس.",
    nextStep: "ابدأ محادثة",
    nextStepText: "شارك أهدافك أو القيود أو الأسئلة وسنساعدك في تحديد خطوة تالية عملية.",
    contactTitle: "اختر نقطة البداية المناسبة",
    contactText:
      "تواصل معنا بشأن الاستشارات أو الشراكات البحثية أو برامج التعليم والتدريب أو الفعاليات أو المشاريع الرقمية.",
    contactButton: "مراسلة SynergyMazeAI",
    legalTitle: "المعلومات والخيارات",
    legalText: "تلخص هذه الصفحة كيفية التعامل مع هذا الموضوع والجهة المخصصة للأسئلة أو الطلبات.",
    legalNotice:
      "هذا المحتوى ملخص سياسة قيد المراجعة ويجب أن يراجعه مستشار قانوني مؤهل قبل النشر العام.",
    teamTitle: "هيكل الفريق",
    teamText: "الدليل جاهز لإضافة ملفات القيادة والبحث والهندسة والتعليم بعد اعتمادها.",
    teamSlot: "مساحة ملف شخصي",
    teamPending: "سيتم نشر الاسم والملف الشخصي بعد التأكيد.",
    directoryTitle: "استكشف المحتوى"
  }
};

const genericDescriptions: Record<Locale, (title: string) => string> = {
  en: (title) =>
    `Learn how SynergyMazeAI approaches ${title.toLowerCase()} through practical collaboration.`,
  tr: (title) =>
    `SynergyMazeAI'ın ${title} alanına pratik iş birliğiyle nasıl yaklaştığını keşfedin.`,
  ar: (title) => `تعرف على منهج SynergyMazeAI العملي والتعاوني في مجال ${title}.`
};

function getDirectory(path: string): DirectoryContent | null {
  const directories: Record<string, DirectoryContent> = {
    "case-studies": { items: caseStudies, basePath: "/case-studies" },
    blog: { items: blogPosts, basePath: "/blog" },
    "research/projects": { items: researchProjects, basePath: "/research/projects" },
    "research/publications": { items: publications, basePath: "/research/publications" }
  };

  return directories[path] ?? null;
}

function getDetail(path: string): CardContent | null {
  const collections = [
    { prefix: "case-studies/", items: caseStudies },
    { prefix: "blog/", items: blogPosts },
    { prefix: "research/projects/", items: researchProjects }
  ];

  for (const collection of collections) {
    if (path.startsWith(collection.prefix)) {
      const slug = path.slice(collection.prefix.length).split("/")[0];
      return collection.items.find((item) => item.slug === slug) ?? null;
    }
  }

  return null;
}

function titleFromPath(path: string): string {
  const segment = path.split("/").filter(Boolean).at(-1) ?? "SynergyMazeAI";
  return segment
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export function createPageMetadata(page: StandalonePageConfig) {
  return async ({ params }: { params: { locale: Locale } }): Promise<Metadata> => {
    const t = await getTranslations({ locale: params.locale });
    const detail = getDetail(page.path);
    const title = detail ? localize(detail.title, params.locale) : t(page.titleKey);
    const description = detail
      ? localize(detail.description, params.locale)
      : page.descriptionKey === "pages.placeholder.description"
        ? genericDescriptions[params.locale](title)
        : t(page.descriptionKey);

    return {
      title: `${title} | SynergyMazeAI`,
      description,
      alternates: {
        canonical: `/${params.locale}/${page.path}`
      }
    };
  };
}

export async function StandalonePage({ locale, page }: StandalonePageProps) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const copy = labels[locale];
  const directory = getDirectory(page.path);
  const detail = getDetail(page.path);
  const translatedTitle = t(page.titleKey);
  const title = detail
    ? localize(detail.title, locale)
    : page.titleKey === "pages.placeholder.title"
      ? titleFromPath(page.path)
      : translatedTitle;
  const description = detail
    ? localize(detail.description, locale)
    : page.descriptionKey === "pages.placeholder.description"
      ? genericDescriptions[locale](title)
      : t(page.descriptionKey);
  const isContact = page.path === "contact";
  const isTeam = page.path === "about/team";

  return (
    <div className={styles.page}>
      <Section className={styles.hero}>
        <Container className={styles.heroInner}>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1>{title}</h1>
          <p className={styles.lead}>{description}</p>
        </Container>
      </Section>

      {directory ? (
        <Section className={styles.contentSection}>
          <Container>
            <div className={styles.sectionIntro}>
              <p className={styles.eyebrow}>{copy.directoryTitle}</p>
              <h2>{title}</h2>
            </div>
            <div className={styles.directoryGrid}>
              {directory.items.map((item) => (
                <Card className={styles.directoryCard} key={item.slug}>
                  {item.eyebrow ? (
                    <p className={styles.cardEyebrow}>{localize(item.eyebrow, locale)}</p>
                  ) : null}
                  <h3>{localize(item.title, locale)}</h3>
                  <p>{localize(item.description, locale)}</p>
                  <Button
                    href={localizedPath(locale, `${directory.basePath}/${item.slug}`)}
                    variant="ghost"
                  >
                    {copy.readMore}
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </Button>
                </Card>
              ))}
            </div>
          </Container>
        </Section>
      ) : isContact ? (
        <Section className={styles.contentSection}>
          <Container className={styles.contactGrid}>
            <div className={styles.sectionIntro}>
              <p className={styles.eyebrow}>{copy.contactTitle}</p>
              <h2>{copy.contactTitle}</h2>
              <p>{copy.contactText}</p>
            </div>
            <Card className={styles.contactCard}>
              <Mail aria-hidden="true" />
              <h3>info@synergymazeai.com</h3>
              <p>{copy.nextStepText}</p>
              <Button href="mailto:info@synergymazeai.com">
                {copy.contactButton}
                <ArrowUpRight size={17} aria-hidden="true" />
              </Button>
            </Card>
          </Container>
        </Section>
      ) : isTeam ? (
        <Section className={styles.contentSection}>
          <Container>
            <div className={styles.sectionIntro}>
              <p className={styles.eyebrow}>{copy.teamTitle}</p>
              <h2>{copy.teamTitle}</h2>
              <p>{copy.teamText}</p>
            </div>
            <div className={styles.teamGrid}>
              {["Leadership", "Research", "Engineering", "Education"].map((role) => (
                <Card className={styles.teamCard} key={role}>
                  <span className={styles.avatarSlot}>
                    <Users aria-hidden="true" />
                  </span>
                  <p className={styles.cardEyebrow}>{copy.teamSlot}</p>
                  <h3>{locale === "en" ? role : copy.teamTitle}</h3>
                  <p>{copy.teamPending}</p>
                </Card>
              ))}
            </div>
          </Container>
        </Section>
      ) : (
        <Section className={styles.contentSection}>
          <Container>
            <div className={styles.editorialGrid}>
              {[
                [copy.overview, copy.overviewText],
                [copy.approach, copy.approachText],
                [
                  page.legal ? copy.legalTitle : copy.nextStep,
                  page.legal ? copy.legalText : copy.nextStepText
                ]
              ].map(([heading, body], index) => (
                <Card className={styles.editorialCard} key={heading}>
                  <span className={styles.sectionNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <CheckCircle2 aria-hidden="true" />
                  <h2>{heading}</h2>
                  <p>{body}</p>
                </Card>
              ))}
            </div>
            {page.legal ? <p className={styles.notice}>{copy.legalNotice}</p> : null}
          </Container>
        </Section>
      )}

      <Section className={styles.ctaSection}>
        <Container className={styles.ctaInner}>
          <div>
            <p className={styles.eyebrow}>{copy.nextStep}</p>
            <h2>{copy.nextStep}</h2>
            <p>{copy.nextStepText}</p>
          </div>
          <Button href={localizedPath(locale, "/contact")}>{t("navigation.partner")}</Button>
        </Container>
      </Section>
    </div>
  );
}
