'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences and integrations</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="font-medium mb-2">MCP Servers</h2>
            <p className="text-sm text-muted-foreground mb-4">Configure Model Context Protocol servers and tools.</p>
            <Link className="text-primary underline text-sm" href="/mcp">Open MCP settings</Link>
          </Card>

          <Card className="p-6">
            <h2 className="font-medium mb-2">Account</h2>
            <p className="text-sm text-muted-foreground mb-4">Profile, security, and preferences.</p>
            <Link className="text-primary underline text-sm" href="/account">Manage account</Link>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="font-medium mb-4">Preferences</h2>
          {/* Placeholder: preferences form or tabs */}
          <Tabs
            tabs={[
              { id: 'general', label: 'General', content: <div className="text-sm text-muted-foreground">General preferences</div> },
              { id: 'notifications', label: 'Notifications', content: <div className="text-sm text-muted-foreground">Notification settings</div> },
            ]}
          />
        </Card>
      </div>
    </AuthGuard>
  );
}


