import { defineCollection, defineContentConfig, z } from '@nuxt/content'

/**
 * Worksheet content schema.
 *
 * Each worksheet is a markdown file under content/worksheets/<ageBand>/<slug>.md
 * with frontmatter describing the worksheet type and its play data.
 *
 * Adding a new worksheet:
 *   1. Pick a worksheet `type` (matches a runtime component, e.g. "color")
 *   2. Add the play data to frontmatter `data` (shape varies per type)
 *   3. Drop a markdown file into the matching ageBand folder
 */
export default defineContentConfig({
  collections: {
    worksheets: defineCollection({
      type: 'page',
      source: 'worksheets/**/*.md',
      schema: z.object({
        title: z.object({
          en: z.string(),
          id: z.string(),
        }),
        type: z.enum(['color', 'sequence', 'move', 'maze', 'loop']),
        ageBand: z.enum(['paud', 'sd-low', 'sd-high']),
        concept: z.string(),
        order: z.number().default(0),
        locales: z.array(z.enum(['en', 'id'])).default(['en', 'id']),
        accent: z.string().optional(),
        // Type-specific play data. Validated at runtime per worksheet component.
        data: z.record(z.string(), z.any()),
      }),
    }),
  },
})
