import {
  ArrowLeft,
  Book,
  Keyboard,
  MessageSquare,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  formatShortcut,
  getCommandsByCategory,
  MAAT_CATEGORIES,
} from '@/lib/constants/commands-of-maat';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 font-bold text-4xl">
              <Book className="h-10 w-10 text-primary" />
              Divine Guidance
            </h1>
            <p className="mt-2 text-muted-foreground text-xl">
              Your guide to mastering ANUBIS Chat
            </p>
          </div>
          <Link href="/chat">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Chat
            </Button>
          </Link>
        </div>

        {/* Quick Start Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">1. Start a Conversation</h3>
                <p className="text-muted-foreground">
                  Click "New Chat" or press{' '}
                  <kbd className="rounded border px-1.5 py-0.5 text-xs">
                    {formatShortcut(['mod', 'n'])}
                  </kbd>{' '}
                  to create a new conversation. Type your message and press
                  Enter to send.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">2. Choose Your Oracle</h3>
                <p className="text-muted-foreground">
                  Select from multiple AI models including Claude, GPT-4, and
                  more. Each oracle has unique strengths for different tasks.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">3. Summon Anubis Agents</h3>
                <p className="text-muted-foreground">
                  Enhance your conversations with specialized AI agents that
                  provide expert assistance in various domains.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">4. Master the Commands</h3>
                <p className="text-muted-foreground">
                  Open the command palette with{' '}
                  <kbd className="rounded border px-1.5 py-0.5 text-xs">
                    {formatShortcut(['mod', 'k'])}
                  </kbd>{' '}
                  to access all features quickly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                Chat Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• Create, rename, and delete conversations</li>
                <li>• Search through chat history</li>
                <li>• Export conversations as markdown</li>
                <li>• Upload files and documents</li>
                <li>• Navigate between chats with shortcuts</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• Multiple AI models to choose from</li>
                <li>• Specialized agent assistance</li>
                <li>• Deep reasoning mode for complex tasks</li>
                <li>• Custom system prompts</li>
                <li>• Temperature and parameter controls</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-green-500" />
                Customization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• Light and dark theme modes</li>
                <li>• Customizable chat settings</li>
                <li>• User preferences and defaults</li>
                <li>• Interface language options</li>
                <li>• Keyboard shortcut reference</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Keyboard Shortcuts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-orange-500" />
              Keyboard Shortcuts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(MAAT_CATEGORIES).map(([key, category]) => {
                const commands = getCommandsByCategory(
                  key as keyof typeof MAAT_CATEGORIES
                );
                if (commands.length === 0) {
                  return null;
                }

                return (
                  <div key={key}>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold">
                      <span>{category.icon}</span>
                      {category.name}
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {commands.slice(0, 6).map((cmd) => (
                        <div
                          className="flex items-center justify-between rounded-lg border bg-card p-2"
                          key={cmd.id}
                        >
                          <span className="text-sm">{cmd.name}</span>
                          <kbd className="rounded border px-1.5 py-0.5 text-xs">
                            {formatShortcut(cmd.shortcut)}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm">
                Press{' '}
                <kbd className="rounded border px-1.5 py-0.5 text-xs">
                  {formatShortcut(['mod', '?'])}
                </kbd>{' '}
                to see all keyboard shortcuts
              </p>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 font-semibold">
                  How do I switch between AI models?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Use the model selector in the top bar or press{' '}
                  <kbd className="rounded border px-1.5 py-0.5 text-xs">
                    {formatShortcut(['mod', 'shift', 'm'])}
                  </kbd>{' '}
                  to open the model selection dialog.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-semibold">
                  Can I save my chat history?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Yes, all authenticated users have their chat history
                  automatically saved. You can also export individual chats as
                  markdown files.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-semibold">
                  What is Deep Reasoning mode?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Deep Reasoning mode enables the AI to think through complex
                  problems step-by-step, providing more thoughtful and accurate
                  responses for challenging tasks.
                </p>
              </div>
              <div>
                <h3 className="mb-1 font-semibold">
                  How do I use Anubis Agents?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Click the agent selector or press{' '}
                  <kbd className="rounded border px-1.5 py-0.5 text-xs">
                    {formatShortcut(['mod', 'shift', 'a'])}
                  </kbd>{' '}
                  to choose from specialized agents that can assist with
                  specific domains.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center text-muted-foreground text-sm">
          <p>
            Need more help? Contact support or visit our{' '}
            <Link className="text-primary underline" href="/roadmap">
              roadmap
            </Link>{' '}
            to see what's coming next.
          </p>
        </div>
      </div>
    </div>
  );
}
