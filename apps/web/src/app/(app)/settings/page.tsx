import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Settings - ISIS Chat',
  description:
    'Manage your preferences, integrations, and account settings for ISIS Chat. Configure MCP servers, account preferences, notifications, and more.',
  keywords: [
    'settings',
    'preferences',
    'MCP servers',
    'account',
    'configuration',
    'ISIS Chat',
    'AI chat settings',
  ],
  openGraph: {
    title: 'Settings - ISIS Chat',
    description:
      'Manage your preferences, integrations, and account settings for ISIS Chat.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Settings - ISIS Chat',
    description:
      'Manage your preferences, integrations, and account settings for ISIS Chat.',
  },
  robots: {
    index: false, // Settings pages typically shouldn't be indexed
    follow: true,
  },
};

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-semibold text-2xl">Settings</h1>
        <p className="text-muted-foreground">
          Manage your preferences and integrations
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-2 font-medium">MCP Servers</h2>
          <p className="mb-4 text-muted-foreground text-sm">
            Configure Model Context Protocol servers and tools.
          </p>
          <Link className="text-primary text-sm underline" href="/mcp">
            Open MCP settings
          </Link>
        </Card>

        <Card className="p-6">
          <h2 className="mb-2 font-medium">Account</h2>
          <p className="mb-4 text-muted-foreground text-sm">
            Profile, security, and preferences.
          </p>
          <Link className="text-primary text-sm underline" href="/account">
            Manage account
          </Link>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 font-medium">Preferences</h2>
        {/* Placeholder: preferences form or tabs */}
        <Tabs className="w-full" defaultValue="general">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <TabsContent className="space-y-2" value="general">
            <div className="text-muted-foreground text-sm">
              General preferences
            </div>
          </TabsContent>
          <TabsContent className="space-y-2" value="notifications">
            <div className="text-muted-foreground text-sm">
              Notification settings
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
