// Store links tagged with the page that sent the visitor, so downloads can be
// traced back to it:
// - App Store: App Store Connect → Analytics → Acquisition → Campaigns (`ct`).
//   Apple hides campaigns with few downloads, so iOS is tagged per section.
// - Google Play: the install referrer's utm_campaign, which Firebase records as
//   traffic_source.name on first_open (BigQuery, no threshold), tagged per page.
// Kept free of imports: the /download page bundles it into client JS.

export const APP_STORE_ID = '6737857695';
const PLAY_PACKAGE = 'com.softallthings.poopcheckapp';

/** App Store Connect provider ID; Apple ignores `ct` without it. */
const APP_STORE_PROVIDER_TOKEN = '127430953';

/** App Store Connect caps campaign tokens at 40 characters. */
const MAX_CAMPAIGN_LENGTH = 40;

/** First path segment → iOS campaign section. Anything unlisted is 'other'. */
const SECTIONS: Record<string, string> = {
  '': 'home',
  'poopcheck-blog': 'blog',
  guides: 'guides',
  bristol: 'charts',
  'poop-color-chart': 'charts',
  'baby-poop-color-chart': 'charts',
  'poop-pictures': 'charts',
  'high-fiber-foods-chart': 'charts',
  'low-fodmap-food-list': 'charts',
  data: 'charts',
  tools: 'tools',
  compare: 'compare',
  download: 'download',
};

function segments(pathname: string): string[] {
  return pathname.split('/').filter(Boolean);
}

/** '/' → 'web-home', '/poopcheck-blog/green-poop/' → 'web-blog-green-poop'. */
export function pageCampaign(pathname: string): string {
  const slug = segments(pathname)
    .join('-')
    .replace(/^poopcheck-blog/, 'blog')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
  return `web-${slug || 'home'}`.slice(0, MAX_CAMPAIGN_LENGTH).replace(/-+$/, '');
}

/** '/poopcheck-blog/green-poop/' → 'web-blog', '/bristol/type-4/' → 'web-charts'. */
export function sectionCampaign(pathname: string): string {
  return `web-${SECTIONS[segments(pathname)[0] ?? ''] ?? 'other'}`;
}

/** App Store link credited to the section of the page at `pathname`. */
export function appStoreUrl(pathname: string): string {
  const params = new URLSearchParams({
    pt: APP_STORE_PROVIDER_TOKEN,
    ct: sectionCampaign(pathname),
    mt: '8',
  });
  return `https://apps.apple.com/app/apple-store/id${APP_STORE_ID}?${params}`;
}

/** Google Play link credited to the page at `pathname`. */
export function playStoreUrl(pathname: string): string {
  const referrer = new URLSearchParams({
    utm_source: 'poopcheck.app',
    utm_medium: 'website',
    utm_campaign: pageCampaign(pathname),
  });
  const params = new URLSearchParams({ id: PLAY_PACKAGE, referrer: referrer.toString() });
  return `https://play.google.com/store/apps/details?${params}`;
}
