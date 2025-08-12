import {
  Brain,
  CheckCircle2,
  Clock,
  Compass,
  Rocket,
  Settings2,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react';

export type RoadmapFeature = {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  progress: number;
  category: 'MCP' | 'Memories' | 'Workflows' | 'General';
  quarter: string;
  estimatedDate?: string;
  details?: string[];
  links?: Array<{ label: string; href: string }>;
  icon: React.ComponentType<{ className?: string }>;
};

export const roadmapData: RoadmapFeature[] = [
  // 2024 - DONE
  {
    id: 'ai-agents',
    title: 'AI Agents',
    description:
      'Support for Claude, GPT-4, and other leading AI models with seamless switching.',
    status: 'completed',
    progress: 100,
    category: 'General',
    quarter: 'Q3 2024',
    estimatedDate: 'Completed',
    details: [
      'Claude 3.5 Sonnet & Haiku',
      'GPT-4 & GPT-4o',
      'Gemini Pro',
      'Custom model integration',
    ],
    icon: Brain,
  },
  {
    id: 'team-collaboration',
    title: 'Team Collaboration',
    description:
      'Real-time collaboration features for teams working with AI agents.',
    status: 'completed',
    progress: 100,
    category: 'General',
    quarter: 'Q4 2024',
    estimatedDate: 'Completed',
    details: [
      'Shared workspaces',
      'Team chat history',
      'Role-based permissions',
      'Activity tracking',
    ],
    icon: Users,
  },
  // 2025 - IN PROGRESS & UPCOMING
  {
    id: 'mcp-integration',
    title: 'MCP Integration',
    description:
      'Model Context Protocol for advanced AI interactions and tool use.',
    status: 'in-progress',
    progress: 65,
    category: 'MCP',
    quarter: 'Q1 2025',
    estimatedDate: 'February 2025',
    details: [
      'Tool calling framework',
      'Custom tool creation',
      'Third-party integrations',
      'Context management',
    ],
    icon: Sparkles,
    links: [
      {
        label: 'Learn about MCP',
        href: 'https://modelcontextprotocol.io',
      },
    ],
  },
  {
    id: 'desktop-app',
    title: 'Desktop Application',
    description:
      'Native desktop app for Windows, macOS, and Linux with offline support.',
    status: 'in-progress',
    progress: 40,
    category: 'General',
    quarter: 'Q2 2025',
    estimatedDate: 'April 2025',
    details: [
      'Electron-based app',
      'Offline mode',
      'System tray integration',
      'Local model support',
    ],
    icon: Settings2,
  },
  {
    id: 'mcp-server-management',
    title: 'MCP Server Management',
    description:
      'Auto-discovery, authentication, health monitoring, and marketplace.',
    status: 'upcoming',
    progress: 15,
    category: 'MCP',
    quarter: 'Q3 2025',
    estimatedDate: 'August 2025',
    details: [
      'Server auto-discovery',
      'OAuth authentication',
      'Real-time health monitoring',
      'Server marketplace',
      'Auto-reconnection logic',
    ],
    icon: Settings2,
  },
  {
    id: 'memories-alpha',
    title: 'Memories (Alpha)',
    description:
      'Document uploads, embedding, and retrieval for context-aware chats.',
    status: 'in-progress',
    progress: 20,
    category: 'Memories',
    quarter: 'Q4 2025',
    estimatedDate: 'November 2025',
    details: [
      'File upload interface',
      'Vector embeddings',
      'Semantic search',
      'Context injection',
    ],
    icon: Upload,
  },
  {
    id: 'workflows-alpha',
    title: 'Workflows (Alpha)',
    description: 'Trigger/action nodes, schedules, run logs, and retry policy.',
    status: 'upcoming',
    progress: 0,
    category: 'Workflows',
    quarter: 'Q4 2025',
    estimatedDate: 'December 2025',
    details: [
      'Visual workflow builder',
      'Cron scheduling',
      'Execution logs',
      'Error handling & retries',
    ],
    icon: Compass,
  },
  // 2026 - LATER
  {
    id: 'workflows-stable',
    title: 'Workflows (Beta → Stable)',
    description:
      'Branching, approvals, variables/secrets, templates, hosted runners.',
    status: 'upcoming',
    progress: 0,
    category: 'Workflows',
    quarter: '2026',
    estimatedDate: 'Q1 2026',
    details: [
      'Conditional branching',
      'Manual approval steps',
      'Secret management',
      'Template library',
      'Dedicated runners',
    ],
    icon: Compass,
  },
  {
    id: 'memories-stable',
    title: 'Memories (Beta → Stable)',
    description:
      'Analytics, redaction tools, organization policies, cross-agent sharing with guardrails.',
    status: 'upcoming',
    progress: 0,
    category: 'Memories',
    quarter: '2026',
    estimatedDate: 'Q2 2026',
    details: [
      'Usage analytics',
      'PII redaction',
      'Team policies',
      'Agent memory sharing',
      'Compliance tools',
    ],
    icon: Upload,
  },
  {
    id: 'mcp-marketplace',
    title: 'MCP Marketplace',
    description:
      'Quality bar, community submissions, usage insights and versioning.',
    status: 'upcoming',
    progress: 0,
    category: 'MCP',
    quarter: '2026',
    estimatedDate: 'Q3 2026',
    details: [
      'Community contributions',
      'Quality standards',
      'Usage metrics',
      'Version management',
      'Revenue sharing',
    ],
    icon: Sparkles,
  },
];

export const statusConfig = {
  completed: {
    label: 'Completed',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    icon: CheckCircle2,
  },
  'in-progress': {
    label: 'In Progress',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    icon: Rocket,
  },
  upcoming: {
    label: 'Upcoming',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    icon: Clock,
  },
} as const;

export const categoryColors = {
  MCP: 'border-purple-500/50 bg-purple-500/10 text-purple-600 dark:text-purple-400',
  Memories:
    'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  Workflows:
    'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400',
  General: 'border-gray-500/50 bg-gray-500/10 text-gray-600 dark:text-gray-400',
} as const;
