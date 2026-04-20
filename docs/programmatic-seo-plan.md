# Programmatic SEO plan (future work)

> **Status:** Idea parking, not an active workstream.
> Revisit after the 1/day blog agent has 2+ weeks of stable output and some signal from Google Search Console.

## Context

An external SEO recommendation suggested "10k pages in 1 month." That specific shape is
wrong for poopcheck.app for three reasons:

1. **YMYL (Your Money or Your Life)** content has a much higher quality bar in Google's
   guidelines. AI-written medical content without clear expert review is aggressively
   demoted.
2. **Google's "Scaled Content Abuse" policy** (March 2024, expanded 2025) explicitly
   targets high-volume, low-value pages — AI-written blog posts at that volume hit it
   squarely.
3. **Topic exhaustion.** "Gut health" isn't a 10k-unique-query space. After ~200
   genuine intent-backed topics, we'd be generating near-duplicates that cannibalize
   each other in SERPs.

**What actually scales to thousands of pages** is programmatic SEO where *each page is
backed by unique structured data*. Think G2's product reviews, Zapier's integration
pages, SimilarWeb's stats pages. Same template, different data. That's a legitimately
indexable footprint.

## Candidate page formats for PoopCheck

All of these could scale to hundreds or thousands of pages with real data behind them.
Order roughly reflects effort vs payoff — top = highest-leverage first.

### 1. `/bristol/type-[1..7]/` — seven deep pages

- Not thousands, but **cornerstone** pages. One per Bristol type.
- Each covers: description, causes, fixes, when to see a doctor, food associations,
  related conditions, sample 3-day plans.
- Highly targeted, highly searchable, link magnet for the blog posts to funnel into.
- **Priority: do this first.** Seven pages. Huge SEO return per page.

### 2. `/foods/[food]/effect-on-stool/`

- One page per common food (fiber content, FODMAP category, effects on stool
  consistency, color, smell, transit time).
- Data source: USDA FoodData Central (public API) + Monash FODMAP (licensed or
  equivalent open dataset) + internal mapping of effects.
- Could be ~500–2,000 pages of real, differentiated content.
- Template: same JSX layout, different data injection.

### 3. `/symptom/[symptom]/` × `/symptom/[symptom]/with-[stool-type]/`

- Common symptoms × Bristol types. "Diarrhea + mucus", "constipation + blood",
  "gas + floating stool", etc.
- Decision-tree-style content: likely causes, red flags, when to see a doctor.
- **High YMYL risk.** Must be reviewed by a medical professional or clearly sourced
  from clinical guidelines (Mayo, Cleveland Clinic, NIH). Do NOT launch without
  expert review.
- Real data: symptom clustering from medical literature.

### 4. `/ingredient/[ingredient]/fodmap-profile/`

- One page per FODMAP-relevant ingredient. Monash-style breakdown.
- Data: Monash (licensed) or open FODMAP datasets.
- Audience: IBS sufferers doing active elimination-diet planning.
- ~300–500 pages possible.

### 5. `/condition/[condition]/gut-health-guide/`

- IBS, IBD, Crohn's, UC, celiac, SIBO, GERD, gastritis, gastroparesis, functional
  dyspepsia, etc. Maybe 20–40 conditions.
- Each: definition, typical stool presentation, diet implications, typical workup,
  when PoopCheck tracking can help.
- **High YMYL risk** — must be sourced from clinical guidelines and ideally reviewed.

### 6. User/app-derived insights (the long-term moat)

- Anonymized aggregate stats from PoopCheck's 80k users.
- Examples: "Average Bristol distribution by age", "Fiber intake vs stool consistency
  in tracked users", "Most improved gut-health-score habits last 30 days".
- **100% unique**. Not scrapable. Google loves it. Competitors can't replicate.
- Requires privacy-safe aggregation pipeline (likely in
  `/Users/fab/Desktop/poopcheck/functions/src/stats` — reuse what's there).
- **Highest long-term defensibility.** Plan this seriously before it ever ships.

## Architecture sketch

### Separate from the blog agent

Programmatic pages are **not** MDX blog posts — they're dynamic Astro routes backed by
data files or APIs:

```
src/pages/
  foods/
    [food]/
      effect-on-stool.astro   ← one template, static-generated per food
  bristol/
    type-[type].astro
  symptom/
    [symptom]/
      index.astro
      with-[stool].astro
  ingredient/
    [ingredient]/
      fodmap-profile.astro
```

Each template calls `getStaticPaths()` against a data source:

- `src/data/foods.json` (from USDA FDC + internal)
- `src/data/fodmap.json`
- `src/data/symptoms.json`
- `src/data/conditions.json`

Astro's content collections + `getStaticPaths` already handle this pattern natively.
Static output = no runtime cost, fast deploys, easy caching.

### Data pipeline

One-time or periodic script that fetches from sources, normalizes, writes JSON:

```
scripts/
  fetch-usda-foods.mjs       ← pulls USDA FDC nutrient data
  build-food-effects.mjs     ← joins USDA + internal mapping → src/data/foods.json
  build-fodmap.mjs
  build-conditions.mjs
```

These run on demand (or via a weekly GH Actions cron) — separate from the daily blog
agent. Changes to source data → re-commit the JSON → CI redeploys.

### Claude involvement (limited, targeted)

- **Not** generating page content per-page at build time. That's the AI-spam pattern.
- **Yes** for:
  - Initial data curation and mapping (e.g., "for each food in USDA, what's the
    expected stool effect?") — one-off enrichment, human-reviewed.
  - Page copy boilerplate (intro/outro paragraphs for the template).
  - Review and flag ambiguous medical statements.
- Each generated page should have **more data than prose**. Tables, gradings,
  citations, icons. Not paragraphs of AI text.

## SEO requirements per format

All programmatic pages must:

- Have **unique H1 and meta description** derived from the data, not a template
  string with substitution. (Use at least 2 data points in the description.)
- Cite sources with real links (USDA, Monash, PubMed). Embed in-page and in JSON-LD.
- Carry the same `SEO.astro` infrastructure already in use for blog posts.
- Use `Article` or `MedicalWebPage` JSON-LD (the latter signals YMYL legitimacy).
- Include **human-review metadata** when the content touches clinical advice
  (reviewer name, credentials, date) — ideally a real medical professional before
  launching condition/symptom pages.
- Internally link to and from related blog posts. This is the SEO compound-interest
  mechanism.

## Risks and stop conditions

- **Don't launch condition/symptom pages without medical review.** YMYL. Full stop.
- **Monitor indexation rate in GSC.** If Google indexes <30% of a batch after 4 weeks,
  the pattern is being classified as thin. Pause, improve, relaunch.
- **Don't noindex your way out.** If you feel the need to noindex 80% of a batch,
  the batch shouldn't have been built.
- **Watch for manual actions** in GSC → Security & Manual Actions. Any "Thin content"
  or "Scaled content abuse" flag = stop, don't just bargain.

## Dependencies before starting

1. 1/day blog agent proven stable for ≥2 weeks with no indexation issues.
2. Access to (or budget for) Monash FODMAP dataset if that format is prioritized.
3. A named medical reviewer (in-house or contracted) for YMYL pages.
4. Data pipeline scripts written and tested locally before any programmatic page ships.

## What NOT to do

- Generate 10k AI-written blog-style posts. Will tank the site.
- Spin up tag/category pages with no content behind them. Google treats those as thin.
- Auto-publish YMYL content without a human medical review gate.
- Use the existing blog-writer agent for any of this — it's wrong for the job.

## Next step when revisiting

Start with #1 (Bristol type cornerstone pages — 7 deep pages, highest ratio of
SEO value to effort and risk). Ship those, watch GSC for a month, then decide if
formats #2–#6 are worth building.
