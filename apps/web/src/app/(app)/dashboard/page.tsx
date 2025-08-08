"use client";

import { useAuthContext } from '@/components/providers/auth-provider';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, MessageSquare, Settings, User } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthContext();

  return (
    <AuthGuard>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome{user?.displayName ? `, ${user.displayName}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/chat">
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Open Chat
              </Button>
            </Link>
            <Link href="/agents/new">
              <Button variant="secondary">
                <Bot className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-medium">Profile</h2>
                <p className="text-sm text-muted-foreground">Manage your account</p>
              </div>
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-4">
              <Link href="/account">
                <Button variant="ghost" size="sm">View profile</Button>
              </Link>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-medium">Settings</h2>
                <p className="text-sm text-muted-foreground">Preferences and options</p>
              </div>
              <Settings className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary">MCP</Badge>
              <Badge variant="secondary">Agents</Badge>
            </div>
            <div className="mt-4">
              <Link href="/settings">
                <Button variant="ghost" size="sm">Open settings</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}


