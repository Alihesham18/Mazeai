import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogDetailPage, BlogLoadError } from "@/components/pages/BlogDetailPage";
import type { Locale } from "@/i18n/routing";
import { getPublishedBlogPostBySlug } from "@/lib/directus/blog";

interface BlogPostPageProps {
  params: { locale: Locale; slug: string };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const result = await getPublishedBlogPostBySlug(params.slug, params.locale);
  if (!result.ok || !result.data) return {};

  const canonical = `/${params.locale}/blog/${result.data.slug}`;
  return {
    title: `${result.data.seoTitle} | SynergyMazeAI`,
    description: result.data.seoDescription || undefined,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: result.data.seoTitle,
      description: result.data.seoDescription || undefined,
      url: canonical,
      ...(result.data.publishedAt ? { publishedTime: result.data.publishedAt } : {})
    },
    twitter: {
      card: "summary",
      title: result.data.seoTitle,
      description: result.data.seoDescription || undefined
    }
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const result = await getPublishedBlogPostBySlug(params.slug, params.locale);
  if (!result.ok) return <BlogLoadError locale={params.locale} />;
  if (!result.data) notFound();
  return <BlogDetailPage post={result.data} locale={params.locale} />;
}
