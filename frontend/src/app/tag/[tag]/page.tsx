import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllTags, getArticlesByTag } from "@/lib/articles";
import { SITE_NAME, BASE_URL } from "@/lib/config";
import ArticleCard from "@/components/cards/ArticleCard";
import AdSlot from "@/components/monetization/AdSlot";
import Link from "next/link";

export async function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const articles = getArticlesByTag(tag);
  if (articles.length === 0) return {};

  const display = tag.charAt(0).toUpperCase() + tag.slice(1);
  const description = `Browse ${articles.length} article${articles.length !== 1 ? "s" : ""} tagged "${display}" on ${SITE_NAME}.`;

  return {
    title: `${display} Articles`,
    description,
    openGraph: {
      title: `${display} Articles | ${SITE_NAME}`,
      description,
      url: `${BASE_URL}/tag/${tag}`,
    },
    alternates: { canonical: `${BASE_URL}/tag/${tag}` },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const articles = getArticlesByTag(tag);
  if (articles.length === 0) notFound();

  const display = tag.charAt(0).toUpperCase() + tag.slice(1);

  return (
    <div className="animate-in">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="transition-colors hover:opacity-80" style={{ color: "var(--accent)" }}>Home</Link>
        <span>/</span>
        <span style={{ color: "var(--text-secondary)" }}>Tags</span>
        <span>/</span>
        <span style={{ color: "var(--text-secondary)" }}>{display}</span>
      </nav>

      {/* Hero */}
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
          {display}
        </h1>
        <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
          Articles tagged with &ldquo;{display}&rdquo;
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {articles.length} article{articles.length !== 1 ? "s" : ""}
        </p>
      </header>

      <AdSlot position="top" className="mb-6" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>

      {articles.length === 0 && (
        <p className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
          No articles with this tag yet.
        </p>
      )}

      <AdSlot position="bottom" className="mt-8" />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: `${display} Articles`,
              description: `Articles tagged with "${display}" on ${SITE_NAME}.`,
              url: `${BASE_URL}/tag/${tag}`,
              numberOfItems: articles.length,
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
                { "@type": "ListItem", position: 2, name: "Tags" },
                { "@type": "ListItem", position: 3, name: display },
              ],
            },
          ]),
        }}
      />
    </div>
  );
}
