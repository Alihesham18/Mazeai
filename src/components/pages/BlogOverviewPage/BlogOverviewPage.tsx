import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { getDirection, type Locale } from "@/i18n/routing";
import { getPublishedBlogPosts } from "@/lib/directus/blog";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./BlogOverviewPage.module.css";

function formatDate(value: string | null, locale: Locale) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(value));
}

export async function BlogOverviewPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [result, t, pageT] = await Promise.all([
    getPublishedBlogPosts(locale),
    getTranslations({ locale, namespace: "blog" }),
    getTranslations({ locale, namespace: "pages.blog" })
  ]);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <Container>
          <p className={styles.eyebrow}>{t("eyebrow")}</p>
          <h1>{pageT("title")}</h1>
          <p className={styles.lead}>{pageT("description")}</p>
        </Container>
      </section>

      <section className={styles.collection} aria-labelledby="blog-articles-heading">
        <Container>
          <header className={styles.sectionHeading}>
            <p className={styles.eyebrow}>{t("collectionEyebrow")}</p>
            <h2 id="blog-articles-heading">{t("collectionTitle")}</h2>
          </header>

          {!result.ok ? (
            <p className={styles.state} role="alert">
              {t("unableToLoad")}
            </p>
          ) : result.data.length === 0 ? (
            <p className={styles.state}>{t("empty")}</p>
          ) : (
            <div className={styles.grid}>
              {result.data.map((post) => {
                const publishedDate = formatDate(post.publishedAt, locale);
                return (
                  <article
                    className={styles.card}
                    dir={getDirection(post.locale)}
                    key={post.id}
                    lang={post.locale}
                  >
                    <div className={styles.cardBody}>
                      {publishedDate ? (
                        <p className={styles.date}>
                          {t("published", { date: publishedDate })}
                        </p>
                      ) : null}
                      <h3>{post.title}</h3>
                      {post.excerpt ? <p className={styles.excerpt}>{post.excerpt}</p> : null}
                      <Link
                        className={styles.link}
                        href={localizedPath(locale, `/blog/${post.slug}`)}
                      >
                        {t("readArticle", { title: post.title })}
                        <ArrowUpRight size={17} aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Container>
      </section>
    </div>
  );
}
