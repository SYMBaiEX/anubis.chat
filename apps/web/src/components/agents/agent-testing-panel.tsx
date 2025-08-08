'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Send,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Copy,
  Check,
  AlertCircle,
  Info,
  Terminal,
  MessageSquare,
  Activity,
  BarChart3,
  Clock,
  Zap,
  Database,
  Bug,
  TestTube,
  FileText,
  ChevronRight,
  User,
  Bot,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Agent, AgentTool, TestMessage as TestMessageType, TestScenario as TestScenarioType } from './types';

interface TestMessage extends Omit<TestMessageType, 'role'> {
  role: 'user' | 'agent' | 'system';
  metadata?: {
    tokensUsed?: number;
    responseTime?: number;
    model?: string;
    tools?: string[];
  };
}

interface TestScenario extends TestScenarioType {
  expectedBehavior?: string;
}

interface AgentTestingPanelProps {
  agent: Agent;
}

const testScenarios: TestScenario[] = [
  {
    id: 'greeting',
    name: 'Basic Greeting',
    description: 'Test how the agent responds to greetings',
    messages: [
      { role: 'user', content: 'Hello! How are you today?' },
    ],
    expectedBehavior: 'Agent should greet back politely and offer assistance',
  },
  {
    id: 'trading',
    name: 'Trading Request',
    description: 'Test trading capability responses',
    messages: [
      { role: 'user', content: 'I want to swap 100 USDC for SOL' },
    ],
    expectedBehavior: 'Agent should explain the swap process and request confirmation',
  },
  {
    id: 'analysis',
    name: 'Market Analysis',
    description: 'Test analytical capabilities',
    messages: [
      { role: 'user', content: 'What do you think about the current SOL price action?' },
    ],
    expectedBehavior: 'Agent should provide market analysis based on available data',
  },
  {
    id: 'error',
    name: 'Error Handling',
    description: 'Test how agent handles errors',
    messages: [
      { role: 'user', content: 'Execute an invalid transaction: xyz123' },
    ],
    expectedBehavior: 'Agent should gracefully handle the error and explain the issue',
  },
  {
    id: 'multi-turn',
    name: 'Multi-turn Conversation',
    description: 'Test context retention across messages',
    messages: [
      { role: 'user', content: 'I want to learn about DeFi' },
      { role: 'agent', content: 'I can help you understand DeFi. What aspect interests you most?' },
      { role: 'user', content: 'Tell me about yield farming' },
    ],
    expectedBehavior: 'Agent should maintain context and provide relevant information',
  },
];

export function AgentTestingPanel({ agent }: AgentTestingPanelProps) {
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    totalMessages: 0,
    avgResponseTime: 0,
    totalTokens: 0,
    successRate: 100,
  });
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: TestMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsRunning(true);

    // Simulate agent response
    setTimeout(() => {
      const agentMessage: TestMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'agent',
        content: `This is a simulated response from ${agent.name}. In production, this would be the actual agent response.`,
        timestamp: new Date(),
        metadata: {
          tokensUsed: Math.floor(Math.random() * 100) + 50,
          responseTime: Math.floor(Math.random() * 2000) + 500,
          model: 'gpt-4',
          tools: agent.tools?.slice(0, 2).map((t) => t.name),
        },
      };

      setMessages(prev => [...prev, agentMessage]);
      setIsRunning(false);

      // Update metrics
      setMetrics(prev => ({
        totalMessages: prev.totalMessages + 2,
        avgResponseTime: prev.totalMessages === 0 
          ? (agentMessage.metadata?.responseTime || 0)
          : (prev.avgResponseTime * prev.totalMessages + (agentMessage.metadata?.responseTime || 0)) / (prev.totalMessages + 1),
        totalTokens: prev.totalTokens + (agentMessage.metadata?.tokensUsed || 0),
        successRate: 100,
      }));
    }, 1500);
  };

  const runScenario = async (scenario: TestScenario) => {
    setSelectedScenario(scenario.id);
    setMessages([]);
    setIsRunning(true);

    // Simulate running through the scenario
    for (const message of scenario.messages) {
      const testMessage: TestMessage = {
        id: `msg_${Date.now()}_${message.role}`,
        role: message.role === 'user' ? 'user' : 'agent',
        content: message.content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, testMessage]);
      
      if (message.role === 'user') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate agent response
        const agentResponse: TestMessage = {
          id: `msg_${Date.now()}_agent`,
          role: 'agent',
          content: `[Test Response] Processing: "${message.content}"`,
          timestamp: new Date(),
          metadata: {
            tokensUsed: Math.floor(Math.random() * 100) + 50,
            responseTime: Math.floor(Math.random() * 2000) + 500,
          },
        };
        
        setMessages(prev => [...prev, agentResponse]);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    setTestResults(prev => ({ ...prev, [scenario.id]: true }));
  };

  const resetTests = () => {
    setMessages([]);
    setMetrics({
      totalMessages: 0,
      avgResponseTime: 0,
      totalTokens: 0,
      successRate: 100,
    });
    setTestResults({});
    setSelectedScenario(null);
  };

  const exportTestResults = () => {
    const results = {
      agent: {
        name: agent.name,
        type: agent.type,
        capabilities: agent.capabilities,
      },
      messages,
      metrics,
      testResults,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-test-${agent.name}-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Test Environment</span>
            <div className="flex items-center space-x-2">
              <Badge variant={isRunning ? 'default' : 'secondary'}>
                {isRunning ? 'Running' : 'Ready'}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetTests}
                disabled={isRunning}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={exportTestResults}
                disabled={messages.length === 0}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Test {agent.name}'s capabilities in a sandboxed environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat">Interactive Chat</TabsTrigger>
              <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="space-y-4">
              {/* Chat Messages */}
              <ScrollArea className="h-[400px] rounded-lg border bg-muted/20 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-sm font-medium">No messages yet</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Start a conversation to test your agent
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "flex",
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[70%] rounded-lg px-4 py-2",
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : message.role === 'agent'
                                ? 'bg-muted'
                                : 'bg-yellow-100 dark:bg-yellow-900'
                            )}
                          >
                            <div className="flex items-start space-x-2">
                              {message.role === 'agent' && (
                                <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              )}
                              {message.role === 'user' && (
                                <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm">{message.content}</p>
                                {message.metadata && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {message.metadata.tokensUsed && (
                                      <Badge variant="secondary" className="text-xs">
                                        {message.metadata.tokensUsed} tokens
                                      </Badge>
                                    )}
                                    {message.metadata.responseTime && (
                                      <Badge variant="secondary" className="text-xs">
                                        {message.metadata.responseTime}ms
                                      </Badge>
                                    )}
                                    {message.metadata.tools && message.metadata.tools.length > 0 && (
                                      <Badge variant="secondary" className="text-xs">
                                        {message.metadata.tools.length} tools used
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                  
                  {isRunning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <Bot className="h-4 w-4" />
                          <div className="flex space-x-1">
                            <motion.div
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="h-2 w-2 bg-primary rounded-full"
                            />
                            <motion.div
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                              className="h-2 w-2 bg-primary rounded-full"
                            />
                            <motion.div
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                              className="h-2 w-2 bg-primary rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Type a message to test your agent..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isRunning}
                />
                <Button onClick={handleSendMessage} disabled={isRunning}>
                  {isRunning ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="scenarios" className="space-y-4">
              <div className="grid gap-3">
                {testScenarios.map((scenario) => {
                  const isCompleted = testResults[scenario.id];
                  const isSelected = selectedScenario === scenario.id;
                  
                  return (
                    <Card
                      key={scenario.id}
                      className={cn(
                        "cursor-pointer transition-all",
                        isSelected && "border-primary",
                        isCompleted && "bg-green-50 dark:bg-green-950/20"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium">{scenario.name}</h4>
                              {isCompleted && (
                                <Badge variant="default" className="text-xs">
                                  <Check className="mr-1 h-3 w-3" />
                                  Passed
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {scenario.description}
                            </p>
                            {scenario.expectedBehavior && (
                              <div className="flex items-start space-x-1 mt-2">
                                <Info className="h-3 w-3 text-muted-foreground mt-0.5" />
                                <p className="text-xs text-muted-foreground">
                                  Expected: {scenario.expectedBehavior}
                                </p>
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant={isSelected ? 'default' : 'outline'}
                            onClick={() => runScenario(scenario)}
                            disabled={isRunning}
                          >
                            {isRunning && isSelected ? (
                              <>
                                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                Running
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-3 w-3" />
                                Run
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center py-6">
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Test Suite
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Total Messages</p>
                        <p className="text-2xl font-bold">{metrics.totalMessages}</p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Avg Response Time</p>
                        <p className="text-2xl font-bold">{metrics.avgResponseTime}ms</p>
                      </div>
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Tokens Used</p>
                        <p className="text-2xl font-bold">{metrics.totalTokens}</p>
                      </div>
                      <Zap className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Success Rate</p>
                        <p className="text-2xl font-bold">{metrics.successRate}%</p>
                      </div>
                      <Activity className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Response Quality</span>
                        <span className="text-sm text-muted-foreground">95%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '95%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Context Retention</span>
                        <span className="text-sm text-muted-foreground">88%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '88%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Tool Usage Efficiency</span>
                        <span className="text-sm text-muted-foreground">92%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: '92%' }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default AgentTestingPanel;