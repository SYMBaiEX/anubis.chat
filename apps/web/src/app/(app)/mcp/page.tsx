'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface MCPStatusResponse {
  initialized: boolean;
  servers: Array<{ name: string; description?: string; transport: string; tools: string[] }>;
  totalTools: number;
  availableTools: string[];
}

export default function MCPServersPage() {
  const [status, setStatus] = useState<MCPStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/mcp/servers', { method: 'GET' });
        if (res.ok) {
          const json = (await res.json()) as { data?: MCPStatusResponse } | MCPStatusResponse;
          const data = 'data' in json ? json.data : json;
          setStatus(data);
        }
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const handleInitFilesystem = async () => {
    try {
      await fetch('/api/mcp/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'filesystem',
          transport: { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] },
        }),
      });
      window.location.reload();
    } catch {
      // noop
    }
  };

  return (
    <AuthGuard>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">MCP Servers</h1>
          <p className="text-muted-foreground">Manage Model Context Protocol servers and tools.</p>
        </div>

        <Card className="p-6 space-y-4">
          {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
          {!isLoading && status && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Initialized: <span className="font-medium text-foreground">{status.initialized ? 'Yes' : 'No'}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {status.servers.map((s) => (
                  <Card key={s.name} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{s.name}</h3>
                        <p className="text-sm text-muted-foreground">{s.description ?? 'No description'}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{s.transport}</span>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Tools: {s.tools.length > 0 ? s.tools.join(', ') : 'None'}
                    </div>
                  </Card>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleInitFilesystem}>Initialize Filesystem Server</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AuthGuard>
  );
}


