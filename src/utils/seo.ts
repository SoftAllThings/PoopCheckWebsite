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
  noindex?: boolean;
}

export const SITE = {
  name: 'PoopCheck',
  tagline: 'AI Stool Tracker',
  description:
    'Understand your gut in seconds. AI-powered stool analysis, daily gut health score, and personalized insights. Join 25,000+ users tracking their digestive health.',
  url: 'https://poopcheck.app',
  image: '/og-default.svg',
  locale: 'en_US',
  appStore: 'https://apps.apple.com/us/app/poopcheck-ai-stool-tracker/id6737857695',
  playStore:
    'https://play.google.com/store/apps/details?id=com.softallthings.poopcheckapp',
};

// Canonical numbers used across marketing copy. Live counts are hydrated
// client-side from getPublicStats; these are the static fallbacks/baseline.
export const STATS = {
  users: { short: '25K+', long: '25,000+' },
  analyses: { short: '140K+', long: '140,000+' },
  reviews: { short: '2.4K+', long: '2,400+' },
  rating: '4.8',
};

export function formatTitle(pageTitle?: string): string {
  if (!pageTitle) return `${SITE.name}: ${SITE.tagline}`;
  return `${pageTitle} | ${SITE.name}`;
}

export function getCanonicalUrl(path: string): string {
  const base = SITE.url.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const withTrailing = cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`;
  return `${base}${withTrailing}`;
}
