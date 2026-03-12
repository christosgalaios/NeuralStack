import Link from "next/link";
import { SITE_NAME, BASE_URL, AFFILIATES, CATEGORY_META } from "@/lib/config";
import { getAllCategories } from "@/lib/articles";

export default function SiteFooter() {
  return (
    <footer className="border-t" style={{ borderColor: "var(--border)", background: "var(--bg-card)", borderImage: "linear-gradient(90deg, transparent, #1a8a9a33, transparent) 1" }} role="contentinfo">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="17" fill="none" stroke="#7a8494" strokeWidth="1.4" opacity="0.3" />
                <polygon points="20,1 17,5 20,3 23,5" fill="#1a8a9a" opacity="0.7" />
                <path d="M20,3 L17,12 L14.5,17.5 L18,20 L20,17 L22,20 L25.5,17.5 L23,12 Z" fill="#0d4a5a" />
                <path d="M20,37 L23,28 L25.5,22.5 L22,20 L20,23 L18,20 L14.5,22.5 L17,28 Z" fill="#2da0b0" opacity="0.25" />
                <circle cx="20" cy="20" r="2" fill="#e2e8f0" />
                <circle cx="20" cy="20" r="1" fill="#0d4a5a" />
              </svg>
              <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Dev <span style={{ color: "#1a9aaa" }}>Guide</span>
              </p>
            </div>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Independent technical guides for engineers who ship. Updated daily.
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer navigation">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Navigate</p>
            <ul className="flex flex-col gap-2 list-none p-0 m-0">
              <li><Link href="/" className="text-sm transition-colors hover:opacity-80" style={{ color: "var(--text-secondary)" }}>Home</Link></li>
              <li><Link href="/tools" className="text-sm transition-colors hover:opacity-80" style={{ color: "var(--text-secondary)" }}>Recommended Tools</Link></li>
              <li><Link href="/about" className="text-sm transition-colors hover:opacity-80" style={{ color: "var(--text-secondary)" }}>About</Link></li>
            </ul>
          </nav>

          {/* Categories */}
          <nav aria-label="Categories">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Categories</p>
            <ul className="flex flex-col gap-2 list-none p-0 m-0">
              {getAllCategories().map((cat) => {
                const meta = CATEGORY_META[cat];
                return (
                  <li key={cat}><Link href={`/category/${cat}`} className="text-sm transition-colors hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
                    {meta?.display || cat}
                  </Link></li>
                );
              })}
              <li><a href={`${BASE_URL}/feed.xml`} className="text-sm transition-colors hover:opacity-80" style={{ color: "var(--text-muted)" }}>RSS Feed</a></li>
              <li><a href={`${BASE_URL}/sitemap.xml`} className="text-sm transition-colors hover:opacity-80" style={{ color: "var(--text-muted)" }}>Sitemap</a></li>
            </ul>
          </nav>

          {/* Tools */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Tools We Recommend</p>
            <ul className="flex flex-col gap-2 list-none p-0 m-0">
              {AFFILIATES.map((aff) => (
                <li key={aff.name}><a href={aff.url} target="_blank" rel="noopener sponsored" className="text-sm transition-colors hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
                  {aff.name}
                </a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="compass-divider mt-10"><span className="compass-divider-diamond" /></div>
        <div className="pt-6">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {SITE_NAME} contains affiliate links. We may earn a commission when you purchase through our links, at no extra cost to you. This helps support our independent content.
          </p>
          <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
