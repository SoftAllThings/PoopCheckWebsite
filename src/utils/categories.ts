/**
 * Blog taxonomy — the one place category slugs, labels and copy are defined.
 *
 * Previously this list was duplicated in four places (the zod enum in
 * content.config.ts, the category route's getStaticPaths, CategoryFilter and
 * BlogLayout), which is how `app-updates` ended up shipping an indexed page
 * with zero posts on it.
 *
 * Tags used to be a second taxonomy. They generated 198 indexed pages — 157 of
 * them listing a single post — and earned zero clicks in three months, so tag
 * pages were removed. `tags` survives in post frontmatter as metadata only.
 */

export const CATEGORY_LABELS = {
  'gut-health': 'Gut Health',
  'stool-analysis': 'Stool Analysis',
  'bristol-stool-scale': 'Bristol Stool Scale',
  nutrition: 'Nutrition',
  conditions: 'Conditions',
  'app-updates': 'App Updates',
  research: 'Research',
} as const;

export type CategorySlug = keyof typeof CATEGORY_LABELS;

/** Non-empty tuple so `z.enum()` accepts it in content.config.ts. */
export const CATEGORY_SLUGS = Object.keys(CATEGORY_LABELS) as [CategorySlug, ...CategorySlug[]];

export const CATEGORY_DESCRIPTIONS: Record<CategorySlug, string> = {
  'gut-health':
    'Evidence-based articles on improving gut health, supporting your microbiome, and building digestive resilience — from the PoopCheck team.',
  'stool-analysis':
    'Stool color, shape, consistency, and what they reveal about your digestive health. Expert stool analysis articles from PoopCheck.',
  'bristol-stool-scale':
    'Master the Bristol Stool Scale (Types 1–7). Learn what each type means and track your digestive health with PoopCheck.',
  nutrition:
    'How diet, fermented foods, fiber, and spices shape your gut. Nutrition-focused digestive health articles from PoopCheck.',
  conditions:
    'IBS, colon cancer, hemorrhoids, and other digestive conditions — symptoms, causes, and when to see a doctor. From PoopCheck.',
  'app-updates':
    'The latest PoopCheck app updates, new features, and release notes for our AI stool analyzer.',
  research:
    'Emerging research on the gut microbiome, digestion, and stool analysis — breaking down the latest science for everyday health.',
};

export const categoryLabel = (slug: string): string =>
  CATEGORY_LABELS[slug as CategorySlug] ?? slug;

/**
 * Categories that actually have at least one published post.
 *
 * Both the route and the filter derive from this, so an empty category can
 * never again be generated, linked or submitted to the sitemap.
 */
export function categoriesWithPosts(
  posts: Array<{ data: { category: string; draft?: boolean } }>
): CategorySlug[] {
  const live = new Set(posts.filter((p) => !p.data.draft).map((p) => p.data.category));
  return CATEGORY_SLUGS.filter((slug) => live.has(slug));
}
