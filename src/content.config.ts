import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const kampo = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kampo' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    affiliateNote: z.string().optional(),
  }),
});

const otc = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/otc' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    affiliateNote: z.string().optional(),
  }),
});

const study = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/study' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    affiliateNote: z.string().optional(),
  }),
});

export const collections = { kampo, otc, study };
