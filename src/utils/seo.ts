import generated from '../data/generated-images.json';

export interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  /** Keep the page out of the index. Links are still followed unless `nofollow`. */
  noindex?: boolean;
  /** Only set alongside `noindex` when link equity should NOT flow onward. */
  nofollow?: boolean;
}

export const SITE = {
  name: 'PoopCheck',
  tagline: 'AI Stool Tracker',
  description:
    'Understand your gut in seconds. AI-powered stool analysis, daily gut health score, and personalized insights. Join 25,000+ users tracking their digestive health.',
  url: 'https://poopcheck.app',
  // Must be a raster: Facebook, X, LinkedIn and iMessage all refuse to render
  // SVG in og:image, which left every share as a blank card.
  image: '/images/og/default.png',
  imageWidth: 1200,
  imageHeight: 630,
  logo: '/images/logo/poopcheck-logo.png',
  locale: 'en_US',
  appStore: 'https://apps.apple.com/us/app/poopcheck-ai-stool-tracker/id6737857695',
  playStore:
    'https://play.google.com/store/apps/details?id=com.softallthings.poopcheckapp',
};

// Canonical numbers used across marketing copy. Live counts are hydrated
// client-side from getPublicStats; these are the static fallbacks/baseline.
export const STATS = {
  users: { short: '25K+', long: '25,000+' },
  analyses: { short: '180K+', long: '180,000+' },
  reviews: { short: '2.4K+', long: '2,400+' },
  rating: '4.8',
};

export function formatTitle(pageTitle?: string): string {
  if (!pageTitle) return `${SITE.name}: ${SITE.tagline}`;
  return `${pageTitle} | ${SITE.name}`;
}

/**
 * Every post and guide gets a generated 1200x630 card at a predictable path
 * (see scripts/generate-images.mjs). Resolving by slug rather than requiring
 * `image:` frontmatter means new posts are never published imageless — which
 * previously left all 52 of them with no hero, no social card, and no
 * `image` property in their Article schema.
 *
 * The manifest guards the case where a post is committed before `npm run images`
 * has run for it: rather than emitting a broken <img>, we fall back to the site
 * card. Run `npm run images` after adding a post to give it its own.
 */
export function postImage(slug: string, explicit?: string): string {
  if (explicit) return explicit;
  return generated.blog.includes(slug) ? `/images/og/blog/${slug}.png` : SITE.image;
}

export function guideImage(slug: string, explicit?: string): string {
  if (explicit) return explicit;
  return generated.guides.includes(slug) ? `/images/og/guides/${slug}.png` : SITE.image;
}

export function getCanonicalUrl(path: string): string {
  const base = SITE.url.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const withTrailing = cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`;
  return `${base}${withTrailing}`;
}
