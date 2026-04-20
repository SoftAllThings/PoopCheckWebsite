# Audit Findings — 2026-04-20

> **Run:** Phase B of the marketing-skills plan. Skills applied: `/seo-audit`,
> `/page-cro`, `/schema-markup`, `/copy-editing`, `/competitor-alternatives`.
> Scope: repo state + live site + product-marketing-context.
>
> **Status of each finding:**
> - ✅ **Fixed in this pass**
> - 🟡 **Deferred** — real issue, needs separate work, not shipping now
> - 🔵 **Informational** — captured for future reference

## P0 — Shipped in this pass

### ✅ 1. Missing `aggregateRating` in app schema

**Before:** `softwareApplicationSchema()` in [src/utils/schema.ts](../src/utils/schema.ts) had no
rating. Google rich results need `aggregateRating` to display stars in SERPs.

**Fix:** Added `aggregateRating` with combined App Store + Google Play data
(4.8★ / 80 reviews) and switched `@type` from `SoftwareApplication` to the more
specific `MobileApplication`. Also expanded `offers[]` from a single $0 Free
tier to three offers (Free, Premium Monthly $6.99, Premium Annual $49.99) so
Google can surface pricing details.

### ✅ 2. Missing `MedicalWebPage` schema on YMYL blog posts

**Before:** All blog posts used plain `Article` schema. For a YMYL (health)
site, Google's guidelines specifically favor `MedicalWebPage` to signal
medical-content legitimacy.

**Fix:** `articleSchema()` now accepts a `medical: boolean` prop; when true,
it emits `@type: ['Article', 'MedicalWebPage']` plus `lastReviewed` and
`audience` fields. `BlogLayout.astro` passes `medical: category !== 'app-updates'`
— every blog category except app-updates is treated as YMYL.

### ✅ 3. Product marketing context lacks real data

**Before:** `.agents/product-marketing-context.md` had `[TODO]` markers on
pricing, privacy, newsletter status, competitors, verbatim customer language.

**Fix:** Seeded from research — pricing $6.99/mo $49.99/yr, privacy stance
verbatim from `src/pages/privacy.astro`, 8 real 2026-competition competitors
(Dieta Health / Balloon / Plop / Stooly etc), verbatim App Store + Google
Play reviews (including the negative ones that surface real objections), app
store ratings. Remaining `[TODO]`s are explicitly optional (full review corpus
from App Store Connect, real GSC keyword data).

## P1 — Deferred (real issues, captured here)

### 🟡 4. No newsletter signup anywhere on the site

**Finding:** `resend` package is installed (v6.10.0), but it's only wired to
the `/api/support/` endpoint for the contact form
([src/pages/api/support.ts](../src/pages/api/support.ts)). No footer signup,
no post-CTA signup, no dedicated page. Every blog visit is a one-shot SEO
encounter — no list-building.

**Recommendation:** add a minimal `POST /api/newsletter/` endpoint + a simple
`<NewsletterSignup>` Astro component in the footer and at the end of each
blog post. Resend has an audience/contacts API. Owns a real compounding
growth lever for zero net-new infra. **~2–3 hours of work** — defer to a
dedicated session.

### 🟡 5. Privacy policy missing explicit photo-retention window

**Finding:** [privacy.astro](../src/pages/privacy.astro) says "Photos are
processed securely and are never shared with third parties," but doesn't say
for how long they're kept. Users (and potential enterprise/health-data
customers) ask this. It's also a trust signal that AI-image products
typically surface prominently.

**Recommendation:** add a concrete retention statement (e.g., "Photos are
retained for X days after analysis, then deleted"). This is a product/legal
decision, not editorial — flag for Marco to decide, then update.

### 🟡 6. Sparse internal-link graph in existing blog posts

**Finding:** Random sample of 3 existing posts had an average of ~0.3
internal `/poopcheck-blog/*` links each. Healthy SEO sites have 3–5+ per
post. The new blog-writer agent now enforces 3–5 internal links + 1
back-link per run, so **new** posts will compound. **Old** posts won't
automatically get retrofitted.

**Recommendation:** one-off pass across the 13 existing posts to add 3–5
internal links each. Could be done in a single ~30-min session. Deferred —
not this pass.

### 🟡 7. No `BreadcrumbList` schema on category / tag / index pages

**Finding:** `breadcrumbSchema()` exists in `schema.ts` and the
`Breadcrumbs` component uses it on blog post pages, but the blog index page,
category pages, and tag pages don't inject `BreadcrumbList` JSON-LD.
Missed rich-snippet real estate.

**Recommendation:** one-line add in each of those three templates. Small
win — deferred for the focused scope of this pass.

## Informational — captured for context

### 🔵 8. Prefetch + static output are doing the heavy lifting on CWV

`prefetchAll: true` + `viewport` strategy in [astro.config.mjs](../astro.config.mjs)
+ fully static `output: 'static'` = great Core Web Vitals story out of the
box. No image-optimization pipeline configured, but blog posts currently
don't use raster images (SVG only — matches agent rules).

### 🔵 9. Schema functions available but under-injected

`schema.ts` exports `faqSchema()`, `serviceSchema()`, `breadcrumbSchema()`,
`websiteSchema()`, `organizationSchema()`. Most are used on at least one
page. FAQ schema is injected only on `/support/` — candidate for
re-injection on every blog post that has a FAQ section (the blog-writer
agent always ends posts with a FAQ). Deferred.

### 🔵 10. Blog layout hardcodes 1500-word reading-time estimate

[BlogLayout.astro](../src/layouts/BlogLayout.astro#L48-L50): `readingTime` is
computed from a hard-coded 1500 estimate, not actual content length. Minor.
Cosmetic. Not worth a fix unless refactoring that file for other reasons.

## Competitor alternatives — planning input for phase D

Based on the research agent's findings (real 2026 search-demand competitors),
the programmatic-writer agent (phase D) should prioritize these
`/compare/<slug>/` pages:

1. `poopcheck-vs-cara-care` — largest branded competitor, FODMAP audience
2. `poopcheck-vs-dieta-health` — AI-vs-AI, clinical-credibility angle
3. `poopcheck-vs-balloon` — #1 in "best poop tracker 2026" roundups
4. `poopcheck-vs-bowelle` — IBS-specific positioning
5. `poopcheck-vs-plop` — power-user / customization
6. `poopcheck-vs-mysymptoms` — manual diary vs AI photo

Category-level comparison pages worth building:
- `/compare/ai-stool-analysis-apps/` — category roundup, PoopCheck positioned as reference
- `/compare/poop-tracker-apps/` — broader consumer category

## Changelog

- **2026-04-20** — initial audit pass. Fixed P0 schema issues (aggregateRating,
  MobileApplication, MedicalWebPage). Deferred P1 items noted above.
