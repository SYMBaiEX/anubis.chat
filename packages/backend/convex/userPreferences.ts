/**
 * User preferences queries and mutations
 * Handles interface settings that sync across devices
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getCurrentUser, requireAuth } from './authHelpers';

// Get user preferences
export const getUserPreferences = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const preferences = await ctx.db
      .query('userPreferences')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    return preferences;
  },
});

// Create or update user preferences
export const updateUserPreferences = mutation({
  args: {
    // Interface Settings
    theme: v.optional(
      v.union(v.literal('light'), v.literal('dark'), v.literal('system'))
    ),
    language: v.optional(v.string()),
    soundEnabled: v.optional(v.boolean()),
    autoScroll: v.optional(v.boolean()),

    // Behavior Settings
    streamResponses: v.optional(v.boolean()),
    saveHistory: v.optional(v.boolean()),
    enableMemory: v.optional(v.boolean()),
    responseFormat: v.optional(
      v.union(v.literal('text'), v.literal('markdown'), v.literal('json'))
    ),

    // Model Preferences (defaults for new chats)
    defaultModel: v.optional(v.string()),
    defaultTemperature: v.optional(v.number()),
    defaultMaxTokens: v.optional(v.number()),
    defaultTopP: v.optional(v.number()),
    defaultFrequencyPenalty: v.optional(v.number()),
    defaultPresencePenalty: v.optional(v.number()),

    // Chat Preferences
    contextWindow: v.optional(v.number()),

    // Notification Settings
    emailNotifications: v.optional(v.boolean()),
    pushNotifications: v.optional(v.boolean()),

    // Privacy Settings
    dataCollection: v.optional(v.boolean()),
    analytics: v.optional(v.boolean()),

    // Accessibility Settings
    reducedMotion: v.optional(v.boolean()),
    highContrast: v.optional(v.boolean()),
    fontSize: v.optional(
      v.union(v.literal('small'), v.literal('medium'), v.literal('large'))
    ),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    // Check if preferences already exist
    const existingPreferences = await ctx.db
      .query('userPreferences')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    const updates: any = {
      userId: user._id,
      updatedAt: Date.now(),
    };

    // Add all provided settings
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined) {
        updates[key] = value;
      }
    });

    if (existingPreferences) {
      // Update existing preferences
      await ctx.db.patch(existingPreferences._id, updates);
      return await ctx.db.get(existingPreferences._id);
    }
    // Create new preferences with defaults
    const newPreferences = {
      ...updates,
      // Set sensible defaults for new users
      theme: updates.theme ?? 'system',
      language: updates.language ?? 'en',
      soundEnabled: updates.soundEnabled ?? true,
      autoScroll: updates.autoScroll ?? true,
      streamResponses: updates.streamResponses ?? true,
      saveHistory: updates.saveHistory ?? true,
      enableMemory: updates.enableMemory ?? true,
      responseFormat: updates.responseFormat ?? 'markdown',
      contextWindow: updates.contextWindow ?? 10,
      emailNotifications: updates.emailNotifications ?? false,
      pushNotifications: updates.pushNotifications ?? true,
      dataCollection: updates.dataCollection ?? true,
      analytics: updates.analytics ?? true,
      reducedMotion: updates.reducedMotion ?? false,
      highContrast: updates.highContrast ?? false,
      fontSize: updates.fontSize ?? 'medium',
      createdAt: Date.now(),
    };

    const preferencesId = await ctx.db.insert(
      'userPreferences',
      newPreferences
    );
    return await ctx.db.get(preferencesId);
  },
});

// Reset user preferences to defaults
export const resetUserPreferences = mutation({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireAuth(ctx);

    const existingPreferences = await ctx.db
      .query('userPreferences')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    const defaultPreferences = {
      userId: user._id,
      theme: 'system' as const,
      language: 'en',
      soundEnabled: true,
      autoScroll: true,
      streamResponses: true,
      saveHistory: true,
      enableMemory: true,
      responseFormat: 'markdown' as const,
      contextWindow: 10,
      emailNotifications: false,
      pushNotifications: true,
      dataCollection: true,
      analytics: true,
      reducedMotion: false,
      highContrast: false,
      fontSize: 'medium' as const,
      updatedAt: Date.now(),
    };

    if (existingPreferences) {
      await ctx.db.patch(existingPreferences._id, {
        ...defaultPreferences,
        createdAt: existingPreferences.createdAt,
      });
      return await ctx.db.get(existingPreferences._id);
    }
    const preferencesId = await ctx.db.insert('userPreferences', {
      ...defaultPreferences,
      createdAt: Date.now(),
    });
    return await ctx.db.get(preferencesId);
  },
});

// Get user preferences with fallbacks to defaults
export const getUserPreferencesWithDefaults = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      // Return defaults for non-authenticated users
      return {
        theme: 'system' as const,
        language: 'en',
        soundEnabled: true,
        autoScroll: true,
        streamResponses: true,
        saveHistory: true,
        enableMemory: true,
        responseFormat: 'markdown' as const,
        contextWindow: 10,
        emailNotifications: false,
        pushNotifications: true,
        dataCollection: true,
        analytics: true,
        reducedMotion: false,
        highContrast: false,
        fontSize: 'medium' as const,
      };
    }

    const preferences = await ctx.db
      .query('userPreferences')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (!preferences) {
      // Return defaults for users without preferences
      return {
        theme: 'system' as const,
        language: 'en',
        soundEnabled: true,
        autoScroll: true,
        streamResponses: true,
        saveHistory: true,
        enableMemory: true,
        responseFormat: 'markdown' as const,
        contextWindow: 10,
        emailNotifications: false,
        pushNotifications: true,
        dataCollection: true,
        analytics: true,
        reducedMotion: false,
        highContrast: false,
        fontSize: 'medium' as const,
      };
    }

    return preferences;
  },
});

// Bulk update multiple preference categories
export const updatePreferenceCategory = mutation({
  args: {
    category: v.union(
      v.literal('interface'),
      v.literal('behavior'),
      v.literal('model'),
      v.literal('privacy')
    ),
    preferences: v.any(), // We'll validate this based on category
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    const validatedPreferences: any = {};

    switch (args.category) {
      case 'interface':
        if (args.preferences.theme)
          validatedPreferences.theme = args.preferences.theme;
        if (args.preferences.language)
          validatedPreferences.language = args.preferences.language;
        if (args.preferences.soundEnabled !== undefined)
          validatedPreferences.soundEnabled = args.preferences.soundEnabled;
        if (args.preferences.autoScroll !== undefined)
          validatedPreferences.autoScroll = args.preferences.autoScroll;
        if (args.preferences.fontSize)
          validatedPreferences.fontSize = args.preferences.fontSize;
        if (args.preferences.reducedMotion !== undefined)
          validatedPreferences.reducedMotion = args.preferences.reducedMotion;
        if (args.preferences.highContrast !== undefined)
          validatedPreferences.highContrast = args.preferences.highContrast;
        break;

      case 'behavior':
        if (args.preferences.streamResponses !== undefined)
          validatedPreferences.streamResponses =
            args.preferences.streamResponses;
        if (args.preferences.saveHistory !== undefined)
          validatedPreferences.saveHistory = args.preferences.saveHistory;
        if (args.preferences.enableMemory !== undefined)
          validatedPreferences.enableMemory = args.preferences.enableMemory;
        if (args.preferences.responseFormat)
          validatedPreferences.responseFormat = args.preferences.responseFormat;
        if (args.preferences.contextWindow)
          validatedPreferences.contextWindow = args.preferences.contextWindow;
        break;

      case 'model':
        if (args.preferences.defaultModel)
          validatedPreferences.defaultModel = args.preferences.defaultModel;
        if (args.preferences.defaultTemperature !== undefined)
          validatedPreferences.defaultTemperature =
            args.preferences.defaultTemperature;
        if (args.preferences.defaultMaxTokens)
          validatedPreferences.defaultMaxTokens =
            args.preferences.defaultMaxTokens;
        if (args.preferences.defaultTopP !== undefined)
          validatedPreferences.defaultTopP = args.preferences.defaultTopP;
        if (args.preferences.defaultFrequencyPenalty !== undefined)
          validatedPreferences.defaultFrequencyPenalty =
            args.preferences.defaultFrequencyPenalty;
        if (args.preferences.defaultPresencePenalty !== undefined)
          validatedPreferences.defaultPresencePenalty =
            args.preferences.defaultPresencePenalty;
        break;

      case 'privacy':
        if (args.preferences.emailNotifications !== undefined)
          validatedPreferences.emailNotifications =
            args.preferences.emailNotifications;
        if (args.preferences.pushNotifications !== undefined)
          validatedPreferences.pushNotifications =
            args.preferences.pushNotifications;
        if (args.preferences.dataCollection !== undefined)
          validatedPreferences.dataCollection = args.preferences.dataCollection;
        if (args.preferences.analytics !== undefined)
          validatedPreferences.analytics = args.preferences.analytics;
        break;
    }

    if (Object.keys(validatedPreferences).length === 0) {
      throw new Error(
        'No valid preferences provided for the specified category'
      );
    }

    // Use internal call instead of api reference
    const existingPreferences = await ctx.db
      .query('userPreferences')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    const updates: any = {
      userId: user._id,
      updatedAt: Date.now(),
      ...validatedPreferences,
    };

    if (existingPreferences) {
      await ctx.db.patch(existingPreferences._id, updates);
      return await ctx.db.get(existingPreferences._id);
    }
    const preferencesId = await ctx.db.insert('userPreferences', {
      ...updates,
      createdAt: Date.now(),
    });
    return await ctx.db.get(preferencesId);
  },
});
