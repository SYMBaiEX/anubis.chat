'use client';

import { api } from '@convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import {
  Activity,
  CreditCard,
  Crown,
  Filter,
  Search,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MigrationButton } from './migration-button';

function AdminDashboardContent() {
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<
    'all' | 'free' | 'pro' | 'pro_plus'
  >('all');

  // Check if user is admin (for display purposes - auth is handled by AdminGuard)
  const adminStatus = useQuery(api.adminAuth.checkCurrentUserAdminStatus);

  // Get admin data
  const allUsers = useQuery(api.adminAuth.getAllUsers, {
    limit: 100,
    filterTier: tierFilter === 'all' ? undefined : tierFilter,
    search: searchQuery.trim() || undefined,
  });

  const subscriptionAnalytics = useQuery(
    api.adminAuth.getSubscriptionAnalytics
  );
  const systemUsage = useQuery(api.adminAuth.getSystemUsage);
  const admins = useQuery(api.adminAuth.getAllAdmins);

  // Mutations
  const updateUserSubscription = useMutation(
    api.adminAuth.updateUserSubscription
  );
  const promoteToAdmin = useMutation(api.adminAuth.promoteUserToAdmin);
  const syncAdminsFromEnv = useMutation(api.adminAuth.syncAdminWallets);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Initialize admin system if no admins exist
  const handleInitializeAdmins = async () => {
    try {
      await syncAdminsFromEnv();
      toast.success('Admin system initialized successfully');
    } catch (error) {
      toast.error(
        'Failed to initialize admin system: ' + (error as Error).message
      );
    }
  };

  // Handle user subscription update
  const handleUpdateSubscription = async (
    walletAddress: string,
    tier: 'free' | 'pro' | 'pro_plus'
  ) => {
    try {
      await updateUserSubscription({
        walletAddress,
        tier,
        reason: `Admin update by ${user?.walletAddress}`,
      });
      toast.success('User subscription updated successfully');
    } catch (error) {
      toast.error('Failed to update subscription: ' + (error as Error).message);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6" />
            <h1 className="font-semibold text-2xl">Admin Dashboard</h1>
            <Badge className="gap-1" variant="outline">
              <Crown className="h-3 w-3" />
              {adminStatus?.adminInfo?.role}
            </Badge>
          </div>
          <MigrationButton />
        </div>
        <p className="text-muted-foreground">
          System administration and user management
        </p>
      </div>

      {/* Overview Cards */}
      {subscriptionAnalytics && systemUsage && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Total Users</span>
            </div>
            <div className="mt-2">
              <div className="font-bold text-2xl">
                {subscriptionAnalytics?.totalUsers || 0}
              </div>
              <p className="text-muted-foreground text-xs">
                {subscriptionAnalytics?.activeUsers || 0} active
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Revenue</span>
            </div>
            <div className="mt-2">
              <div className="font-bold text-2xl">
                {subscriptionAnalytics?.totalRevenue || 0} SOL
              </div>
              <p className="text-muted-foreground text-xs">Monthly recurring</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Messages</span>
            </div>
            <div className="mt-2">
              <div className="font-bold text-2xl">
                {systemUsage?.totalMessages || 0}
              </div>
              <p className="text-muted-foreground text-xs">Total sent</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Chats</span>
            </div>
            <div className="mt-2">
              <div className="font-bold text-2xl">
                {systemUsage?.totalChats || 0}
              </div>
              <p className="text-muted-foreground text-xs">Conversations</p>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs className="space-y-4" defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent className="space-y-4" value="users">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by wallet address or name..."
                value={searchQuery}
              />
            </div>
            <Select
              onValueChange={(value) =>
                setTierFilter(value as typeof tierFilter)
              }
              value={tierFilter}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="pro_plus">Pro+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {allUsers && (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.displayName || 'Anonymous'}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {user.walletAddress.slice(0, 8)}...
                            {user.walletAddress.slice(-4)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.subscription.tier === 'free'
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {user.subscription.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {user.subscription.messagesUsed || 0}/
                            {user.subscription.messagesLimit || 0} messages
                          </div>
                          <div className="text-muted-foreground">
                            {user.subscription.premiumMessagesUsed || 0}/
                            {user.subscription.premiumMessagesLimit || 0}{' '}
                            premium
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? 'default' : 'secondary'}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select
                            onValueChange={(value) =>
                              handleUpdateSubscription(
                                user.walletAddress,
                                value as 'free' | 'pro' | 'pro_plus'
                              )
                            }
                            value={user.subscription.tier}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="pro_plus">Pro+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent className="space-y-4" value="subscriptions">
          {subscriptionAnalytics && subscriptionAnalytics.tierCounts && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-6">
                <h3 className="mb-2 font-medium">Free Tier</h3>
                <div className="font-bold text-2xl">
                  {subscriptionAnalytics.tierCounts.free || 0}
                </div>
                <p className="text-muted-foreground text-sm">users</p>
              </Card>
              <Card className="p-6">
                <h3 className="mb-2 font-medium">Pro Tier</h3>
                <div className="font-bold text-2xl">
                  {subscriptionAnalytics.tierCounts.pro || 0}
                </div>
                <p className="text-muted-foreground text-sm">users</p>
              </Card>
              <Card className="p-6">
                <h3 className="mb-2 font-medium">Pro+ Tier</h3>
                <div className="font-bold text-2xl">
                  {subscriptionAnalytics.tierCounts.pro_plus || 0}
                </div>
                <p className="text-muted-foreground text-sm">users</p>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Admins Tab */}
        <TabsContent className="space-y-4" value="admins">
          {admins && (
            <Card>
              <div className="border-b p-6">
                <h3 className="font-medium">System Administrators</h3>
                <p className="text-muted-foreground text-sm">
                  Manage admin access and permissions
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin._id}>
                      <TableCell>
                        <div className="font-medium">
                          {admin.walletAddress.slice(0, 8)}...
                          {admin.walletAddress.slice(-4)}
                        </div>
                        {admin.notes && (
                          <div className="text-muted-foreground text-sm">
                            {admin.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            admin.role === 'super_admin'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {admin.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {admin.permissions.length} permissions
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </div>
                        {admin.addedBy && (
                          <div className="text-muted-foreground text-xs">
                            by {admin.addedBy.slice(0, 8)}...
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* System Tab */}
        <TabsContent className="space-y-4" value="system">
          {systemUsage && (
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="mb-4 font-medium">System Statistics</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-muted-foreground text-sm">
                      Total Users
                    </div>
                    <div className="font-bold text-lg">
                      {systemUsage?.totalUsers || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm">
                      Active Users
                    </div>
                    <div className="font-bold text-lg">
                      {systemUsage?.activeUsers || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm">
                      Total Chats
                    </div>
                    <div className="font-bold text-lg">
                      {systemUsage?.totalChats || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm">
                      Total Messages
                    </div>
                    <div className="font-bold text-lg">
                      {systemUsage?.totalMessages || 0}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="mb-2 font-medium">Environment Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Admin Wallets:
                    </span>
                    <span>
                      {process.env.NEXT_PUBLIC_ADMIN_WALLETS?.split(',')
                        .length || 0}{' '}
                      configured
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Current Admin:
                    </span>
                    <span>
                      {adminStatus?.adminInfo?.walletAddress?.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminDashboardPage() {
  return <AdminDashboardContent />;
}
