'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface MCPStatusResponse {
  initialized: boolean;
  servers: Array<{
    name: string;
    description?: string;
    transport: string;
    tools: string[];
  }>;
  totalTools: number;
  availableTools: string[];
}

interface MCPApiResponse {
  data?: MCPStatusResponse;
}

function isMCPStatusResponse(obj: unknown): obj is MCPStatusResponse {
  if (obj == null || typeof obj !== 'object') return false;
  const maybe = obj as Partial<MCPStatusResponse> & Record<string, unknown>;
  return (
    typeof maybe.initialized === 'boolean' && Array.isArray(maybe.servers)
  );
}

export default function MCPServersPage() {
  const [status, setStatus] = useState<MCPStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchServerStatus = async () => {
    try {
      const res = await fetch('/api/mcp/servers', { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (isMCPStatusResponse(json)) {
          setStatus(json);
        } else if (json && typeof json === 'object' && 'data' in json) {
          const apiResponse = json as MCPApiResponse;
          setStatus(apiResponse.data || null);
        } else {
          setStatus(null);
        }
      }
    } catch (_error) {
      toast.error('Failed to fetch server status');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        await fetchServerStatus();
      } finally {
        setIsLoading(false);
      }
    };
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    load();
  }, []);

  const handleInitFilesystem = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/mcp/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'filesystem',
          transport: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
          },
        }),
      });
      toast.success('Filesystem server initialized successfully!');
      // Refresh data without page reload
      await fetchServerStatus();
    } catch (_error) {
      toast.error('Failed to initialize filesystem server. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-semibold text-2xl">MCP Servers</h1>
        <p className="text-muted-foreground">
          Manage Model Context Protocol servers and tools.
        </p>
      </div>

      <Card className="space-y-4 p-6">
        {isLoading && (
          <div className="text-muted-foreground text-sm">
            Loading servers...
          </div>
        )}
        {!isLoading && status && (
          <div className="space-y-4">
            <div className="text-muted-foreground text-sm">
              Initialized:{' '}
              <span className="font-medium text-foreground">
                {status.initialized ? 'Yes' : 'No'}
              </span>
            </div>
            {isRefreshing && (
              <div className="animate-pulse text-muted-foreground text-sm">
                Refreshing server data...
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {status.servers.map((s) => (
                <Card className="p-4" key={s.name}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{s.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        {s.description ?? 'No description'}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {s.transport}
                    </span>
                  </div>
                  <div className="mt-3 text-muted-foreground text-xs">
                    Tools: {s.tools.length > 0 ? s.tools.join(', ') : 'None'}
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                disabled={isRefreshing}
                onClick={handleInitFilesystem}
                size="sm"
              >
                {isRefreshing
                  ? 'Initializing...'
                  : 'Initialize Filesystem Server'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
