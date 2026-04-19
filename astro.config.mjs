// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://poopcheck.app',
  output: 'static',
  trailingSlash: 'always',

  redirects: {
    // Page-level redirects. Old Squarespace URLs are now real pages at the same paths
    // (/about-poopcheck, /ai-poop-analyzer, /ai-stool-analysis-technology, /faq,
    // /poopcheck-blog) to preserve SEO equity. Redirects below cover only paths
    // that don't have a 1:1 page in the new site.
    '/playground': '/demo/',
    '/track-your-health': '/features/poop-tracking/',
    '/privacy-policy': '/privacy/',
    '/contact-us': '/support/',
    '/cart': '/',

    // Internal-to-canonical: /about (removed) → /about-poopcheck (the SEO URL)
    '/about': '/about-poopcheck/',

    // Legacy /blog/ prefix → canonical /poopcheck-blog/ (root + any sub-slug)
    '/blog': '/poopcheck-blog/',
    '/blog/[...slug]': '/poopcheck-blog/[...slug]',

    // Old blog post with matching new content (different slug)
    '/poopcheck-blog/bristol-stool-chart-explained-your-guide-to-stool-health': '/poopcheck-blog/bristol-stool-chart-types-explained/',

    // Mucus in Stool — moved from gibberish Squarespace slug to clean slug
    '/poopcheck-blog/yzaivbi2a54j7jy72mcb852emg02vg': '/poopcheck-blog/mucus-in-stool/',

    // Old blog posts without ported equivalents → blog index (Big Breakfast + Bioengineered Probiotics skipped in migration)
    '/poopcheck-blog/how-a-big-breakfast-diet-boosts-appetite-control-and-gut-health': '/poopcheck-blog/',
    '/poopcheck-blog/bioengineered-probiotics-a-new-frontier-in-gut-health-and-diabetes-care': '/poopcheck-blog/',

    // Old category redirects → blog index
    '/poopcheck-blog/category/Bristol+Stool+Chart': '/poopcheck-blog/',
    '/poopcheck-blog/category/Diet+%26+Nutrition': '/poopcheck-blog/',
  },

  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: true,
    },
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  integrations: [
    mdx(),
    react(),
    sitemap({
      filter: (page) => !page.includes('/api/'),
      changefreq: 'weekly',
      priority: 0.7,
    }),
  ],

  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },

  adapter: cloudflare(),
});