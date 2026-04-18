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
    // Page-level redirects (old Squarespace → new Astro)
    '/playground': '/demo/',
    '/about-poopcheck': '/about/',
    '/ai-poop-analyzer': '/features/ai-stool-analysis/',
    '/ai-stool-analysis-technology': '/features/',
    '/faq': '/',
    '/track-your-health': '/features/poop-tracking/',
    '/privacy-policy': '/privacy/',
    '/contact-us': '/support/',
    '/cart': '/',

    // Blog prefix redirect
    '/poopcheck-blog': '/blog/',

    // Old blog post with matching new content (different slug)
    '/poopcheck-blog/bristol-stool-chart-explained-your-guide-to-stool-health': '/blog/bristol-stool-chart-types-explained/',

    // Old blog posts without new equivalents → blog index
    '/poopcheck-blog/long-term-capsaicin-intake-effects-on-gut-health-and-inflammation-2': '/blog/',
    '/poopcheck-blog/top-fermented-beverages-to-enhance-your-gut-health-naturally': '/blog/',
    '/poopcheck-blog/how-green-stool-in-infants-predicts-future-bowel-health-insights': '/blog/',
    '/poopcheck-blog/how-a-big-breakfast-diet-boosts-appetite-control-and-gut-health': '/blog/',
    '/poopcheck-blog/bioengineered-probiotics-a-new-frontier-in-gut-health-and-diabetes-care': '/blog/',
    '/poopcheck-blog/do-i-have-colon-cancer': '/blog/',
    '/poopcheck-blog/how-often-should-you-poop-3-shocking-facts-you-need-to-know': '/blog/',
    '/poopcheck-blog/why-is-my-poop-green-decoding-the-secret-language-of-your-stool': '/blog/',
    '/poopcheck-blog/ibs-plague-of-the-millenium': '/blog/',

    // Old category redirects → blog index
    '/poopcheck-blog/category/Bristol+Stool+Chart': '/blog/',
    '/poopcheck-blog/category/Diet+%26+Nutrition': '/blog/',
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

  integrations: [mdx(), react(), sitemap()],

  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },

  adapter: cloudflare(),
});