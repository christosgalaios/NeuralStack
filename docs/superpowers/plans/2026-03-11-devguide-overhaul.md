# Dev Guide Overhaul Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Dev Guide from an aggressive affiliate site into a content-first developer resource with contextual monetization, broader topics, migrated RSS, and a polished visual identity with logo/favicon.

**Architecture:** Frontend-first changes (affiliate relevance system, homepage/header/article cleanup, logo, RSS route), followed by Python cleanup (remove old RSS), then data expansion (topic seeds). Tasks are sequential within each chunk. Task 4 depends on Task 1 (uses `getRelevantAffiliate`).

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Python stdlib

**Spec:** `docs/superpowers/specs/2026-03-11-devguide-overhaul-design.md`

---

## File Map

| File | Action | Task |
|------|--------|------|
| `frontend/src/lib/config.ts` | Edit | 1 |
| `frontend/src/lib/articles.ts` | Edit | 1 |
| `frontend/src/components/layout/SiteHeader.tsx` | Edit | 2 |
| `frontend/src/app/page.tsx` | Edit | 3 |
| `frontend/src/app/articles/[slug]/page.tsx` | Edit | 4 |
| `frontend/public/icon.svg` | Create | 5 |
| `frontend/public/logo.svg` | Create | 5 |
| `frontend/src/app/layout.tsx` | Edit | 5 |
| `frontend/src/styles/globals.css` | Edit | 6 |
| `frontend/src/app/feed.xml/route.ts` | Create | 7 |
| `agents/distribution.py` | Edit | 8 |
| `tests/test_distribution.py` | Edit | 8 |
| `data/topics.json` | Edit | 9 |

---

## Chunk 1: Affiliate De-escalation + UI Refresh

### Task 1: Add Affiliate Type and Relevance System

**Files:**
- Modify: `frontend/src/lib/config.ts:16-38`
- Modify: `frontend/src/lib/articles.ts:1-23`

- [ ] **Step 1: Add Affiliate interface and AFFILIATE_RELEVANCE map to config.ts**

In `frontend/src/lib/config.ts`, add above the AFFILIATES array:

```typescript
export interface Affiliate {
  name: string;
  url: string;
  description: string;
  tagline: string;
}
```

Do NOT add `Affiliate[]` type annotation to the AFFILIATES array — the `process.env` values return `string | undefined` which would cause a type error. Instead, leave the array untyped and cast when needed. The `getRelevantAffiliate()` function will import the array as-is.

Then add after the AFFILIATES array:

```typescript
export const AFFILIATE_RELEVANCE: Record<string, string[]> = {
  "Cursor IDE": ["code-editor", "ai-coding", "ide", "developer-tools", "copilot", "vscode", "cursor", "ai editor"],
  "Datadog": ["monitoring", "observability", "logging", "debugging", "apm", "production", "datadog", "grafana"],
  "Railway": ["deployment", "hosting", "cloud", "ci-cd", "infrastructure", "paas", "railway", "heroku", "render"],
};
```

- [ ] **Step 2: Add getRelevantAffiliate() to articles.ts**

In `frontend/src/lib/articles.ts`, add import and function:

```typescript
import { AFFILIATES, AFFILIATE_RELEVANCE, type Affiliate } from "./config";

export function getRelevantAffiliate(article: { title: string; description: string; category: string }): Affiliate | null {
  const text = `${article.title} ${article.description} ${article.category}`.toLowerCase();
  for (const aff of AFFILIATES) {
    const keywords = AFFILIATE_RELEVANCE[aff.name] || [];
    if (keywords.some((kw) => text.includes(kw))) return aff;
  }
  return null;
}
```

- [ ] **Step 3: Verify frontend build passes**

Run: `cd frontend && npm run build 2>&1 | tail -10`
Expected: Build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/config.ts frontend/src/lib/articles.ts
git commit -m "feat: add Affiliate type and relevance matching system"
```

---

### Task 2: Redesign SiteHeader — Remove CTA, Add Logo, Rename Nav

**Files:**
- Modify: `frontend/src/components/layout/SiteHeader.tsx` (full rewrite)

- [ ] **Step 1: Rewrite SiteHeader.tsx**

Replace the entire file with a clean header that:
- Removes `AFFILIATES` import (no longer needed)
- Replaces the text+square logo with an inline SVG logo (code brackets `</>` in blue gradient square + "Dev Guide" wordmark)
- Removes the affiliate CTA button (lines 26-34)
- Renames "Home" to "Articles" in both desktop nav (line 23) and mobile menu (line 57)
- Adds a subtle separator and RSS link in the desktop nav

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { SITE_NAME, BASE_URL } from "@/lib/config";

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur-xl" style={{ borderColor: "var(--border)", background: "rgba(10,10,11,0.85)" }}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5 text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg transition-shadow duration-300 group-hover:shadow-[0_0_16px_rgba(59,130,246,0.3)]" style={{ background: "linear-gradient(135deg, #3b82f6, #60a5fa)" }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 5L3 10L7 15" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 5L17 10L13 15" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          {SITE_NAME}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm transition-colors hover:opacity-80" style={{ color: "var(--text-secondary)" }}>Articles</Link>
          <Link href="/tools" className="text-sm transition-colors hover:opacity-80" style={{ color: "var(--text-secondary)" }}>Tools</Link>
          <Link href="/about" className="text-sm transition-colors hover:opacity-80" style={{ color: "var(--text-secondary)" }}>About</Link>
          <div className="h-4 w-px" style={{ background: "var(--border)" }} />
          <a href={`${BASE_URL}/feed.xml`} className="text-sm transition-colors hover:opacity-80" style={{ color: "var(--text-muted)" }} title="RSS Feed">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1" />
            </svg>
          </a>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg md:hidden"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <nav className="border-t px-4 pb-4 pt-2 md:hidden" style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}>
          <Link href="/" className="block py-2 text-sm" style={{ color: "var(--text-secondary)" }} onClick={() => setMobileOpen(false)}>Articles</Link>
          <Link href="/tools" className="block py-2 text-sm" style={{ color: "var(--text-secondary)" }} onClick={() => setMobileOpen(false)}>Tools</Link>
          <Link href="/about" className="block py-2 text-sm" style={{ color: "var(--text-secondary)" }} onClick={() => setMobileOpen(false)}>About</Link>
        </nav>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd frontend && npm run build 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/SiteHeader.tsx
git commit -m "feat: redesign header — remove affiliate CTA, add logo, rename nav"
```

---

### Task 3: Redesign Homepage — Remove Tools Section, Refine Hero

**Files:**
- Modify: `frontend/src/app/page.tsx` (lines 2, 4, 77-87)

- [ ] **Step 1: Edit page.tsx**

Changes to make:
1. Remove `ToolCard` import (line 4)
2. Remove `AFFILIATES` and `SITE_TAGLINE` from the config import (line 2) — keep `SITE_NAME, SITE_DESCRIPTION, BASE_URL, CATEGORY_META`
3. Delete the entire Tools Section (lines 77-87):
   ```tsx
   {/* Tools Section */}
   <section className="my-12">
     ...
   </section>
   ```
4. Refine the hero section — update the tagline area with a pill badge:

Replace the hero section (lines 17-40) with:

```tsx
<section className="py-10 text-center sm:py-14">
  <div className="mb-4 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--accent)" }}>
    Updated daily
  </div>
  <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl" style={{ color: "var(--text-primary)" }}>
    Developer intelligence,<br className="hidden sm:block" /> distilled.
  </h1>
  <p className="mx-auto mt-4 max-w-lg text-base" style={{ color: "var(--text-muted)" }}>
    In-depth guides on frameworks, tools, databases, and engineering workflows. No fluff.
  </p>
  <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
    <div className="text-center">
      <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>{articles.length}</p>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Articles</p>
    </div>
    <div className="h-8 w-px" style={{ background: "var(--border)" }} />
    <div className="text-center">
      <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>{categories.length}</p>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Categories</p>
    </div>
  </div>
</section>
```

(Removes the green "Daily" stat — it was a vanity metric.)

- [ ] **Step 2: Verify build passes**

Run: `cd frontend && npm run build 2>&1 | tail -10`
Expected: Build succeeds. Homepage no longer references ToolCard or AFFILIATES.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/page.tsx
git commit -m "feat: redesign homepage — remove tools section, refine hero"
```

---

### Task 4: Article Page — Remove Sidebar Callout, Add Relevance Check

**Depends on:** Task 1 (requires `getRelevantAffiliate` from articles.ts)

**Files:**
- Modify: `frontend/src/app/articles/[slug]/page.tsx` (lines 4-5, 102-107, 132-136)

- [ ] **Step 1: Update imports**

Add `getRelevantAffiliate` import:
```tsx
import { getAllSlugs, getArticle, getRelatedArticles, getRelevantAffiliate } from "@/lib/articles";
```

- [ ] **Step 2: Remove sidebar ToolCallout (lines 132-136)**

Delete these lines from the sidebar `<aside>`:
```tsx
<ToolCallout
  name={article.affiliate.name}
  url={article.affiliate.url}
  description={article.affiliate.description}
/>
```

- [ ] **Step 3: Replace in-content ToolCallout with relevance check**

Replace the in-article callout block (lines 102-107) with:

```tsx
{/* In-article affiliate callout — only if relevant */}
{(() => {
  const aff = getRelevantAffiliate(article);
  return aff ? (
    <ToolCallout
      name={aff.name}
      url={aff.url}
      description={aff.description}
    />
  ) : null;
})()}
```

- [ ] **Step 4: Verify build passes**

Run: `cd frontend && npm run build 2>&1 | tail -10`
Expected: Build succeeds. Articles without relevant affiliates show no callout.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/articles/[slug]/page.tsx
git commit -m "feat: article page — contextual affiliate callouts, remove sidebar duplicate"
```

---

### Task 5: Logo, Favicon, and Layout

**Files:**
- Create: `frontend/public/icon.svg`
- Create: `frontend/public/logo.svg`
- Modify: `frontend/src/app/layout.tsx:42-45`

- [ ] **Step 1: Create icon.svg**

Create `frontend/public/icon.svg` — the code brackets icon in a blue gradient square:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#60A5FA"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="20" fill="url(#bg)"/>
  <path d="M38 30L18 50L38 70" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M62 30L82 50L62 70" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>
```

- [ ] **Step 2: Create logo.svg**

Create `frontend/public/logo.svg` — the full logo (icon + "Dev Guide" text):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 40">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#60A5FA"/>
    </linearGradient>
  </defs>
  <rect width="40" height="40" rx="8" fill="url(#bg)"/>
  <path d="M15 12L7 20L15 28" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M25 12L33 20L25 28" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <text x="52" y="27" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="700" fill="#fafafa" letter-spacing="-0.02em">Dev Guide</text>
</svg>
```

- [ ] **Step 3: Update layout.tsx favicon**

In `frontend/src/app/layout.tsx`, replace the 4-line `<link rel="icon" ...>` block at lines 42-45. The old code is a `<link>` with a long `data:image/svg+xml` data URI containing `${SITE_NAME[0]}`. Delete those 4 lines and replace with:

```tsx
<link rel="icon" href="/icon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/icon.svg" />
```

- [ ] **Step 4: Verify build passes**

Run: `cd frontend && npm run build 2>&1 | tail -10`
Expected: Build succeeds. Favicon and logo files exist in output.

- [ ] **Step 5: Commit**

```bash
git add frontend/public/icon.svg frontend/public/logo.svg frontend/src/app/layout.tsx
git commit -m "feat: add Dev Guide logo and SVG favicon"
```

---

### Task 6: CSS Visual Refinements

**Files:**
- Modify: `frontend/src/styles/globals.css`

- [ ] **Step 1: Refine hover effects and add subtle polish**

In `frontend/src/styles/globals.css`, make these changes:

1. Soften card hover glow (line 248) — reduce from `20px` to `12px`:
   ```css
   .card-hover:hover {
     border-color: var(--accent) !important;
     box-shadow: 0 0 12px var(--accent-glow);
   }
   ```

2. Soften tool card hover glow (line 256) — reduce from `24px` to `12px`:
   ```css
   .tool-card-hover:hover {
     border-color: var(--accent-cta) !important;
     box-shadow: 0 0 12px rgba(34, 197, 94, 0.08);
   }
   ```

3. Refine article typography — update `.article-content h2` (line 70-77) margin-top from `2.5rem` to `3rem` and `.article-content p` (line 86-90) margin-bottom from `1.25rem` to `1.5rem` for better breathing room:
   ```css
   .article-content h2 {
     font-size: 1.5rem;
     margin-top: 3rem;
     margin-bottom: 1rem;
     padding-bottom: 0.5rem;
     border-bottom: 1px solid var(--border);
     color: var(--text-primary);
   }

   .article-content p {
     margin-bottom: 1.5rem;
     line-height: 1.75;
     color: var(--text-secondary);
   }
   ```

4. Improve code block styling — update `.article-content pre` (line 181-188) to add a subtle top accent:
   ```css
   .article-content pre {
     background: var(--code-bg);
     border: 1px solid var(--border);
     border-top: 2px solid var(--accent);
     border-radius: var(--radius-sm);
     padding: 1.25rem;
     overflow-x: auto;
     margin: 1.5rem 0;
   }
   ```

5. Add a subtle section divider class at the end of the file:
   ```css
   /* ─── Section Dividers ──────────────────────────────────────── */

   .section-divider {
     height: 1px;
     background: linear-gradient(90deg, transparent, var(--border), transparent);
     margin: 2rem 0;
   }
   ```

- [ ] **Step 2: Verify build passes**

Run: `cd frontend && npm run build 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/styles/globals.css
git commit -m "style: soften hover effects, add section divider utility"
```

---

## Chunk 2: RSS Migration + Python Cleanup

### Task 7: Create Next.js RSS Route Handler

**Files:**
- Create: `frontend/src/app/feed.xml/route.ts`

- [ ] **Step 1: Create the RSS route handler**

Create `frontend/src/app/feed.xml/route.ts`:

```typescript
import { getAllArticles } from "@/lib/articles";
import { SITE_NAME, SITE_DESCRIPTION, BASE_URL } from "@/lib/config";

export const dynamic = "force-static";

export async function GET() {
  const articles = getAllArticles();

  const items = articles
    .slice(0, 20)
    .map(
      (a) => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${BASE_URL}/articles/${a.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/articles/${a.slug}</guid>
      <description><![CDATA[${a.description}]]></description>
      <pubDate>${new Date(a.date_published).toUTCString()}</pubDate>
      <category>${a.category_display}</category>
    </item>`
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${BASE_URL}</link>
    <description>${SITE_DESCRIPTION}</description>
    <language>en</language>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
```

- [ ] **Step 2: Delete old static feed.xml if it exists in public/**

Run: `rm -f frontend/public/feed.xml`

- [ ] **Step 3: Verify build passes and feed.xml is generated**

Run: `cd frontend && npm run build 2>&1 | tail -10`
Then verify: `ls -la frontend/out/feed.xml`
Expected: Build succeeds, `feed.xml` exists in output.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/feed.xml/route.ts
git commit -m "feat: add Next.js RSS route handler (replaces Python generation)"
```

---

### Task 8: Remove Python RSS Generation

**Files:**
- Modify: `agents/distribution.py:716, 952`
- Modify: `tests/test_distribution.py:62-67`

- [ ] **Step 1: Remove `_update_rss()` call from `run()` method**

In `agents/distribution.py`, delete line 952:
```python
self._update_rss(posts_meta)
```

- [ ] **Step 2: Delete `_update_rss()` method**

In `agents/distribution.py`, delete the entire `_update_rss()` method starting at line 716. Find the method boundaries and remove it completely.

- [ ] **Step 3: Remove RSS test**

In `tests/test_distribution.py`, delete the `test_rss_uses_real_base_url` test method (lines 62-67).

- [ ] **Step 4: Run Python tests**

Run: `python -m unittest discover -s tests -v 2>&1 | tail -10`
Expected: All remaining tests pass. No RSS-related failures.

- [ ] **Step 5: Verify frontend build still works**

Run: `cd frontend && npm run build 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add agents/distribution.py tests/test_distribution.py
git commit -m "chore: remove Python RSS generation (migrated to Next.js)"
```

---

## Chunk 3: Topic Pool Expansion

### Task 9: Add Broad Full-Stack Topic Seeds

**Files:**
- Modify: `data/topics.json`

- [ ] **Step 1: Generate and add ~150 new topic seeds**

Add topic seeds to `data/topics.json`. Each entry follows this schema:

```json
{
  "id": "<category>-<short-slug>",
  "keyword": "<descriptive article title/keyword>",
  "category": "<tutorial|guide|comparison|compatibility|review>",
  "intent": "<one sentence describing reader intent>",
  "difficulty_score": 0.35,
  "source": "seed-fullstack-broadening",
  "created_at": "2026-03-11T00:00:00Z",
  "status": "new"
}
```

**Target distribution (~150 seeds):**

**Tutorials (~45):**
- React: hooks deep dive, context patterns, server components, suspense, error boundaries
- Next.js: App Router patterns, middleware, ISR, API routes, authentication
- TypeScript: generics, utility types, type guards, declaration files
- Node.js: streams, worker threads, event loop, native addons
- Python: async/await, decorators, type hints, virtual environments
- Databases: PostgreSQL indexing, MongoDB aggregation, Redis patterns, SQLite for local
- Docker: multi-stage builds, compose patterns, networking, volume management
- Testing: Jest mocking, Playwright E2E, React Testing Library, snapshot testing

**Guides (~38):**
- Architecture: clean architecture, hexagonal architecture, event sourcing, CQRS
- Best practices: error handling patterns, logging strategies, API versioning
- Security: OWASP top 10, JWT vs sessions, CORS configuration, CSP headers
- DevOps: GitHub Actions workflows, Terraform basics, monitoring setup
- Performance: web vitals optimization, database query tuning, caching strategies
- Workflows: monorepo management, code review practices, documentation standards

**Comparisons (~30):**
- Frameworks: Next.js vs Remix, Express vs Fastify, Django vs FastAPI
- Databases: PostgreSQL vs MySQL, MongoDB vs DynamoDB, Redis vs Memcached
- Testing: Jest vs Vitest, Cypress vs Playwright, pytest vs unittest
- Build tools: Vite vs webpack, esbuild vs swc, Turborepo vs Nx
- Languages: TypeScript vs JavaScript, Python vs Go for APIs, Rust vs Go

**Compatibility (~22):**
- Node.js 22 with popular packages, Python 3.13 breaking changes
- TypeScript 5.x with React 19, ESM vs CJS compatibility
- Docker on Apple Silicon, WSL2 with various dev tools
- Tailwind CSS v4 migration, Next.js 15 upgrade paths

**Reviews (~15):**
- Tools: Bun runtime, Deno 2, Turborepo, Biome linter
- Services: Vercel, Netlify, Cloudflare Workers, PlanetScale
- IDEs: Zed editor, Neovim modern setup, JetBrains Fleet

- [ ] **Step 2: Validate JSON is valid**

Run: `python -c "import json; d=json.load(open('data/topics.json')); print(f'Total topics: {len(d)}'); print(f'New seeds: {sum(1 for t in d if t.get(\"source\")==\"seed-fullstack-broadening\")}')"`
Expected: Total topics ~700+, new seeds ~150.

- [ ] **Step 3: Verify no duplicate IDs**

Run: `python -c "import json; d=json.load(open('data/topics.json')); ids=[t['id'] for t in d]; dupes=[x for x in ids if ids.count(x)>1]; print(f'Duplicates: {len(set(dupes))}') if dupes else print('No duplicates')"`
Expected: "No duplicates"

- [ ] **Step 4: Commit**

```bash
git add data/topics.json
git commit -m "content: add ~150 broad full-stack topic seeds

Rebalances pool from 64% devtools comparisons to diverse coverage:
tutorials, guides, comparisons, compatibility, reviews across
frontend, backend, databases, DevOps, testing, and architecture."
```

---

## Chunk 4: Final Verification

### Task 10: Full Build and Smoke Test

- [ ] **Step 1: Run all Python tests**

Run: `python -m unittest discover -s tests -v`
Expected: All tests pass (should be 37 after RSS test removal).

- [ ] **Step 2: Run full frontend build**

Run: `cd frontend && npm run build`
Expected: Build succeeds. Check page count in output.

- [ ] **Step 3: Verify key pages exist in output**

Run: `ls frontend/out/index.html frontend/out/feed.xml frontend/out/icon.svg frontend/out/logo.svg`
Expected: All files exist.

- [ ] **Step 4: Start dev server and visually verify**

Run: `cd frontend && npm run dev`

Check:
- Homepage: no tools section, refined hero with "Updated daily" pill
- Header: logo with code brackets, "Articles / Tools / About" nav, RSS icon, no CTA
- Article page: no sidebar callout. Relevant articles show one callout, irrelevant ones show none.
- Favicon: blue gradient code brackets icon in browser tab

- [ ] **Step 5: Final commit if any fixes needed**

If any issues were found and fixed, commit them.

- [ ] **Step 6: Push to main**

```bash
git push origin main
```
