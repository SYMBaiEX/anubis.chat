'use client';

import { Bell, Palette, Settings, User, Wallet } from 'lucide-react';
import { useState } from 'react';
import { FormWrapper } from '@/components/forms/form-wrapper';
import { ValidatedInput } from '@/components/forms/validated-input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UserProfileProps } from '@/lib/types/components';
import { cn } from '@/lib/utils';
import { createModuleLogger } from '@/lib/utils/logger';
import { SubscriptionStatus } from './subscription-status';

// Initialize logger
const log = createModuleLogger('user-profile');

/**
 * UserProfile component - Display and edit user profile information
 * Includes wallet info, preferences, and subscription details
 */
export function UserProfile({
  user,
  onUpdate,
  editable = true,
  className,
  children,
}: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const handleProfileUpdate = async (data: any) => {
    try {
      await onUpdate?.(data);
      setIsEditing(false);
      log.info('Profile updated successfully', {
        operation: 'profile_update',
      });
    } catch (error) {
      log.error('Failed to update profile', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        operation: 'profile_update',
      });
      // Handle error (show toast, etc.)
    }
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getSubscriptionTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'pro':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      content: (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar
              fallback={user.displayName?.[0] ?? 'U'}
              size="xl"
              src={user.avatar}
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg dark:text-gray-100">
                {user.displayName ?? 'Anonymous User'}
              </h3>
              <p className="text-gray-600 text-sm dark:text-gray-400">
                {formatWalletAddress(user.walletAddress)}
              </p>
              <div className="mt-2 flex items-center space-x-2">
                <Badge
                  size="sm"
                  variant={user.isActive ? 'success' : 'default'}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge
                  className={getSubscriptionTierColor(user.subscription.tier)}
                  size="sm"
                >
                  {user.subscription.tier.charAt(0).toUpperCase() +
                    user.subscription.tier.slice(1)}
                </Badge>
              </div>
            </div>
            {editable && (
              <Button
                onClick={() => setIsEditing(!isEditing)}
                size="sm"
                variant="outline"
              >
                <Settings className="mr-2 h-4 w-4" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            )}
          </div>

          {isEditing ? (
            <FormWrapper
              defaultValues={{
                displayName: user.displayName ?? '',
                avatar: user.avatar ?? '',
              }}
              onSubmit={handleProfileUpdate}
            >
              <div className="space-y-4">
                <ValidatedInput
                  label="Display Name"
                  name="displayName"
                  placeholder="Enter your display name"
                />
                <ValidatedInput
                  label="Avatar URL"
                  name="avatar"
                  placeholder="https://example.com/avatar.png"
                  type="url"
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => setIsEditing(false)}
                    type="button"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </div>
            </FormWrapper>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <Wallet className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Wallet Address
                    </h4>
                    <p className="font-mono text-gray-600 text-sm dark:text-gray-400">
                      {user.walletAddress}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Account Created
                    </h4>
                    <p className="text-gray-600 text-sm dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'preferences',
      label: 'Preferences',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <Palette className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Theme
                  </h4>
                  <p className="text-gray-600 text-sm dark:text-gray-400">
                    {user.preferences.theme.charAt(0).toUpperCase() +
                      user.preferences.theme.slice(1)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Notifications
                  </h4>
                  <p className="text-gray-600 text-sm dark:text-gray-400">
                    {user.preferences.notifications ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <h4 className="mb-2 font-medium text-gray-900 dark:text-gray-100">
              AI Model Preference
            </h4>
            <p className="text-gray-600 text-sm dark:text-gray-400">
              {user.preferences.aiModel}
            </p>
          </Card>
        </div>
      ),
    },
    {
      id: 'subscription',
      label: 'Subscription',
      content: (
        <SubscriptionStatus
          showUpgrade={user.subscription.tier === 'free'}
          subscription={user.subscription}
        />
      ),
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      <Tabs onValueChange={setActiveTab} value={activeTab}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
      {children}
    </div>
  );
}

export default UserProfile;
