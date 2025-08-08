'use client';

import { Bot, MessageSquare, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  const { user } = useAuthContext();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome{user?.displayName ? `, ${user.displayName}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/chat">
              <MessageSquare className="mr-2 h-4 w-4" />
              Open Chat
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/agents/new">
              <Bot className="mr-2 h-4 w-4" />
              Create Agent
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">Profile</h2>
              <p className="text-muted-foreground text-sm">
                Manage your account
              </p>
            </div>
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <Button asChild size="sm" variant="ghost">
              <Link href="/account">View profile</Link>
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">Settings</h2>
              <p className="text-muted-foreground text-sm">
                Preferences and options
              </p>
            </div>
            <Settings className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="secondary">MCP</Badge>
            <Badge variant="secondary">Agents</Badge>
          </div>
          <div className="mt-4">
            <Button asChild size="sm" variant="ghost">
              <Link href="/settings">Open settings</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
