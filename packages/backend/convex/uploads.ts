import { action } from './_generated/server';
import { v } from 'convex/values';
import { requireAuthAction } from './authHelpers';

export const signUpload = action({
  args: {
    contentType: v.string(),
  },
  handler: async (ctx, { contentType }) => {
    // Ensure caller is authenticated
    await requireAuthAction(ctx);

    // Basic allowlist for images; extend as needed
    const allowed = /^(image\/(png|jpeg|jpg|gif|webp))$/i;
    if (!allowed.test(contentType)) {
      throw new Error('Unsupported content type');
    }

    const url = await ctx.storage.generateUploadUrl();
    return { url } as const;
  },
});


