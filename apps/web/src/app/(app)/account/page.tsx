'use client';

import { api } from '@convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation, useQuery } from 'convex/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Bell,
  Brain,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  DollarSign,
  Download,
  Edit2,
  Loader,
  LogOut,
  MessageSquare,
  Moon,
  Save,
  Settings,
  Shield,
  Sun,
  Trophy,
  User,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { UpgradeModal } from '@/components/auth/upgrade-modal';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUpdateUserProfile } from '@/hooks/convex/useUsers';
import { useSubscription } from '@/hooks/use-subscription';
import { useUpgradeModal } from '@/hooks/use-upgrade-modal';
import { useWallet } from '@/hooks/useWallet';

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 12,
    },
  },
};

export default function AccountPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, isLoading: authLoading } = useAuthContext();
  const { signOut } = useAuthActions();
  const { disconnect } = useWallet();
  const {
    subscription,
    limits,
    isLoading: subscriptionLoading,
    error,
  } = useSubscription();
  const { isOpen, openModal, closeModal, suggestedTier } = useUpgradeModal();
  const { mutate: updateProfile } = useUpdateUserProfile();

  // Local state for editable fields
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preferences, setPreferences] = useState({
    pushNotifications: true,
    streamResponses: true,
    saveHistory: true,
    soundEnabled: true,
    analytics: false,
    dataCollection: false,
  });

  // Mutations for preferences
  const updatePreferences = useMutation(
    api.userPreferences.updateUserPreferences
  );

  // Query for existing preferences
  const existingPreferences = useQuery(api.userPreferences.getUserPreferences);

  // Query user stats
  const userStats = useQuery(
    api.userStats.getUserStats,
    user?.walletAddress ? { walletAddress: user.walletAddress } : 'skip'
  );

  const isLoading = authLoading || subscriptionLoading;

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setAvatarUrl(user.avatar || '');
    }
  }, [user]);

  // Initialize preferences from backend
  useEffect(() => {
    if (existingPreferences) {
      setPreferences({
        pushNotifications: existingPreferences.pushNotifications ?? true,
        streamResponses: existingPreferences.streamResponses ?? true,
        saveHistory: existingPreferences.saveHistory ?? true,
        soundEnabled: existingPreferences.soundEnabled ?? true,
        analytics: existingPreferences.analytics ?? false,
        dataCollection: existingPreferences.dataCollection ?? false,
      });
    }
  }, [existingPreferences]);

  const handleSaveDisplayName = async () => {
    try {
      await updateProfile({
        displayName: displayName || undefined,
      });
      toast.success('Display name updated');
      setIsEditingName(false);
    } catch (error) {
      toast.error('Failed to update display name');
    }
  };

  const handleSaveAvatar = async () => {
    try {
      await updateProfile({
        avatar: avatarUrl || undefined,
      });
      toast.success('Avatar updated');
      setIsEditingAvatar(false);
    } catch (error) {
      toast.error('Failed to update avatar');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, we'll create a local URL. In production, you'd upload to a service
      const localUrl = URL.createObjectURL(file);
      setAvatarUrl(localUrl);
      setIsEditingAvatar(true);
      toast.info('Click save to confirm avatar change');
    }
  };

  const handleUpdatePreferences = async (key: string, value: boolean) => {
    try {
      const updatedPrefs = { ...preferences, [key]: value };
      setPreferences(updatedPrefs);

      // Map frontend keys to backend keys and send update
      const updateArgs: Record<string, boolean> = {
        [key]: value,
      };

      await updatePreferences(updateArgs);

      toast.success('Preferences updated');
    } catch (error) {
      toast.error('Failed to update preferences');
      // Revert state on error
      setPreferences(preferences);
    }
  };

  const copyWalletAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      toast.success('Wallet address copied');
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const showUpgradeButton =
    subscription &&
    subscription.tier !== 'pro_plus' &&
    subscription.tier !== 'admin';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-b from-background to-background/95"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        key="account"
      >
        {/* Subtle Background Effect */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-72 w-72 rounded-full bg-secondary/5 blur-3xl" />
        </div>

        {/* Header Section */}
        <div className="relative">
          <motion.div
            animate={{ opacity: 0.5 }}
            className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"
            initial={{ opacity: 0 }}
          >
            <div className="aurora-primary opacity-20" />
          </motion.div>
          <div className="relative px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"
                initial={{ opacity: 0, y: -10 }}
              >
                <div>
                  <h1 className="animate-gradient-x bg-gradient-to-r from-primary via-accent to-primary bg-clip-text font-bold text-3xl text-transparent sm:text-4xl">
                    Account Settings
                  </h1>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Manage your profile and preferences
                  </p>
                </div>
                {showUpgradeButton && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      className="gap-2"
                      onClick={() =>
                        openModal({
                          tier:
                            subscription.tier === 'pro' ? 'pro_plus' : 'pro',
                          trigger: 'manual',
                        })
                      }
                    >
                      <Zap className="h-4 w-4" />
                      Upgrade Account
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <motion.div
            animate="visible"
            className="space-y-6"
            initial="hidden"
            variants={containerVariants}
          >
            {/* Loading State */}
            {isLoading && (
              <motion.div variants={itemVariants}>
                <Card className="p-8">
                  <div className="flex items-center justify-center">
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    <span className="text-muted-foreground text-sm">
                      Loading account data...
                    </span>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <motion.div variants={itemVariants}>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Unable to load account data. Please refresh the page.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Main Content when loaded */}
            {!isLoading && user && (
              <>
                {/* User Profile Section */}
                <motion.div variants={itemVariants}>
                  <Card className="overflow-hidden">
                    <CardContent className="py-6">
                      <div className="grid items-center gap-6 md:grid-cols-2">
                        {/* Avatar and Basic Info */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="group relative">
                              <Avatar
                                className="h-20 w-20 cursor-pointer transition-opacity group-hover:opacity-80"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <AvatarImage
                                  alt={displayName || user.displayName}
                                  src={avatarUrl || user.avatar}
                                />
                                <AvatarFallback className="text-2xl">
                                  {(displayName || user.displayName || 'U')
                                    .charAt(0)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                                <div className="rounded-full bg-black/50 p-2">
                                  <Edit2 className="h-4 w-4 text-white" />
                                </div>
                              </div>
                              <input
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                                ref={fileInputRef}
                                type="file"
                              />
                            </div>
                            <div className="flex-1">
                              <Label htmlFor="displayName">Display Name</Label>
                              <div className="mt-1 flex items-center gap-2">
                                <Input
                                  className="cursor-pointer transition-all hover:ring-2 hover:ring-primary/20"
                                  id="displayName"
                                  onBlur={() => {
                                    if (displayName !== user.displayName) {
                                      handleSaveDisplayName();
                                    } else {
                                      setIsEditingName(false);
                                    }
                                  }}
                                  onChange={(e) =>
                                    setDisplayName(e.target.value)
                                  }
                                  onFocus={() => setIsEditingName(true)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  placeholder="Click to edit name"
                                  value={displayName}
                                />
                                {isEditingName && (
                                  <Button
                                    className="h-8 w-8"
                                    onClick={handleSaveDisplayName}
                                    size="icon"
                                    variant="ghost"
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="avatarUrl">Avatar URL</Label>
                            <div className="mt-1 flex items-center gap-2">
                              <Input
                                className="cursor-pointer transition-all hover:ring-2 hover:ring-primary/20"
                                id="avatarUrl"
                                onBlur={() => {
                                  if (avatarUrl !== user.avatar) {
                                    handleSaveAvatar();
                                  } else {
                                    setIsEditingAvatar(false);
                                  }
                                }}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                onFocus={() => setIsEditingAvatar(true)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                  }
                                }}
                                placeholder="Click to edit or upload avatar"
                                value={avatarUrl}
                              />
                              {isEditingAvatar && (
                                <Button
                                  className="h-8 w-8"
                                  onClick={handleSaveAvatar}
                                  size="icon"
                                  variant="ghost"
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Account Details */}
                        <div className="space-y-4">
                          <div>
                            <Label>Wallet Address</Label>
                            <div className="mt-1 flex items-center gap-2">
                              <Input
                                className="font-mono text-sm"
                                disabled
                                value={user.walletAddress}
                              />
                              <Button
                                onClick={copyWalletAddress}
                                size="icon"
                                variant="outline"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Member Since</Label>
                              <p className="mt-1 text-muted-foreground text-sm">
                                {formatDate(user.createdAt)}
                              </p>
                            </div>
                            <div>
                              <Label>Last Active</Label>
                              <p className="mt-1 text-muted-foreground text-sm">
                                {formatDate(user.lastActiveAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Subscription & Stats */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Subscription Card */}
                  <motion.div variants={itemVariants}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Crown className="h-5 w-5 text-yellow-500" />
                          Subscription
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-muted-foreground text-sm">
                              Current Plan
                            </p>
                            <p className="font-bold text-2xl capitalize">
                              {subscription?.tier || 'Free'}
                            </p>
                          </div>
                          <Badge
                            variant={
                              subscription?.tier === 'free'
                                ? 'secondary'
                                : 'default'
                            }
                          >
                            <Crown className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        </div>

                        {limits && (
                          <>
                            <Separator />
                            <div className="space-y-3">
                              <div>
                                <div className="mb-1 flex justify-between text-sm">
                                  <span>Messages Used</span>
                                  <span>
                                    {subscription?.messagesUsed || 0} /{' '}
                                    {subscription?.messagesLimit || 0}
                                  </span>
                                </div>
                                <Progress
                                  className="h-2"
                                  value={
                                    ((subscription?.messagesUsed || 0) /
                                      (subscription?.messagesLimit || 1)) *
                                    100
                                  }
                                />
                              </div>

                              {limits.daysUntilReset !== undefined && (
                                <p className="text-muted-foreground text-xs">
                                  Resets in {limits.daysUntilReset} days
                                </p>
                              )}
                            </div>
                          </>
                        )}

                        {showUpgradeButton && (
                          <Button
                            className="w-full"
                            onClick={() => router.push('/subscription')}
                            variant="outline"
                          >
                            View Plans
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Activity Stats */}
                  <motion.div variants={itemVariants}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-primary" />
                          Activity Stats
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground text-sm">
                                Total Chats
                              </span>
                            </div>
                            <p className="font-bold text-2xl">
                              {userStats?.totalChats || 0}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Brain className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground text-sm">
                                Agents Created
                              </span>
                            </div>
                            <p className="font-bold text-2xl">
                              {userStats?.agentsCreated || 0}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground text-sm">
                                Total Messages
                              </span>
                            </div>
                            <p className="font-bold text-2xl">
                              {userStats?.totalMessages || 0}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground text-sm">
                                Streak Days
                              </span>
                            </div>
                            <p className="font-bold text-2xl">
                              {userStats?.streakDays || 0}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Settings Tabs */}
                <motion.div variants={itemVariants}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Settings & Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs className="w-full" defaultValue="general">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="general">General</TabsTrigger>
                          <TabsTrigger value="notifications">
                            Notifications
                          </TabsTrigger>
                          <TabsTrigger value="privacy">Privacy</TabsTrigger>
                        </TabsList>

                        <TabsContent className="mt-4 space-y-4" value="general">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="font-medium text-sm">
                                  Theme
                                </Label>
                                <p className="text-muted-foreground text-xs">
                                  Choose your preferred color theme
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => setTheme('light')}
                                  size="icon"
                                  variant={
                                    theme === 'light' ? 'default' : 'outline'
                                  }
                                >
                                  <Sun className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => setTheme('dark')}
                                  size="icon"
                                  variant={
                                    theme === 'dark' ? 'default' : 'outline'
                                  }
                                >
                                  <Moon className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="font-medium text-sm">
                                  Stream Responses
                                </Label>
                                <p className="text-muted-foreground text-xs">
                                  Show AI responses as they're generated
                                </p>
                              </div>
                              <Switch
                                checked={preferences.streamResponses}
                                onCheckedChange={(value) =>
                                  handleUpdatePreferences(
                                    'streamResponses',
                                    value
                                  )
                                }
                              />
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent
                          className="mt-4 space-y-4"
                          value="notifications"
                        >
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="font-medium text-sm">
                                  Push Notifications
                                </Label>
                                <p className="text-muted-foreground text-xs">
                                  Receive push notifications for updates
                                </p>
                              </div>
                              <Switch
                                checked={preferences.pushNotifications}
                                onCheckedChange={(value) =>
                                  handleUpdatePreferences(
                                    'pushNotifications',
                                    value
                                  )
                                }
                              />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="font-medium text-sm">
                                  Sound Effects
                                </Label>
                                <p className="text-muted-foreground text-xs">
                                  Play sounds for messages and notifications
                                </p>
                              </div>
                              <Switch
                                checked={preferences.soundEnabled}
                                onCheckedChange={(value) =>
                                  handleUpdatePreferences('soundEnabled', value)
                                }
                              />
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent className="mt-4 space-y-4" value="privacy">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="font-medium text-sm">
                                  Save Chat History
                                </Label>
                                <p className="text-muted-foreground text-xs">
                                  Store your conversations for future reference
                                </p>
                              </div>
                              <Switch
                                checked={preferences.saveHistory}
                                onCheckedChange={(value) =>
                                  handleUpdatePreferences('saveHistory', value)
                                }
                              />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="font-medium text-sm">
                                  Analytics
                                </Label>
                                <p className="text-muted-foreground text-xs">
                                  Help improve the app by sharing anonymous
                                  usage data
                                </p>
                              </div>
                              <Switch
                                checked={preferences.analytics}
                                onCheckedChange={(value) =>
                                  handleUpdatePreferences('analytics', value)
                                }
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="font-medium text-sm">
                                  Data Collection
                                </Label>
                                <p className="text-muted-foreground text-xs">
                                  Allow collection of usage patterns to improve
                                  experience
                                </p>
                              </div>
                              <Switch
                                checked={preferences.dataCollection}
                                onCheckedChange={(value) =>
                                  handleUpdatePreferences(
                                    'dataCollection',
                                    value
                                  )
                                }
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="font-medium text-sm">
                                  Data Export
                                </Label>
                                <p className="text-muted-foreground text-xs">
                                  Export your data in JSON format
                                </p>
                              </div>
                              <Button
                                onClick={() =>
                                  toast.info('Data export feature coming soon')
                                }
                                size="sm"
                                variant="outline"
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Export
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Danger Zone */}
                <motion.div variants={itemVariants}>
                  <Card className="border-destructive/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-destructive">
                        <Shield className="h-5 w-5" />
                        Danger Zone
                      </CardTitle>
                      <CardDescription>
                        Irreversible account actions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Sign Out</p>
                          <p className="text-muted-foreground text-sm">
                            Disconnect your wallet and sign out
                          </p>
                        </div>
                        <Button
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={async () => {
                            try {
                              // First sign out from Convex
                              await signOut();
                              // Then disconnect wallet
                              await disconnect();
                              // Navigate to home page
                              router.push('/');
                              toast.success('Signed out successfully');
                            } catch (error) {
                              toast.error('Failed to sign out');
                            }
                          }}
                          variant="outline"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </motion.div>
        </div>

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={isOpen}
          onClose={closeModal}
          suggestedTier={suggestedTier}
          trigger="manual"
        />
      </motion.div>
    </AnimatePresence>
  );
}
