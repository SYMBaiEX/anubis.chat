'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('user-actions');

// User profile update schema
const updateProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(50, 'Display name too long'),
  avatar: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
});

type UpdateProfileData = z.infer<typeof updateProfileSchema>;

/**
 * Server Action to update user profile
 * Uses Zod validation and proper error handling
 */
export async function updateUserProfile(formData: FormData) {
  try {
    // Extract and validate form data
    const rawData = {
      displayName: formData.get('displayName') as string,
      avatar: formData.get('avatar') as string,
      email: formData.get('email') as string,
      bio: formData.get('bio') as string,
    };

    const validatedData = updateProfileSchema.parse(rawData);
    
    log.info('Updating user profile', {
      operation: 'update_profile',
      displayName: validatedData.displayName,
      hasAvatar: Boolean(validatedData.avatar),
    });

    // TODO: Replace with actual Convex mutation call
    // await convex.mutation(api.users.updateProfile, validatedData);
    
    // Simulate async operation for now
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Revalidate the profile page
    revalidatePath('/account');
    revalidatePath('/dashboard');
    
    return {
      success: true,
      message: 'Profile updated successfully',
    };
  } catch (error) {
    log.error('Failed to update user profile', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      operation: 'update_profile',
    });

    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
        message: 'Please check your input and try again',
      };
    }

    return {
      success: false,
      message: 'Failed to update profile. Please try again.',
    };
  }
}

// User settings update schema
const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.string().min(2).max(5),
  timezone: z.string().min(1),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    marketing: z.boolean(),
  }),
});

/**
 * Server Action to update user settings
 */
export async function updateUserSettings(formData: FormData) {
  try {
    const rawData = {
      theme: formData.get('theme') as string,
      language: formData.get('language') as string,
      timezone: formData.get('timezone') as string,
      notifications: {
        email: formData.get('notifications.email') === 'on',
        push: formData.get('notifications.push') === 'on',
        marketing: formData.get('notifications.marketing') === 'on',
      },
    };

    const validatedData = updateSettingsSchema.parse(rawData);
    
    log.info('Updating user settings', {
      operation: 'update_settings',
      theme: validatedData.theme,
      language: validatedData.language,
    });

    // TODO: Replace with actual Convex mutation call
    // await convex.mutation(api.users.updateSettings, validatedData);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    revalidatePath('/settings');
    
    return {
      success: true,
      message: 'Settings updated successfully',
    };
  } catch (error) {
    log.error('Failed to update user settings', {
      error: error instanceof Error ? error.message : String(error),
      operation: 'update_settings',
    });

    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
        message: 'Please check your input and try again',
      };
    }

    return {
      success: false,
      message: 'Failed to update settings. Please try again.',
    };
  }
}

/**
 * Server Action to delete user account
 */
export async function deleteUserAccount(formData: FormData) {
  try {
    const confirmation = formData.get('confirmation') as string;
    
    if (confirmation !== 'DELETE') {
      return {
        success: false,
        message: 'Please type "DELETE" to confirm account deletion',
      };
    }
    
    log.warn('User account deletion requested', {
      operation: 'delete_account',
    });

    // TODO: Replace with actual Convex mutation call
    // await convex.mutation(api.users.deleteAccount, {});
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Clear all user data and redirect
    revalidatePath('/', 'layout');
    redirect('/');
  } catch (error) {
    log.error('Failed to delete user account', {
      error: error instanceof Error ? error.message : String(error),
      operation: 'delete_account',
    });

    return {
      success: false,
      message: 'Failed to delete account. Please try again.',
    };
  }
}