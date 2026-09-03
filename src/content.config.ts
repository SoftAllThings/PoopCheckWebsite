import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORY_SLUGS } from './utils/categories';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    author: z.string().default('PoopCheck Team'),
    category: z.enum(CATEGORY_SLUGS),
    // Metadata only — tag pages were removed (198 indexed URLs, zero clicks).
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    toc: z.boolean().default(true),
  }),
});

export const collections = { blog, guides };
