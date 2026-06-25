import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// Estende lo schema di Starlight con i campi editoriali extra di FPV Italia
// (vedi CLAUDE.md / CONTRIBUTING.md). Tutti opzionali per non rompere le pagine
// generate da Starlight (index, ecc.).
export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        author: z.string().optional(),
        date: z.coerce.date().optional(),
        updated: z.coerce.date().optional(),
        tags: z.array(z.string()).optional(),
        category: z
          .enum(['guide', 'recensioni', 'normativa', 'dove-comprare'])
          .optional(),
        difficulty: z.enum(['principiante', 'intermedio', 'avanzato']).optional(),
        readingTime: z.number().optional(),
        image: z.string().optional(),
        // `ads: false` esclude la pagina dall'inserimento automatico AdSense
        // (vedi src/plugins/rehype-adsense.mjs). Default: annunci attivi.
        ads: z.boolean().optional(),
      }),
    }),
  }),
};
