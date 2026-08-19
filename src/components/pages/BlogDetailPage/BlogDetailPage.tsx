import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { getDirection, type Locale } from "@/i18n/routing";
import type { BlogPost } from "@/lib/directus/blog";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./BlogDetailPage.module.css";

function formatDate(value: string | null, locale: Locale) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(value));
}

export async function BlogDetailPage({ post, locale }: { post: BlogPost; locale: Locale }) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });
  const publishedDate = formatDate(post.publishedAt, locale);
  const contentDirection = getDirection(post.locale);

  return (
    <article className={styles.page}>
      <header className={styles.hero}>
        <Container>
          <Link className={styles.backLink} href={localizedPath(locale, "/blog")}>
            <ArrowLeft size={18} aria-hidden="true" />
            {t("back")}
          </Link>
          <div className={styles.articleCopy} dir={contentDirection} lang={post.locale}>
            <p className={styles.eyebrow}>{t("article")}</p>
            <h1>{post.title}</h1>
            {post.excerpt ? <p className={styles.lead}>{post.excerpt}</p> : null}
            {publishedDate ? (
              <p className={styles.date}>{t("published", { date: publishedDate })}</p>
            ) : null}
          </div>
        </Container>
      </header>

      {post.content ? (
        <section className={styles.contentSection} aria-label={t("articleContent")}>
          <Container>
            <div
              className={styles.content}
              dir={contentDirection}
              lang={post.locale}
            >
              {post.content}
            </div>
          </Container>
        </section>
      ) : null}
    </article>
  );
}

export async function BlogLoadError({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "blog" });
  return (
    <div className={styles.errorPage}>
      <Container>
        <h1>{t("detailUnavailableTitle")}</h1>
        <p role="alert">{t("detailUnavailable")}</p>
        <Link className={styles.backLink} href={localizedPath(locale, "/blog")}>
          <ArrowLeft size={18} aria-hidden="true" />
          {t("back")}
        </Link>
      </Container>
    </div>
  );
}
