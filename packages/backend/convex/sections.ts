import { query } from './_generated/server';

export const counts = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('posts').collect();
    const map: Record<string, number> = {};
    for (const p of all) {
      const key = p.section as string;
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  },
});


