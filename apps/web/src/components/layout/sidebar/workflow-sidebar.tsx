'use client';

import { GitBranch, Play, Pause, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const mockWorkflows = [
  {
    id: '1',
    name: 'Daily Trading Analysis',
    status: 'running',
    lastRun: '2 hours ago',
    nextRun: 'in 4 hours',
  },
  {
    id: '2',
    name: 'Portfolio Rebalance',
    status: 'paused',
    lastRun: '1 day ago',
    nextRun: 'paused',
  },
  {
    id: '3',
    name: 'DeFi Yield Monitor',
    status: 'running',
    lastRun: '30 minutes ago',
    nextRun: 'in 30 minutes',
  },
];

export function WorkflowSidebar() {
  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Workflows</h2>
            <p className="text-sm text-muted-foreground">Automation tasks</p>
          </div>
          <Button size="sm" variant="outline" className="h-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        <div className="space-y-2 pb-4">
          {mockWorkflows.map((workflow) => (
            <div
              key={workflow.id}
              className="group rounded-lg border p-3 transition-colors hover:bg-muted cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{workflow.name}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge
                      variant={workflow.status === 'running' ? 'default' : 'secondary'}
                      className="h-5 text-xs"
                    >
                      {workflow.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {workflow.nextRun}
                    </span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100"
                >
                  {workflow.status === 'running' ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}